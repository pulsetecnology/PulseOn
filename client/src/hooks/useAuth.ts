import { useState, useEffect, useCallback } from "react";
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
  gender?: string;
  physicalRestrictions?: string;
};

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("authToken");
    }
    return null;
  });
  
  const queryClient = useQueryClient();

  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem("authToken", newToken);
    } else {
      localStorage.removeItem("authToken");
    }
  }, []);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user", token],
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    queryFn: async () => {
      if (!token) return null;
      
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setToken(null);
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch user");
      }
      
      return response.json();
    }
  });

  const logout = useCallback(() => {
    setToken(null);
    queryClient.clear();
  }, [setToken, queryClient]);

  const refreshUser = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["user", token] });
  }, [queryClient, token]);

  const isAuthenticated = !!token && !!user && !error;

  return {
    user,
    isAuthenticated,
    isLoading: !!token && isLoading,
    setToken,
    logout,
    refreshUser
  };
}