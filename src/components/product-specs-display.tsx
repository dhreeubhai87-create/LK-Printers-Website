export interface ProductSpecItem {
  label: string;
  value: string;
}

export interface ProductCardProps {
  productCode: string;
  specs: ProductSpecItem[];
}

// Single Product Card - matches the design in your image
export function ProductCard({ productCode, specs }: ProductCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-6 space-y-3 hover:shadow-md transition-shadow">
      {/* Product Code Header - Blue/Accent Color */}
      <div className="pb-3 border-b-2 border-blue-400">
        <p className="text-center">
          <span className="font-semibold text-slate-700">Product Code: </span>
          <span className="text-xl font-bold text-blue-600">{productCode}</span>
        </p>
      </div>

      {/* Specifications */}
      <div className="space-y-2.5 pt-2">
        {specs.map((spec, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-0.5">
              {spec.label}
            </span>
            <span className="text-sm text-slate-700 font-medium">
              {spec.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Grid Container for Multiple Products
export interface ProductGridProps {
  products: ProductCardProps[];
  columns?: 2 | 3 | 4;
}

export function ProductSpecsGrid({ products, columns = 4 }: ProductGridProps) {
  const gridClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-5`}>
      {products.map((product, idx) => (
        <ProductCard key={idx} {...product} />
      ))}
    </div>
  );
}
