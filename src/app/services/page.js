import { servicesData } from '@/data/services-data';
import { ServiceJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import ServicesContent from '@/components/sections/ServicesContent';

export const metadata = {
  title: 'Web Development Services — Custom Websites, E-commerce, Web Apps & UI/UX Design',
  description: 'Explore our full range of professional web development services: custom websites, e-commerce platforms, web applications, UI/UX design, SEO optimization & ongoing support.',
  alternates: {
    canonical: 'https://frontendengineers.fe/services',
  },
  openGraph: {
    title: 'Web Development Services | Frontend Engineers FE',
    description: 'Comprehensive web development services: custom websites, e-commerce, web applications, UI/UX design, and more.',
    url: 'https://frontendengineers.fe/services',
  },
};

export default function ServicesPage() {
  return (
    <>
      <ServiceJsonLd services={servicesData} />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://frontendengineers.fe' },
        { name: 'Services', url: 'https://frontendengineers.fe/services' },
      ]} />

      <section className="pt-24 pb-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Professional Web Development Services</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive custom web development solutions engineered for performance, scale, and conversion. From React websites to full-stack web applications.
          </p>
        </div>
      </section>

      <ServicesContent />
    </>
  );
}
