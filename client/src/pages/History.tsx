import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Flame, Trophy, Clock, ChevronDown, ChevronUp, Target, Dumbbell, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, subMonths, addMonths, startOfWeek, endOfWeek, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CompletedExercise {
  exercise: string;
  muscleGroup: string;
  type: string;
  instructions: string;
  time: number;
  series: number;
  repetitions: number;
  restBetweenSeries: number;
  restBetweenExercises: number;
  weight: number;
  calories: number;
  actualWeight?: number;
  actualTime?: number;
  actualCalories?: number;
  effortLevel: number;
  completed: boolean;
  status?: "completed" | "incomplete" | "not-started";
  notes?: string;
}

interface WorkoutSession {
  id: number;
  userId: number;
  scheduledWorkoutId?: number;
  name: string;
  startedAt: string;
  completedAt: string;
  exercises: CompletedExercise[];
  totalDuration: number;
  totalCalories: number;
  notes?: string;
}

// Fetch workout sessions
const fetchWorkoutSessions = async (): Promise<WorkoutSession[]> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/workout-sessions', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar histórico de treinos');
    }

    return response.json();
  } catch (error) {
    console.error('Erro ao carregar do backend, tentando localStorage:', error);
    
    // Fallback: carregar do localStorage
    const localSessions = localStorage.getItem('workoutSessions');
    if (localSessions) {
      const sessions = JSON.parse(localSessions);
      
      // Converter formato localStorage para formato esperado pela tela
      return sessions.map((session: any) => ({
        id: session.id,
        userId: session.userId,
        scheduledWorkoutId: session.scheduledWorkoutId,
        name: session.workoutName || session.name,
        startedAt: session.startTime || session.startedAt,
        completedAt: session.endTime || session.completedAt,
        exercises: session.exercises || [],
        totalDuration: session.duration || session.totalDuration,
        totalCalories: session.totalCalories,
        notes: session.notes
      }));
    }
    
    return [];
  }
};

export default function History() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSession | null>(null);

  const formatExerciseTime = (timeExec: number) => {
    if (timeExec >= 60) {
      const minutes = Math.floor(timeExec / 60);
      const seconds = timeExec % 60;
      return seconds > 0 ? `${minutes}min ${seconds}s` : `${minutes}min`;
    }
    return `${timeExec}s`;
  };

  const { data: workoutSessions = [], isLoading, error } = useQuery({
    queryKey: ["/api/workout-sessions"],
    queryFn: fetchWorkoutSessions,
  });

  // Process workout data for calendar and stats
  const processedData = useMemo(() => {
    const workoutsByDate: Record<string, WorkoutSession[]> = {};
    let totalCalories = 0;
    let totalMinutes = 0;
    let currentStreak = 0;
    const uniqueWorkouts = new Set();

    // Group workouts by date
    workoutSessions.forEach(session => {
      const dateKey = format(parseISO(session.completedAt), 'yyyy-MM-dd');
      if (!workoutsByDate[dateKey]) {
        workoutsByDate[dateKey] = [];
      }
      workoutsByDate[dateKey].push(session);
      
      // Criar um identificador único para o treino (data + id do treino agendado)
      const workoutIdentifier = `${dateKey}-${session.scheduledWorkoutId || session.name}`;
      uniqueWorkouts.add(workoutIdentifier);
      
      totalCalories += session.totalCalories;
      totalMinutes += session.totalDuration;
    });
    
    // Número total de treinos únicos
    const totalWorkouts = uniqueWorkouts.size;

    // Calculate current streak (consecutive days with workouts)
    let checkDate = new Date();
    while (true) {
      const dateKey = format(checkDate, 'yyyy-MM-dd');
      if (workoutsByDate[dateKey] && workoutsByDate[dateKey].length > 0) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    return {
      workoutsByDate,
      totalWorkouts,
      totalCalories,
      totalMinutes,
      currentStreak,
      averageWorkoutDuration: totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0
    };
  }, [workoutSessions]);

  // Get current month data for calendar
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 }); // Start on Sunday
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

  const getWorkoutsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return processedData.workoutsByDate[dateKey] || [];
  };

  const getWorkoutStatus = (date: Date) => {
    const workouts = getWorkoutsForDate(date);
    if (workouts.length === 0) return null;

    const completedExercises = workouts.reduce((total, workout) => 
      total + workout.exercises.filter(ex => ex.completed).length, 0);
    const totalExercises = workouts.reduce((total, workout) => total + workout.exercises.length, 0);

    if (completedExercises === totalExercises) return "completed";
    if (completedExercises > 0) return "partial";
    return "skipped";
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar histórico: {error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Show workout details view
  if (selectedWorkout) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedWorkout(null)}
              className="text-slate-600 dark:text-slate-400"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {selectedWorkout.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(selectedWorkout.completedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Workout Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="p-4">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedWorkout.totalDuration}
                </p>
                <p className="text-sm text-muted-foreground">minutos</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-4">
                <Flame className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedWorkout.totalCalories}
                </p>
                <p className="text-sm text-muted-foreground">kcal</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-4">
                <Dumbbell className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedWorkout.exercises.filter(ex => ex.completed).length}
                </p>
                <p className="text-sm text-muted-foreground">exercícios</p>
              </CardContent>
            </Card>
          </div>

          {/* Exercises List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Exercícios</h3>
            {selectedWorkout.exercises.map((exercise, index) => {
              const getBorderColor = () => {
                if (exercise.status === 'completed' || exercise.completed) return 'border-green-200 dark:border-green-800';
                if (exercise.status === 'incomplete') return 'border-yellow-200 dark:border-yellow-800';
                return 'border-red-200 dark:border-red-800';
              };

              const getBadgeVariant = () => {
                if (exercise.status === 'completed' || exercise.completed) return "default";
                if (exercise.status === 'incomplete') return "secondary";
                return "destructive";
              };

              const getStatusText = () => {
                if (exercise.status === 'completed' || exercise.completed) return "Concluído";
                if (exercise.status === 'incomplete') return "Incompleto";
                return "Não executado";
              };

              return (
                <Card key={index} className={getBorderColor()}>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {exercise.exercise}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {exercise.muscleGroup}
                      </p>
                    </div>

                    {(exercise.completed || exercise.status === 'incomplete') && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Séries:</span>
                          <span className="ml-1 font-medium">{exercise.series}</span>
                        </div>
                        {exercise.repetitions && exercise.repetitions > 0 && (
                          <div>
                            <span className="text-muted-foreground">Reps:</span>
                            <span className="ml-1 font-medium">{exercise.repetitions}</span>
                          </div>
                        )}
                        {exercise.actualTime && exercise.actualTime > 0 && (
                          <div>
                            <span className="text-muted-foreground">Tempo:</span>
                            <span className="ml-1 font-medium">{formatExerciseTime(exercise.actualTime)}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Peso:</span>
                          <span className="ml-1 font-medium">
                            {exercise.actualWeight && exercise.actualWeight > 0 
                              ? `${exercise.actualWeight}kg` 
                              : 'Peso corporal'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Esforço:</span>
                          <span className="ml-1 font-medium">{exercise.effortLevel}/10</span>
                        </div>
                      </div>
                    )}

                    {/* Mostrar notas se existirem */}
                    {exercise.notes && (
                      <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-medium">Observações:</span> {exercise.notes}
                        </p>
                      </div>
                    )}

                    {/* Status badge no canto inferior esquerdo */}
                    <div className="flex justify-start mt-3">
                      <Badge variant={getBadgeVariant()}>
                        {getStatusText()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-700 p-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
          Histórico de Treinos
        </h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2" />
              <p className="text-2xl font-bold">{processedData.totalWorkouts}</p>
              <p className="text-sm opacity-90">Treinos Realizados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 mx-auto mb-2" />
              <p className="text-2xl font-bold">{processedData.totalCalories.toLocaleString()}</p>
              <p className="text-sm opacity-90">Calorias Queimadas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2" />
              <p className="text-2xl font-bold">{processedData.currentStreak}</p>
              <p className="text-sm opacity-90">Dias Consecutivos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2" />
              <p className="text-2xl font-bold">{processedData.averageWorkoutDuration}</p>
              <p className="text-sm opacity-90">Minutos Médios</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">
                {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                const workouts = getWorkoutsForDate(day);
                const status = getWorkoutStatus(day);
                const isCurrentMonth = day.getMonth() === currentMonth;
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day);
                      const dayWorkouts = getWorkoutsForDate(day);
                      if (dayWorkouts && dayWorkouts.length > 0) {
                        setSelectedWorkout(dayWorkouts[0]);
                      } else {
                        setSelectedWorkout(null);
                      }
                    }}
                    className={`
                      p-2 rounded-lg text-center transition-all relative
                      ${!isCurrentMonth 
                        ? 'text-slate-300 dark:text-slate-600' 
                        : isToday
                          ? 'bg-blue-600 text-white font-bold'
                          : status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                            : status === 'partial'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                              : status === 'skipped'
                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                      ${workouts.length > 0 ? 'cursor-pointer' : 'cursor-default'}
                    `}
                    disabled={workouts.length === 0}
                  >
                    <div className="text-sm">
                      {format(day, 'd')}
                    </div>
                    {workouts.length > 0 && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-current rounded-full opacity-70"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {processedData.totalWorkouts === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Nenhum treino registrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Complete seu primeiro treino para ver o histórico aqui
              </p>
              <Button onClick={() => window.location.href = "/workout"}>
                Iniciar Treino
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}