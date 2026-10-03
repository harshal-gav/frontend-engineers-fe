import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const shareText = encodeURIComponent(
    "I found 2,400+ remote frontend jobs in one place. No LinkedIn noise. No irrelevant listings. Just React, Vue, Angular & TypeScript roles → frontendengineers.com"
  );
  const shareUrl = encodeURIComponent("https://www.frontendengineers.com");

  return (
    <footer className="relative z-10 bg-[#0f172a] pt-16 pb-8 text-sm mt-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Bold closing statement — the last thing visitors see (Principle #4: shareable footer) */}
        <div className="text-center mb-12 pb-12 border-b border-white/10">
          <p className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
            2,400+ remote frontend jobs.<br />
            <span className="text-[#60a5fa]">Zero noise.</span>
          </p>
          <p className="text-gray-400 text-base max-w-lg mx-auto mb-8">
            Exclusive remote React, Vue, Angular &amp; TypeScript roles with less competition. Updated every 24 hours.
          </p>

          {/* Share buttons */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Share this</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              aria-label="Share on X"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              aria-label="Share on LinkedIn"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link href="/" className="text-lg font-bold text-white mb-3 block">
              Frontend<span className="text-[#60a5fa]">Engineers</span>
            </Link>
            <p className="text-gray-500 text-xs leading-relaxed">
              The only job portal built exclusively for frontend developers. 2,400+ remote React, TypeScript, Vue, Angular &amp; Next.js roles - updated daily.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-white font-semibold mb-3 uppercase tracking-wider text-xs">Platform</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Browse 2,400+ Jobs</a></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/employers/pricing" className="text-gray-400 hover:text-white transition-colors font-medium">Post a Job</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-3 uppercase tracking-wider text-xs">Legal</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/legal/terms-of-service" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/refund-policy" className="text-gray-400 hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link href="/legal/disclaimer" className="text-gray-400 hover:text-white transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>&copy; {currentYear} FrontendEngineers.com</p>
          <div className="flex items-center gap-4">
            <a href="mailto:frontendengineersupport@gmail.com" className="hover:text-white transition-colors">Contact</a>
            <a href="https://www.linkedin.com/company/frontend-engineers-fe/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
            <span className="text-gray-600">Payments by PayPal &amp; PayU</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
