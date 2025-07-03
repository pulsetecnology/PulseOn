import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward, CheckCircle2, Timer, Clock } from "lucide-react";

interface Exercise {
  id?: number;
  exercise: string;
  muscleGroup: string;
  type: string;
  instructions: string;
  series: number;
  repetitions?: number;
  timeExec?: number;
  time?: number;
  restBetweenSeries: number;
  restBetweenExercises: number;
  weight?: number;
  calories: number;
}

interface WorkoutData {
  workoutName: string;
  workoutPlan: Exercise[];
}

export default function ActiveWorkout() {
  const [, setLocation] = useLocation();
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSeries, setCurrentSeries] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isRestingBetweenSeries, setIsRestingBetweenSeries] = useState(false);
  const [exerciseIntensity, setExerciseIntensity] = useState(1); // 1-3: suave, moderado, intenso

  useEffect(() => {
    // Simular carregamento rápido e recuperar dados
    const loadWorkout = async () => {
      try {
        const savedWorkout = localStorage.getItem('activeWorkout');
        if (savedWorkout) {
          const data = JSON.parse(savedWorkout);
          setWorkoutData(data);
        } else {
          // Se não há treino ativo, redirecionar para home
          setLocation('/');
          return;
        }
      } catch (error) {
        console.error('Erro ao carregar treino:', error);
        setLocation('/');
        return;
      }

      // Pequeno delay para evitar flash de carregamento
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    };

    loadWorkout();
  }, [setLocation]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimerActive) {
      interval = setInterval(() => {
        if (isResting && restTime > 0) {
          setRestTime(prev => prev - 1);
        } else if (isResting && restTime === 0) {
          // Tempo de descanso acabou
          setIsResting(false);
          setIsTimerActive(false);
        } else {
          setElapsedTime(prev => prev + 1);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerActive, isResting, restTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatExerciseTime = (timeExec: number) => {
    if (timeExec >= 60) {
      const minutes = Math.floor(timeExec / 60);
      const seconds = timeExec % 60;
      return seconds > 0 ? `${minutes}min ${seconds}s` : `${minutes}min`;
    }
    return `${timeExec}s`;
  };

  const startRest = (duration: number, isBetweenSeries: boolean = false) => {
    setRestTime(duration);
    setIsResting(true);
    setIsRestingBetweenSeries(isBetweenSeries);
    setIsTimerActive(true);
  };

  const pauseResumeTimer = () => {
    setIsTimerActive(!isTimerActive);
  };

  const skipToNextSeries = () => {
    setIsResting(false);
    setIsRestingBetweenSeries(false);
    setIsTimerActive(false);
    setRestTime(0);
  };

  const completeSeries = () => {
    const currentExercise = workoutData?.workoutPlan[currentExerciseIndex];
    if (!currentExercise) return;

    if (currentSeries < currentExercise.series) {
      // Próxima série - descanso entre séries
      setCurrentSeries(prev => prev + 1);
      startRest(currentExercise.restBetweenSeries, true);
    } else {
      // Exercício completo
      if (currentExerciseIndex < workoutData.workoutPlan.length - 1) {
        // Próximo exercício - descanso entre exercícios
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSeries(1);
        startRest(currentExercise.restBetweenExercises, false);
      } else {
        // Treino completo
        finishWorkout();
      }
    }
  };

  const skipExercise = () => {
    if (workoutData && currentExerciseIndex < workoutData.workoutPlan.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSeries(1);
      setIsResting(false);
      setIsTimerActive(false);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = async () => {
    if (!workoutData) return;

    // Calcular duração total em minutos
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    // Calcular calorias totais
    const totalCalories = workoutData.workoutPlan.reduce((sum, exercise) => sum + (exercise.calories || 0), 0);

    // Criar exercícios completados com formato adequado
    const completedExercises = workoutData.workoutPlan.map(exercise => ({
      exercise: exercise.exercise,
      muscleGroup: exercise.muscleGroup,
      type: exercise.type,
      instructions: exercise.instructions,
      time: exercise.time || exercise.timeExec || 0,
      series: exercise.series,
      repetitions: exercise.repetitions || 0,
      restBetweenSeries: exercise.restBetweenSeries,
      restBetweenExercises: exercise.restBetweenExercises,
      weight: exercise.weight || 0,
      calories: exercise.calories,
      actualWeight: exercise.weight || 0,
      actualTime: exercise.timeExec || exercise.time || 0,
      actualCalories: exercise.calories,
      effortLevel: exerciseIntensity || 8, // Usar intensidade atual ou padrão
      completed: true, // Assumir que todos foram completados
      notes: null
    }));

    // Criar objeto de sessão de treino
    const workoutSession = {
      scheduledWorkoutId: null,
      workoutName: workoutData.workoutName,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: durationMinutes,
      totalCalories: totalCalories,
      exercisesCompleted: workoutData.workoutPlan.length,
      status: 'completed',
      notes: null,
      exercises: completedExercises
    };

    try {
      // Tentar salvar no backend
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(workoutSession),
      });

      if (response.ok) {
        console.log('Treino salvo no histórico com sucesso');
      } else {
        throw new Error('Erro ao salvar no backend');
      }
    } catch (error) {
      console.error('Erro ao salvar treino no backend:', error);

      // Fallback: salvar no localStorage
      const sessionWithId = {
        ...workoutSession,
        id: Date.now(),
        userId: 1,
        createdAt: endTime.toISOString(),
        updatedAt: endTime.toISOString()
      };

      const existingSessions = JSON.parse(localStorage.getItem('workoutSessions') || '[]');
      existingSessions.unshift(sessionWithId);
      localStorage.setItem('workoutSessions', JSON.stringify(existingSessions));
      console.log('Treino salvo no localStorage como fallback');
    }

    // Limpar treino ativo
    localStorage.removeItem('activeWorkout');

    // Redirecionar para home
    setLocation('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center">
        <div className="text-center text-white dark:text-slate-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white dark:border-slate-300 mx-auto mb-4"></div>
          <p className="text-lg">Preparando seu treino...</p>
        </div>
      </div>
    );
  }

  if (!workoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Erro ao carregar treino. Redirecionando...</p>
      </div>
    );
  }

  const currentExercise = workoutData.workoutPlan[currentExerciseIndex];
  const progress = ((currentExerciseIndex + (currentSeries / currentExercise.series)) / workoutData.workoutPlan.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700 text-white dark:text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{workoutData.workoutName}</CardTitle>
            <div className="flex justify-between text-sm text-white/80 dark:text-slate-300">
              <span>Exercício {currentExerciseIndex + 1} de {workoutData.workoutPlan.length}</span>
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <Progress value={progress} className="w-full bg-white/20 dark:bg-slate-700" />
          </CardHeader>
        </Card>

        {/* Current Exercise */}
        <Card className="bg-white/15 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700 text-white dark:text-white">
          <CardHeader>
            <CardTitle className="text-lg">{currentExercise.exercise}</CardTitle>
            <p className="text-sm text-white/80 dark:text-slate-300">{currentExercise.muscleGroup}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-white/90 dark:text-slate-200">{currentExercise.instructions}</p>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/20 dark:bg-slate-800/80 p-3 rounded-lg">
                <p className="text-2xl font-bold text-white dark:text-slate-100">{currentSeries}</p>
                <p className="text-xs text-white/80 dark:text-slate-300">Série</p>
              </div>
              <div className="bg-white/20 dark:bg-slate-800/80 p-3 rounded-lg">
                <p className="text-2xl font-bold text-white dark:text-slate-100">
                  {currentExercise.repetitions && currentExercise.repetitions > 0 
                    ? currentExercise.repetitions
                    : formatExerciseTime(currentExercise.timeExec || currentExercise.time || 30)}
                </p>
                <p className="text-xs text-white/80 dark:text-slate-300">
                  {currentExercise.repetitions && currentExercise.repetitions > 0 ? 'Repetições' : 'Tempo'}
                </p>
              </div>
              <div className="bg-white/20 dark:bg-slate-800/80 p-3 rounded-lg">
                <p className="text-2xl font-bold text-white dark:text-slate-100">
                  {currentExercise.weight && currentExercise.weight > 0 
                    ? `${currentExercise.weight}kg`
                    : 'Peso corporal'}
                </p>
                <p className="text-xs text-white/80 dark:text-slate-300">Peso</p>
              </div>
            </div>

            {/* Barra de Intensidade */}
            <div className="bg-white/20 dark:bg-slate-800/80 p-4 rounded-lg">
              <p className="text-sm text-white/80 dark:text-slate-300 mb-2">Intensidade do Exercício:</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/70 dark:text-slate-400">Suave</span>
                <span className="text-xs text-white/70 dark:text-slate-400">Moderado</span>
                <span className="text-xs text-white/70 dark:text-slate-400">Intenso</span>
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3].map((level) => (
                  <button
                    key={level}
                    onClick={() => setExerciseIntensity(level)}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      exerciseIntensity >= level
                        ? level === 1
                          ? 'bg-green-500'
                          : level === 2
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                        : 'bg-white/30 dark:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-center text-sm text-white/90 dark:text-slate-200 mt-2">
                {exerciseIntensity === 1 ? 'Suave' : exerciseIntensity === 2 ? 'Moderado' : 'Intenso'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rest Timer */}
        {isResting && (
          <Card className="bg-orange-500/20 backdrop-blur-md border-orange-300/30 text-white">
            <CardContent className="text-center py-6">
              <Timer className="h-8 w-8 mx-auto mb-2 text-orange-300" />
              <p className="text-lg font-bold">
                {isRestingBetweenSeries ? 'Descanso entre séries' : 'Descanso entre exercícios'}
              </p>
              <p className="text-4xl font-bold text-orange-300 mb-4">{formatTime(restTime)}</p>

              <div className="flex justify-center space-x-3 mb-4">
                <Button 
                  onClick={pauseResumeTimer}
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  {isTimerActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button 
                  onClick={skipToNextSeries}
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <Button 
                onClick={skipToNextSeries}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Pular Descanso
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isResting && (
            <Button 
              onClick={completeSeries} 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Concluir Série
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={skipExercise}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Pular
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                localStorage.removeItem('activeWorkout');
                setLocation('/');
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}