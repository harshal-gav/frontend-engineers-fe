// Services data without icon components for use in Server Components (JSON-LD, metadata)
// Icon components are functions and cannot be serialized across the server/client boundary
export const servicesData = [
  {
    id: 'web-development',
    title: 'Custom Web Development',
    description: 'High-performance, scalable, and secure websites built from scratch using modern frameworks like React and Next.js.',
    features: ['React & Next.js', 'Responsive Design', 'API Integration', 'Performance Optimization'],
  },
  {
    id: 'ecommerce',
    title: 'E-commerce Development',
    description: 'Robust online stores tailored to your brand, ensuring a seamless shopping experience and maximum conversions.',
    features: ['Shopify & WooCommerce', 'Payment Gateways', 'Inventory Management', 'Custom Checkout'],
  },
  {
    id: 'web-apps',
    title: 'Web App Development',
    description: 'Complex, interactive web applications designed for scale, efficiency, and exceptional user experiences.',
    features: ['PWA Development', 'Dashboard Creation', 'SaaS Platforms', 'Real-time Features'],
  },
  {
    id: 'ui-ux',
    title: 'UI/UX Design',
    description: 'User-centered design that not only looks beautiful but also drives engagement and business results.',
    features: ['Wireframing & Prototyping', 'User Research', 'Design Systems', 'Interactive Mockups'],
  },
  {
    id: 'seo',
    title: 'SEO & Digital Marketing',
    description: 'Data-driven strategies to improve your search rankings, increase visibility, and drive organic traffic.',
    features: ['Technical SEO', 'On-page Optimization', 'Content Strategy', 'Performance Tracking'],
  },
  {
    id: 'maintenance',
    title: 'Maintenance & Support',
    description: 'Reliable ongoing support, security updates, and performance monitoring to keep your site running smoothly.',
    features: ['Security Audits', 'Regular Backups', 'Content Updates', '24/7 Monitoring'],
  }
];
