import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import { useSimpleAuth } from "./hooks/useSimpleAuth";
import Home from "./pages/Home";
import UserSetup from "./pages/UserSetup";
import Workout from "./pages/Workout";
import ActiveWorkout from "./pages/ActiveWorkout";
import History from "./pages/History";
import Profile from "./pages/Profile";
import NotFound from "@/pages/not-found";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSimpleAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <UserSetup />;
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
          <History />
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="pulseon-ui-theme">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
