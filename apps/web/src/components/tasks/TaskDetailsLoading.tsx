import React from 'react';
import { Skeleton } from '../Skeleton';

export const TaskDetailsLoading: React.FC = () => {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
};
