const fs = require('fs');
const path = require('path');
const file = path.join('src', 'routes', 'product.$slug.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\/\s*REPLACED[\s\S]*?\{\/\*\s*RIGHT:\s*Add Order Form\s*\*\/\}/;

const replacement = `  if (!breakdown) return null;

  const handleAddToCart = () => {
    const selectedOption = productOptions.find(o => o.id === selectedVariantId);
    addToCart(product, breakdown.total, Number(quantity) || 1, {
      orderName,
      variant: selectedOption?.label,
      paper: product?.paper_types?.find((p) => p.id === selectedPaper)?.label,
      paperColor: product?.color_options?.find((c) => c.id === selectedPaperColor)?.label,
      binding: product?.finishing_options?.find((f) => f.id === selectedBinding)?.label,
      pressline,
      specialRemark
    });
    toast.success("Order Added!", { description: \`\${product.name} order has been created.\` });
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans text-sm">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          {/* LEFT: Product Description & Specialization */}
          <div className="flex flex-col space-y-10">
            <div className="w-full aspect-[4/3] bg-gray-50 border shadow-sm flex items-center justify-center overflow-hidden">
              <img src={product.images?.[0] || ""} alt={product.name} className="w-full h-full object-cover" />
            </div>

            <div className="w-full">
              <FullProductDetails product={product} />
            </div>
          </div>

          {/* RIGHT: Add Order Form */}`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log('Fixed A4BillBookCustomizer');
