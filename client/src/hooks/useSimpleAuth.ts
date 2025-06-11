import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type User = {
  id: number;
  email: string;
  name: string;
  onboardingCompleted: boolean;
};

export function useSimpleAuth() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("authToken")
  );
  const queryClient = useQueryClient();

  // Escutar mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const storedToken = localStorage.getItem("authToken");
      setToken(storedToken);
    };

    // Escutar eventos de storage de outras abas
    window.addEventListener("storage", handleStorageChange);
    
    // Verificar mudanças no token atual
    const checkToken = () => {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken !== token) {
        setToken(storedToken);
      }
    };

    const interval = setInterval(checkToken, 100);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [token]);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!token) return null;
      
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setToken(null);
        return null;
      }
      
      const data = await response.json();
      return data.user;
    },
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false
  });

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    queryClient.clear();
    window.location.href = "/login";
  };

  const isAuthenticated = !!token && !!user;

  return {
    user: user || null,
    isLoading,
    isAuthenticated,
    logout,
    setToken
  };
}