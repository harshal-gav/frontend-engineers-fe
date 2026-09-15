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
      <div className="space-y-3">
        {items.map((item, index) => (
          <details
            key={index}
            className="group rounded-xl border border-[#e2e2e6] bg-white overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-3 px-6 py-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <h3 className="text-base font-semibold text-gray-900 group-open:text-[#2563eb] transition-colors">
                {item.question}
              </h3>
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-5 pt-0">
              <p className="text-gray-600 leading-relaxed text-sm">{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
