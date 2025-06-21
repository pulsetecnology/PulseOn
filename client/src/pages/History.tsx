import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Flame, TrendingUp, ChevronLeft, ChevronRight, Eye, Dumbbell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isToday, isYesterday, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
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
};

export default function History() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSession | null>(null);

  const { data: workoutSessions = [], isLoading, error } = useQuery({
    queryKey: ["/api/workout-sessions"],
    queryFn: fetchWorkoutSessions,
  });

  // Process workout data for calendar and stats
  const processedData = useMemo(() => {
    const workoutsByDate: Record<string, WorkoutSession[]> = {};
    let totalWorkouts = 0;
    let totalCalories = 0;
    let totalMinutes = 0;

    workoutSessions.forEach(session => {
      const dateKey = format(parseISO(session.completedAt), 'yyyy-MM-dd');
      if (!workoutsByDate[dateKey]) {
        workoutsByDate[dateKey] = [];
      }
      workoutsByDate[dateKey].push(session);
      
      totalWorkouts++;
      totalCalories += session.totalCalories;
      totalMinutes += session.totalDuration;
    });

    return {
      workoutsByDate,
      totalWorkouts,
      totalCalories,
      totalMinutes,
      averageWorkoutDuration: totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0
    };
  }, [workoutSessions]);

  // Get current week data
  const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  const formatDate = (date: Date) => {
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    return format(date, "d 'de' MMMM", { locale: ptBR });
  };

  const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

  const getWorkoutsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return processedData.workoutsByDate[dateKey] || [];
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
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedWorkout(null)}
                className="text-slate-600 dark:text-slate-400"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedWorkout.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {formatDate(parseISO(selectedWorkout.completedAt))}
                </p>
              </div>
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

          {/* Exercises */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Exercícios Realizados</h3>
            {selectedWorkout.exercises.map((exercise, index) => (
              <Card key={index} className={`${exercise.completed ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {exercise.exercise}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {exercise.muscleGroup} • {exercise.type}
                      </p>
                    </div>
                    <Badge variant={exercise.completed ? "default" : "destructive"}>
                      {exercise.completed ? "Concluído" : "Pulado"}
                    </Badge>
                  </div>
                  
                  {exercise.completed && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Séries:</span>
                        <span className="ml-1 font-medium">{exercise.series}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Repetições:</span>
                        <span className="ml-1 font-medium">{exercise.repetitions}</span>
                      </div>
                      {exercise.actualWeight && exercise.actualWeight > 0 && (
                        <div>
                          <span className="text-muted-foreground">Peso:</span>
                          <span className="ml-1 font-medium">{exercise.actualWeight}kg</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Esforço:</span>
                        <span className="ml-1 font-medium">{exercise.effortLevel}/10</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
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
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {processedData.totalWorkouts}
              </p>
              <p className="text-sm text-muted-foreground">Treinos Realizados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {processedData.totalCalories.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Calorias Queimadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Week Navigation */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">
                {format(currentWeekStart, "d MMM", { locale: ptBR })} - {format(currentWeekEnd, "d MMM", { locale: ptBR })}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayWorkouts = getWorkoutsForDate(day);
                const hasWorkout = dayWorkouts.length > 0;
                const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      p-3 rounded-lg text-center transition-colors relative
                      ${isSelected 
                        ? 'bg-blue-600 text-white' 
                        : hasWorkout 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    <div className="text-xs font-medium">
                      {format(day, 'EEE', { locale: ptBR })}
                    </div>
                    <div className="text-lg font-bold">
                      {format(day, 'd')}
                    </div>
                    {hasWorkout && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Daily Workouts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {formatDate(selectedDate)}
          </h3>
          
          {getWorkoutsForDate(selectedDate).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum treino realizado neste dia</p>
              </CardContent>
            </Card>
          ) : (
            getWorkoutsForDate(selectedDate).map((workout) => (
              <Card key={workout.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {workout.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(workout.startedAt), 'HH:mm')} - {format(parseISO(workout.completedAt), 'HH:mm')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedWorkout(workout)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                      <p className="font-medium">{workout.totalDuration}min</p>
                    </div>
                    <div className="text-center">
                      <Flame className="h-4 w-4 text-red-600 dark:text-red-400 mx-auto mb-1" />
                      <p className="font-medium">{workout.totalCalories} kcal</p>
                    </div>
                    <div className="text-center">
                      <Dumbbell className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
                      <p className="font-medium">{workout.exercises.filter(ex => ex.completed).length} exercícios</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Exercícios concluídos</span>
                      <span>{workout.exercises.filter(ex => ex.completed).length}/{workout.exercises.length}</span>
                    </div>
                    <Progress 
                      value={(workout.exercises.filter(ex => ex.completed).length / workout.exercises.length) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}