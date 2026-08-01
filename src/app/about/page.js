import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import AboutContent from '@/components/sections/AboutContent';

export const metadata = {
  title: 'About Us — Expert Web Development Team',
  description: 'Meet the team behind Frontend Engineers FE. 10+ years of experience building scalable, high-performance websites and web applications for businesses worldwide.',
  alternates: {
    canonical: 'https://frontendengineers.fe/about',
  },
  openGraph: {
    title: 'About Us | Frontend Engineers FE',
    description: 'Meet the expert web development team at Frontend Engineers FE. We engineer scalable, high-performance digital solutions.',
    url: 'https://frontendengineers.fe/about',
  },
};

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: 'https://frontendengineers.fe' },
        { name: 'About Us', url: 'https://frontendengineers.fe/about' },
      ]} />
      <AboutContent />
    </>
  );
}
