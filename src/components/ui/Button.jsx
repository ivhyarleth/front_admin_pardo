import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Button = forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'default',
  children, 
  ...props 
}, ref) => {
  const variants = {
    default: 'bg-pardos-rust text-white hover:bg-pardos-brown',
    outline: 'border border-pardos-rust text-pardos-rust hover:bg-pardos-cream',
    ghost: 'hover:bg-gray-100 text-pardos-dark',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-spartan font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pardos-yellow',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };

