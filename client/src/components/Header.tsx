import { Moon, Sun, LogOut } from "lucide-react";
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
      <div className="flex items-center justify-between px-4 h-full">
        <Logo />

        <div className="flex items-center space-x-3">
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
          
          {user && (
            <Avatar className="h-8 w-8 animate-pulse-icon cursor-pointer" onClick={() => setLocation("/profile")}>
              <AvatarImage 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Usuario')}&background=0CE6D6&color=fff&size=32`} 
              />
              <AvatarFallback className="text-xs">
                {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
          
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