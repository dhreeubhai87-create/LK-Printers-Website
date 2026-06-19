function calculatePrice(product, input) {
  const size = (product.sizes || []).find((s) => s.id === input.sizeId);
  const paper = (product.paper_types || []).find((p) => p.id === input.paperId);
  const color = (product.color_options || []).find((c) => c.id === input.colorId);
  const finishing = (product.finishing_options || []).filter((f) => (input.finishingIds || []).includes(f.id));
  const sizeMultiplier = size?.multiplier ?? 1;
  const paperPrice = paper?.price ?? 0;
  const colorPrice = color?.price ?? 0;
  const finishingPrice = finishing.reduce((s, f) => s + f.price, 0);
  const adjustedBase = product.base_price * sizeMultiplier;
  const sizeAdjustment = adjustedBase - product.base_price;
  const unitPrice = adjustedBase + paperPrice + colorPrice + finishingPrice;
  const qty = Math.max(1, Math.floor(input.quantity || 1));
  const subtotal = unitPrice * qty;
  const tier = [...product.quantity_tiers || []].sort((a, b) => a.qty - b.qty).filter((t) => qty >= t.qty).pop();
  const discountPct = tier?.discount ?? 0;
  const discount = subtotal * discountPct;
  const shipping = product.shipping_cost;
  const expressExtra = input.express ? product.express_extra : 0;
  const total = subtotal - discount + shipping + expressExtra;
  return {
    basePrice: product.base_price,
    sizeAdjustment,
    paperPrice,
    colorPrice,
    finishingPrice,
    unitPrice,
    subtotal,
    discount,
    discountPct,
    shipping,
    expressExtra,
    total,
    quantity: qty
  };
}
const formatINR = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export {
  calculatePrice as c,
  formatINR as f
};
