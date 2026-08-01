import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

export const metadata = {
  title: 'Terms of Service',
  description: 'Review the terms of service for Frontend Engineers FE\'s web development services. Understand our policies for custom website development projects.',
  alternates: {
    canonical: 'https://frontendengineers.fe/terms-of-service',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://frontendengineers.fe' },
        { name: 'Terms of Service', url: 'https://frontendengineers.fe/terms-of-service' },
      ]} />

      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <div className="prose prose-blue max-w-none text-gray-600">
            <p className="mb-4">Last updated: August 1, 2026</p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Agreement to Terms</h2>
            <p className="mb-4">
              By accessing our website at frontendengineers.fe, you are agreeing to be bound by these terms of service, 
              all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Intellectual Property</h2>
            <p className="mb-4">
              The website and its original content, features, and functionality are owned by Frontend Engineers FE and are protected by 
              international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Web Development Services</h2>
            <p className="mb-4">
              Frontend Engineers FE provides custom web development, e-commerce development, web application development, UI/UX design, and related digital services. Specific terms for these services will be 
              outlined in individual contracts or statements of work signed by both parties prior to the commencement of any project.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Limitations</h2>
            <p className="mb-4">
              In no event shall Frontend Engineers FE or its suppliers be liable for any damages (including, without limitation, damages 
              for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on 
              Frontend Engineers FE&apos;s website.
            </p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Revisions and Errata</h2>
            <p className="mb-4">
              The materials appearing on Frontend Engineers FE&apos;s website could include technical, typographical, or photographic errors. 
              Frontend Engineers FE does not warrant that any of the materials on its website are accurate, complete, or current.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
