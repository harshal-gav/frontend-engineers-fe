import { Globe, ShoppingCart, Smartphone, Palette, Search, Settings } from 'lucide-react';

export const services = [
  {
    id: 'web-development',
    title: 'Custom Web Development',
    description: 'High-performance, scalable, and secure websites built from scratch using modern frameworks like React and Next.js.',
    icon: Globe,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    features: ['React & Next.js', 'Responsive Design', 'API Integration', 'Performance Optimization'],
  },
  {
    id: 'ecommerce',
    title: 'E-commerce Development',
    description: 'Robust online stores tailored to your brand, ensuring a seamless shopping experience and maximum conversions.',
    icon: ShoppingCart,
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    features: ['Shopify & WooCommerce', 'Payment Gateways', 'Inventory Management', 'Custom Checkout'],
  },
  {
    id: 'web-apps',
    title: 'Web App Development',
    description: 'Complex, interactive web applications designed for scale, efficiency, and exceptional user experiences.',
    icon: Smartphone,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    features: ['PWA Development', 'Dashboard Creation', 'SaaS Platforms', 'Real-time Features'],
  },
  {
    id: 'ui-ux',
    title: 'UI/UX Design',
    description: 'User-centered design that not only looks beautiful but also drives engagement and business results.',
    icon: Palette,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    features: ['Wireframing & Prototyping', 'User Research', 'Design Systems', 'Interactive Mockups'],
  },
  {
    id: 'seo',
    title: 'SEO & Digital Marketing',
    description: 'Data-driven strategies to improve your search rankings, increase visibility, and drive organic traffic.',
    icon: Search,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    features: ['Technical SEO', 'On-page Optimization', 'Content Strategy', 'Performance Tracking'],
  },
  {
    id: 'maintenance',
    title: 'Maintenance & Support',
    description: 'Reliable ongoing support, security updates, and performance monitoring to keep your site running smoothly.',
    icon: Settings,
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    features: ['Security Audits', 'Regular Backups', 'Content Updates', '24/7 Monitoring'],
  }
];
