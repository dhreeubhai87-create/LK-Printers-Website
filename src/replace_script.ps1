$path = 'e:\New folder\lk\copy\src\routes\product.$slug.tsx'
$content = Get-Content -Raw -LiteralPath $path
$pattern = '(?s)(<h4 className="font-bold text-black border-b border-gray-300 pb-1 mb-2">Product Description</h4>\s*)<ul className="space-y-1">.*?</ul>'
$replacement = '$1<ul className="space-y-1">
                  {product.features?.length > 0 ? product.features.map((f, i) => (
                    <li key={i} className={f.toLowerCase().startsWith(''note:'') ? ''text-red-600'' : ''''}>● <em>{f}</em></li>
                  )) : (
                    <li className="text-gray-500">Loading details...</li>
                  )}
                </ul>'
$content = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement)
Set-Content -LiteralPath $path -Value $content
