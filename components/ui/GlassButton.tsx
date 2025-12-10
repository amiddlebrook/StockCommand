import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className = '',
  variant = 'glass',
  size = 'md',
  isLoading = false,
  icon,
  ...props
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-mono font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden";
  
  const variants = {
    primary: "bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_15px_rgba(8,145,178,0.2)] hover:shadow-[0_0_20px_rgba(8,145,178,0.4)]",
    secondary: "bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/50 hover:border-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.2)]",
    danger: "bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/50 hover:border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.2)]",
    glass: "bg-slate-800/40 hover:bg-slate-700/50 text-gray-200 border border-white/10 hover:border-white/20 backdrop-blur-md shadow-lg",
    ghost: "bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-transparent",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 rounded-md gap-1.5",
    md: "text-xs px-4 py-2 rounded-lg gap-2",
    lg: "text-sm px-6 py-3 rounded-xl gap-2.5",
    icon: "p-2 rounded-lg",
  };

  const activeClasses = "active:scale-95";

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${activeClasses}
        ${className}
      `}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Glossy shine effect */}
      <div className="absolute inset-0 -translate-x-[100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none" />
      
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
