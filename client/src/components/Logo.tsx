
import { Dumbbell } from "lucide-react";
import { useEffect, useState } from "react";

interface LogoProps {
  showBlueIcon?: boolean;
  onAnimationComplete?: () => void;
}

export default function Logo({ showBlueIcon = false, onAnimationComplete }: LogoProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (showBlueIcon) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onAnimationComplete?.();
      }, 2000); // Animação por 2 segundos
      
      return () => clearTimeout(timer);
    }
  }, [showBlueIcon, onAnimationComplete]);

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <Dumbbell 
          className={`h-8 w-8 ${
            isAnimating 
              ? "text-blue-500 animate-pulse" 
              : "text-primary"
          } transition-colors duration-300`} 
        />
        {isAnimating && (
          <div className="absolute inset-0 rounded-full animate-ping bg-blue-500 opacity-20" />
        )}
      </div>
      <span className="text-xl font-bold text-foreground">
        Pulse<span className="brand-cyan">On</span>
      </span>
    </div>
  );
}
