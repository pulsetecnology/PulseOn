import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Workout from "./pages/Workout";
import ActiveWorkout from "./pages/ActiveWorkout";
import History from "./pages/History";
import Profile from "./pages/Profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/onboarding">
        <ProtectedRoute>
          <Layout>
            <Onboarding />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/">
        <ProtectedRoute requireOnboarding>
          <Layout>
            <Home />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/workout">
        <ProtectedRoute requireOnboarding>
          <Layout>
            <Workout />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/active-workout">
        <ProtectedRoute requireOnboarding>
          <Layout>
            <ActiveWorkout />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/history">
        <ProtectedRoute requireOnboarding>
          <Layout>
            <History />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/profile">
        <ProtectedRoute requireOnboarding>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
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
