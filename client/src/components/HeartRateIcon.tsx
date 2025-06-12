
export default function HeartRateIcon({ className = "w-4 h-4", animated = false }: { className?: string; animated?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="w-full h-full text-blue-400"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Linha base da frequência cardíaca */}
        <path 
          d="M2 12h4l2-4 2 4 2-6 2 6 2-3 2 3h4" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none"
          className={animated ? "animate-heartbeat-line" : ""}
        />
        {/* Ponto pulsante no final */}
        <circle 
          cx="20" 
          cy="12" 
          r="2" 
          fill="currentColor"
          className={animated ? "animate-pulse" : ""}
        />
      </svg>
      
      <style jsx>{`
        @keyframes heartbeat-line {
          0%, 100% { 
            stroke-dasharray: 0, 100;
            stroke-dashoffset: 0;
          }
          50% { 
            stroke-dasharray: 50, 100;
            stroke-dashoffset: -25;
          }
        }
        
        .animate-heartbeat-line {
          animation: heartbeat-line 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
