import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border-2 border-input bg-gaming-light px-4 py-2.5 text-sm text-foreground shadow-sm transition-all duration-300 placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-glow disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50',
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';
