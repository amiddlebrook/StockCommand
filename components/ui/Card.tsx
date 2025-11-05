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
  const baseStyles = 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl transition-all';

  const variantStyles = {
    default: 'hover:border-slate-600/50',
    bordered: 'border-2 border-cyan-500/20',
    elevated: 'shadow-xl shadow-black/50 hover:shadow-2xl hover:shadow-cyan-500/10 hover:border-cyan-500/30',
  };

  const paddingStyles = {
    none: '',
    small: 'p-3',
    medium: 'p-5',
    large: 'p-6',
  };

  const interactiveStyles = onClick ? 'cursor-pointer hover:border-cyan-500/30' : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${interactiveStyles} ${className}`}
      onClick={onClick}
    >
      {(title || subtitle || actions) && (
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-700/30">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-gray-100 tracking-tight">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1 tracking-wide">{subtitle}</p>
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
  return <div className={`border-b border-slate-700/30 pb-3 mb-3 ${className}`}>{children}</div>;
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
  return <div className={`border-t border-slate-700/30 pt-3 mt-3 ${className}`}>{children}</div>;
}
