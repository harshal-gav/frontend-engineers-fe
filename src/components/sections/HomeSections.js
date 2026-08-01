'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '@/components/common/Button';
import SectionHeading from '@/components/common/SectionHeading';
import Card from '@/components/common/Card';
import { services } from '@/data/services';
import { industries } from '@/data/industries';

const HomeServicesSection = () => {
  return (
    <section className="py-20 bg-gray-50" id="services">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading 
          title="Professional Web Development Services" 
          subtitle="What We Do Best"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {services.slice(0, 6).map((service) => (
            <Card key={service.id} hover className="p-8">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-[var(--primary)] mb-6">
                <service.icon size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">{service.title}</h3>
              <p className="text-gray-600 mb-6">{service.description}</p>
              <ul className="space-y-2 mb-6">
                {service.features.slice(0, 3).map((feature, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-[var(--accent)] mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button to="/services" variant="ghost" icon={ArrowRight}>View All Services</Button>
        </div>
      </div>
    </section>
  );
};

const HomeIndustriesSection = () => {
  return (
    <section className="py-20" id="industries">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading 
          title="Industries We Serve" 
          subtitle="Domain Expertise"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-12">
          {industries.map((industry) => (
            <Card key={industry.id} hover className="p-6 text-center cursor-pointer group border border-gray-100 hover:border-blue-100">
              <div className="w-12 h-12 bg-gray-50 group-hover:bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600 group-hover:text-[var(--primary)] transition-colors">
                <industry.icon size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[var(--primary)] transition-colors">{industry.name}</h3>
              <p className="text-sm text-gray-500 mt-2">{industry.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export { HomeServicesSection, HomeIndustriesSection };
