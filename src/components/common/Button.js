'use client';

import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  to, 
  href, 
  onClick, 
  type = 'button',
  icon: Icon,
  disabled = false
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[var(--primary)] text-white hover:bg-blue-900 focus:ring-[var(--primary)]',
    secondary: 'bg-[var(--secondary)] text-white hover:bg-blue-600 focus:ring-[var(--secondary)]',
    outline: 'border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white focus:ring-[var(--primary)]',
    ghost: 'text-[var(--primary)] hover:bg-blue-50 focus:ring-[var(--primary)]'
  };
  
  const sizes = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-6 py-3',
    lg: 'text-lg px-8 py-4'
  };
  
  const classes = twMerge(
    baseStyles,
    variants[variant],
    sizes[size],
    className
  );
  
  const content = (
    <>
      {children}
      {Icon && <Icon className="ml-2 w-5 h-5" />}
    </>
  );

  if (to) {
    return (
      <Link href={to} className={classes}>
        {content}
      </Link>
    );
  }
  
  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  
  return (
    <button type={type} onClick={onClick} className={classes} disabled={disabled}>
      {content}
    </button>
  );
};

export default Button;
