import { NotificationIcon } from "./NotificationIcon";
import { useGlobalNotification } from "./NotificationProvider";
import HeartRateIcon from "./HeartRateIcon";

export default function Logo({ className = "text-xl" }: { className?: string }) {
  const { notification } = useGlobalNotification();
  
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="w-8 h-8 relative">
        <div className="w-8 h-8 bg-brand-cyan rounded-full flex items-center justify-center">
          {notification.type && notification.isVisible ? (
            <NotificationIcon
              type={notification.type}
              isVisible={notification.isVisible}
              className="w-8 h-8"
            />
          ) : (
            <HeartRateIcon className="h-4 w-4 text-slate-900" />
          )}
        </div>
      </div>
      <div className="flex items-center">
        <span className="font-bold brand-cyan">Pulse</span>
        <span className="font-bold brand-blue">On</span>
      </div>
    </div>
  );
}
