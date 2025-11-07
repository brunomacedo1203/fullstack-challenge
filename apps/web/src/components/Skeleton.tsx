import * as React from 'react';
import { cn } from '../lib/utils';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('relative overflow-hidden rounded-lg bg-gaming-light skeleton', className)} />
);
