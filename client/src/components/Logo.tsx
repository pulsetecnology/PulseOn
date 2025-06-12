import { NotificationIcon } from "./NotificationIcon";
import { useGlobalNotification } from "./NotificationProvider";
import FitnessIcon from "./FitnessIcon";

export default function Logo({ className = "text-xl" }: { className?: string }) {
  const { notification } = useGlobalNotification();

  return (
    <div className={`flex items-center space-x-0 ${className}`}>
      <div className="w-14 h-14 relative flex items-center justify-center">
        {notification.type && notification.isVisible ? (
          <NotificationIcon
            type={notification.type}
            isVisible={notification.isVisible}
            className="w-10 h-10"
          />
        ) : (
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center animate-pulse-icon">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 9h2v6H3V9zm4-3h2v12H7V6zm4-3h2v18h-2V3zm4 3h2v12h-2V6zm4 3h2v6h-2V9z"/>
              <circle cx="4" cy="12" r="1.5"/>
              <circle cx="20" cy="12" r="1.5"/>
            </svg>
          </div>
        )}
      </div>
      <div className="flex items-center">
        <span className="font-bold text-primary">Pulse</span>
        <span className="font-bold logo-on">On</span>
      </div>
    </div>
  );
}