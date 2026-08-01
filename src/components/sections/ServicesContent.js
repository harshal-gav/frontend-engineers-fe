'use client';

import SectionHeading from '@/components/common/SectionHeading';
import { services } from '@/data/services';
import { CheckCircle2 } from 'lucide-react';
import Button from '@/components/common/Button';

const ServicesContent = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="space-y-24">
          {services.map((service, index) => (
            <article key={service.id} className={`flex flex-col md:flex-row gap-12 items-center ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
              <div className="w-full md:w-1/2">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[var(--primary)] mb-6">
                  <service.icon size={32} />
                </div>
                <h2 className="text-3xl font-bold mb-4">{service.title}</h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                <h3 className="font-semibold text-gray-900 mb-4">What&apos;s included:</h3>
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <CheckCircle2 size={20} className="text-[var(--accent)] mr-3 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button to="/contact">Discuss This Service</Button>
              </div>
              <div className="w-full md:w-1/2">
                <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-gray-100 relative group">
                  <img 
                    src={service.image} 
                    alt={`${service.title} - Professional web development service by Frontend Engineers FE`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    width={1200}
                    height={900}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent"></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesContent;
