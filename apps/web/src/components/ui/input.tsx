import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-lg border-2 border-input bg-gaming-light px-4 py-2.5 text-sm text-foreground shadow-sm transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-glow disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
