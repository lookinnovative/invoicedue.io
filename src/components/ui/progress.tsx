'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  variant?: 'default' | 'warning' | 'critical' | 'destructive';
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, variant = 'default', ...props }, ref) => {
    const getVariantClass = () => {
      switch (variant) {
        case 'warning':
          return 'bg-yellow-500';
        case 'critical':
          return 'bg-orange-500';
        case 'destructive':
          return 'bg-red-500';
        default:
          return 'bg-primary';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 transition-all',
            getVariantClass()
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
