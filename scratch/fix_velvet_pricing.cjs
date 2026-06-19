const fs = require('fs');

const filePath = 'E:\\New folder\\lk\\copy\\src\\routes\\product.$slug.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Velvet handleAddToCart
const targetHandle = '  const handleAddToCart = () => {\r\n    toast.success("Order Added!", { description: "500 GSM + Velvet order has been created." });\r\n  };';

const replacementHandle = `  const breakdown = useMemo(() => {
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
      spotUv,
      foil,
      foilColor,
      dieShape,
      privacyPacking,
      pressline,
      specialRemark
    });
  };`;

// 2. Fix Velvet Pricing Box
const targetBox = '                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">\r\n                  <div className="flex justify-between items-center text-gray-600">\r\n                    <span>Applicable Cost</span>\r\n                    <span className="font-bold text-black">Rs. 0/-</span>\r\n                  </div>\r\n                  <div className="flex justify-between items-center text-gray-600">\r\n                    <span>GST (18.00%)</span>\r\n                    <span className="font-bold text-black">Rs. 0/-</span>\r\n                  </div>\r\n                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">\r\n                    <span className="font-bold">Amount Payable</span>\r\n                    <span className="font-bold text-red-600 text-base">Rs. 0/-</span>\r\n                  </div>\r\n                </div>';

const replacementBox = '                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">\r\n                  <div className="flex justify-between items-center text-gray-600">\r\n                    <span>Applicable Cost</span>\r\n                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>\r\n                  </div>\r\n                  <div className="flex justify-between items-center text-gray-600">\r\n                    <span>GST (18.00%)</span>\r\n                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>\r\n                  </div>\r\n                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">\r\n                    <span className="font-bold">Amount Payable</span>\r\n                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>\r\n                  </div>\r\n                </div>';

let updated = false;
if (content.includes(targetHandle)) {
    content = content.replace(targetHandle, replacementHandle.replace(/\n/g, '\r\n'));
    console.log('Found Velvet handleAddToCart');
    updated = true;
}

if (content.includes(targetBox)) {
    content = content.replace(targetBox, replacementBox);
    console.log('Found Velvet Pricing Box');
    updated = true;
}

if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated Velvet500GsmCustomizer');
} else {
    console.error('Velvet targets not found');
}
