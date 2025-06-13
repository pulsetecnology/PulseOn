
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Plus, Dumbbell, User, Trophy, TrendingUp, CheckCircle, AlertCircle, BarChart3, Calendar, Target, Zap, ChevronDown, ChevronUp, X, Scale, Heart, Flame, Play } from "lucide-react";
import FitnessIcon from "@/components/FitnessIcon";

// Component for expandable onboarding card
function OnboardingCard({ user }: { user: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMissingFields = () => {
    const missingFields = [];

    if (!user?.birthDate) {
      missingFields.push({
        field: "Data de nascimento",
        description: "Necessária para calcular sua idade e personalizar treinos",
        icon: Calendar
      });
    }

    if (!user?.weight || user.weight <= 0) {
      missingFields.push({
        field: "Peso",
        description: "Importante para calcular cargas e intensidade dos exercícios",
        icon: Scale
      });
    }

    if (!user?.height || user.height <= 0) {
      missingFields.push({
        field: "Altura",
        description: "Usada para cálculos de IMC e metabolismo basal",
        icon: User
      });
    }

    if (!user?.gender || user.gender === "not_specified") {
      missingFields.push({
        field: "Gênero",
        description: "Influencia no cálculo de necessidades calóricas",
        icon: User
      });
    }

    if (!user?.fitnessGoal) {
      missingFields.push({
        field: "Objetivo fitness",
        description: "Define o tipo de treino (perder peso, ganhar massa, etc.)",
        icon: Target
      });
    }

    if (!user?.experienceLevel) {
      missingFields.push({
        field: "Nível de experiência",
        description: "Determina a complexidade e intensidade dos exercícios",
        icon: Trophy
      });
    }

    if (!user?.weeklyFrequency || user.weeklyFrequency <= 0) {
      missingFields.push({
        field: "Frequência semanal",
        description: "Quantas vezes por semana você pretende treinar",
        icon: Calendar
      });
    }

    if (!user?.availableEquipment || user.availableEquipment.length === 0) {
      missingFields.push({
        field: "Equipamentos disponíveis",
        description: "Tipos de equipamentos que você tem acesso para treinar",
        icon: Dumbbell
      });
    }

    // Adicionar validações para campos de estilo de vida se necessário
    if (!user?.smokingStatus) {
      missingFields.push({
        field: "Status de tabagismo",
        description: "Informação importante para personalizar treinos",
        icon: Heart
      });
    }

    if (!user?.alcoholConsumption) {
      missingFields.push({
        field: "Consumo de álcool",
        description: "Influencia no planejamento de treinos",
        icon: Heart
      });
    }

    if (!user?.dietType) {
      missingFields.push({
        field: "Tipo de alimentação",
        description: "Importante para recomendações personalizadas",
        icon: Heart
      });
    }

    if (!user?.sleepHours) {
      missingFields.push({
        field: "Horas de sono",
        description: "Essencial para planejamento de recuperação",
        icon: Heart
      });
    }

    if (!user?.stressLevel) {
      missingFields.push({
        field: "Nível de estresse",
        description: "Influencia na intensidade dos treinos",
        icon: Heart
      });
    }

    if (!user?.preferredWorkoutTime) {
      missingFields.push({
        field: "Horário preferido",
        description: "Para otimizar seus treinos",
        icon: Clock
      });
    }

    if (!user?.availableDaysPerWeek || user.availableDaysPerWeek <= 0) {
      missingFields.push({
        field: "Dias disponíveis",
        description: "Quantos dias por semana você pode treinar",
        icon: Calendar
      });
    }

    if (!user?.averageWorkoutDuration) {
      missingFields.push({
        field: "Duração dos treinos",
        description: "Tempo médio que você tem para treinar",
        icon: Clock
      });
    }

    if (!user?.preferredLocation) {
      missingFields.push({
        field: "Local preferido",
        description: "Onde você prefere treinar",
        icon: Target
      });
    }

    return missingFields;
  };

  const missingFields = getMissingFields();
  const totalFields = 16; // Total de campos obrigatórios
  const completionPercentage = Math.round(((totalFields - missingFields.length) / totalFields) * 100);

  // Se não há campos faltando, não exibir o card
  if (missingFields.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Complete seu perfil
                </h3>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <div className="mb-3">
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                  Finalize suas informações para receber treinos personalizados pela IA.
                </p>
                <div className="flex items-center space-x-2 mb-2">
                  <Progress value={completionPercentage} className="flex-1 h-2" />
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    {completionPercentage}%
                  </span>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  {missingFields.length} {missingFields.length === 1 ? 'campo faltando' : 'campos faltando'}
                </p>
              </div>

              <CollapsibleContent>
                <div className="space-y-3 mb-4">
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Informações necessárias:
                  </h4>
                  {missingFields.map((field, index) => {
                    const Icon = field.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                            {field.field}
                          </p>
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            {field.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>

              <Link href="/onboarding">
                <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  Completar Onboarding
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

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
          {user?.gender === "female" ? "Pronta" : "Pronto"} para iniciar seu treino?
        </p>
      </div>

      {/* Status Alerts */}
      {(!hasCompletedOnboarding || (user && !user.onboardingCompleted)) && (
        <OnboardingCard user={user} />
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
              <FitnessIcon className="h-3 w-3" />
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
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">{currentStreak} dias</span>
              {currentStreak >= 7 && (
                <Badge variant="destructive" className="text-xs">
                  Em chamas!
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Treino de Hoje</h2>
        <Card className="bg-slate-50 dark:bg-slate-900 light:bg-slate-100/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Treino de Pernas</h3>
              <span className="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-full text-xs text-primary">45 min</span>
            </div>
            <p className="text-muted-foreground mb-3 text-sm">5 exercícios • Nível Intermediário</p>
            <Link href="/active-workout">
              <Button className="w-full py-2 bg-primary hover:bg-primary/90 font-semibold">
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
