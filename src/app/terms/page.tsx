import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[#00ffcc] hover:underline mb-8 inline-block">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="mb-8">Last Updated: August 2026</p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">By accessing or using FrontendEngineers.com, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you do not have permission to access the service.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p className="leading-relaxed">FrontendEngineers.com is a job board aggregator that curates remote frontend engineering jobs. The jobs are scraped from public third-party company careers websites and we do not guarantee the availability, accuracy, or outcome of any job application.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">3. Subscriptions</h2>
            <p className="leading-relaxed">Some parts of the service are billed on a subscription basis to unlock full access. You will be billed in advance on a recurring and periodic basis. Payment processing is handled securely by PayPal, our payment gateway partner.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">4. User Accounts</h2>
            <p className="leading-relaxed">When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password that you use to access the service.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">5. Changes to Terms</h2>
            <p className="leading-relaxed">We reserve the right to modify or replace these Terms at any time. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">6. Contact Us</h2>
            <p className="leading-relaxed">If you have any questions about these Terms, please contact us at <a href="mailto:frontendengineersupport@gmail.com" className="text-[#00ffcc] hover:underline">frontendengineersupport@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
