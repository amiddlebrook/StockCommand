
import React from 'react';

export const LoadingSpinner: React.FC<{className?: string}> = ({ className = 'w-5 h-5' }) => {
  return (
    <div className={`animate-spin rounded-full border-2 border-slate-400 border-t-slate-100 ${className}`} role="status">
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
        </span>
    </div>
  );
};
