import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  className?: string;
}

export const PulseOnLogo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'full',
  className = '' 
}) => {
  const sizeClasses = {
    sm: variant === 'full' ? 'h-6' : 'h-4 w-4',
    md: variant === 'full' ? 'h-8' : 'h-6 w-6',
    lg: variant === 'full' ? 'h-10' : 'h-8 w-8',
    xl: variant === 'full' ? 'h-12' : 'h-10 w-10'
  };

  if (variant === 'icon') {
    return (
      <svg 
        className={`${sizeClasses[size]} ${className}`} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Heart with pulse line */}
        <defs>
          <linearGradient id="heartGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="heartGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        
        {/* Heart shape */}
        <path 
          d="M50 85 C50 85, 15 55, 15 35 C15 25, 25 15, 35 15 C42 15, 48 20, 50 25 C52 20, 58 15, 65 15 C75 15, 85 25, 85 35 C85 55, 50 85, 50 85 Z"
          fill="url(#heartGradientLight)"
          className="dark:fill-[url(#heartGradientDark)]"
          stroke="none"
        />
        
        {/* Pulse line */}
        <path 
          d="M10 50 L25 50 L30 35 L35 65 L40 25 L45 75 L50 50 L55 30 L60 70 L65 40 L70 50 L90 50"
          stroke="url(#heartGradientLight)"
          strokeWidth="2.5"
          fill="none"
          className="dark:stroke-[url(#heartGradientDark)]"
        />
      </svg>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <svg 
        className={sizeClasses[size].replace('h-', 'h-').replace(' w-', ' w-')} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="logoGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        
        {/* Heart shape */}
        <path 
          d="M50 85 C50 85, 15 55, 15 35 C15 25, 25 15, 35 15 C42 15, 48 20, 50 25 C52 20, 58 15, 65 15 C75 15, 85 25, 85 35 C85 55, 50 85, 50 85 Z"
          fill="url(#logoGradientLight)"
          className="dark:fill-[url(#logoGradientDark)]"
        />
        
        {/* Pulse line */}
        <path 
          d="M10 50 L25 50 L30 35 L35 65 L40 25 L45 75 L50 50 L55 30 L60 70 L65 40 L70 50 L90 50"
          stroke="url(#logoGradientLight)"
          strokeWidth="2.5"
          fill="none"
          className="dark:stroke-[url(#logoGradientDark)]"
        />
      </svg>
      
      <span className={`font-bold bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 dark:from-sky-400 dark:via-blue-500 dark:to-purple-500 bg-clip-text text-transparent ${
        size === 'sm' ? 'text-lg' :
        size === 'md' ? 'text-xl' :
        size === 'lg' ? 'text-2xl' :
        'text-3xl'
      }`}>
        PulseOn
      </span>
    </div>
  );
};

export default PulseOnLogo;