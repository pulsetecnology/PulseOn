import { NotificationIcon } from "./NotificationIcon";
import { useGlobalNotification } from "./NotificationProvider";
import { PulseOnLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export default function NotificationArea() {
  const { notification, showWorkoutSuccess } = useGlobalNotification();

  const handleClick = () => {
    // Test notification functionality
    showWorkoutSuccess();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="w-10 h-10 relative flex items-center justify-center"
    >
      {notification.type && notification.isVisible ? (
        <NotificationIcon
          type={notification.type}
          isVisible={notification.isVisible}
          className="w-8 h-8"
        />
      ) : (
        <PulseOnLogo size="sm" variant="icon" />
      )}
    </Button>
  );
}