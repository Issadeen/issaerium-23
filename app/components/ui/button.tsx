import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const variantClass =
    variant === 'ghost'
      ? 'bg-transparent hover:bg-gray-800'
      : 'bg-blue-600 text-white hover:bg-blue-700';
  
  const sizeClass =
    size === 'sm' ? 'px-2 py-1 text-sm' :
    size === 'lg' ? 'px-4 py-2 text-lg' :
    'px-3 py-1.5 text-base';

  return (
    <button
      className={`rounded ${variantClass} ${sizeClass} ${className} transition-all duration-200`}
      {...props}
    >
      {children}
    </button>
  );
};
