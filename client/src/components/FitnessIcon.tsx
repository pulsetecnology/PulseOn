
export default function FitnessIcon({ className = "w-4 h-4", animated = false }: { className?: string; animated?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="w-full h-full text-primary"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Círculo externo */}
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          fill="none"
          className={animated ? "animate-pulse" : ""}
        />
        
        {/* Círculo interno com gradiente visual */}
        <circle 
          cx="12" 
          cy="12" 
          r="7" 
          fill="currentColor" 
          opacity="0.1"
          className={animated ? "animate-pulse" : ""}
        />
        
        {/* Símbolo de força/fitness no centro */}
        <g className={animated ? "animate-bounce" : ""}>
          {/* Barra central */}
          <rect x="8" y="11" width="8" height="2" rx="1" fill="currentColor" />
          
          {/* Peso esquerdo */}
          <rect x="6" y="9" width="3" height="6" rx="1.5" fill="currentColor" />
          <rect x="5.5" y="10" width="4" height="4" rx="1" fill="currentColor" opacity="0.7" />
          
          {/* Peso direito */}
          <rect x="15" y="9" width="3" height="6" rx="1.5" fill="currentColor" />
          <rect x="14.5" y="10" width="4" height="4" rx="1" fill="currentColor" opacity="0.7" />
        </g>
        
        {/* Pontos de energia ao redor */}
        <circle cx="12" cy="4" r="1" fill="currentColor" opacity="0.6" className={animated ? "animate-ping" : ""} />
        <circle cx="20" cy="12" r="1" fill="currentColor" opacity="0.6" className={animated ? "animate-ping" : ""} style={{ animationDelay: '0.3s' }} />
        <circle cx="12" cy="20" r="1" fill="currentColor" opacity="0.6" className={animated ? "animate-ping" : ""} style={{ animationDelay: '0.6s' }} />
        <circle cx="4" cy="12" r="1" fill="currentColor" opacity="0.6" className={animated ? "animate-ping" : ""} style={{ animationDelay: '0.9s' }} />
      </svg>
    </div>
  );
}
