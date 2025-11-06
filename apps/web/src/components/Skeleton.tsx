import * as React from 'react';
import { cn } from '../lib/utils';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-gaming-light', className)} />
);
