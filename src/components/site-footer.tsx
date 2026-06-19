import { Printer } from "lucide-react";

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-foreground text-background mt-24">
      <div className="container mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Printer className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-serif font-bold">LK Printer</span>
          </div>
          <p className="text-sm text-background/70 leading-relaxed">
            Premium printing solutions for businesses, professionals, and creators across India.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-background/90">Categories</h4>
          <ul className="space-y-2 text-sm text-background/70">
            <li><a href="/#categories" className="hover:text-accent transition-colors">Visiting Cards</a></li>
            <li><a href="/#categories" className="hover:text-accent transition-colors">Letterheads</a></li>
            <li><a href="/#categories" className="hover:text-accent transition-colors">Pamphlets</a></li>
            <li><a href="/#categories" className="hover:text-accent transition-colors">Stickers & Labels</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-background/90">Company</h4>
          <ul className="space-y-2 text-sm text-background/70">
            <li><a href="/#about" className="hover:text-accent transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">How It Works</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Quality Promise</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Bulk Inquiries</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-background/90">Get in Touch</h4>
          <ul className="space-y-2 text-sm text-background/70">
            <li>📍 Mumbai, India</li>
            <li>✉️ hello@lkprinter.in</li>
            <li>📞 +91 98765 43210</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10 py-6 text-center text-xs text-background/50">
        © {new Date().getFullYear()} LK Printer. All rights reserved.
      </div>
    </footer>
  );
}
