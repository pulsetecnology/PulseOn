import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationType } from "@/hooks/useNotification";
import DumbbellIcon from "./DumbbellIcon"; // Import the DumbbellIcon component

interface NotificationIconProps {
  type: NotificationType;
  isVisible: boolean;
  className?: string;
}

export function NotificationIcon({ type, isVisible, className }: NotificationIconProps) {
  if (!isVisible) return null;

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
    set_completion: { // Add configuration for set_completion
      icon: DumbbellIcon,
      bgColor: "bg-blue-500",
      textColor: "text-white"
    }
  };

  const config = iconMap[type];
  const IconComponent = config.icon;

  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-300 ease-in-out",
        config.bgColor,
        config.textColor,
        isVisible ? "animate-in fade-in-50 zoom-in-95" : "animate-out fade-out-50 zoom-out-95",
        className || "w-8 h-8"
      )}
    >
      <IconComponent className={className?.includes("w-8") ? "w-4 h-4" : "w-4 h-4"} />
    </div>
  );
}