import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Dumbbell, ChevronDown, ChevronUp, X, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CompletedExercise {
  exercise: string;
  muscleGroup: string;
  type: string;
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
  name: string;
  startedAt: string;
  completedAt: string | null;
  exercises: CompletedExercise[];
  totalDuration: number;
  totalCalories: number;
  notes?: string;
  createdAt: string;
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

// Fetch user stats
const fetchUserStats = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch('/api/user/stats', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar estatísticas');
  }

  return response.json();
};

export default function WorkoutHistory() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<number>>(new Set());

  const { data: workoutSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['workout-sessions'],
    queryFn: fetchWorkoutSessions,
  });

  // Convert workout sessions to history format matching the original design
  const workoutHistory = workoutSessions
    .filter(session => session.completedAt)
    .map(session => {
      const completedAt = parseISO(session.completedAt!);
      const completedExercises = session.exercises.filter(ex => ex.completed);
      const totalExercises = session.exercises.length;

      // Calculate relative date
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24));
      let dateText = "";
      if (diffDays === 0) dateText = "Hoje";
      else if (diffDays === 1) dateText = "Ontem";
      else if (diffDays <= 7) dateText = `${diffDays} dias atrás`;
      else dateText = format(completedAt, "dd/MM/yyyy", { locale: ptBR });

      const completionRate = totalExercises > 0 ? Math.round((completedExercises.length / totalExercises) * 100) : 0;

      return {
        id: session.id,
        name: session.name,
        date: dateText,
        duration: session.totalDuration,
        exercises: totalExercises,
        status: completionRate === 100 ? "completed" : completionRate > 0 ? "partial" : "skipped",
        completionRate,
        exerciseDetails: session.exercises.map(ex => ({
          name: ex.exercise,
          sets: ex.series || 1,
          reps: ex.repetitions || 0,
          weight: ex.actualWeight ? `${ex.actualWeight}kg` : (ex.weight ? `${ex.weight}kg` : "Peso Corporal"),
          completed: ex.completed === true ? true : (ex.status === 'partial' ? 'partial' : false),
          completedSets: ex.completed === true ? (ex.series || 1) : (ex.status === 'partial' ? Math.floor((ex.series || 1) / 2) : 0),
          totalSets: ex.series || 1,
          status: ex.status || (ex.completed === true ? 'completed' : 'not_executed'),
          notes: ex.notes
        }))
      };
    })
    .sort((a, b) => b.id - a.id); // Sort by most recent first

  const toggleExpansion = (workoutId: number) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId);
    } else {
      newExpanded.add(workoutId);
    }
    setExpandedWorkouts(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "partial": return "bg-yellow-100 text-yellow-800";
      case "skipped": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completo";
      case "partial": return "Parcial";
      case "skipped": return "Não executado";
      default: return "Desconhecido";
    }
  };

  const getCompletionIcon = (completed: boolean | string) => {
    if (completed === true) return <span className="text-green-500">✓</span>;
    if (completed === "partial") return <span className="text-yellow-500">~</span>;
    return <span className="text-red-500">✗</span>;
  };

  if (sessionsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-24 bg-slate-700 rounded"></div>
              <div className="h-24 bg-slate-700 rounded"></div>
              <div className="h-24 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Histórico de Treinos</h1>
          <div className="flex gap-2">
            <CalendarIcon className="h-6 w-6 text-gray-400" />
          </div>
        </div>

        {/* Calendar Section */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border-0"
              classNames={{
                months: "text-white",
                month: "space-y-4",
                caption: "text-white font-medium",
                caption_label: "text-sm font-medium text-white",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 text-slate-400 hover:text-white",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-slate-400 rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-100/50 [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal text-white hover:bg-slate-700 rounded-md",
                day_range_end: "day-range-end",
                day_selected: "bg-cyan-500 text-white hover:bg-cyan-600 focus:bg-cyan-500 focus:text-white",
                day_today: "bg-slate-700 text-white",
                day_outside: "text-slate-600 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-600 aria-selected:opacity-30",
                day_disabled: "text-slate-600 opacity-50",
                day_range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900",
                day_hidden: "invisible",
              }}
            />
          </CardContent>
        </Card>

        {/* Workout History */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Treinos Recentes</h2>

          {workoutHistory.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhum treino realizado
                </h3>
                <p className="text-slate-400 mb-4">
                  Complete seu primeiro treino para ver o histórico aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            workoutHistory.map((workout) => (
              <Card key={workout.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{workout.name}</h3>
                      <p className="text-sm text-slate-400">{workout.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(workout.status)}>
                        {getStatusText(workout.status)}
                      </Badge>
                      <button
                        onClick={() => toggleExpansion(workout.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {expandedWorkouts.has(workout.id) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{workout.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dumbbell className="h-4 w-4" />
                      <span>{workout.exercises} exercícios</span>
                    </div>
                    <div className="text-cyan-400">
                      {workout.completionRate}% completo
                    </div>
                  </div>

                  {expandedWorkouts.has(workout.id) && (
                    <div className="space-y-2 pt-3 border-t border-slate-700">
                      {workout.exerciseDetails.map((exercise, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3">
                            {getCompletionIcon(exercise.completed)}
                            <div className="flex-1">
                              <p className="text-white font-medium">{exercise.name}</p>
                              <p className="text-xs text-slate-400">
                                {exercise.completedSets}/{exercise.totalSets} séries • {exercise.reps} reps • {exercise.weight}
                              </p>
                              {exercise.notes && (
                                <p className="text-xs text-slate-500 italic mt-1">{exercise.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge className={
                                exercise.status === 'completed' ? 'bg-green-100 text-green-800 text-xs' :
                                exercise.status === 'partial' ? 'bg-yellow-100 text-yellow-800 text-xs' :
                                'bg-red-100 text-red-800 text-xs'
                              }>
                                {exercise.status === 'completed' ? 'Completo' :
                                 exercise.status === 'partial' ? 'Parcial' : 'Não executado'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}