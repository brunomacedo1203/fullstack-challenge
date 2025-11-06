import * as React from 'react';
import { cn } from '../../lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({ className, ...props }) => {
  return (
    <label
      className={cn('block text-sm font-semibold text-foreground mb-2', className)}
      {...props}
    />
  );
};
