import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-[#f5f5f7] border-t border-[#e2e2e6] pt-10 pb-6 text-sm text-gray-600 mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link href="/" className="text-lg font-bold text-gray-900 mb-3 block">
              Frontend<span className="text-[#2563eb]">Engineers</span>
            </Link>
            <p className="text-gray-500 text-xs leading-relaxed">
              Curated 100% remote frontend developer jobs. React, TypeScript, Vue, Angular &amp; Next.js roles — updated daily.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-3 uppercase tracking-wider text-xs">Platform</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="/" className="hover:text-[#2563eb] transition-colors">Browse Jobs</a></li>
              <li><Link href="/pricing" className="hover:text-[#2563eb] transition-colors">Pro Membership</Link></li>
              <li><Link href="/employers/pricing" className="hover:text-[#2563eb] transition-colors font-medium">Post a Job</Link></li>
              <li><Link href="/about" className="hover:text-[#2563eb] transition-colors">About</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-3 uppercase tracking-wider text-xs">Legal</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/legal/terms-of-service" className="hover:text-[#2563eb] transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/privacy-policy" className="hover:text-[#2563eb] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/refund-policy" className="hover:text-[#2563eb] transition-colors">Refund Policy</Link></li>
              <li><Link href="/legal/disclaimer" className="hover:text-[#2563eb] transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#e2e2e6] pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>&copy; {currentYear} FrontendEngineers.com</p>
          <div className="flex items-center gap-4">
            <a href="mailto:frontendengineersupport@gmail.com" className="hover:text-[#2563eb] transition-colors">Contact</a>
            <a href="https://www.linkedin.com/company/frontend-engineers-fe/" target="_blank" rel="noopener noreferrer" className="hover:text-[#2563eb] transition-colors">LinkedIn</a>
            <span className="text-gray-400">Payments by PayPal &amp; PayU</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
