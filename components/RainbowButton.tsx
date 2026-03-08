import React from 'react';

interface RainbowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function RainbowButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
}: RainbowButtonProps) {
  const baseClasses = 'px-8 py-4 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';
  
  const variantClasses = variant === 'primary'
    ? 'bg-gradient-to-r from-blue-400 via-purple-500 via-pink-500 to-orange-400 bg-size-200 bg-pos-0 hover:bg-pos-100'
    : 'bg-gradient-to-r from-orange-400 via-pink-500 via-purple-500 to-blue-400 bg-size-200 bg-pos-0 hover:bg-pos-100';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={{
        backgroundSize: '200% 200%',
        backgroundPosition: '0% 50%',
      }}
    >
      {children}
    </button>
  );
}
