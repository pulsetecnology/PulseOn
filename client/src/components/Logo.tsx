import { NotificationIcon } from "./NotificationIcon";
import { useGlobalNotification } from "./NotificationProvider";
import FitnessIcon from "./FitnessIcon";

export default function Logo({ className = "text-xl" }: { className?: string }) {
  const { notification } = useGlobalNotification();

  return (
    <div className={`flex items-center space-x-0.5 ${className}`}>
      <div className="w-14 h-14 relative flex items-center justify-center">
        {notification.type && notification.isVisible ? (
          <NotificationIcon
            type={notification.type}
            isVisible={notification.isVisible}
            className="w-10 h-10"
          />
        ) : (
          <FitnessIcon className="h-10 w-10 text-primary" animated={false} />
        )}
      </div>
      <div className="flex items-center">
        <span className="font-bold text-primary">Pulse</span>
        <span className="font-bold logo-on">On</span>
      </div>
    </div>
  );
}