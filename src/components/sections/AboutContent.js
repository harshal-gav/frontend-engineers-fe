'use client';

import SectionHeading from '@/components/common/SectionHeading';
import Card from '@/components/common/Card';
import { Code2, Zap, Shield, Users, Target, Rocket } from 'lucide-react';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

const values = [
  {
    icon: Code2,
    title: 'Engineering Excellence',
    description: 'We don\'t just build websites; we engineer robust, scalable digital products using the latest technologies and best practices.'
  },
  {
    icon: Zap,
    title: 'Performance First',
    description: 'Speed is a feature. We optimize every asset, query, and render path to ensure lightning-fast experiences for your users.'
  },
  {
    icon: Shield,
    title: 'Built for Security',
    description: 'Security isn\'t an afterthought. We implement industry-leading security protocols to protect your data and your customers.'
  },
  {
    icon: Users,
    title: 'User-Centric Design',
    description: 'Every interface we create is designed with empathy for the end-user, ensuring intuitive navigation and high engagement.'
  },
  {
    icon: Target,
    title: 'Business Alignment',
    description: 'We measure our success by your success. Our technical decisions are always driven by your core business objectives.'
  },
  {
    icon: Rocket,
    title: 'Continuous Innovation',
    description: 'The web evolves rapidly. We constantly research and adopt new methodologies to keep your digital presence ahead of the curve.'
  }
];

const AboutContent = () => {
  return (
    <>
      {/* Hero */}
      <section className="pt-24 pb-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">About Our Web Development Agency</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We are a team of expert frontend engineers and full-stack developers dedicated to pushing the boundaries of what&apos;s possible on the web.
          </p>
        </div>
      </section>

      {/* Philosophy / Story */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/2">
              <h2 className="text-3xl font-bold mb-6">Our Philosophy</h2>
              <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                <p>
                  At <strong>Frontend Engineers FE</strong>, we believe that the web should be fast, accessible, and beautiful. Founded on the principle that exceptional code leads to exceptional user experiences, we approach every project as an engineering challenge rather than just a design task.
                </p>
                <p>
                  We saw a gap in the market between traditional creative agencies that lacked technical depth, and pure software houses that ignored user experience. We built our custom web development agency to sit perfectly at that intersection.
                </p>
                <p>
                  Our mission is simple: to empower businesses with digital platforms that are architecturally sound, visually striking, and perfectly aligned with their growth strategies.
                </p>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                  alt="Frontend Engineers FE team collaborating on a web development project" 
                  className="w-full h-auto object-cover"
                  width={1200}
                  height={800}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeading title="Our Core Values" subtitle="What Drives Us" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="p-8 text-center hover:border-blue-100 transition-colors">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-[var(--primary)] mx-auto mb-6">
                  <value.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutContent;
