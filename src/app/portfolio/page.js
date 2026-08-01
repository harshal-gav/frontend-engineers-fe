import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import PortfolioGrid from '@/components/sections/PortfolioGrid';

export const metadata = {
  title: 'Our Work & Portfolio — Web Development Case Studies',
  description: 'Browse our portfolio of successful web development projects across healthcare, e-commerce, finance, education & more. See real results and case studies from our custom web solutions.',
  alternates: {
    canonical: 'https://frontendengineers.fe/portfolio',
  },
  openGraph: {
    title: 'Portfolio & Case Studies | Frontend Engineers FE',
    description: 'Explore our latest web development projects showcasing technical capabilities and design excellence.',
    url: 'https://frontendengineers.fe/portfolio',
  },
};

export default function PortfolioPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://frontendengineers.fe' },
        { name: 'Portfolio', url: 'https://frontendengineers.fe/portfolio' },
      ]} />

      <section className="pt-24 pb-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Web Development Portfolio</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our latest custom web development projects showcasing our technical capabilities and design excellence across multiple industries.
          </p>
        </div>
      </section>

      <PortfolioGrid />
    </>
  );
}
