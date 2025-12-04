import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { Button } from './Button';

const Dialog = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>,
    document.body
  );
};

const DialogContent = ({ className, children, ...props }) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
};

const DialogHeader = ({ className, ...props }) => {
  return (
    <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props} />
  );
};

const DialogTitle = ({ className, ...props }) => {
  return (
    <h2 className={cn('text-2xl font-spartan font-bold text-pardos-dark', className)} {...props} />
  );
};

const DialogDescription = ({ className, ...props }) => {
  return (
    <p className={cn('text-sm text-gray-600 font-lato', className)} {...props} />
  );
};

const DialogFooter = ({ className, ...props }) => {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)} {...props} />
  );
};

const DialogClose = ({ className, children, onClose, ...props }) => {
  return (
    <button
      type="button"
      className={cn(
        'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity',
        'hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-pardos-yellow',
        'disabled:pointer-events-none',
        className
      )}
      onClick={onClose}
      {...props}
    >
      {children || (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
};

export { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose 
};

