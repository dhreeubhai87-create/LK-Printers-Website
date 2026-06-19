const fs = require('fs');

const filePath = 'E:\\New folder\\lk\\copy\\src\\routes\\product.$slug.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. MetalCardCustomizer (Line 798-1048 approx)
const metalStart = content.indexOf('function MetalCardCustomizer');
const metalAddToCart = content.indexOf('const handleAddToCart = () => {', metalStart);
const metalAddToCartEnd = content.indexOf('};', metalAddToCart) + 2;

if (metalStart !== -1 && metalAddToCart !== -1) {
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
    addToCart(product, breakdown.total, quantity, {
      name: orderName,
      finish: metalFinish,
      colors: colorCount,
      privacy: privacyPacking,
      pressline,
      specialRemark
    });
  };`;
    content = content.substring(0, metalAddToCart) + replacement.replace(/\n/g, '\r\n') + content.substring(metalAddToCartEnd);
    console.log('Fixed MetalCardCustomizer');
}

// 2. Velvet800GsmCustomizer
const v800Start = content.indexOf('function Velvet800GsmCustomizer');
const v800AddToCart = content.indexOf('const handleAddToCart = () => {', v800Start);
const v800AddToCartEnd = content.indexOf('};', v800AddToCart) + 2;

if (v800Start !== -1 && v800AddToCart !== -1) {
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
    addToCart(product, breakdown.total, quantity, {
      name: orderName,
      variant: selectedVariant,
      printing,
      spotUv,
      foil,
      foilColor,
      dieShape,
      privacy: privacyPacking,
      pressline,
      specialRemark
    });
  };`;
    content = content.substring(0, v800AddToCart) + replacement.replace(/\n/g, '\r\n') + content.substring(v800AddToCartEnd);
    console.log('Fixed Velvet800GsmCustomizer');
}

// 3. Matt800GsmCustomizer
const m800Start = content.indexOf('function Matt800GsmCustomizer');
const m800AddToCart = content.indexOf('const handleAddToCart = () => {', m800Start);
const m800AddToCartEnd = content.indexOf('};', m800AddToCart) + 2;

if (m800Start !== -1 && m800AddToCart !== -1) {
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
    addToCart(product, breakdown.total, quantity, {
      name: orderName,
      variant: selectedVariant,
      printing,
      spotUv,
      foil,
      foilColor,
      dieShape,
      privacy: privacyPacking,
      pressline,
      specialRemark
    });
  };`;
    content = content.substring(0, m800AddToCart) + replacement.replace(/\n/g, '\r\n') + content.substring(m800AddToCartEnd);
    console.log('Fixed Matt800GsmCustomizer');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated remaining 800 GSM Customizers');
