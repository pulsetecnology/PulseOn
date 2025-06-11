import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { useLocation } from "wouter";
import Logo from "./Logo";
import { NotificationIcon } from "./NotificationIcon";
import { useGlobalNotification } from "./NotificationProvider";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { logout } = useSimpleAuth();
  const [, setLocation] = useLocation();
  const { notification } = useGlobalNotification();

  const handleLogout = () => {
    logout();
    // Redirect to login page after logout
    setLocation("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <Logo />
        
        <div className="flex items-center space-x-3">
          {notification.type && (
            <NotificationIcon
              type={notification.type}
              isVisible={notification.isVisible}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-10 w-10"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-10 w-10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
