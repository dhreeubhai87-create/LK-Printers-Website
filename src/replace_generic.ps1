$path = 'e:\New folder\lk\copy\src\routes\product.$slug.tsx'
$content = Get-Content -Raw -LiteralPath $path
$pattern = '(?s)(<p className="text-lg text-muted-foreground leading-relaxed">\{product\.description\}</p>\s*)</div>'
$replacement = '$1  {product.features?.length > 0 && (
                <div className="mt-6 p-4 bg-muted/30 rounded-2xl border">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground/70 mb-3 border-b pb-2">Product Details</h4>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {product.features.map((feature, idx) => {
                      const isNote = feature.toLowerCase().startsWith("note:");
                      return (
                        <li key={idx} className={`flex items-start gap-2 ${isNote ? "text-red-600 font-medium" : ""}`}>
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-primary/50 flex-shrink-0" />
                          <em>{feature}</em>
                        </li>
                      );
                    })}
                  </ul>
                </div>x
              )}
            </div>'
$content = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement)
Set-Content -LiteralPath $path -Value $content
