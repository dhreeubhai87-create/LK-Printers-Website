const fs = require('fs');

const filePath = 'E:\\New folder\\lk\\copy\\src\\routes\\product.$slug.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = '  const handleAddToCart = () => {\n    toast.success("Order Added!", { description: "500 GSM + Matt order has been created." });\n  };';

const replacement = `  const breakdown = useMemo(() => {
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

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated Matt500GsmCustomizer');
} else {
    // Try with \r\n
    const targetRN = target.replace(/\n/g, '\r\n');
    if (content.includes(targetRN)) {
        content = content.replace(targetRN, replacement.replace(/\n/g, '\r\n'));
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Successfully updated Matt500GsmCustomizer (with RN)');
    } else {
        console.error('Target not found');
    }
}
