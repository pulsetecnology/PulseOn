
import { useToast } from "@/hooks/use-toast";
import { SuccessIcon, ErrorIcon, WarningIcon } from "@/components/NotificationIcons";

export function useNotification() {
  const { toast } = useToast();

  const showSuccess = (message?: string) => {
    toast({
      description: (
        <div className="flex items-center gap-2">
          <SuccessIcon className="" />
          {message && <span>{message}</span>}
        </div>
      ),
      duration: 2000,
      className: "border-green-200 bg-green-50",
    });
  };

  const showError = (message?: string) => {
    toast({
      description: (
        <div className="flex items-center gap-2">
          <ErrorIcon className="" />
          {message && <span>{message}</span>}
        </div>
      ),
      duration: 3000,
      className: "border-red-200 bg-red-50",
    });
  };

  const showWarning = (message?: string) => {
    toast({
      description: (
        <div className="flex items-center gap-2">
          <WarningIcon className="" />
          {message && <span>{message}</span>}
        </div>
      ),
      duration: 2500,
      className: "border-yellow-200 bg-yellow-50",
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
  };
}
