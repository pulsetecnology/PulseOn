import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Target, Flame, Trophy, TrendingUp, ChevronLeft, Filter } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
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
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  
  const { data: workoutSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['workout-sessions'],
    queryFn: fetchWorkoutSessions,
  });

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: fetchUserStats,
  });

  // Get recent workouts (last 10)
  const recentWorkouts = workoutSessions
    .filter(session => session.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 10);

  // Get current week's workouts for calendar
  const weekStart = startOfWeek(selectedWeek, { locale: ptBR });
  const weekEnd = endOfWeek(selectedWeek, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const weekWorkouts = workoutSessions.filter(session => {
    if (!session.completedAt) return false;
    const sessionDate = parseISO(session.completedAt);
    return sessionDate >= weekStart && sessionDate <= weekEnd;
  });

  const getWorkoutForDay = (day: Date) => {
    return weekWorkouts.find(session => 
      session.completedAt && isSameDay(parseISO(session.completedAt), day)
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getWorkoutTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cardio': return 'bg-red-100 text-red-800';
      case 'força': return 'bg-blue-100 text-blue-800';
      case 'resistência': return 'bg-green-100 text-green-800';
      case 'mobilidade': return 'bg-purple-100 text-purple-800';
      case 'funcional': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (sessionsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/home">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Histórico</h1>
            </div>
            <Button variant="ghost" size="sm">
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Stats Overview */}
        {userStats && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{userStats.totalWorkouts}</p>
                <p className="text-sm text-gray-600">Treinos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Flame className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{userStats.totalCalories}</p>
                <p className="text-sm text-gray-600">Calorias</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{Math.round(userStats.totalMinutes / 60)}h</p>
                <p className="text-sm text-gray-600">Tempo Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{userStats.currentStreak}</p>
                <p className="text-sm text-gray-600">Sequência</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent">Treinos Recentes</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
          </TabsList>

          {/* Recent Workouts */}
          <TabsContent value="recent" className="space-y-4">
            {recentWorkouts.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum treino realizado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Complete seu primeiro treino para ver o histórico aqui.
                  </p>
                  <Link href="/workout">
                    <Button>Começar Treino</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              recentWorkouts.map((workout) => (
                <Card key={workout.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{workout.name}</h3>
                        <p className="text-sm text-gray-600">
                          {format(parseISO(workout.completedAt!), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Concluído
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{formatDuration(workout.totalDuration)}</p>
                        <p className="text-xs text-gray-600">Duração</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{workout.totalCalories}</p>
                        <p className="text-xs text-gray-600">Calorias</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{workout.exercises.filter(ex => ex.completed).length}</p>
                        <p className="text-xs text-gray-600">Exercícios</p>
                      </div>
                    </div>

                    {/* Exercise types */}
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(workout.exercises.map(ex => ex.type))).map((type) => (
                        <Badge key={type} variant="secondary" className={`text-xs ${getWorkoutTypeColor(type)}`}>
                          {type}
                        </Badge>
                      ))}
                    </div>

                    {workout.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{workout.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {format(selectedWeek, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-600 p-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day) => {
                    const workout = getWorkoutForDay(day);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={`
                          aspect-square p-1 rounded-lg border-2 transition-colors
                          ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                          ${workout ? 'bg-green-100' : 'bg-white'}
                        `}
                      >
                        <div className="h-full flex flex-col items-center justify-center">
                          <span className={`text-sm font-medium ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                            {format(day, 'd')}
                          </span>
                          {workout && (
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Week navigation */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setSelectedWeek(new Date(selectedWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
              >
                Semana Anterior
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedWeek(new Date(selectedWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
              >
                Próxima Semana
              </Button>
            </div>

            {/* Workouts for selected week */}
            {weekWorkouts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Treinos desta semana</h3>
                {weekWorkouts.map((workout) => (
                  <Card key={workout.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{workout.name}</h4>
                          <p className="text-sm text-gray-600">
                            {format(parseISO(workout.completedAt!), "EEEE, dd/MM", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatDuration(workout.totalDuration)}</p>
                          <p className="text-xs text-gray-600">{workout.totalCalories} cal</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}