const fs = require('fs');

const filePath = 'E:\\New folder\\lk\\copy\\src\\routes\\product.$slug.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = '                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">\r\n                  <div className="flex justify-between items-center text-gray-600">\r\n                    <span>Applicable Cost</span>\r\n                    <span className="font-bold text-black">Rs. 0/-</span>\r\n                  </div>\r\n                  <div className="flex justify-between items-center text-gray-600">\r\n                    <span>GST (18.00%)</span>\r\n                    <span className="font-bold text-black">Rs. 0/-</span>\r\n                  </div>\r\n                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">\r\n                    <span className="font-bold">Amount Payable</span>\r\n                    <span className="font-bold text-red-600 text-base">Rs. 0/-</span>\r\n                  </div>\r\n                </div>';

const replacement = '                <div className="border border-gray-300 p-4 space-y-2 bg-gray-50 text-[13px]">\r\n                  <div className="flex justify-between items-center text-gray-600">\r\n                    <span>Applicable Cost</span>\r\n                    <span className="font-bold text-black">Rs. {Math.round(breakdown.subtotal - breakdown.discount).toLocaleString()}/-</span>\r\n                  </div>\r\n                  <div className="flex justify-between items-center text-gray-600">\r\n                    <span>GST (18.00%)</span>\r\n                    <span className="font-bold text-black">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 0.18).toLocaleString()}/-</span>\r\n                  </div>\r\n                  <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">\r\n                    <span className="font-bold">Amount Payable</span>\r\n                    <span className="font-bold text-red-600 text-base">Rs. {Math.round((breakdown.subtotal - breakdown.discount) * 1.18).toLocaleString()}/-</span>\r\n                  </div>\r\n                </div>';

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated Matt500GsmCustomizer Pricing Box');
} else {
    console.error('Target not found');
}
