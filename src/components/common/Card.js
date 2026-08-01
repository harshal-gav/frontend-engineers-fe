'use client';

import { twMerge } from 'tailwind-merge';

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  as: Component = 'div',
  ...props
}) => {
  const baseStyles = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden';
  const hoverStyles = hover ? 'transition-all duration-300 hover:shadow-lg hover:-translate-y-1' : '';
  
  const classes = twMerge(baseStyles, hoverStyles, className);
  
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};

export default Card;
