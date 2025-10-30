/**
 * Loading Skeleton Component
 * 
 * Displays a placeholder skeleton while content is loading
 */

import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton Component
 * 
 * @example
 * <Skeleton variant="text" width="200px" />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="rectangular" height="200px" />
 * 
 * TODO: Add wave animation
 */
export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className = '',
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyles = 'bg-gray-800';
  
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // TODO: Implement wave animation
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : '100%'),
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton Group Component - for common loading patterns
 */
export function SkeletonGroup({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} variant="text" height="1.5em" />
      ))}
    </div>
  );
}

/**
 * Chart Skeleton - specific skeleton for chart components
 */
export function ChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 p-4 ${className}`}>
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width="150px" height="1.5em" />
        <Skeleton variant="text" width="100px" height="1.5em" />
      </div>
      <Skeleton variant="rectangular" height="300px" />
    </div>
  );
}

/**
 * Card Skeleton - specific skeleton for card components
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border border-gray-800 rounded ${className}`}>
      <Skeleton variant="text" width="60%" height="1.5em" className="mb-3" />
      <Skeleton variant="text" width="40%" height="1em" className="mb-4" />
      <Skeleton variant="rectangular" height="150px" />
    </div>
  );
}
