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
      <h2 className="text-2xl font-bold mb-6 text-gray-900">{title}</h2>
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={index} className="faq-item p-6 rounded-xl border border-[#e2e2e6] bg-white">
            <h3 className="text-lg font-semibold text-[#2563eb] mb-3">{item.question}</h3>
            <p className="text-gray-600 leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
