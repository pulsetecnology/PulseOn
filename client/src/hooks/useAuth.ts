import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  onboardingCompleted: boolean;
};

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export function useAuth(): AuthContextType {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("authToken")
  );

  // Check if user is authenticated
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
    retry: false
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro no login");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro no cadastro");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
  });

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    queryClient.clear();
    setLocation("/login");
  };

  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    // Force refresh user data after login
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    return result;
  };

  const register = async (data: any) => {
    const result = await registerMutation.mutateAsync(data);
    // Force refresh user data after register
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    return result;
  };

  return {
    user: user || null,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token
  };
}