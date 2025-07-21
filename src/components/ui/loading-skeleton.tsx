
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'dashboard' | 'profile' | 'list';
  count?: number;
  className?: string;
}

const LoadingSkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("bg-card rounded-sharp border border-white/10 p-6 space-y-4", className)}>
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
    <div className="flex space-x-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

const LoadingSkeletonTable = ({ className }: { className?: string }) => (
  <div className={cn("bg-card rounded-sharp border border-white/10 p-6", className)}>
    <Skeleton className="h-8 w-48 mb-4" />
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  </div>
);

const LoadingSkeletonDashboard = ({ className }: { className?: string }) => (
  <div className={cn("space-y-6", className)}>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card rounded-sharp border border-white/10 p-4">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LoadingSkeletonCard />
      <LoadingSkeletonTable />
    </div>
  </div>
);

const LoadingSkeletonProfile = ({ className }: { className?: string }) => (
  <div className={cn("bg-card rounded-sharp border border-white/10 p-6", className)}>
    <div className="flex items-center space-x-4 mb-6">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  </div>
);

const LoadingSkeletonList = ({ className, count = 5 }: { className?: string; count?: number }) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3 bg-card rounded-sharp border border-white/10">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    ))}
  </div>
);

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  variant = 'card', 
  count = 1, 
  className 
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return Array.from({ length: count }).map((_, i) => (
          <LoadingSkeletonCard key={i} className={className} />
        ));
      case 'table':
        return <LoadingSkeletonTable className={className} />;
      case 'dashboard':
        return <LoadingSkeletonDashboard className={className} />;
      case 'profile':
        return <LoadingSkeletonProfile className={className} />;
      case 'list':
        return <LoadingSkeletonList className={className} count={count} />;
      default:
        return <LoadingSkeletonCard className={className} />;
    }
  };

  return <>{renderSkeleton()}</>;
};

export default LoadingSkeleton;
