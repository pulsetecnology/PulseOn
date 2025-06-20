import { useGlobalNotification } from "./NotificationProvider";
import { NotificationIcon } from "./NotificationIcon";

export default function NotificationDisplay() {
  const { notification } = useGlobalNotification();

  if (!notification.isVisible || !notification.type) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
        <NotificationIcon
          type={notification.type}
          isVisible={notification.isVisible}
          className="w-8 h-8 shrink-0"
        />
        <div className="text-sm font-medium">
          {notification.type === 'workout_success' && "Treino finalizado com sucesso!"}
          {notification.type === 'workout_error' && "Erro ao finalizar treino"}
          {notification.type === 'workout_warning' && "Atenção no treino"}
          {notification.type === 'set_completion' && "Série completada!"}
          {notification.type === 'workout_progress' && "Progresso do treino"}
          {notification.type === 'success' && "Sucesso!"}
          {notification.type === 'error' && "Erro!"}
          {notification.type === 'warning' && "Atenção!"}
        </div>
      </div>
    </div>
  );
}