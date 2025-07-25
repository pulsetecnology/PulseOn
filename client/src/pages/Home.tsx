import React, { useState, useEffect, useMemo } from "react";
import { parseISO, subDays } from "date-fns";
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
import { useGlobalNotification } from "@/components/NotificationProvider";
import { Clock, Dumbbell, User, Trophy, CheckCircle, AlertCircle, BarChart3, Calendar, Target, ChevronDown, ChevronUp, X, Scale, Heart, Flame, Play, Loader2, Sparkles } from "lucide-react";
import FitnessIcon from "@/components/FitnessIcon";

// Mock workout data with exercise details
const mockTodaysWorkout = {
  id: 1,
  name: "Treino de Pernas",
  duration: 45,
  difficulty: "Intermediário",
  exercises: [
    {
      id: "leg-1",
      name: "Agachamento",
      sets: 4,
      reps: 12,
      weight: "80kg",
      restTime: 90,
      instructions: "Mantenha os pés paralelos, desça até formar 90° nos joelhos",
      muscleGroups: ["quadríceps", "glúteos"]
    },
    {
      id: "leg-2", 
      name: "Leg Press",
      sets: 3,
      reps: 15,
      weight: "120kg",
      restTime: 60,
      instructions: "Posicione os pés na largura dos ombros, controle a descida",
      muscleGroups: ["quadríceps", "glúteos"]
    },
    {
      id: "leg-3",
      name: "Extensão de Pernas",
      sets: 3,
      reps: 12,
      weight: "40kg", 
      restTime: 45,
      instructions: "Movimento controlado, pausa de 1 segundo no topo",
      muscleGroups: ["quadríceps"]
    },
    {
      id: "leg-4",
      name: "Flexão de Pernas",
      sets: 3,
      reps: 12,
      weight: "35kg",
      restTime: 45,
      instructions: "Controle a fase excêntrica, não deixe o peso bater",
      muscleGroups: ["isquiotibiais"]
    },
    {
      id: "leg-5",
      name: "Panturrilha em Pé",
      sets: 4,
      reps: 20,
      weight: "60kg",
      restTime: 30,
      instructions: "Amplitude completa, pausa de 1 segundo no topo",
      muscleGroups: ["panturrilha"]
    }
  ]
};



// Component for expandable onboarding card
function OnboardingCard({ user }: { user: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMissingFields = () => {
    // Se o onboarding foi marcado como completo, não há campos faltando
    if (user?.onboardingCompleted) {
      return [];
    }

    const missingFields = [];

    // Verificar apenas os campos essenciais do onboarding
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

    const availableEquipment = user?.availableEquipment 
      ? (typeof user.availableEquipment === 'string' 
          ? (() => {
              try {
                return JSON.parse(user.availableEquipment);
              } catch {
                return [];
              }
            })()
          : user.availableEquipment)
      : [];
    
    if (!availableEquipment || availableEquipment.length === 0) {
      missingFields.push({
        field: "Equipamentos disponíveis",
        description: "Tipos de equipamentos que você tem acesso para treinar",
        icon: Dumbbell
      });
    }

    return missingFields;
  };

  const missingFields = getMissingFields();
  const totalFields = 8; // Total de campos essenciais do onboarding
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
  const { showSuccess, showError, showWarning, showWorkoutSuccess, showWorkoutError } = useGlobalNotification();
  const queryClient = useQueryClient();
  const [expandedTodaysWorkout, setExpandedTodaysWorkout] = useState(false);

  const [expandedStatsCard, setExpandedStatsCard] = useState<string | null>(null);
  const [expandedWeeklyProgress, setExpandedWeeklyProgress] = useState(false);
  const [expandedCaloriesCard, setExpandedCaloriesCard] = useState(false);

  const hasCompletedOnboarding = user?.onboardingCompleted || false;

  const formatExerciseTime = (timeExec: number) => {
    if (timeExec >= 60) {
      const minutes = Math.floor(timeExec / 60);
      const seconds = timeExec % 60;
      return seconds > 0 ? `${minutes}min ${seconds}s` : `${minutes}min`;
    }
    return `${timeExec}s`;
  };

  // Fetch scheduled workouts from database
  const { data: scheduledWorkouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ["scheduled-workouts"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      console.log("Fetching scheduled workouts...");
      const response = await fetch('/api/scheduled-workouts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch scheduled workouts:", response.status);
        throw new Error('Erro ao carregar treinos programados');
      }

      const data = await response.json();
      console.log("Received scheduled workouts:", data.length, "workouts");
      if (data.length > 0) {
        console.log("First workout data:", data[0]);
      }
      return data;
    },
    enabled: hasCompletedOnboarding,
  });

  // Fetch workout sessions for statistics
  const { data: workoutSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["workout-sessions"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/workout-sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar sessões de treino');
      }

      return response.json();
    },
    enabled: hasCompletedOnboarding,
  });

  // AI workout generation mutation
  const generateWorkoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/ai/generate-workout", "POST");
    },
    onSuccess: (data) => {
      showWorkoutSuccess(5000);
      // Invalidate all scheduled workouts queries
      queryClient.invalidateQueries({ queryKey: ["scheduled-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-workouts"] });
    },
    onError: (error) => {
      showWorkoutError(5000);
    },
  });

  // Count unique workouts by date and workout ID/name to avoid counting partial completions multiple times
  const completedWorkouts = useMemo(() => {
    if (!Array.isArray(workoutSessions)) return 0;
    
    const uniqueWorkouts = new Set();
    
    workoutSessions.forEach((session: any) => {
      if (session.completedAt) {
        const sessionDate = parseISO(session.completedAt).toDateString();
        const workoutId = session.scheduledWorkoutId || session.name || '';
        const uniqueKey = `${sessionDate}-${workoutId}`;
        uniqueWorkouts.add(uniqueKey);
      }
    });
    
    return uniqueWorkouts.size;
  }, [workoutSessions]);

  // Calculate real stats from workout sessions
  const workoutStats = useMemo(() => {
    if (!Array.isArray(workoutSessions)) {
      return {
        totalCalories: 0,
        totalMinutes: 0,
        totalExercises: 0,
        currentStreak: 0,
        weeklyCalories: 0,
        weeklyMinutes: 0,
        weeklyExercises: 0,
        averageWorkoutDuration: 0,
        lastWorkoutCalories: 0,
        yesterdayCalories: 0,
        todayCalories: 0,
        dailyAverage: 0,
        maxCalories: 0,
        longestWorkout: 0
      };
    }

    const completedSessions = workoutSessions.filter((session: any) => 
      session.completedAt && session.totalDuration && session.totalDuration >= 1
    );
    const totalCalories = completedSessions.reduce((sum: number, session: any) => sum + (session.totalCalories || 0), 0);
    const totalMinutes = completedSessions.reduce((sum: number, session: any) => sum + (session.totalDuration || 0), 0);
    const totalExercises = completedSessions.reduce((sum: number, session: any) => {
      // Contar apenas exercícios únicos por sessão para evitar duplicação
      const uniqueExercises = new Set();
      if (session.exercises && Array.isArray(session.exercises)) {
        session.exercises.forEach((ex: any) => {
          if (ex.completed && ex.exercise) {
            uniqueExercises.add(ex.exercise);
          }
        });
      }
      return sum + uniqueExercises.size;
    }, 0);

    // Calculate current streak
    const today = new Date();
    const sortedSessions = completedSessions
      .map((session: any) => ({
        ...session,
        completedDate: parseISO(session.completedAt).toDateString()
      }))
      .sort((a: any, b: any) => parseISO(b.completedAt).getTime() - parseISO(a.completedAt).getTime());

    let currentStreak = 0;
    let checkDate = today;

    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dateString = checkDate.toDateString();
      const hasWorkout = sortedSessions.some((session: any) => session.completedDate === dateString);

      if (hasWorkout) {
        currentStreak++;
      } else if (i > 0) { // Allow today to not have a workout yet
        break;
      }

      checkDate = subDays(checkDate, 1);
    }

    // Weekly stats (last 7 days)
    const weekAgo = subDays(today, 7);
    const weeklySessions = completedSessions.filter((session: any) => 
      parseISO(session.completedAt) >= weekAgo
    );
    const weeklyCalories = weeklySessions.reduce((sum: number, session: any) => sum + (session.totalCalories || 0), 0);
    const weeklyMinutes = weeklySessions.reduce((sum: number, session: any) => sum + (session.totalDuration || 0), 0);
    const weeklyExercises = weeklySessions.reduce((sum: number, session: any) => {
      // Contar apenas exercícios únicos por sessão para evitar duplicação
      const uniqueExercises = new Set();
      if (session.exercises && Array.isArray(session.exercises)) {
        session.exercises.forEach((ex: any) => {
          if (ex.completed && ex.exercise) {
            uniqueExercises.add(ex.exercise);
          }
        });
      }
      return sum + uniqueExercises.size;
    }, 0);

    // Today's and yesterday's calories
    const todayString = today.toDateString();
    const yesterdayString = subDays(today, 1).toDateString();
    const todayCalories = completedSessions
      .filter((session: any) => parseISO(session.completedAt).toDateString() === todayString)
      .reduce((sum: number, session: any) => sum + (session.totalCalories || 0), 0);
    const yesterdayCalories = completedSessions
      .filter((session: any) => parseISO(session.completedAt).toDateString() === yesterdayString)
      .reduce((sum: number, session: any) => sum + (session.totalCalories || 0), 0);

    // Additional stats
    const lastWorkoutCalories = sortedSessions.length > 0 ? sortedSessions[0].totalCalories || 0 : 0;
    const dailyAverage = completedSessions.length > 0 ? Math.round(totalCalories / completedSessions.length) : 0;
    const maxCalories = Math.max(...completedSessions.map((session: any) => session.totalCalories || 0), 0);
    const longestWorkout = Math.max(...completedSessions.map((session: any) => session.totalDuration || 0), 0);
    const averageWorkoutDuration = completedSessions.length > 0 ? Math.round(totalMinutes / completedSessions.length) : 0;

    return {
      totalCalories,
      totalMinutes,
      totalExercises,
      currentStreak,
      weeklyCalories,
      weeklyMinutes,
      weeklyExercises,
      averageWorkoutDuration,
      lastWorkoutCalories,
      yesterdayCalories,
      todayCalories,
      dailyAverage,
      maxCalories,
      longestWorkout
    };
  }, [workoutSessions]);

  // Calculate weekly workout details for the expanded view
  const weeklyWorkoutDetails = useMemo(() => {
    if (!Array.isArray(workoutSessions)) return { details: {}, uniqueExercises: 0, uniqueMuscleGroups: 0 };
    
    const completedSessions = workoutSessions.filter((session: any) => 
      session.completedAt && session.totalDuration && session.totalDuration >= 1
    );
    const today = new Date();
    
    // Get current week's Monday
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Adjust Sunday to be 6 days from Monday
    const monday = subDays(today, daysFromMonday);
    
    // Calculate this week's sessions (from Monday to Sunday)
    const weekStart = new Date(monday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(monday);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weeklySessions = completedSessions.filter((session: any) => {
      const sessionDate = parseISO(session.completedAt);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });



    // Get workout details for each day of the week (Monday to Sunday)
    const weekDays = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const weeklyDetails: Record<string, { hasWorkout: boolean; duration: number; name: string }> = {};
    
    // Calculate total unique exercises and muscle groups
    const allExercises = new Set<string>();
    const allMuscleGroups = new Set<string>();
    
    // Loop through each day of this week (Monday to Sunday)
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(dayDate.getDate() + i);
      const dayString = dayDate.toDateString();
      const dayName = weekDays[i];
      
      const dayWorkouts = weeklySessions.filter((session: any) => 
        parseISO(session.completedAt).toDateString() === dayString
      );
      
      if (dayWorkouts.length > 0) {
        const totalMinutes = dayWorkouts.reduce((sum: number, session: any) => sum + (session.totalDuration || 0), 0);
        const mainMuscleGroup = dayWorkouts[0].name || 'Treino'; // Use workout name
        
        weeklyDetails[dayName] = {
          hasWorkout: true,
          duration: totalMinutes,
          name: mainMuscleGroup
        };
        
        // Add exercises and muscle groups to sets
        dayWorkouts.forEach((session: any) => {
          if (session.exercises && Array.isArray(session.exercises)) {
            session.exercises.forEach((exercise: any) => {
              if (exercise.completed) {
                allExercises.add(exercise.exercise);
                allMuscleGroups.add(exercise.muscleGroup);
              }
            });
          }
        });
      } else {
        weeklyDetails[dayName] = {
          hasWorkout: false,
          duration: 0,
          name: 'Descanso'
        };
      }
    }
    
    return {
      details: weeklyDetails,
      uniqueExercises: allExercises.size,
      uniqueMuscleGroups: allMuscleGroups.size
    };
  }, [workoutSessions]);

  const hasWorkoutsAvailable = Array.isArray(scheduledWorkouts) && scheduledWorkouts.length > 0;
  const todaysWorkout = hasWorkoutsAvailable ? scheduledWorkouts[0] : null;

  // Debug logs
  React.useEffect(() => {
    console.log("Home component - scheduledWorkouts:", scheduledWorkouts);
    console.log("Home component - hasWorkoutsAvailable:", hasWorkoutsAvailable);
    console.log("Home component - todaysWorkout:", todaysWorkout);
  }, [scheduledWorkouts, hasWorkoutsAvailable, todaysWorkout]);



  const toggleStatsCard = (cardId: string) => {
    setExpandedStatsCard(expandedStatsCard === cardId ? null : cardId);
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
      {!hasCompletedOnboarding && (
        <OnboardingCard user={user} />
      )}



      {/* Quick Stats */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {expandedStatsCard !== 'streak' && (
            <Card 
              className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                expandedStatsCard === 'workouts' ? 'col-span-2' : ''
              }`}
              onClick={() => toggleStatsCard('workouts')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Treinos Concluídos</span>
                  <div className="flex items-center gap-1">
                    <FitnessIcon className="h-3 w-3" />
                    {expandedStatsCard === 'workouts' ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <span className="text-xl font-bold">{completedWorkouts}</span>
                {workoutStats.weeklyExercises > 0 && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    +{Math.ceil(workoutStats.weeklyExercises / 5)} esta semana
                  </Badge>
                )}

                {/* Expanded Content */}
                {expandedStatsCard === 'workouts' && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Esta semana:</span>
                      <span className="font-medium">{workoutStats.weeklyExercises > 0 ? Math.ceil(workoutStats.weeklyExercises / 5) : 0} treinos</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total exercícios:</span>
                      <span className="font-medium">{workoutStats.totalExercises}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tempo total:</span>
                      <span className="font-medium">{Math.floor(workoutStats.totalMinutes / 60)}h {workoutStats.totalMinutes % 60}min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Maior sequência:</span>
                      <span className="font-medium text-orange-600">{workoutStats.currentStreak} dias</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Média/treino:</span>
                      <span className="font-medium">{workoutStats.averageWorkoutDuration}min</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {expandedStatsCard !== 'workouts' && (
            <Card 
              className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                expandedStatsCard === 'streak' ? 'col-span-2' : ''
              }`}
              onClick={() => toggleStatsCard('streak')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Sequência Atual</span>
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {expandedStatsCard === 'streak' ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">{workoutStats.currentStreak} dias</span>
                  {workoutStats.currentStreak >= 7 && (
                    <Badge variant="destructive" className="text-xs">
                      Em chamas!
                    </Badge>
                  )}
                </div>

                {/* Expanded Content */}
                {expandedStatsCard === 'streak' && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Iniciou em:</span>
                      <span className="font-medium">05/01/2025</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Próxima meta:</span>
                      <span className="font-medium text-blue-600">10 dias</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Recorde pessoal:</span>
                      <span className="font-medium text-green-600">14 dias</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Último treino:</span>
                      <span className="font-medium">Hoje</span>
                    </div>
                    <div className="w-full mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progresso até 10 dias</span>
                        <span className="font-medium">70%</span>
                      </div>
                      <Progress value={70} className="h-1" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>


      </div>

      {/* Extended Stats */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {expandedStatsCard !== 'time' && (
            <Card 
              className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                expandedStatsCard === 'calories' ? 'col-span-2' : ''
              }`}
              onClick={() => toggleStatsCard('calories')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Calorias Queimadas</span>
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-red-500" />
                    {expandedStatsCard === 'calories' ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <span className="text-xl font-bold">{workoutStats.weeklyCalories.toLocaleString()}</span>
                {workoutStats.weeklyCalories > 0 && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Esta semana
                  </Badge>
                )}

                {/* Expanded Content */}
                {expandedStatsCard === 'calories' && workoutStats.totalCalories > 0 && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Hoje:</span>
                      <span className="font-medium">{workoutStats.todayCalories} kcal</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Ontem:</span>
                      <span className="font-medium">{workoutStats.yesterdayCalories} kcal</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Média/dia:</span>
                      <span className="font-medium">{workoutStats.dailyAverage} kcal</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total geral:</span>
                      <span className="font-medium text-blue-600">{workoutStats.totalCalories.toLocaleString()} kcal</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Maior queima:</span>
                      <span className="font-medium text-orange-600">{workoutStats.maxCalories} kcal</span>
                    </div>
                    <div className="w-full mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Meta semanal (1,500 kcal)</span>
                        <span className="font-medium">{Math.min(100, Math.round((workoutStats.weeklyCalories / 1500) * 100))}%</span>
                      </div>
                      <Progress value={Math.min(100, Math.round((workoutStats.weeklyCalories / 1500) * 100))} className="h-1" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {expandedStatsCard !== 'calories' && (
            <Card 
              className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                expandedStatsCard === 'time' ? 'col-span-2' : ''
              }`}
              onClick={() => toggleStatsCard('time')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Tempo Total</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-500" />
                    {expandedStatsCard === 'time' ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <span className="text-xl font-bold">{Math.floor(workoutStats.weeklyMinutes / 60)}h {workoutStats.weeklyMinutes % 60}min</span>
                {workoutStats.weeklyMinutes > 0 && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Esta semana
                  </Badge>
                )}

                {/* Expanded Content */}
                {expandedStatsCard === 'time' && workoutStats.totalMinutes > 0 && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Esta semana:</span>
                      <span className="font-medium">{Math.floor(workoutStats.weeklyMinutes / 60)}h {workoutStats.weeklyMinutes % 60}min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total geral:</span>
                      <span className="font-medium">{Math.floor(workoutStats.totalMinutes / 60)}h {workoutStats.totalMinutes % 60}min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Média/treino:</span>
                      <span className="font-medium">{workoutStats.averageWorkoutDuration}min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Maior treino:</span>
                      <span className="font-medium text-green-600">{Math.floor(workoutStats.longestWorkout / 60)}h {workoutStats.longestWorkout % 60}min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Meta semanal:</span>
                      <span className="font-medium text-blue-600">300min</span>
                    </div>
                    <div className="w-full mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Meta semanal</span>
                        <span className="font-medium">{Math.min(100, Math.round((workoutStats.weeklyMinutes / 300) * 100))}%</span>
                      </div>
                      <Progress value={Math.min(100, Math.round((workoutStats.weeklyMinutes / 300) * 100))} className="h-1" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Weekly Progress */}
      {hasCompletedOnboarding && (
        <Card 
          className="cursor-pointer transition-all duration-200"
          onClick={() => setExpandedWeeklyProgress(!expandedWeeklyProgress)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Progresso da Semana
              </div>
              {expandedWeeklyProgress ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Meta Semanal</span>
                <span className="text-muted-foreground">{Object.values(weeklyWorkoutDetails.details || {}).filter((day: any) => day.hasWorkout).length}/3 treinos</span>
              </div>
              <Progress value={Math.min(100, (Object.values(weeklyWorkoutDetails.details || {}).filter((day: any) => day.hasWorkout).length / 3) * 100)} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Calorias</p>
                <p className="text-sm font-semibold">{workoutStats.weeklyCalories} kcal</p>
                <div className="w-full bg-muted rounded-full h-1">
                  <div className="bg-red-500 h-1 rounded-full" style={{ width: `${Math.min(100, Math.round((workoutStats.weeklyCalories / 1500) * 100))}%` }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tempo</p>
                <p className="text-sm font-semibold">{Math.floor(workoutStats.weeklyMinutes / 60)}h {workoutStats.weeklyMinutes % 60}min</p>
                <div className="w-full bg-muted rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${Math.min(100, Math.round((workoutStats.weeklyMinutes / 300) * 100))}%` }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Exercícios</p>
                <p className="text-sm font-semibold">{workoutStats.weeklyExercises}</p>
                <div className="w-full bg-muted rounded-full h-1">
                  <div className="bg-green-500 h-1 rounded-full" style={{ width: `${Math.min(100, Math.round((workoutStats.weeklyExercises / 20) * 100))}%` }}></div>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedWeeklyProgress && (
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                <h4 className="font-semibold text-sm">Detalhes Semanais</h4>

                <div className="space-y-3">
                  {Object.entries(weeklyWorkoutDetails.details || {}).map(([dayName, dayData]) => (
                    <div key={dayName} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{dayName}</span>
                      <div className="flex items-center gap-2">
                        {dayData.hasWorkout ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">
                              {dayData.name} - {dayData.duration}min
                            </span>
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Descanso</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-muted/30 p-3 rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Resumo da Semana</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de calorias:</span>
                      <span className="font-medium">{workoutStats.weeklyCalories.toLocaleString()} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tempo total:</span>
                      <span className="font-medium">{Math.floor(workoutStats.weeklyMinutes / 60)}h {workoutStats.weeklyMinutes % 60}min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exercícios únicos:</span>
                      <span className="font-medium">{weeklyWorkoutDetails.uniqueExercises || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Grupos musculares:</span>
                      <span className="font-medium">{weeklyWorkoutDetails.uniqueMuscleGroups || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Today's Workout */}
      {hasCompletedOnboarding && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Treino de Hoje</h2>
            <Button
              onClick={() => generateWorkoutMutation.mutate()}
              disabled={generateWorkoutMutation.isPending}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {generateWorkoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Atualizar treino
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
          ) : hasWorkoutsAvailable && todaysWorkout ? (
            <Card 
              className="cursor-pointer transition-all duration-200 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
              onClick={() => setExpandedTodaysWorkout(!expandedTodaysWorkout)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-blue-800 dark:text-blue-200">{todaysWorkout.name}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {todaysWorkout.exercises ? todaysWorkout.exercises.length : 0} exercícios • {todaysWorkout.totalCalories || 0} kcal
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

                <div className="mb-3">
                  <div className="flex justify-start mb-3">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        // Redirecionar apenas para a tela de treinos
                        window.location.href = '/workout';
                      }}
                    >
                      <Dumbbell className="mr-2 h-4 w-4" />
                      Ir para Treino
                    </Button>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      {(todaysWorkout as any).description || "Baseado no seu perfil"}
                    </p>
                  </div>
                </div>

                {/* Expanded Exercise Details */}
                {expandedTodaysWorkout && (
                  <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <h4 className="font-semibold text-sm mb-3 text-blue-800 dark:text-blue-200">Exercícios do Treino</h4>
                    <div className="space-y-2">
                      {todaysWorkout.exercises && todaysWorkout.exercises?.map((exercise: any, index: number) => (
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
                                {exercise.series} séries × {exercise.repetitions > 0 ? `${exercise.repetitions} reps` : `${formatExerciseTime(exercise.timeExec || exercise.time)}`}
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
                      Clique em "Atualizar treino" para gerar seu treino personalizado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}


    </div>
  );
}