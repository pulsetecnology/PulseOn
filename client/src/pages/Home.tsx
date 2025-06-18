import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Dumbbell, User, Trophy, CheckCircle, AlertCircle, BarChart3, Calendar, Target, ChevronDown, ChevronUp, X, Scale, Heart, Flame, Play, Loader2, Sparkles } from "lucide-react";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedTodaysWorkout, setExpandedTodaysWorkout] = useState(false);
  const [expandedUpcomingWorkout, setExpandedUpcomingWorkout] = useState<number | null>(null);
  const [expandedStatsCard, setExpandedStatsCard] = useState<string | null>(null);
  const [expandedWeeklyProgress, setExpandedWeeklyProgress] = useState(false);
  const [expandedCaloriesCard, setExpandedCaloriesCard] = useState(false);

  const hasCompletedOnboarding = user?.onboardingCompleted || false;

  // Fetch scheduled workouts from database
  const { data: scheduledWorkouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ["/api/scheduled-workouts"],
    enabled: hasCompletedOnboarding,
  });

  // Fetch workout sessions for statistics
  const { data: workoutSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/workout-sessions"],
    enabled: hasCompletedOnboarding,
  });

  // AI workout generation mutation
  const generateWorkoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/ai/generate-workout", "POST");
    },
    onSuccess: (data) => {
      toast({
        title: "Treino gerado com sucesso!",
        description: "Seu novo treino personalizado está pronto.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-workouts"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar treino",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  // Generate N8N sync mutation for dashboard
  const syncN8NMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/n8n/sync-user-data", "POST");
    },
    onSuccess: (data) => {
      toast({
        title: "Dados sincronizados!",
        description: "Seus dados foram sincronizados com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-sessions"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao sincronizar dados",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  const completedWorkouts = Array.isArray(workoutSessions) ? workoutSessions.filter((session: any) => session.completedAt).length : 0;
  const currentStreak = Array.isArray(workoutSessions) ? workoutSessions.filter((session: any) => session.completedAt).length : 0; // Calculate based on consecutive workout days
  const hasWorkoutsAvailable = Array.isArray(scheduledWorkouts) ? scheduledWorkouts.length > 0 : false;
  const todaysWorkout = Array.isArray(scheduledWorkouts) ? scheduledWorkouts.find((workout: any) => workout.status === "pending") : null;

  const toggleUpcomingWorkout = (workoutId: number) => {
    setExpandedUpcomingWorkout(expandedUpcomingWorkout === workoutId ? null : workoutId);
  };

  const toggleStatsCard = (cardId: string) => {
    setExpandedStatsCard(expandedStatsCard === cardId ? null : cardId);
  };

  const toggleWeeklyProgress = () => {
    setExpandedWeeklyProgress(!expandedWeeklyProgress);
  };

  const toggleCaloriesCard = () => {
    setExpandedCaloriesCard(!expandedCaloriesCard);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">Olá, {user?.name?.split(' ')[0] || 'usuário'}!</h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso e veja seus treinos planejados
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

      {/* Quick Stats - Only show if there are completed workouts */}
      {completedWorkouts > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Treinos Concluídos</span>
                  <div className="flex items-center gap-1">
                    <FitnessIcon className="h-3 w-3" />
                  </div>
                </div>
                <span className="text-xl font-bold">{completedWorkouts}</span>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Sequência Atual</span>
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                  </div>
                </div>
                <span className="text-xl font-bold">{currentStreak}</span>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Today's Workout */}
      {hasCompletedOnboarding && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Treino de Hoje</h2>
            <Button
              onClick={() => syncN8NMutation.mutate()}
              disabled={syncN8NMutation.isPending}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {syncN8NMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Sincronizar Dados
                </>
              )}
            </Button>
          </div>

          {workoutsLoading ? (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-blue-800 dark:text-blue-200">Carregando treino...</span>
                </div>
              </CardContent>
            </Card>
          ) : todaysWorkout ? (
            <Card 
              className="cursor-pointer transition-all duration-200 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
              onClick={() => setExpandedTodaysWorkout(!expandedTodaysWorkout)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-blue-800 dark:text-blue-200">{todaysWorkout.name}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {todaysWorkout.exercises?.length || 0} exercícios • {todaysWorkout.totalDuration || 0} min • {todaysWorkout.totalCalories || 0} kcal
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-white">Hoje</Badge>
                    {expandedTodaysWorkout ? (
                      <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <Link href="/workout">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Play className="mr-2 h-4 w-4" />
                      Ir para treino
                    </Button>
                  </Link>
                  <div className="text-right">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Recomendado pela IA</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Baseado no seu progresso</p>
                  </div>
                </div>

                {/* Expanded Exercise Details */}
                {expandedTodaysWorkout && (
                  <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <h4 className="font-semibold text-sm mb-3 text-blue-800 dark:text-blue-200">Exercícios do Treino</h4>
                    <div className="space-y-2">
                      {todaysWorkout.exercises?.map((exercise: any, index: number) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between py-2 px-3 rounded-md bg-blue-100 dark:bg-blue-900/30"
                        >
                          <div className="flex-1">
                            <div className="flex flex-col">
                              <h5 className="font-medium text-sm text-blue-800 dark:text-blue-200">
                                {exercise.exercise}
                              </h5>
                              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                {exercise.series} séries × {exercise.repetitions} reps
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                {exercise.instructions}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-3">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {exercise.weight > 0 ? `${exercise.weight}kg` : 'Peso corporal'}
                            </span>
                            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center justify-end">
                              <Flame className="mr-1 h-2 w-2" />
                              {exercise.calories} kcal
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">
                      Nenhum treino encontrado
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sincronize seus dados para obter um novo treino personalizado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Upcoming Workouts */}
      {/* <div>
        <h2 className="text-lg font-semibold mb-3">Próximos Treinos</h2>
        <div className="space-y-2">
          {mockUpcomingWorkouts.map((workout) => (
            <Card 
              key={workout.id} 
              className="cursor-pointer transition-all duration-200"
              onClick={() => toggleUpcomingWorkout(workout.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{workout.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {workout.date} • {workout.exercises.length} exercícios • {workout.difficulty}
                    </p>
                  </div>
                  {expandedUpcomingWorkout === workout.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Expanded Exercise Details */}
                {/* {expandedUpcomingWorkout === workout.id && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <h4 className="font-semibold text-sm mb-3 text-foreground">Exercícios do Treino</h4>
                    <div className="space-y-2">
                      {workout.exercises.map((exercise, index) => (
                        <div 
                          key={exercise.id} 
                          className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30"
                        >
                          <div className="flex-1">
                            <div className="flex flex-col">
                              <h5 className="font-medium text-sm text-foreground">
                                {exercise.name}
                              </h5>
                              <p className="text-xs text-muted-foreground mt-1">
                                {exercise.sets} séries × {exercise.reps} reps
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {exercise.instructions}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-3">
                            <span className="text-sm font-semibold text-primary">
                              {exercise.weight}
                            </span>
                            <p className="text-xs text-muted-foreground flex items-center justify-end">
                              <Clock className="mr-1 h-2 w-2" />
                              {exercise.restTime}s
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div> */}
    </div>
  );
}