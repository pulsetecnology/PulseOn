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

      // Carregar imediatamente
      setIsLoading(false);
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-slate-100 mx-auto mb-4"></div>
          <p className="text-lg text-slate-900 dark:text-slate-100">Preparando seu treino...</p>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader className="text-center py-4">
            <CardTitle className="text-xl text-slate-900 dark:text-white">{workoutData.workoutName}</CardTitle>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
              <span>Exercício {currentExerciseIndex + 1} de {workoutData.workoutPlan.length}</span>
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
              <span>Progresso do treino</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full h-2" />
          </CardHeader>
        </Card>

        {/* Current Exercise */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader className="py-3">
            <CardTitle className="text-lg text-slate-900 dark:text-white">{currentExercise.exercise}</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">{currentExercise.muscleGroup}</p>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">{currentExercise.instructions}</p>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentSeries}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Série</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {currentExercise.repetitions && currentExercise.repetitions > 0 
                    ? currentExercise.repetitions
                    : formatExerciseTime(currentExercise.timeExec || currentExercise.time || 30)}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {currentExercise.repetitions && currentExercise.repetitions > 0 ? 'Repetições' : 'Tempo'}
                </p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                <p className={`font-bold text-slate-900 dark:text-slate-100 ${
                  currentExercise.weight && currentExercise.weight > 0 ? 'text-xl' : 'text-sm'
                }`}>
                  {currentExercise.weight && currentExercise.weight > 0 
                    ? `${currentExercise.weight}kg`
                    : 'Corporal'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Peso</p>
              </div>
            </div>

            {/* Barra de Intensidade */}
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">Intensidade do Exercício:</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">Suave</span>
                <span className="text-xs text-slate-600 dark:text-slate-400">Moderado</span>
                <span className="text-xs text-slate-600 dark:text-slate-400">Intenso</span>
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
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-center text-sm text-slate-700 dark:text-slate-200 mt-2">
                {exerciseIntensity === 1 ? 'Suave' : exerciseIntensity === 2 ? 'Moderado' : 'Intenso'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rest Timer */}
        {isResting && (
          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="text-center py-4">
              <Timer className="h-8 w-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {isRestingBetweenSeries ? 'Descanso entre séries' : 'Descanso entre exercícios'}
              </p>
              <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-4">{formatTime(restTime)}</p>

              <div className="flex justify-center space-x-3 mb-4">
                <Button 
                  onClick={pauseResumeTimer}
                  variant="outline"
                  size="sm"
                  className="border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-800"
                >
                  {isTimerActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button 
                  onClick={skipToNextSeries}
                  variant="outline"
                  size="sm"
                  className="border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-800"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <Button 
                onClick={skipToNextSeries}
                className="bg-orange-600 hover:bg-orange-700 text-white"
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
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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