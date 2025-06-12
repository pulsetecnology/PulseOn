import React from 'react';

interface FitnessIconProps {
  className?: string;
  animated?: boolean;
}

export default function FitnessIcon({ className = "w-6 h-6", animated = false }: FitnessIconProps) {
  return (
    <svg
      className={`${className} ${animated ? 'animate-heartbeat' : ''}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
      <circle cx="6.5" cy="6.5" r="1.5"/>
      <circle cx="17.5" cy="17.5" r="1.5"/>
    </svg>
  );
}