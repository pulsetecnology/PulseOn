import { Moon, Sun, LogOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Logo from "./Logo";

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
      <div className="flex items-center justify-between px-6 h-full">
        <Logo />

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
            onClick={() => {
              // TODO: Implementar funcionalidade de chat
              console.log("Chat clicked");
            }}
            className="h-10 w-10 relative"
          >
            <MessageCircle className="h-4 w-4" />
            {/* Badge de mensagens para uso futuro */}
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full text-xs flex items-center justify-center text-white opacity-0">
              {/* Contador será implementado futuramente */}
            </span>
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
                {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </header>
  );
}