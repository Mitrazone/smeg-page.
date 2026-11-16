// Shared by the browser and Node tests. Prices and availability are revalidated by Shopify at checkout.
(function(root) {
  function knifeColourUpdates(catalog, items, colour) {
    const product=catalog.products.knife;
    const target=product.variants.find(v=>v.available && v.title===colour);
    const knives=items.filter(item=>item.product_id===product.id);
    if (!target || !knives.length) return null;
    const quantity=knives.reduce((sum,item)=>sum+item.quantity,0);
    if (quantity>10 || knives.every(item=>item.variant_id===target.id)) return null;
    return {...Object.fromEntries(knives.map(item=>[item.variant_id,0])),[target.id]:quantity};
  }
  function checkoutUrl(catalog, items) {
    if (!/^([a-z0-9]+(?:-[a-z0-9]+)*)\.myshopify\.com$/.test(catalog.domain)) throw new Error('Unexpected checkout store.');
    const variants = new Map(Object.values(catalog.products).flatMap(p=>p.variants.map(v=>[Number(v.id),v])));
    const main = new Set(catalog.products.main.variants.map(v=>Number(v.id)));
    const lines=new Map();
    for (const item of items) {
      const id=Number(item.variant_id),qty=Number(item.quantity),variant=variants.get(id);
      if (!variant || !variant.available || !Number.isInteger(qty) || qty<1 || qty>10) throw new Error('An item is unavailable or has an invalid quantity. Please update your basket.');
      const count=(lines.get(id)||0)+qty;
      if (count>10) throw new Error('Maximum quantity is 10 per variant.');
      lines.set(id,count);
    }
    if (![...lines.keys()].some(id=>main.has(id))) throw new Error('Add the collection before continuing to checkout.');
    return `https://${catalog.domain}/cart/${[...lines].map(([id,qty])=>`${id}:${qty}`).join(',')}?checkout&utm_source=Organic${catalog.marketCountry === 'GB' ? '&country=GB' : ''}`;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports={checkoutUrl,knifeColourUpdates};
  else root.ShopifyCart={checkoutUrl,knifeColourUpdates};
})(typeof window === 'undefined' ? globalThis : window);
