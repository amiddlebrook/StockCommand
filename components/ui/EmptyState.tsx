/**
 * Empty State Component
 * 
 * Displays a friendly message when there's no data to show
 */

import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState Component
 * 
 * @example
 * <EmptyState 
 *   title="No stocks added"
 *   description="Add a stock symbol to get started"
 *   action={<Button>Add Stock</Button>}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-gray-500 text-5xl">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-300 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
