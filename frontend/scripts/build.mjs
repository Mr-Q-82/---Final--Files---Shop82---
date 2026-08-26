import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(frontendRoot, "dist");
const storefrontStyles = [
  "main-store-style.css",
  "utilities.css",
  "3D-background-store.css",
  "layout-store.css",
  "header&&menu-store.css",
  "herosection-store.css",
  "home-product-sliders-store.css",
  "home-promo-banners-store.css",
  "gaming-store.css",
  "categories&&products-grid-store.css",
  "product-detail-store.css",
  "configurator-store.css",
  "cart-drawer-store.css",
  "auth-store.css",
  "profile-store.css",
  "content-pages-store.css",
  "ai-assistant.css",
  "footer-toast-modals-store.css",
  "responsive.css",
  "fullscreen-layout-store.css",
  "media-frames-store.css",
  "product-detail-pro-store.css",
  "header-responsive-final-store.css",
];

async function readApplicationStyle(fileName) {
  const source = await fs.readFile(path.join(frontendRoot, "css", fileName), "utf8");
  const imports = [...source.matchAll(/@import\s+url\(["']([^"']+)["']\);/g)];
  if (!imports.length) return source;
  const parts = await Promise.all(
    imports.map((match) =>
      fs.readFile(path.join(frontendRoot, "css", match[1]), "utf8"),
    ),
  );
  return parts.join("\n");
}

async function modulePaths(bootstrapFile, variableName) {
  const source = await fs.readFile(path.join(frontendRoot, bootstrapFile), "utf8");
  const block = source.match(
    new RegExp(`const ${variableName} = \\[([\\s\\S]*?)\\];`),
  );
  if (!block) throw new Error(`فهرست ماژول‌ها در ${bootstrapFile} پیدا نشد.`);
  return [...block[1].matchAll(/["'](\/js\/[^"']+)["']/g)].map(
    (match) => match[1],
  );
}

async function compile({ bootstrapFile, variableName, outputName, leaflet }) {
  const paths = await modulePaths(bootstrapFile, variableName);
  const modules = await Promise.all(
    paths.map((modulePath) =>
      fs.readFile(path.join(frontendRoot, modulePath.replace(/^\//, "")), "utf8"),
    ),
  );
  const imports = [
    'import * as React from "react";',
    'import * as ReactDOMClient from "react-dom/client";',
    'import { createPortal } from "react-dom";',
    "const ReactDOM = { ...ReactDOMClient, createPortal };",
  ];
  if (leaflet) {
    imports.push('import * as L from "leaflet";');
    imports.push('import "leaflet/dist/leaflet.css";');
  }
  await build({
    stdin: {
      contents: `${imports.join("\n")}\n${modules.join("\n")}`,
      loader: "jsx",
      resolveDir: frontendRoot,
      sourcefile: `${outputName}.jsx`,
    },
    outfile: path.join(outputDirectory, `${outputName}.js`),
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ["es2020"],
    platform: "browser",
    define: { "process.env.NODE_ENV": '"production"' },
    loader: {
      ".png": "dataurl",
      ".svg": "dataurl",
    },
    legalComments: "none",
  });
  return paths.length;
}

await fs.mkdir(outputDirectory, { recursive: true });
const storefrontCount = await compile({
  bootstrapFile: "js/storefront/bootstrap.js",
  variableName: "STOREFRONT_MODULES",
  outputName: "storefront.bundle",
  leaflet: true,
});
const adminCount = await compile({
  bootstrapFile: "js/admin/bootstrap.js",
  variableName: "ADMIN_MODULES",
  outputName: "admin.bundle",
  leaflet: false,
});
const storefrontBundlePath = path.join(outputDirectory, "storefront.bundle.css");
const libraryStyles = (
  await fs.readFile(storefrontBundlePath, "utf8").catch(() => "")
)
  // Leaflet intentionally ships legacy prefixed declarations. Pair the few
  // standalone ones with their standards so editor validators stay quiet.
  .replace(
    /\.leaflet-safari \.leaflet-tile-container\{width:1600px;height:1600px;-webkit-transform-origin:0 0\}/,
    ".leaflet-safari .leaflet-tile-container{width:1600px;height:1600px;transform-origin:0 0;-webkit-transform-origin:0 0}",
  )
  .replace(
    /\.leaflet-overlay-pane svg\{-moz-user-select:none\}/,
    ".leaflet-overlay-pane svg{-moz-user-select:none;user-select:none}",
  )
  .replace(
    /\.leaflet-oldie \.leaflet-popup-content-wrapper\{-ms-zoom:1\}/,
    ".leaflet-oldie .leaflet-popup-content-wrapper{-ms-zoom:1;zoom:1}",
  );
const applicationStyles = await Promise.all(
  storefrontStyles.map(async (fileName) => {
    const source = (
      await readApplicationStyle(fileName)
    ).replace(/^\s*@charset\s+["'][^"']+["'];\s*/i, "");
    return `\n/* source: css/${fileName} */\n${source}`;
  }),
);
await fs.writeFile(
  storefrontBundlePath,
  `${libraryStyles}\n${applicationStyles.join("\n")}`,
  "utf8",
);
console.log(`Built storefront (${storefrontCount} modules) and admin (${adminCount} modules).`);
