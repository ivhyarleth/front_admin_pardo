import React from 'react';
import { cn } from '../../lib/utils';

export const Separator = ({ orientation = 'horizontal', className, ...props }) => {
  return (
    <div
      className={cn(
        'shrink-0 bg-gray-200',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...props}
    />
  );
};

