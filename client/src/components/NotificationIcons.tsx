
import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationIconProps {
  className?: string;
}

export function SuccessIcon({ className }: NotificationIconProps) {
  return (
    <div className={cn(
      "flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white",
      className
    )}>
      <Check className="w-5 h-5" />
    </div>
  );
}

export function ErrorIcon({ className }: NotificationIconProps) {
  return (
    <div className={cn(
      "flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white",
      className
    )}>
      <X className="w-5 h-5" />
    </div>
  );
}

export function WarningIcon({ className }: NotificationIconProps) {
  return (
    <div className={cn(
      "flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white",
      className
    )}>
      <AlertTriangle className="w-5 h-5" />
    </div>
  );
}
