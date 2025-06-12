import { NotificationIcon } from "./NotificationIcon";
import { useGlobalNotification } from "./NotificationProvider";
import HeartRateIcon from "./HeartRateIcon";

export default function Logo({ className = "text-xl" }: { className?: string }) {
  const { notification } = useGlobalNotification();
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-12 h-12 relative flex items-center justify-center">
        {notification.type && notification.isVisible ? (
          <NotificationIcon
            type={notification.type}
            isVisible={notification.isVisible}
            className="w-8 h-8"
          />
        ) : (
          <HeartRateIcon className="h-8 w-8 text-brand-cyan" animated={false} />
        )}
      </div>
      <div className="flex items-center">
        <span className="font-bold brand-cyan">Pulse</span>
        <span className="font-bold brand-blue">On</span>
      </div>
    </div>
  );
}
