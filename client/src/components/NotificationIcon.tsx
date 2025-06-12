import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import WorkoutDumbbellIcon from "./WorkoutDumbbellIcon";
import type { NotificationType } from "@/hooks/useNotification";

interface NotificationIconProps {
  type: NotificationType;
  isVisible: boolean;
  className?: string;
}

export function NotificationIcon({ type, isVisible, className }: NotificationIconProps) {
  if (!isVisible) return null;

  // Para notificações de treino, usar o ícone de halter colorido
  if (type === 'workout_success') {
    return (
      <div 
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-300 ease-in-out",
          "bg-green-500 animate-pulse-icon",
          isVisible ? "animate-in fade-in-50 zoom-in-95" : "animate-out fade-out-50 zoom-out-95",
          className || "w-8 h-8"
        )}
      >
        <WorkoutDumbbellIcon variant="success" className="w-4 h-4" />
      </div>
    );
  }

  if (type === 'workout_error') {
    return (
      <div 
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-300 ease-in-out",
          "bg-red-500 animate-pulse-icon",
          isVisible ? "animate-in fade-in-50 zoom-in-95" : "animate-out fade-out-50 zoom-out-95",
          className || "w-8 h-8"
        )}
      >
        <WorkoutDumbbellIcon variant="error" className="w-4 h-4" />
      </div>
    );
  }

  if (type === 'workout_warning') {
    return (
      <div 
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-300 ease-in-out",
          "bg-yellow-500 animate-pulse-icon",
          isVisible ? "animate-in fade-in-50 zoom-in-95" : "animate-out fade-out-50 zoom-out-95",
          className || "w-8 h-8"
        )}
      >
        <WorkoutDumbbellIcon variant="warning" className="w-4 h-4" />
      </div>
    );
  }

  // Para notificações gerais do sistema, usar ícones padrão
  const iconMap = {
    success: {
      icon: Check,
      bgColor: "bg-green-500",
      textColor: "text-white"
    },
    error: {
      icon: X,
      bgColor: "bg-red-500", 
      textColor: "text-white"
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-yellow-500",
      textColor: "text-white"
    },
    set_completion: {
      icon: Check,
      bgColor: "bg-green-500",
      textColor: "text-white"
    },
    workout_progress: {
      icon: Check,
      bgColor: "bg-green-500",
      textColor: "text-white"
    }
  };

  const config = iconMap[type];
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-300 ease-in-out",
        config.bgColor,
        config.textColor,
        "animate-pulse-icon",
        isVisible ? "animate-in fade-in-50 zoom-in-95" : "animate-out fade-out-50 zoom-out-95",
        className || "w-8 h-8"
      )}
    >
      <IconComponent className="w-4 h-4" />
    </div>
  );
}