const fs = require('fs');

const filePath = 'E:\\New folder\\lk\\copy\\src\\routes\\product.$slug.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Craft handleAddToCart
const craftTarget = '  const handleAddToCart = () => {\r\n    toast.success("Order Added!", { description: "800 GSM + Craft Sheet order has been created." });\r\n  };';
const craftReplacement = `  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: product.sizes[0]?.id || "",
      paperId: product.paper_types[0]?.id || "",
      colorId: product.color_options[0]?.id || "",
      finishingIds: [], 
      quantity,
      express: false
    });
  }, [product, quantity]);

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error("Please select a product variant");
      return;
    }
    addToCart(product, breakdown.total, quantity, {
      variant: selectedVariant,
      orderName,
      printing,
      whiteBase,
      foil,
      foilColor,
      dieShape,
      privacyPacking,
      pressline,
      specialRemark
    });
  };`;

// 2. Fix Texture handleAddToCart
const textureTarget = '  const handleAddToCart = () => {\r\n    toast.success("Order Added!", { description: "800 GSM + Texture order has been created." });\r\n  };';
const textureReplacement = `  const breakdown = useMemo(() => {
    return calculatePrice(product, {
      sizeId: product.sizes[0]?.id || "",
      paperId: product.paper_types[0]?.id || "",
      colorId: product.color_options[0]?.id || "",
      finishingIds: [], 
      quantity,
      express: false
    });
  }, [product, quantity]);

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error("Please select a product variant");
      return;
    }
    addToCart(product, breakdown.total, quantity, {
      variant: selectedVariant,
      orderName,
      printing,
      textureType,
      dieShape,
      privacyPacking,
      pressline,
      specialRemark
    });
  };`;

if (content.includes(craftTarget)) {
    content = content.replace(craftTarget, craftReplacement.replace(/\n/g, '\r\n'));
    console.log('Fixed Craft handleAddToCart');
}

if (content.includes(textureTarget)) {
    content = content.replace(textureTarget, textureReplacement.replace(/\n/g, '\r\n'));
    console.log('Fixed Texture handleAddToCart');
}

// Pricing Boxes
const pricingBoxTarget = '                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">\r\n                  <div className="flex justify-between items-center text-gray-600">\r\n                    <span>Applicable Cost</span>\r\n                    <span className="font-bold text-black">Rs. 0/-</span>\r\n                  </div>\r\n                  <div className="flex justify-between items-center text-gray-600">\r\n                    <span>GST (18.00%)</span>\r\n                    <span className="font-bold text-black">Rs. 0/-</span>\r\n                  </div>\r\n                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">\r\n                    <span className="font-bold">Amount Payable</span>\r\n                    <span className="font-bold text-red-600 text-base">Rs. 0/-</span>\r\n                  </div>\r\n                </div>';

const pricingBoxReplacement = '                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">\r\n                  <div className="flex justify-between items-center text-gray-600">\r\n                    <span>Applicable Cost</span>\r\n                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>\r\n                  </div>\r\n                  <div className="flex justify-between items-center text-gray-600">\r\n                    <span>GST (18.00%)</span>\r\n                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>\r\n                  </div>\r\n                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">\r\n                    <span className="font-bold">Amount Payable</span>\r\n                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>\r\n                  </div>\r\n                </div>';

// Replace all occurrences in the file
let count = 0;
while (content.includes(pricingBoxTarget)) {
    content = content.replace(pricingBoxTarget, pricingBoxReplacement);
    count++;
}
console.log(`Updated ${count} Pricing Boxes`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated 800 GSM Customizers');
