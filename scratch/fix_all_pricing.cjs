const fs = require('fs');

const filePath = 'E:\\New folder\\lk\\copy\\src\\routes\\product.$slug.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Matt500GsmCustomizer
const mattStart = content.indexOf('function Matt500GsmCustomizer');
const mattEnd = content.indexOf('// ----------------------------------------------------------------------', mattStart + 100);

if (mattStart !== -1 && mattEnd !== -1) {
    const mattFunc = `function Matt500GsmCustomizer({ product }: { product: Product }) {
  const [orderName, setOrderName] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [printing, setPrinting] = useState("");
  const [spotUv, setSpotUv] = useState("");
  const [foil, setFoil] = useState("");
  const [foilColor, setFoilColor] = useState("");
  const [dieShape, setDieShape] = useState("");
  const [privacyPacking, setPrivacyPacking] = useState("Not Required");
  const [fileOption, setFileOption] = useState("Attach File Online");
  const [specialRemark, setSpecialRemark] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pressline, setPressline] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isMattOnly = selectedVariant === "500 GSM + Matt";
  const isMattUVFoil = selectedVariant === "500 GSM + Matt + UV + Foil";
  const isMattUVDieCut = selectedVariant === "500 GSM + Matt + UV + Die Cut";
  const isMattUVFoilDie = selectedVariant === "500 GSM + Matt + UV + Foil + Die Cut";

  const hasUV = isMattUVFoil || isMattUVDieCut || isMattUVFoilDie;
  const hasFoil = isMattUVFoil || isMattUVFoilDie;
  const hasDie = isMattUVDieCut || isMattUVFoilDie;

  const productCode = isMattUVFoilDie ? "VC-7-D" : isMattUVDieCut ? "VC-7-C" : isMattUVFoil ? "VC-7-B" : "VC-7";
  const productClass = isMattUVFoilDie ? "Super Premium (Unique)" : (isMattUVFoil || isMattUVDieCut) ? "Super Premium" : "Premium";
  const productCore = isMattUVFoilDie ? "Matt + UV + Foil + 36 Die Shapes" : isMattUVDieCut ? "Matt + Embossed UV + 36 Die Shapes" : isMattUVFoil ? "Matt + Embossed Spot UV + Foil" : "Premium 500 GSM Matt Lamination";

  const breakdown = useMemo(() => {
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
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1100px]">
        <Link
          to="/category/$slug"
          params={{ slug: product.category_slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 border-b pb-4 w-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Category
        </Link>

        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-12 items-start">
          <div className="flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[400px] aspect-[1.4] bg-gradient-to-t from-[#1a1a2e] to-[#16213e] border-2 border-gray-400 flex flex-col items-center justify-center text-white p-2 shadow-sm mb-8 mx-auto">
              <div className="border border-gray-400 w-full h-full flex flex-col items-center justify-center space-y-1 p-4 text-center">
                <h2 className="text-4xl sm:text-5xl font-bold font-sans">500 GSM</h2>
                <h2 className="text-4xl sm:text-5xl font-bold font-sans">+</h2>
                <h2 className="text-3xl sm:text-4xl font-bold font-sans">MATT</h2>
              </div>
            </div>

            <div className="space-y-8 text-[13px] leading-relaxed text-gray-800 w-full">
              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2">Product Description</h4>
                <ul className="space-y-1">
                  <li>● Product Ref. : VC/11th Edition (Matt)</li>
                  <li>● Product Code : {productCode}</li>
                  <li>● Product Class : {productClass}</li>
                  <li>● Product Core : {productCore}</li>
                  <li>● Paper Quality : Imported 500 GSM Art Paper</li>
                  <li>● Production Time : 3-4 working days</li>
                  <li>● Lamination : Premium Matt Lamination</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2">Our Specialization</h4>
                <ul className="space-y-1">
                  <li>● India's Leading B2B Print Hub.</li>
                  <li>● Advanced Komori Offset (2023–2025 technology).</li>
                  <li>● Precision Die-Cutting & Metallic Foil Specialists.</li>
                  <li>● Real-time tracking and professional QC.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2">Points to be Noted</h4>
                <ul className="space-y-1 whitespace-pre-wrap">
                  <li>● Size Must be as below:<br />       Card Design Size : W: 96.00 mm X H: 58.00 mm<br />       Text / Matter Area : W: 84.00 mm X H: 46.00 mm<br />       Size After Cutting : W: 90.00 mm x H: 53.00 mm</li>
                  <li>● Matt finish is ideal for sophisticated, non-reflective designs.</li>
                  {hasUV && <li>● Spot UV adds a tactile glossy feel to specific design elements.</li>}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-lg font-bold bg-gray-100 p-3 text-center text-gray-800 border border-gray-200 uppercase">
              ADD ORDER
            </h1>

            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <Input
                  placeholder="Customer name for tracking..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none rounded-none focus:border-gray-600"
                  value={selectedVariant}
                  onChange={e => setSelectedVariant(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  <option value="500 GSM + Matt">500 GSM + Matt</option>
                  <option value="500 GSM + Matt + UV + Foil">500 GSM + Matt + UV + Foil</option>
                  <option value="500 GSM + Matt + UV + Die Cut">500 GSM + Matt + UV + Die Cut</option>
                  <option value="500 GSM + Matt + UV + Foil + Die Cut">500 GSM + Matt + UV + Foil + Die Cut</option>
                </select>
              </div>

              <div className="font-bold text-gray-800 border-b pb-2 pt-4">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <input
                    type="number"
                    min={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(100, Number(e.target.value) || 100))}
                    className="border border-gray-300 p-2 w-full max-w-[120px]"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 100)</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Printing</label>
                <select
                  className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none"
                  value={printing}
                  onChange={e => setPrinting(e.target.value)}
                >
                  <option value="">--Select--</option>
                  <option value="Front Only">Front Only</option>
                  <option value="Front / Back">Front / Back</option>
                </select>
              </div>

              {hasUV && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">Spot UV</label>
                  <select
                    className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none"
                    value={spotUv}
                    onChange={e => setSpotUv(e.target.value)}
                  >
                    <option value="">--Select--</option>
                    <option value="Front">Front</option>
                    <option value="Back">Back</option>
                    <option value="Front & Back">Front & Back</option>
                  </select>
                </div>
              )}

              {hasFoil && (
                <>
                  <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                    <label className="font-bold text-right text-gray-700">Foil</label>
                    <select
                      className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none"
                      value={foil}
                      onChange={e => setFoil(e.target.value)}
                    >
                      <option value="">--Select--</option>
                      <option value="Front">Front</option>
                      <option value="Back">Back</option>
                      <option value="Front & Back">Front & Back</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                    <label className="font-bold text-right text-gray-700">Foil Color</label>
                    <select
                      className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none"
                      value={foilColor}
                      onChange={e => setFoilColor(e.target.value)}
                    >
                      <option value="">--Select--</option>
                      <option value="Gold Foil">Gold Foil</option>
                      <option value="Silver Foil">Silver Foil</option>
                      <option value="Copper Foil">Copper Foil</option>
                      <option value="Rose Gold Foil">Rose Gold Foil</option>
                      <option value="Red Foil">Red Foil</option>
                    </select>
                  </div>
                </>
              )}

              {hasDie && (
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                  <label className="font-bold text-right text-gray-700">Die Shape</label>
                  <select
                    className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none"
                    value={dieShape}
                    onChange={e => setDieShape(e.target.value)}
                  >
                    <option value="">--Select--</option>
                    {Array.from({ length: 36 }, (_, i) => (
                      <option key={i + 1} value={\`Shape \${i + 1}\`}>Shape {i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Privacy Packing</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="matt500_privacy" checked={privacyPacking === 'Required'} onChange={() => setPrivacyPacking('Required')} />
                    Required
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="matt500_privacy" checked={privacyPacking === 'Not Required'} onChange={() => setPrivacyPacking('Not Required')} />
                    Not Required
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <div />
                <div className="text-green-700 font-bold bg-green-50 border border-green-200 p-2 text-center text-xs">
                  Congratulations! Order's eligible for free delivery
                </div>
              </div>

              <B2BFileSelector
                fileOption={fileOption}
                setFileOption={setFileOption}
                onFileChange={handleFileChange}
              />

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Applicable Cost</span>
                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>GST (18.00%)</span>
                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="font-bold">Amount Payable</span>
                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <Textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Enter Pressline :<br /><span className="text-[10px] text-gray-500 font-normal">To be Printed on Free Gift (Card Holder)</span>
                </label>
                <Textarea
                  placeholder="LK Printers of India Limited"
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  rows={2}
                  className="rounded-none border-gray-300"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-6">
                <div />
                <Button onClick={handleAddToCart} className="bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-none w-32 h-10">
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}`;

    content = content.substring(0, mattStart) + mattFunc + content.substring(mattEnd);
    console.log('Updated Matt500GsmCustomizer');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated product.$slug.tsx');
