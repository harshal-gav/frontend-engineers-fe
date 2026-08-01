export function OrganizationJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Frontend Engineers FE',
    alternateName: 'Frontend Engineers',
    url: 'https://frontendengineers.fe',
    logo: 'https://frontendengineers.fe/favicon.svg',
    description: 'Award-winning web development agency specializing in custom websites, e-commerce platforms, web applications, and UI/UX design. React & Next.js experts.',
    email: 'frontendengineersupport@gmail.com',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'frontendengineersupport@gmail.com',
      contactType: 'customer service',
      availableLanguage: 'English'
    },
    areaServed: 'Worldwide',
    knowsAbout: [
      'Web Development',
      'React Development',
      'Next.js Development',
      'E-commerce Development',
      'Web Application Development',
      'UI/UX Design',
      'SEO Optimization',
      'Custom Website Design',
      'Frontend Development',
      'Full Stack Development'
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function WebSiteJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Frontend Engineers FE',
    url: 'https://frontendengineers.fe',
    description: 'Custom web development agency — we engineer websites that grow your business.',
    publisher: {
      '@type': 'Organization',
      name: 'Frontend Engineers FE'
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://frontendengineers.fe/?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function FAQJsonLd({ faqs }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function ServiceJsonLd({ services }) {
  const structuredData = services.map(service => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.title,
    provider: {
      '@type': 'Organization',
      name: 'Frontend Engineers FE',
      url: 'https://frontendengineers.fe'
    },
    description: service.description,
    areaServed: 'Worldwide'
  }));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function ReviewJsonLd({ testimonials }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Frontend Engineers FE',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      reviewCount: String(testimonials.length),
      bestRating: '5',
      worstRating: '1'
    },
    review: testimonials.map(t => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: t.name
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: String(t.rating),
        bestRating: '5'
      },
      reviewBody: t.quote
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
