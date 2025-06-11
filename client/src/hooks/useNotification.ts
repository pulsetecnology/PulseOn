import { useState, useCallback } from "react";

export type NotificationType = "success" | "error" | "warning";

interface NotificationState {
  type: NotificationType | null;
  isVisible: boolean;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    type: null,
    isVisible: false,
  });

  const showNotification = useCallback((type: NotificationType, duration = 3000) => {
    setNotification({ type, isVisible: true });
    
    setTimeout(() => {
      setNotification({ type: null, isVisible: false });
    }, duration);
  }, []);

  const showSuccess = useCallback((duration?: number) => {
    showNotification("success", duration);
  }, [showNotification]);

  const showError = useCallback((duration?: number) => {
    showNotification("error", duration);
  }, [showNotification]);

  const showWarning = useCallback((duration?: number) => {
    showNotification("warning", duration);
  }, [showNotification]);

  return {
    notification,
    showSuccess,
    showError,
    showWarning,
  };
}