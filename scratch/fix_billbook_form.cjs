const fs = require('fs');
const path = require('path');
const file = path.join('src', 'routes', 'product.$slug.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* RIGHT: Add Order Form \*\/\}[\s\S]*?(?=\/\/\s*----------------------------------------------------------------------\n\/\/\s*CUSTOM STICKER CONFIGURATOR)/;

const replacement = `{/* RIGHT: Add Order Form */}
          <div className="bg-white border rounded shadow-sm p-6 lg:p-8 space-y-6">
            <h1 className="text-xl font-bold p-3 text-center border uppercase bg-gray-50 text-blue-800">
              ADD ORDER
            </h1>

            <div className="space-y-5">
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700">Order Name</label>
                <input
                  placeholder="यहाँ अपने कस्टमर का नाम टाइप करें जिससे आर्डर का स्टेटस चेक करने में आसानी होगी..."
                  value={orderName}
                  onChange={e => setOrderName(e.target.value)}
                  className="border border-gray-300 p-2 w-full text-xs h-10 outline-none"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Select Product</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none font-bold text-blue-800 h-10 text-sm"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  <option value="">--Select Product--</option>
                  {productOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="font-bold border-b pb-1 text-black">Select Detail</div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4">
                <label className="font-bold text-right text-gray-700 pt-2">Quantity</label>
                <div>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="border border-gray-300 p-2 w-full max-w-[200px] bg-white outline-none h-10"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">(Min Qty. : 10)</span>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Paper Type</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={selectedPaper}
                  onChange={e => setSelectedPaper(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.paper_types || []).map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Paper Color</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={selectedPaperColor}
                  onChange={e => setSelectedPaperColor(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.color_options || []).map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 leading-tight">Binding</label>
                <select
                  className="border border-gray-300 p-2 w-full bg-white outline-none h-10 text-sm"
                  value={selectedBinding}
                  onChange={e => setSelectedBinding(e.target.value)}
                >
                  <option value="">--Select--</option>
                  {(product.finishing_options || []).map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <B2BFileSelector
                  fileOption={fileOption}
                  setFileOption={setFileOption}
                  onFileChange={handleFileChange}
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4 mt-8">
                <div />
                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 font-bold">
                  <div className="flex justify-between items-center text-gray-600 text-[13px]">
                    <span>Applicable Cost</span>
                    <span className="text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600 text-[13px]">
                    <span>GST (18.00%)</span>
                    <span className="text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                    <span className="text-sm">Amount Payable</span>
                    <span className="text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-start gap-4 pt-4">
                <label className="font-bold text-right text-gray-700 leading-tight pt-2">
                  Special Remark<br /><span className="text-[11px] text-gray-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  placeholder="remarks for order processing team..."
                  value={specialRemark}
                  onChange={e => setSpecialRemark(e.target.value)}
                  rows={2}
                  className="border border-gray-300 p-2 w-full outline-none"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] items-center gap-4">
                <label className="font-bold text-right text-gray-700 pt-1 text-[11px] leading-tight">
                  Enter Pressline :<br />
                  <span className="text-[9px] text-blue-600 font-normal">To be Printed on Free Gift</span>
                </label>
                <input
                  placeholder="Enter Pressline..."
                  value={pressline}
                  onChange={e => setPressline(e.target.value)}
                  className="border border-gray-300 p-2 w-full font-bold text-blue-800 h-9 outline-none"
                />
              </div>

              <div className="mt-6 w-full space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[#007bff] hover:bg-blue-600 text-white rounded-md py-6 font-bold text-[16px] tracking-wide"
                >
                  Add Order (Pay From Wallet)
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.location.href = "/checkout";
                  }}
                  className="w-full rounded-md py-6 font-bold text-[16px] tracking-wide border-2 border-[#007bff] text-[#007bff] hover:bg-blue-50"
                >
                  Order Now
                </Button>
              </div>

            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

`;

const startIdx = content.indexOf('{/* RIGHT: Add Order Form */}', content.indexOf('function BillBookCustomizer'));
if (startIdx !== -1) {
  const endMarker = '// ----------------------------------------------------------------------\n// CUSTOM STICKER CONFIGURATOR';
  const endIdx = content.indexOf(endMarker, startIdx);
  if (endIdx !== -1) {
    content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
    fs.writeFileSync(file, content);
    console.log('Fixed BillBookCustomizer form!');
  } else {
    console.log('End marker not found');
  }
} else {
  console.log('Start marker not found');
}
