import { ProductSpecsGrid, ProductCard } from "@/components/product-specs-display";

/**
 * EXAMPLE: Product Cards Grid (Like your image)
 * Shows 4 product codes with their specifications
 */
export function VisitingCardSpecsGrid() {
  const products = [
    {
      productCode: "2",
      specs: [
        { label: "Lamination Type", value: "Velvet" },
        { label: "UV Option", value: "Available" },
        { label: "Foil Option", value: "Available (5 Types)" },
        { label: "Die Cut Option", value: "Available (36 Types)" },
        { label: "Production Time", value: "3 days" },
      ],
    },
    {
      productCode: "3",
      specs: [
        { label: "Lamination Type", value: "Matt" },
        { label: "UV Option", value: "Available" },
        { label: "Foil Option", value: "Available" },
        { label: "Die Cut Option", value: "Available (36 Types)" },
        { label: "Production Time", value: "3 days" },
      ],
    },
    {
      productCode: "4",
      specs: [
        { label: "Lamination Type", value: "Not Available" },
        { label: "UV Option", value: "Available" },
        { label: "Foil Option", value: "Available (5 Types)" },
        { label: "Die Cut Option", value: "Available (36 Types)" },
        { label: "Production Time", value: "3 days" },
      ],
    },
    {
      productCode: "5",
      specs: [
        { label: "Lamination Type", value: "Not Available" },
        { label: "UV Option", value: "Available" },
        { label: "Foil Option", value: "Not Available" },
        { label: "Die Cut Option", value: "Available (36 Types)" },
        { label: "Production Time", value: "3 days" },
      ],
    },
  ];

  return <ProductSpecsGrid products={products} columns={4} />;
}

/**
 * EXAMPLE: Single Product Card
 */
export function SingleProductCardExample() {
  return (
    <ProductCard
      productCode="2"
      specs={[
        { label: "Lamination Type", value: "Velvet" },
        { label: "UV Option", value: "Available" },
        { label: "Foil Option", value: "Available (5 Types)" },
        { label: "Die Cut Option", value: "Available (36 Types)" },
        { label: "Production Time", value: "3 days" },
      ]}
    />
  );
}
