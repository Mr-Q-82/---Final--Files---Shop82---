let CATEGORIES = [
  {
    id: "laptop",
    name: "لپ‌تاپ",
    icon: "laptop",
    subs: ["گیمینگ", "اولترابوک", "مهندسی", "دانشجویی", "مک‌بوک"],
  },
  {
    id: "cpu",
    name: "پردازنده",
    icon: "cpu",
    subs: ["Intel Core i9", "Intel Core i7", "AMD Ryzen 9", "AMD Ryzen 7"],
  },
  {
    id: "gpu",
    name: "کارت گرافیک",
    icon: "gpu",
    subs: ["RTX 4090", "RTX 4070", "RX 7900", "RTX 4060"],
  },
  {
    id: "ram",
    name: "حافظه RAM",
    icon: "ram",
    subs: ["DDR5", "DDR4", "32GB", "16GB"],
  },
  {
    id: "ssd",
    name: "حافظه SSD",
    icon: "ssd",
    subs: ["NVMe", "SATA", "1TB", "2TB"],
  },
  {
    id: "monitor",
    name: "مانیتور",
    icon: "monitor",
    subs: ["گیمینگ 144Hz", "4K", "منحنی", "اولترا واید"],
  },
  {
    id: "mouse",
    name: "ماوس",
    icon: "mouse",
    subs: ["گیمینگ", "بی‌سیم", "ارگونومیک"],
  },
  {
    id: "keyboard",
    name: "کیبورد",
    icon: "keyboard",
    subs: ["مکانیکال", "بی‌سیم", "RGB"],
  },
  {
    id: "headphone",
    name: "هدفون",
    icon: "headphone",
    subs: ["گیمینگ", "بی‌سیم", "نویزکنسلینگ"],
  },
  {
    id: "speaker",
    name: "اسپیکر",
    icon: "speaker",
    subs: ["بلوتوثی", "رومیزی", "ساندبار"],
  },
  {
    id: "case",
    name: "کیس",
    icon: "case",
    subs: ["میدتاور", "فول‌تاور", "RGB"],
  },
  {
    id: "motherboard",
    name: "مادربرد",
    icon: "motherboard",
    subs: ["Intel", "AMD", "ATX", "Micro-ATX"],
  },
  {
    id: "power",
    name: "پاور",
    icon: "power",
    subs: ["650W", "750W", "850W", "1000W"],
  },
  {
    id: "hdd",
    name: "هارد HDD",
    icon: "hdd",
    subs: ["۱ ترابایت", "۲ ترابایت", "دسکتاپ", "ذخیره‌سازی"],
  },
  {
    id: "laptop-hdd",
    name: "هارد لپ‌تاپی",
    icon: "hdd",
    subs: ["۲.۵ اینچ", "SATA", "۵۰۰ گیگابایت", "۱ ترابایت"],
  },
  {
    id: "laptop-battery",
    name: "باتری لپ‌تاپ",
    icon: "battery",
    subs: ["اورجینال", "داخلی", "قابل تعویض", "ظرفیت بالا"],
  },
  {
    id: "laptop-board",
    name: "برد کامپیوتر و لپ‌تاپ",
    icon: "board",
    subs: ["مادربرد لپ‌تاپ", "برد پاور", "برد گرافیک", "برد جانبی"],
  },
  {
    id: "cooling-pad",
    name: "فن و کول‌پد",
    icon: "cooling",
    subs: ["فن لپ‌تاپ", "کول‌پد RGB", "خنک‌کننده", "فن کم‌صدا"],
  },
  {
    id: "desk",
    name: "میز کامپیوتر",
    icon: "desk",
    subs: ["گیمینگ", "اداری", "ارگونومیک", "ارتفاع قابل تنظیم", "L شکل"],
  },
  {
    id: "chair",
    name: "صندلی کامپیوتر",
    icon: "chair",
    subs: ["گیمینگ", "اداری", "ارگونومیک", "طبی", "قابل تنظیم"],
  },
  {
    id: "mouse-pad",
    name: "موس‌پد",
    icon: "mousepad",
    subs: ["گیمینگ", "RGB", "کنترل", "سرعت", "سایز بزرگ"],
  },
  {
    id: "accessories",
    name: "لوازم جانبی",
    icon: "gift",
    subs: ["هاب و مبدل", "کابل", "شارژر", "پایه نگهدارنده", "وب‌کم", "ابزار نظافت"],
  },
];
const BRANDS = [
  "ASUS",
  "MSI",
  "Gigabyte",
  "Intel",
  "AMD",
  "NVIDIA",
  "Corsair",
  "Logitech",
  "Samsung",
  "Apple",
  "Razer",
  "HP",
];
const rnd = (a, b) => Math.floor(Math.random() * (b - a) + a);
const NAMES = {
  laptop: [
    "لپ‌تاپ گیمینگ ROG Strix",
    "مک‌بوک پرو M3",
    "لپ‌تاپ MSI Katana",
    "اولترابوک ZenBook",
    "لپ‌تاپ HP Victus",
  ],
  cpu: [
    "پردازنده Intel Core i9-14900K",
    "پردازنده AMD Ryzen 9 7950X",
    "پردازنده Core i7-14700",
    "پردازنده Ryzen 7 7800X3D",
  ],
  gpu: [
    "کارت گرافیک RTX 4090",
    "کارت گرافیک RTX 4070 Ti",
    "کارت گرافیک RX 7900 XTX",
    "کارت گرافیک RTX 4060",
  ],
  ram: [
    "رم DDR5 32GB Corsair",
    "رم DDR4 16GB Kingston",
    "رم DDR5 64GB G.Skill",
  ],
  ssd: [
    "اس‌اس‌دی NVMe 1TB Samsung",
    "اس‌اس‌دی 2TB WD Black",
    "اس‌اس‌دی SATA 500GB",
  ],
  monitor: [
    "مانیتور گیمینگ 27 اینچ 165Hz",
    "مانیتور 4K 32 اینچ",
    "مانیتور منحنی 34 اینچ",
  ],
  mouse: [
    "ماوس گیمینگ Logitech G502",
    "ماوس بی‌سیم Razer",
    "ماوس ارگونومیک MX",
  ],
  keyboard: [
    "کیبورد مکانیکال RGB",
    "کیبورد بی‌سیم Keychron",
    "کیبورد گیمینگ Razer",
  ],
  headphone: ["هدفون گیمینگ HyperX", "هدفون بی‌سیم Sony", "هدفون نویزکنسلینگ"],
  speaker: ["اسپیکر بلوتوثی JBL", "ساندبار رومیزی", "اسپیکر گیمینگ RGB"],
  case: ["کیس گیمینگ RGB میدتاور", "کیس فول‌تاور", "کیس ATX مشکی"],
  power: ["پاور 750W گلد", "پاور 850W پلاتینیوم", "پاور 650W برنز"],
  desk: ["میز گیمینگ ارگونومیک", "میز کامپیوتر ارتفاع قابل تنظیم", "میز اداری L شکل"],
  chair: ["صندلی گیمینگ حرفه‌ای", "صندلی ارگونومیک اداری", "صندلی کامپیوتر طبی"],
  "mouse-pad": ["موس‌پد گیمینگ RGB", "موس‌پد کنترل حرفه‌ای", "موس‌پد بزرگ رومیزی"],
  accessories: ["هاب USB-C چندکاره", "وب‌کم Full HD", "پایه نگهدارنده لپ‌تاپ", "کابل و مبدل حرفه‌ای"],
};
const COLORS = [
  ["مشکی", "#1e293b"],
  ["نقره‌ای", "#cbd5e1"],
  ["سفید", "#f8fafc"],
  ["قرمز", "#ef4444"],
  ["آبی", "#3b82f6"],
];
const buildProducts = () => {
  let arr = [],
    id = 1;
  CATEGORIES.forEach((c) => {
    const names = NAMES[c.id] || [c.name];
    for (let i = 0; i < 5; i++) {
      const price = rnd(3, 120) * 1000000;
      const off = rnd(0, 4) === 0 ? 0 : rnd(5, 35);
      arr.push({
        id: id++,
        cat: c.id,
        catName: c.name,
        icon: c.icon,
        name: names[i % names.length] + " " + (i > 4 ? "نسخه " + i : ""),
        brand: BRANDS[rnd(0, BRANDS.length)],
        price,
        off,
        finalPrice: Math.round(price * (1 - off / 100)),
        rate: rnd(35, 50) / 10,
        sold: rnd(20, 900),
        stock: rnd(0, 30),
        colors: COLORS.slice(0, rnd(2, 5)),
        specs: {
          برند: BRANDS[rnd(0, BRANDS.length)],
          گارانتی: "۱۸ ماهه شرکتی",
          ارسال: "۲۴ ساعته",
          دسته: c.name,
          وزن: rnd(1, 4) + " کیلوگرم",
        },
      });
    }
  });
  return arr;
};
// محصولات فقط از API دریافت می‌شوند؛ هیچ محصول نمایشی یا تصادفی وجود ندارد.
