function ProductDetail({ param }) {
  const { catalogVersion, catalogLoading } = useStore();
  const initialProduct =
    PRODUCTS.find((x) => x.slug === param || String(x.id) === String(param)) ||
    PRODUCTS[0];
  const [p, setProduct] = useState(initialProduct);
  useEffect(() => {
    const source = PRODUCTS.find((x) => x.slug === param || String(x.id) === String(param)) || initialProduct;
    if (!source?.apiId) return;
    let active = true;
    accountApi(`/catalog/products/${source.apiId}/`)
      .then((item) => {
        if (active) setProduct(apiProductToStoreProduct(item, source.id - 1));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [param, catalogVersion]);
  if (!p)
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="glass" style={{ padding: 40, textAlign: "center" }}>
          {catalogLoading
            ? "در حال دریافت اطلاعات محصول..."
            : "محصول موردنظر پیدا نشد."}
        </div>
      </div>
    );
  return (
    <ProductDetailReady param={param} p={p} catalogVersion={catalogVersion} />
  );
}

