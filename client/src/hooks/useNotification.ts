import { useState, useCallback } from "react";

export type NotificationType = 'success' | 'error' | 'warning' | 'set_completion' | 'workout_progress' | 'workout_success' | 'workout_error' | 'workout_warning';

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

  const showWorkoutProgress = useCallback((duration?: number) => {
    showNotification("workout_progress", duration);
  }, [showNotification]);

  const showSetCompletion = useCallback((duration?: number) => {
    showNotification("set_completion", duration);
  }, [showNotification]);

  const showWorkoutSuccess = useCallback((duration?: number) => {
    showNotification("workout_success", duration);
  }, [showNotification]);

  const showWorkoutError = useCallback((duration?: number) => {
    showNotification("workout_error", duration);
  }, [showNotification]);

  const showWorkoutWarning = useCallback((duration?: number) => {
    showNotification("workout_warning", duration);
  }, [showNotification]);

  return {
    notification,
    showSuccess,
    showError,
    showWarning,
    showWorkoutProgress,
    showSetCompletion,
    showWorkoutSuccess,
    showWorkoutError,
    showWorkoutWarning,
  };
}