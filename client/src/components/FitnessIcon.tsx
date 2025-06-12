
export default function FitnessIcon({ className = "w-4 h-4", animated = false }: { className?: string; animated?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="w-full h-full text-primary"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dumbbell design */}
        <g className={animated ? "animate-pulse" : ""}>
          {/* Left weight */}
          <rect x="2" y="8" width="4" height="8" rx="2" fill="currentColor" />
          <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.7" />
          
          {/* Bar */}
          <rect x="6" y="11" width="12" height="2" rx="1" fill="currentColor" />
          
          {/* Center grip */}
          <rect x="10" y="10" width="4" height="4" rx="2" fill="currentColor" opacity="0.8" />
          
          {/* Right weight */}
          <rect x="18" y="8" width="4" height="8" rx="2" fill="currentColor" />
          <rect x="17" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.7" />
        </g>
        
        {/* Power indicator dots */}
        <circle cx="12" cy="6" r="1" fill="currentColor" className={animated ? "animate-ping" : ""} opacity="0.6" />
        <circle cx="10" cy="6" r="0.5" fill="currentColor" className={animated ? "animate-ping" : ""} opacity="0.4" style={{ animationDelay: '0.2s' }} />
        <circle cx="14" cy="6" r="0.5" fill="currentColor" className={animated ? "animate-ping" : ""} opacity="0.4" style={{ animationDelay: '0.4s' }} />
      </svg>
    </div>
  );
}
