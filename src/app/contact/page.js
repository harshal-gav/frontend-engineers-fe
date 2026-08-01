import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import ContactForm from '@/components/sections/ContactForm';

export const metadata = {
  title: 'Contact Us — Get a Free Web Development Quote',
  description: 'Ready to start your web project? Contact Frontend Engineers FE for a free consultation and custom quote. Expert web development, e-commerce, and UI/UX design services. We respond within 24 hours.',
  alternates: {
    canonical: 'https://frontendengineers.fe/contact',
  },
  openGraph: {
    title: 'Contact Us | Frontend Engineers FE',
    description: 'Get a free web development quote. Contact our expert team to discuss your project.',
    url: 'https://frontendengineers.fe/contact',
  },
};

export default function ContactPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://frontendengineers.fe' },
        { name: 'Contact', url: 'https://frontendengineers.fe/contact' },
      ]} />

      <section className="pt-24 pb-16 bg-[var(--primary)] text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Get a Free Web Development Quote</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Ready to start your project? Fill out the form below and our expert web development team will get back to you within 24 hours with a custom quote.
          </p>
        </div>
      </section>

      <ContactForm />
    </>
  );
}
