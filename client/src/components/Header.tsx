import { Moon, Sun, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PulseOnLogo } from "@/components/ui/logo";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { logout } = useSimpleAuth();
  const [, setLocation] = useLocation();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No token");

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    }
  });

  const handleLogout = () => {
    logout();
    // Redirect to login page after logout
    setLocation("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border header-shadow h-16">
      <div className="flex items-center justify-between px-4 h-full">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // TODO: Implementar funcionalidade de notificações
              console.log("Notifications clicked");
            }}
            className="h-10 w-10 relative"
          >
            <PulseOnLogo size="sm" variant="icon" />
            {/* Badge de notificações */}
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white opacity-0">
              {/* Contador será implementado futuramente */}
            </span>
          </Button>
          
          <span className="font-bold bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 dark:from-sky-400 dark:via-blue-500 dark:to-purple-500 bg-clip-text text-transparent text-xl">
            PulseOn
          </span>
        </div>

        <div className="flex items-center space-x-1">
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
          
          {user && (
            <Avatar className="h-8 w-8 cursor-pointer" onClick={() => setLocation("/profile")}>
              <AvatarImage 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Usuario')}&background=0CE6D6&color=fff&size=32`} 
              />
              <AvatarFallback className="text-xs">
                {user.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </header>
  );
}