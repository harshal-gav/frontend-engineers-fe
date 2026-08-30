"use client";

import React from "react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSchemaProps {
  items: FaqItem[];
  title?: string;
}

export default function FaqSchema({ items, title = "Frequently Asked Questions" }: FaqSchemaProps) {
  if (!items || items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="faq-section my-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="text-2xl font-bold mb-6 text-white">{title}</h2>
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={index} className="faq-item p-6 rounded-xl border border-[#333] bg-[#111]">
            <h3 className="text-lg font-semibold text-[#00ffcc] mb-3">{item.question}</h3>
            <p className="text-gray-300 leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
