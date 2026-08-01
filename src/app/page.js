import Button from '@/components/common/Button';
import { faqs } from '@/data/faqs';
import { testimonials } from '@/data/testimonials';
import { WebSiteJsonLd, FAQJsonLd, ReviewJsonLd } from '@/components/seo/JsonLd';
import FAQSection from '@/components/sections/FAQSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import { HomeServicesSection, HomeIndustriesSection } from '@/components/sections/HomeSections';

export const metadata = {
  title: 'Custom Web Development Agency — Websites That Grow Your Business',
  description: 'Award-winning web development agency specializing in custom websites, e-commerce platforms, web applications & UI/UX design. React & Next.js experts. Get a free quote today.',
  alternates: {
    canonical: 'https://frontendengineers.fe',
  },
  openGraph: {
    title: 'Frontend Engineers FE | Custom Web Development Agency',
    description: 'Award-winning web development agency building high-performance websites and web applications. React & Next.js experts.',
    url: 'https://frontendengineers.fe',
  },
};

export default function HomePage() {
  return (
    <>
      <WebSiteJsonLd />
      <FAQJsonLd faqs={faqs} />
      <ReviewJsonLd testimonials={testimonials} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-white to-white"></div>
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-[var(--primary)] text-sm font-semibold mb-6 border border-blue-100">
              Award-Winning Web Development Agency
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-8">
              We Engineer Websites That <span className="text-[var(--primary)]">Grow Your Business</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Fast, secure, and visually stunning custom web development — designed to convert visitors into loyal customers.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button to="/contact" size="lg">Get a Free Quote</Button>
              <Button to="/portfolio" variant="outline" size="lg">View Our Work</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <HomeServicesSection />

      {/* Industries */}
      <HomeIndustriesSection />

      {/* Testimonials */}
      <TestimonialsSection testimonials={testimonials} />

      {/* FAQ */}
      <FAQSection faqs={faqs} />

      {/* Final CTA */}
      <section className="py-20 bg-[var(--primary)] text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Build Your Next Website?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Let&apos;s discuss your project requirements and create a technical roadmap for your success. Get a free consultation today.
          </p>
          <Button to="/contact" size="lg" className="bg-white text-[var(--primary)] hover:bg-gray-100 border-2 border-white hover:border-gray-100">
            Start Your Project
          </Button>
        </div>
      </section>
    </>
  );
}
