import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type User = {
  id: number;
  email: string;
  name: string;
  onboardingCompleted: boolean;
  weight?: number;
  height?: number;
  birthDate?: string;
  fitnessGoal?: string;
  experienceLevel?: string;
  weeklyFrequency?: number;
  availableEquipment?: string[];
};

export function useSimpleAuth() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("authToken")
  );
  const queryClient = useQueryClient();

  // Escutar mudanças no localStorage apenas para outras abas
  useEffect(() => {
    const handleStorageChange = () => {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken !== token) {
        setToken(storedToken);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [token]);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!token) throw new Error("No token");
      
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          setToken(null);
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch user");
      }
      
      const data = await response.json();
      return data;
    }
  });

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    queryClient.clear();
  };

  return {
    user,
    isAuthenticated: !!token && !!user,
    isLoading,
    setToken,
    logout
  };
}