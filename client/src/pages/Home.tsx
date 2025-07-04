import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parseISO, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  Dumbbell,
  Fire,
  Play,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  CheckCircle,
  X,
  Target,
  TrendingUp,
  Flame
} from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

const FitnessIcon = Dumbbell;

function formatExerciseTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
}

function OnboardingCard({ user }: { user: any }) {
  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Target className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
              Complete seu perfil
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
              Finalize suas informações para receber treinos personalizados pela nossa IA
            </p>
            <Link href="/profile">
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                Completar Perfil
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedStatsCard, setExpandedStatsCard] = useState<string | null>(null);
  const [expandedTodaysWorkout, setExpandedTodaysWorkout] = useState(false);
  const [expandedWeeklyProgress, setExpandedWeeklyProgress] = useState(false);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Fetch workout sessions
  const { data: workoutSessions, isLoading: workoutSessionsLoading } = useQuery({
    queryKey: ['/api/workout-sessions'],
  });

  // Fetch scheduled workouts
  const { data: scheduledWorkouts, isLoading: workoutsLoading } = useQuery({
    queryKey: ['/api/scheduled-workouts'],
  });

  // Generate workout mutation
  const generateWorkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to generate workout');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-workouts'] });
      toast({
        title: "Treino gerado!",
        description: "Seu novo treino personalizado está pronto.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar treino",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  const hasCompletedOnboarding = user?.onboardingCompleted;

  // Calculate workout statistics
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
      session.completedAt && session.totalDuration && session.totalDuration >= 10
    );

    const totalCalories = completedSessions.reduce((sum: number, session: any) => sum + (session.totalCalories || 0), 0);
    const totalMinutes = completedSessions.reduce((sum: number, session: any) => sum + (session.totalDuration || 0), 0);
    
    let totalExercises = 0;
    completedSessions.forEach((session: any) => {
      if (session.exercises && Array.isArray(session.exercises)) {
        totalExercises += session.exercises.filter((ex: any) => ex.completed).length;
      }
    });

    // Calculate weekly stats
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weeklySessions = completedSessions.filter((session: any) => {
      const sessionDate = parseISO(session.completedAt);
      return sessionDate >= weekStart;
    });

    const weeklyCalories = weeklySessions.reduce((sum: number, session: any) => sum + (session.totalCalories || 0), 0);
    const weeklyMinutes = weeklySessions.reduce((sum: number, session: any) => sum + (session.totalDuration || 0), 0);
    
    let weeklyExercises = 0;
    weeklySessions.forEach((session: any) => {
      if (session.exercises && Array.isArray(session.exercises)) {
        weeklyExercises += session.exercises.filter((ex: any) => ex.completed).length;
      }
    });

    return {
      totalCalories,
      totalMinutes,
      totalExercises,
      currentStreak: 7, // Mock data for now
      weeklyCalories,
      weeklyMinutes,
      weeklyExercises,
      averageWorkoutDuration: completedSessions.length > 0 ? Math.round(totalMinutes / completedSessions.length) : 0,
      lastWorkoutCalories: completedSessions.length > 0 ? completedSessions[completedSessions.length - 1]?.totalCalories || 0 : 0,
      yesterdayCalories: 0, // Would need date filtering
      todayCalories: 0, // Would need date filtering
      dailyAverage: completedSessions.length > 0 ? Math.round(totalCalories / Math.max(1, completedSessions.length)) : 0,
      maxCalories: completedSessions.length > 0 ? Math.max(...completedSessions.map((s: any) => s.totalCalories || 0)) : 0,
      longestWorkout: completedSessions.length > 0 ? Math.max(...completedSessions.map((s: any) => s.totalDuration || 0)) : 0
    };
  }, [workoutSessions]);

  const completedWorkouts = useMemo(() => {
    if (!Array.isArray(workoutSessions)) return 0;
    return workoutSessions.filter((session: any) => 
      session.completedAt && session.totalDuration && session.totalDuration >= 10
    ).length;
  }, [workoutSessions]);

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

  const toggleStatsCard = (cardId: string) => {
    setExpandedStatsCard(expandedStatsCard === cardId ? null : cardId);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Onboarding reminder */}
      {(!hasCompletedOnboarding || (user && !user.onboardingCompleted)) && (
        <OnboardingCard user={user} />
      )}

      {/* Quick Stats - Only shown for users with workout history */}
      {hasCompletedOnboarding && completedWorkouts > 0 && (
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
                        <span className="text-muted-foreground">Duração média:</span>
                        <span className="font-medium">{workoutStats.averageWorkoutDuration}min</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Treino mais longo:</span>
                        <span className="font-medium text-green-600">{workoutStats.longestWorkout}min</span>
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
                    <span className="text-xs text-muted-foreground">Sequência</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      {expandedStatsCard === 'streak' ? (
                        <ChevronUp className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <span className="text-xl font-bold">{workoutStats.currentStreak}</span>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    dias
                  </Badge>

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
      )}

      {/* Weekly Progress - Only shown for users with workout history */}
      {hasCompletedOnboarding && completedWorkouts > 0 && (
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
              <Progress 
                value={Math.min(100, (Object.values(weeklyWorkoutDetails.details || {}).filter((day: any) => day.hasWorkout).length / 3) * 100)} 
                className="h-2" 
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Calorias</p>
                <p className="text-sm font-semibold">{workoutStats.weeklyCalories.toLocaleString()}</p>
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
                        {(dayData as any).hasWorkout ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">
                              {(dayData as any).name} - {(dayData as any).duration}min
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
                  {todaysWorkout ? 'Gerar novo treino' : 'Gerar treino'}
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
                      {todaysWorkout.exercises?.length || 0} exercícios • {todaysWorkout.totalCalories || 0} kcal
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
                        // Salvar dados do treino no localStorage
                        const workoutData = {
                          workoutName: todaysWorkout.name,
                          workoutPlan: todaysWorkout.exercises || []
                        };
                        localStorage.setItem('activeWorkout', JSON.stringify(workoutData));
                        // Redirecionar para a tela de treino ativo
                        window.location.href = '/active-workout';
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Ir para treino
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
              <CardContent className="p-4 text-center">
                <div className="space-y-3">
                  <Sparkles className="h-8 w-8 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      Pronto para começar?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Clique em "Gerar treino" para criar um treino personalizado baseado no seu perfil
                    </p>
                    {!hasCompletedOnboarding && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                        Complete seu perfil primeiro para treinos mais personalizados
                      </p>
                    )}
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