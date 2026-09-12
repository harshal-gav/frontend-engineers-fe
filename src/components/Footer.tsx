import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-[#f5f5f7] border-t border-[#e2e2e6] pt-16 pb-8 text-sm text-gray-600 mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link href="/" className="text-xl font-bold text-gray-900 mb-4 block">
              Frontend<span className="text-[#2563eb]">Engineers</span>
            </Link>
            <p className="text-gray-600 mb-6">
              Curated remote frontend and JavaScript engineering jobs at the world's best product companies.
            </p>
          </div>

          {/* Platform Navigation */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4 uppercase tracking-wider text-xs">Platform</h3>
            <ul className="space-y-3">
              <li>
                <a href="/" className="hover:text-[#2563eb] transition-colors">
                  Browse Jobs
                </a>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#2563eb] transition-colors">
                  Pricing (Candidates)
                </Link>
              </li>
              <li>
                <Link href="/employers/pricing" className="hover:text-[#2563eb] transition-colors font-medium">
                  Post a Job (Employers)
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#2563eb] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="hover:text-[#2563eb] transition-colors">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4 uppercase tracking-wider text-xs">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/legal/terms-of-service" className="hover:text-[#2563eb] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy-policy" className="hover:text-[#2563eb] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/refund-policy" className="hover:text-[#2563eb] transition-colors">
                  Cancellation and Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/disclaimer" className="hover:text-[#2563eb] transition-colors">
                  Job Board Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Trust */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4 uppercase tracking-wider text-xs">Company</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <span>frontendengineersupport@gmail.com</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                <span>Frontend Engineers</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#e2e2e6] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {currentYear} Frontend Engineers. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="text-gray-700 text-xs">Secure payments by PayPal & PayU</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
