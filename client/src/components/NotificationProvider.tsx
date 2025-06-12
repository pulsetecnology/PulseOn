import React, { createContext, useContext } from "react";
import { useNotification, NotificationType } from "@/hooks/useNotification";

interface NotificationContextType {
  notification: {
    type: NotificationType | null;
    isVisible: boolean;
  };
  showSuccess: (duration?: number) => void;
  showError: (duration?: number) => void;
  showWarning: (duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const notificationHook = useNotification();

  return (
    <NotificationContext.Provider value={notificationHook}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useGlobalNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useGlobalNotification must be used within a NotificationProvider");
  }
  return context;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'set_completion';