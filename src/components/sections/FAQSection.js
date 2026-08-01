'use client';

import { useState } from 'react';
import SectionHeading from '@/components/common/SectionHeading';
import { ChevronDown } from 'lucide-react';

const FAQSection = ({ faqs }) => {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="py-20 bg-gray-50" id="faq">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading 
          title="Frequently Asked Questions" 
          subtitle="Common Questions About Web Development"
        />
        <div className="max-w-3xl mx-auto space-y-4 mt-12">
          {faqs.map((faq) => (
            <div 
              key={faq.id} 
              className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
            >
              <button
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                aria-expanded={openId === faq.id}
                aria-controls={`faq-answer-${faq.id}`}
              >
                <h3 className="font-semibold text-gray-900 text-lg">{faq.question}</h3>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-400 shrink-0 transition-transform duration-200 ${
                    openId === faq.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openId === faq.id && (
                <div id={`faq-answer-${faq.id}`} className="px-6 pb-5">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
