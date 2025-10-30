/**
 * Reusable Card UI Component
 * 
 * A flexible card component that can be used throughout the application
 * for displaying various types of content in a consistent manner.
 */

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onClick?: () => void;
}

/**
 * Card Component
 * 
 * @example
 * <Card title="Stock Info" subtitle="AAPL">
 *   <p>Content goes here</p>
 * </Card>
 */
export function Card({
  children,
  className = '',
  title,
  subtitle,
  actions,
  variant = 'default',
  padding = 'medium',
  onClick,
}: CardProps) {
  const baseStyles = 'bg-black border border-gray-800 transition-colors';
  
  const variantStyles = {
    default: '',
    bordered: 'border-2',
    elevated: 'shadow-lg hover:shadow-xl',
  };

  const paddingStyles = {
    none: '',
    small: 'p-2',
    medium: 'p-4',
    large: 'p-6',
  };

  const interactiveStyles = onClick ? 'cursor-pointer hover:border-gray-700' : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${interactiveStyles} ${className}`}
      onClick={onClick}
    >
      {(title || subtitle || actions) && (
        <div className="flex justify-between items-start mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

/**
 * Card Header Component
 */
export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-b border-gray-800 pb-3 mb-3 ${className}`}>{children}</div>;
}

/**
 * Card Body Component
 */
export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

/**
 * Card Footer Component
 */
export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-t border-gray-800 pt-3 mt-3 ${className}`}>{children}</div>;
}
