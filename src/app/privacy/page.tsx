import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[#00ffcc] hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="mb-8">Last Updated: August 2026</p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p className="leading-relaxed">We collect information you provide directly to us when you create an account, subscribe to our premium service, or otherwise communicate with us. This includes your email address, name, and payment information processed by our secure payment provider (PayPal).</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p className="leading-relaxed">We use the information we collect to operate, maintain, and provide the features of our service. This includes processing transactions, authenticating users securely via Firebase, and sending necessary administrative emails regarding your subscription.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">3. Cookies and Tracking</h2>
            <p className="leading-relaxed">We use cookies and similar tracking technologies to track activity on our service and store certain information to improve your user experience, such as keeping you logged in securely.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p className="leading-relaxed">We use trusted third-party services such as Google Firebase for authentication and database management, and PayPal for payment processing. These services have their own stringent privacy policies regarding the data they collect and process.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">5. Contact Us</h2>
            <p className="leading-relaxed">If you have any questions about this Privacy Policy, please contact us at <a href="mailto:frontendengineersupport@gmail.com" className="text-[#00ffcc] hover:underline">frontendengineersupport@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
