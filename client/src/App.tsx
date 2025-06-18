import React, { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import "./hmr-fix";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ThemeProvider";
import { NotificationProvider } from "./components/NotificationProvider";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Workout from "./pages/Workout";
import ActiveWorkout from "./pages/ActiveWorkout";
import History from "./pages/History";
import WorkoutHistory from "./pages/WorkoutHistory";
import Profile from "./pages/Profile";
import UserSetup from "./pages/UserSetup";
import NotFound from "./pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Onboarding from "@/pages/Onboarding";

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<any, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Oops! Algo deu errado</h1>
            <p className="text-muted-foreground mb-4">O aplicativo encontrou um erro inesperado.</p>
            <button 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }} 
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!isMounted) return;

        if (response.ok) {
          const userData = await response.json();
          if (userData) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("authToken");
            setIsAuthenticated(false);
          }
        } else {
          localStorage.removeItem("authToken");
          setIsAuthenticated(false);
        }
      } catch (error) {
        if (isMounted) {
          localStorage.removeItem("authToken");
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Layout>{children}</Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/setup" component={UserSetup} />
      <Route path="/">
        <ProtectedLayout>
          <Home />
        </ProtectedLayout>
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/workout">
        <ProtectedLayout>
          <Workout />
        </ProtectedLayout>
      </Route>
      <Route path="/active-workout">
        <ProtectedLayout>
          <ActiveWorkout />
        </ProtectedLayout>
      </Route>
      <Route path="/history">
        <ProtectedLayout>
          <WorkoutHistory />
        </ProtectedLayout>
      </Route>
      <Route path="/profile">
        <ProtectedLayout>
          <Profile />
        </ProtectedLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="pulseon-ui-theme">
          <NotificationProvider>
            <TooltipProvider>
              <Router />
              <Toaster />
            </TooltipProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;