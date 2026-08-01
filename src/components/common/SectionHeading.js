'use client';

import { twMerge } from 'tailwind-merge';

const SectionHeading = ({ 
  title, 
  subtitle, 
  align = 'center', 
  className = '' 
}) => {
  const alignment = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto'
  };
  
  return (
    <div className={twMerge(`max-w-3xl mb-12 ${alignment[align]}`, className)}>
      {subtitle && (
        <span className="text-[var(--secondary)] font-semibold tracking-wider uppercase text-sm mb-3 block">
          {subtitle}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
        {title}
      </h2>
      <div className={twMerge("w-20 h-1 bg-[var(--accent)] rounded", align === 'center' ? 'mx-auto' : '')}></div>
    </div>
  );
};

export default SectionHeading;
