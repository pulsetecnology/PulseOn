import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Flame, Play, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Link } from "wouter";
import { useGlobalNotification } from "@/components/NotificationProvider";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  
  // Simulate user onboarding status and workout data
  const hasCompletedOnboarding = user?.onboardingCompleted || false;
  const hasWorkoutsAvailable = true; // This would come from API
  const completedWorkouts = hasCompletedOnboarding ? 24 : 0;
  const currentStreak = hasCompletedOnboarding ? 7 : 0;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Olá, {user?.name?.split(' ')[0] || 'usuário'}!</h1>
        <p className="text-muted-foreground">
          {user?.gender === "female" ? "Pronta" : "Pronto"} para o seu treino de hoje?
        </p>
      </div>

      {/* Status Alerts */}
      {!hasCompletedOnboarding && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Complete seu perfil
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                  Finalize suas informações para receber treinos personalizados pela IA.
                </p>
                <Link href="/profile">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                    Completar Onboarding
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasCompletedOnboarding && !hasWorkoutsAvailable && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  IA preparando seus treinos
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Aguarde enquanto nossa IA cria treinos personalizados baseados no seu perfil.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {completedWorkouts === 0 && hasCompletedOnboarding && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  Bem-vindo ao PulseOn!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Seu primeiro treino personalizado está pronto. Vamos começar!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Treinos Concluídos</span>
              <Dumbbell className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xl font-bold">{completedWorkouts}</span>
            {completedWorkouts > 0 && (
              <Badge variant="secondary" className="mt-1 text-xs">
                +3 esta semana
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Sequência Atual</span>
              <Flame className="h-3 w-3 text-orange-500" />
            </div>
            <span className="text-xl font-bold">{currentStreak} dias</span>
            {currentStreak >= 7 && (
              <Badge variant="destructive" className="mt-1 text-xs">
                Em chamas!
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Treino de Hoje</h2>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-2xl dark:shadow-black/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Treino de Pernas</h3>
              <span className="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-full text-xs text-primary">45 min</span>
            </div>
            <p className="text-muted-foreground mb-3 text-sm">5 exercícios • Nível Intermediário</p>
            <Link href="/active-workout">
              <Button className="w-full py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
                <Play className="mr-2 h-4 w-4" />
                Iniciar Treino
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      

      {/* Upcoming Workouts */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Próximos Treinos</h2>
        <div className="space-y-2">
          <Card>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Treino de Peito</h3>
                <p className="text-xs text-muted-foreground">Amanhã • 6 exercícios</p>
              </div>
              <Button variant="ghost" size="sm">
                <Play className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Treino de Costas</h3>
                <p className="text-xs text-muted-foreground">Quinta-feira • 7 exercícios</p>
              </div>
              <Button variant="ghost" size="sm">
                <Play className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
