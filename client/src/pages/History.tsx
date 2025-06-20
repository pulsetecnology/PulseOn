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
  series?: number;
  repetitions?: number;
  weight?: number;
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

const mockHistory = [
  {
    id: 1,
    name: "Treino de Pernas",
    date: "Hoje",
    duration: 42,
    exercises: 5,
    status: "completed",
    completionRate: 100,
    exerciseDetails: [
      { name: "Agachamento", sets: 4, reps: 12, weight: "80kg", completed: true, completedSets: 4, totalSets: 4 },
      { name: "Leg Press", sets: 3, reps: 15, weight: "120kg", completed: true, completedSets: 3, totalSets: 3 },
      { name: "Extensão de Pernas", sets: 3, reps: 12, weight: "40kg", completed: true, completedSets: 3, totalSets: 3 },
      { name: "Flexão de Pernas", sets: 3, reps: 12, weight: "35kg", completed: true, completedSets: 3, totalSets: 3 },
      { name: "Panturrilha em Pé", sets: 4, reps: 20, weight: "60kg", completed: true, completedSets: 4, totalSets: 4 }
    ]
  },
  {
    id: 2,
    name: "Treino de Peito",
    date: "Ontem",
    duration: 38,
    exercises: 6,
    status: "partial",
    completionRate: 75,
    exerciseDetails: [
      { name: "Supino Reto", sets: 4, reps: 10, weight: "70kg", completed: true, completedSets: 4, totalSets: 4 },
      { name: "Supino Inclinado", sets: 3, reps: 12, weight: "60kg", completed: true, completedSets: 3, totalSets: 3 },
      { name: "Flexão de Braços", sets: 3, reps: 15, weight: "Peso Corporal", completed: "partial", completedSets: 2, totalSets: 3 },
      { name: "Voador", sets: 3, reps: 12, weight: "25kg", completed: true, completedSets: 3, totalSets: 3 },
      { name: "Crucifixo", sets: 3, reps: 12, weight: "20kg", completed: false, completedSets: 0, totalSets: 3 },
      { name: "Paralelas", sets: 3, reps: 10, weight: "Peso Corporal", completed: false, completedSets: 0, totalSets: 3 }
    ]
  },
  {
    id: 3,
    name: "Treino de Costas",
    date: "3 dias atrás",
    duration: 45,
    exercises: 7,
    status: "completed",
    completionRate: 100,
    exerciseDetails: [
      { name: "Barra Fixa", sets: 4, reps: 8, weight: "Peso Corporal", completed: true, completedSets: 4, totalSets: 4 },
      { name: "Remada Curvada", sets: 4, reps: 10, weight: "65kg", completed: true, completedSets: 4, totalSets: 4 },
      { name: "Puxada Frontal", sets: 3, reps: 12, weight: "55kg", completed: true, completedSets: 3, totalSets: 3 },
      { name: "Remada Sentado", sets: 3, reps: 12, weight: "50kg", completed: true, completedSets: 3, totalSets: 3 },
      { name: "Levantamento Terra", sets: 4, reps: 8, weight: "90kg", completed: true, completedSets: 4, totalSets: 4 },
      { name: "Pullover", sets: 3, reps: 12, weight: "25kg", completed: true, completedSets: 3, totalSets: 3 },
      { name: "Encolhimento", sets: 3, reps: 15, weight: "30kg", completed: true, completedSets: 3, totalSets: 3 }
    ]
  },
  {
    id: 4,
    name: "Treino de Ombros",
    date: "5 dias atrás",
    duration: 35,
    exercises: 5,
    status: "partial",
    completionRate: 60,
    exerciseDetails: [
      { name: "Desenvolvimento", sets: 4, reps: 10, weight: "45kg", completed: true, completedSets: 4, totalSets: 4 },
      { name: "Elevação Lateral", sets: 3, reps: 12, weight: "15kg", completed: "partial", completedSets: 2, totalSets: 3 },
      { name: "Elevação Frontal", sets: 3, reps: 12, weight: "12kg", completed: true, completedSets: 3, totalSets: 3 },
      { name: "Remada Alta", sets: 3, reps: 12, weight: "30kg", completed: false, completedSets: 0, totalSets: 3 },
      { name: "Crucifixo Inverso", sets: 3, reps: 15, weight: "10kg", completed: false, completedSets: 0, totalSets: 3 }
    ]
  }
];

// Calendar workout data - maps dates to workout IDs with consistent status
const workoutCalendarData = {
  // Janeiro 2025 - Semana atual (sincronizando com status do mockHistory)
  "2025-01-13": { workoutId: 1, status: "completed" }, // Hoje - Treino de Pernas (completed)
  "2025-01-12": { workoutId: 2, status: "partial" },   // Ontem - Treino de Peito (partial)
  "2025-01-11": { workoutId: 3, status: "completed" }, // Treino de Costas (completed)
  "2025-01-10": { workoutId: 4, status: "partial" },   // Treino de Ombros (partial)
  "2025-01-09": { workoutId: 1, status: "completed" },
  "2025-01-08": { workoutId: 2, status: "partial" },   
  "2025-01-07": { workoutId: 3, status: "completed" },

  // Semana passada
  "2025-01-06": { workoutId: 4, status: "partial" },
  "2025-01-05": { workoutId: 1, status: "completed" },
  "2025-01-04": { workoutId: 2, status: "partial" },
  "2025-01-03": { workoutId: 3, status: "completed" },
  "2025-01-02": { workoutId: 4, status: "partial" },
  "2025-01-01": { workoutId: 1, status: "completed" }, // Ano novo

  // Dezembro 2024 - Final do ano passado
  "2024-12-31": { workoutId: 2, status: "partial" },
  "2024-12-30": { workoutId: 3, status: "completed" },
  "2024-12-29": { workoutId: 4, status: "partial" },
  "2024-12-28": { workoutId: 1, status: "completed" },
  "2024-12-27": { workoutId: 2, status: "partial" },
  "2024-12-26": { workoutId: 3, status: "completed" }, // Boxing Day
  "2024-12-25": { workoutId: 4, status: "partial" }, // Natal
  "2024-12-24": { workoutId: 1, status: "completed" },   // Véspera de Natal
  "2024-12-23": { workoutId: 2, status: "partial" }, 
  "2024-12-22": { workoutId: 3, status: "completed" },
  "2024-12-21": { workoutId: 4, status: "partial" },
  "2024-12-20": { workoutId: 1, status: "completed" },

  // Algumas datas espalhadas para teste
  "2025-01-15": { workoutId: 3, status: "completed" }, // Futura
  "2025-01-17": { workoutId: 1, status: "completed" }, // Futura
  "2025-01-20": { workoutId: 2, status: "partial" },   // Futura
  "2025-01-22": { workoutId: 4, status: "partial" }, // Futura
  "2025-01-25": { workoutId: 3, status: "completed" }, // Futura
  "2025-01-27": { workoutId: 1, status: "completed" },   // Futura
  "2025-01-30": { workoutId: 2, status: "partial" }  // Final do mês
};

export default function History() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [expandedCalendarWorkout, setExpandedCalendarWorkout] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch real workout sessions
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
          completed: ex.completed,
          completedSets: ex.completed ? (ex.series || 1) : 0,
          totalSets: ex.series || 1
        }))
      };
    })
    .sort((a, b) => b.id - a.id); // Sort by most recent first

  // Create calendar data from real workout sessions
  const calendarData: { [key: string]: { workoutId: number; status: string } } = {};
  workoutSessions
    .filter(session => session.completedAt)
    .forEach(session => {
      const dateKey = formatDateKey(parseISO(session.completedAt!));
      const completedExercises = session.exercises.filter(ex => ex.completed);
      const totalExercises = session.exercises.length;
      const completionRate = totalExercises > 0 ? Math.round((completedExercises.length / totalExercises) * 100) : 0;
      
      calendarData[dateKey] = {
        workoutId: session.id,
        status: completionRate === 100 ? "completed" : completionRate > 0 ? "partial" : "skipped"
      };
    });

  const toggleCard = (cardId: number) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const hasWorkout = (date: Date) => {
    return workoutCalendarData[formatDateKey(date)];
  };

  const handleDateSelect = (date: Date) => {
    const dateKey = formatDateKey(date);
    const workoutData = workoutCalendarData[dateKey];

    if (workoutData) {
      const workout = mockHistory.find(w => w.id === workoutData.workoutId);
      // Create a workout object with the correct status from calendar data
      const workoutWithCorrectStatus = workout ? {
        ...workout,
        status: workoutData.status
      } : null;

      setSelectedWorkout(workoutWithCorrectStatus);
      setSelectedDate(date);
      setExpandedCalendarWorkout(false); // Reset expanded state when selecting new date
    } else {
      setSelectedDate(date);
      setSelectedWorkout(null);
      setExpandedCalendarWorkout(false);
    }
  };

  const toggleCalendarWorkoutDetails = () => {
    setExpandedCalendarWorkout(!expandedCalendarWorkout);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };
  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico de Treinos</h1>
        <p className="text-muted-foreground">Visualize todos os treinos realizados e seu desempenho</p>
      </div>

      {/* Workout History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Treinos Recentes</h2>
        {mockHistory.map((workout) => (
          <Card 
            key={workout.id} 
            className="cursor-pointer transition-all duration-200"
            onClick={() => toggleCard(workout.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm">{workout.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground flex items-center">
                    <CalendarIcon className="mr-1 h-2 w-2" />
                    {workout.date}
                  </span>
                  {expandedCard === workout.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Clock className="mr-1 h-2 w-2" />
                    {workout.duration} min
                  </span>
                  <span className="flex items-center">
                    <Dumbbell className="mr-1 h-2 w-2" />
                    {workout.exercises} exercícios
                  </span>
                </div>
                <Badge 
                  variant="default" 
                  className={`text-white text-xs px-2 py-0 ${
                    workout.status === "completed" 
                      ? "bg-success" 
                      : "bg-orange-500"
                  }`}
                >
                  {workout.status === "completed" ? "Concluído" : "Parcial"}
                </Badge>
              </div>

              {/* Expanded Exercise Details */}
              {expandedCard === workout.id && (
                <div className="mt-4 pt-3 border-t border-border">
                  <h4 className="font-semibold text-sm mb-3 text-foreground">Detalhes dos Exercícios</h4>
                  <div className="space-y-2">
                    {workout.exerciseDetails.map((exercise, index) => {
                      const isPartialSets = exercise.completed === "partial";
                      const isNotCompleted = exercise.completed === false;
                      const isCompleted = exercise.completed === true;

                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between py-2 px-3 rounded-md ${
                            isCompleted 
                              ? 'bg-muted/30' 
                              : isPartialSets
                              ? 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50'
                              : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50'
                          }`}
                        >
                          <div className="flex items-center flex-1">
                            {isNotCompleted && (
                              <X className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                            )}
                            {isPartialSets && (
                              <AlertCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="flex flex-col min-w-0">
                                <h5 className={`font-medium text-sm ${
                                  isCompleted 
                                    ? 'text-foreground' 
                                    : isPartialSets
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {exercise.name}
                                </h5>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {isNotCompleted && (
                                    <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                                      Não executado
                                    </span>
                                  )}
                                  {isPartialSets && (
                                    <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                                      Séries incompletas
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs mt-1 ${
                                  isCompleted 
                                    ? 'text-muted-foreground' 
                                    : isPartialSets
                                    ? 'text-orange-500 dark:text-orange-400'
                                    : 'text-red-500 dark:text-red-400'
                                }`}>
                                  {isPartialSets 
                                    ? `${exercise.completedSets}/${exercise.totalSets} séries × ${exercise.reps} reps`
                                    : `${exercise.sets} séries × ${exercise.reps} reps`
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-semibold ${
                              isCompleted 
                                ? 'text-primary' 
                                : isPartialSets
                                ? 'text-orange-500 dark:text-orange-400'
                                : 'text-red-500 dark:text-red-400'
                            }`}>
                              {exercise.weight}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workout Calendar */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendário de Treinos
          </h3>

          {/* Custom Calendar */}
          <div className="w-full">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-muted rounded"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h4 className="font-medium">
                {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h4>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-muted rounded"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Week days header */}
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {getDaysInMonth(currentMonth).map((date, index) => {
                if (!date) {
                  return <div key={index} className="p-2"></div>;
                }

                const workoutData = hasWorkout(date);
                const isSelected = selectedDate && formatDateKey(date) === formatDateKey(selectedDate);
                const isToday = formatDateKey(date) === formatDateKey(new Date());

                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    className={`
                      p-2 text-sm rounded-full transition-colors relative
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                      ${isToday && !isSelected ? 'bg-accent text-accent-foreground' : ''}
                      ${workoutData ? 'font-semibold' : ''}
                    `}
                  >
                    {date.getDate()}
                    {workoutData && (
                      <div 
                        className={`
                          absolute inset-0 rounded-full border-2 
                          ${workoutData.status === 'completed' ? 'border-green-500' : 'border-orange-500'}
                        `}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Workout Details */}
          {selectedWorkout && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="font-semibold text-sm mb-2">
                Treino de {selectedDate?.toLocaleDateString('pt-BR')}
              </h4>
              <div 
                className="bg-muted/50 p-3 rounded-md cursor-pointer transition-all duration-200"
                onClick={toggleCalendarWorkoutDetails}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">{selectedWorkout.name}</h5>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="default" 
                      className={`text-white text-xs px-2 py-0 ${
                        selectedWorkout.status === "completed" 
                          ? "bg-success" 
                          : "bg-orange-500"
                      }`}
                    >
                      {selectedWorkout.status === "completed" ? "Concluído" : "Parcial"}
                    </Badge>
                    {expandedCalendarWorkout ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Clock className="mr-1 h-2 w-2" />
                    {selectedWorkout.duration} min
                  </span>
                  <span className="flex items-center">
                    <Dumbbell className="mr-1 h-2 w-2" />
                    {selectedWorkout.exercises} exercícios
                  </span>
                </div>

                {/* Expanded Exercise Details for Calendar Selection */}
                {expandedCalendarWorkout && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <h6 className="font-semibold text-sm mb-3 text-foreground">Detalhes dos Exercícios</h6>
                    <div className="space-y-2">
                      {selectedWorkout.exerciseDetails.map((exercise, index) => {
                        const isPartialSets = exercise.completed === "partial";
                        const isNotCompleted = exercise.completed === false;
                        const isCompleted = exercise.completed === true;

                        return (
                          <div 
                            key={index} 
                            className={`flex items-center justify-between py-2 px-3 rounded-md ${
                              isCompleted 
                                ? 'bg-muted/30' 
                                : isPartialSets
                                ? 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50'
                                : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50'
                            }`}
                          >
                            <div className="flex items-center flex-1">
                              {isNotCompleted && (
                                <X className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                              )}
                              {isPartialSets && (
                                <AlertCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="flex flex-col min-w-0">
                                  <h5 className={`font-medium text-sm ${
                                    isCompleted 
                                      ? 'text-foreground' 
                                      : isPartialSets
                                      ? 'text-orange-600 dark:text-orange-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {exercise.name}
                                  </h5>
                                  <div className="flex flex-wrap items-center gap-1 mt-1">
                                    {isNotCompleted && (
                                      <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        Não executado
                                      </span>
                                    )}
                                    {isPartialSets && (
                                      <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        Séries incompletas
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-xs mt-1 ${
                                    isCompleted 
                                      ? 'text-muted-foreground' 
                                      : isPartialSets
                                      ? 'text-orange-500 dark:text-orange-400'
                                      : 'text-red-500 dark:text-red-400'
                                  }`}>
                                    {isPartialSets 
                                      ? `${exercise.completedSets}/${exercise.totalSets} séries × ${exercise.reps} reps`
                                      : `${exercise.sets} séries × ${exercise.reps} reps`
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-semibold ${
                                isCompleted 
                                  ? 'text-primary' 
                                  : isPartialSets
                                  ? 'text-orange-500 dark:text-orange-400'
                                  : 'text-red-500 dark:text-red-400'
                              }`}>
                                {exercise.weight}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedDate && !selectedWorkout && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Nenhum treino realizado em {selectedDate.toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="font-semibold text-sm mb-2">Legenda</h4>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full border-2 border-green-500"></div>
                <span>Concluído</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full border-2 border-orange-500"></div>
                <span>Parcial</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}