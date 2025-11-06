import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'h-11 w-full rounded-lg border-2 border-input bg-gaming-light px-4 py-2.5 text-sm text-foreground shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-glow disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50',
          className,
        )}
        {...props}
      />
    );
  },
);
Select.displayName = 'Select';
