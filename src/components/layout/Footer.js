'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Code, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email,
        createdAt: serverTimestamp()
      });
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Error adding document: ', error);
      setStatus('error');
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8" role="contentinfo">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group mb-6" aria-label="Frontend Engineers FE - Home">
              <div className="bg-[var(--primary)] p-2 rounded-lg text-white">
                <Code size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Frontend Engineers <span className="text-[var(--primary)]">FE</span>
              </span>
            </Link>
            <p className="text-gray-400">
              We engineer premium, high-performance websites and web applications that drive growth and deliver exceptional user experiences.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="hover:text-[var(--secondary)] transition-colors">About Us</Link></li>
              <li><Link href="/services" className="hover:text-[var(--secondary)] transition-colors">Services</Link></li>
              <li><Link href="/portfolio" className="hover:text-[var(--secondary)] transition-colors">Portfolio</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--secondary)] transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Services</h3>
            <ul className="space-y-3">
              <li><Link href="/services" className="hover:text-[var(--secondary)] transition-colors">Web Development</Link></li>
              <li><Link href="/services" className="hover:text-[var(--secondary)] transition-colors">E-commerce Solutions</Link></li>
              <li><Link href="/services" className="hover:text-[var(--secondary)] transition-colors">Web Applications</Link></li>
              <li><Link href="/services" className="hover:text-[var(--secondary)] transition-colors">UI/UX Design</Link></li>
              <li><Link href="/services" className="hover:text-[var(--secondary)] transition-colors">Maintenance & Support</Link></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Get in Touch</h3>
            <ul className="space-y-4 mb-6">
              <li className="flex items-center gap-3">
                <Mail className="text-[var(--primary)] shrink-0" size={18} />
                <span>frontendengineersupport@gmail.com</span>
              </li>
            </ul>
            <form onSubmit={handleSubscribe} className="relative">
              <label htmlFor="newsletter-email" className="sr-only">Subscribe to newsletter</label>
              <input 
                type="email" 
                id="newsletter-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Subscribe to newsletter" 
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:border-[var(--primary)] text-white disabled:opacity-50"
                disabled={status === 'loading' || status === 'success'}
              />
              <button 
                type="submit" 
                disabled={status === 'loading' || status === 'success'}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--primary)] hover:text-white transition-colors p-1 disabled:opacity-50"
                aria-label="Subscribe"
              >
                {status === 'success' ? <CheckCircle2 size={18} className="text-green-500" /> : <ArrowRight size={18} />}
              </button>
            </form>
            {status === 'success' && <p className="text-green-500 text-xs mt-2">Subscribed successfully!</p>}
            {status === 'error' && <p className="text-red-500 text-xs mt-2">Failed to subscribe.</p>}
          </div>

        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; {currentYear} Frontend Engineers FE. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
