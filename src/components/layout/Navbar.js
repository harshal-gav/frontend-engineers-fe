'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Code } from 'lucide-react';
import Button from '../common/Button';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
      }`}
      role="banner"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" aria-label="Frontend Engineers FE - Home">
            <div className="bg-[var(--primary)] p-2 rounded-lg text-white group-hover:bg-[var(--secondary)] transition-colors">
              <Code size={24} />
            </div>
            <span className={`font-bold text-xl tracking-tight ${scrolled ? 'text-gray-900' : 'text-gray-900'} `}>
              Frontend Engineers <span className="text-[var(--primary)]">FE</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            <ul className="flex items-center gap-6">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.path}
                    className={`text-sm font-medium transition-colors hover:text-[var(--primary)] ${
                      pathname === link.path ? 'text-[var(--primary)]' : 'text-gray-600'
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Button to="/contact" size="sm">Get a Quote</Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-gray-900 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <nav className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 p-4" aria-label="Mobile navigation">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link 
                  href={link.path}
                  className={`block px-4 py-2 rounded-lg ${
                    pathname === link.path ? 'bg-blue-50 text-[var(--primary)] font-semibold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Button to="/contact" className="w-full">Get a Quote</Button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
