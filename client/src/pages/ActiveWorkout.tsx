
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipForward, CheckCircle2, Timer } from "lucide-react";

interface Exercise {
  id?: number;
  exercise: string;
  muscleGroup: string;
  type: string;
  instructions: string;
  series: number;
  repetitions?: number;
  timeExec?: number;
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
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(new Date());

  useEffect(() => {
    // Recuperar dados do treino do localStorage ou state
    const savedWorkout = localStorage.getItem('activeWorkout');
    if (savedWorkout) {
      setWorkoutData(JSON.parse(savedWorkout));
    } else {
      // Se não há treino ativo, redirecionar para home
      setLocation('/');
    }
  }, [setLocation]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive) {
      interval = setInterval(() => {
        if (isResting && restTime > 0) {
          setRestTime(prev => prev - 1);
        } else if (isResting && restTime === 0) {
          setIsResting(false);
          setIsActive(false);
        } else {
          setElapsedTime(prev => prev + 1);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isResting, restTime]);

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

  const startRest = (duration: number) => {
    setRestTime(duration);
    setIsResting(true);
    setIsActive(true);
  };

  const skipToNextSeries = () => {
    setIsResting(false);
    setIsActive(false);
    setRestTime(0);
  };

  const completeSeries = () => {
    const currentExercise = workoutData?.workoutPlan[currentExerciseIndex];
    if (!currentExercise) return;

    if (currentSeries < currentExercise.series) {
      // Próxima série
      setCurrentSeries(prev => prev + 1);
      startRest(currentExercise.restBetweenSeries);
    } else {
      // Exercício completo
      if (currentExerciseIndex < workoutData.workoutPlan.length - 1) {
        // Próximo exercício
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSeries(1);
        startRest(currentExercise.restBetweenExercises);
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
      setIsActive(false);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = () => {
    if (!workoutData) return;

    // Calcular duração total em minutos
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    // Calcular calorias totais
    const totalCalories = workoutData.workoutPlan.reduce((sum, exercise) => sum + (exercise.calories || 0), 0);

    // Criar objeto de sessão de treino compatível com o formato do histórico
    const workoutSession = {
      id: Date.now(), // ID temporário baseado em timestamp
      userId: 1, // Assumindo usuário logado
      scheduledWorkoutId: null,
      workoutName: workoutData.workoutName,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: durationMinutes,
      totalCalories: totalCalories,
      exercisesCompleted: workoutData.workoutPlan.length,
      status: 'completed',
      notes: null,
      createdAt: endTime.toISOString(),
      updatedAt: endTime.toISOString()
    };

    // Salvar no localStorage como histórico de sessões
    const existingSessions = JSON.parse(localStorage.getItem('workoutSessions') || '[]');
    existingSessions.unshift(workoutSession); // Adicionar no início da lista
    localStorage.setItem('workoutSessions', JSON.stringify(existingSessions));

    // Limpar treino ativo
    localStorage.removeItem('activeWorkout');
    
    // Redirecionar para home
    setLocation('/');
  };

  if (!workoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando treino...</p>
      </div>
    );
  }

  const currentExercise = workoutData.workoutPlan[currentExerciseIndex];
  const progress = ((currentExerciseIndex + (currentSeries / currentExercise.series)) / workoutData.workoutPlan.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{workoutData.workoutName}</CardTitle>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Exercício {currentExerciseIndex + 1} de {workoutData.workoutPlan.length}</span>
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>
        </Card>

        {/* Current Exercise */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentExercise.exercise}</CardTitle>
            <p className="text-sm text-muted-foreground">{currentExercise.muscleGroup}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{currentExercise.instructions}</p>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-2xl font-bold">{currentSeries}</p>
                <p className="text-xs text-muted-foreground">Série</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-2xl font-bold">
                  {currentExercise.repetitions ? `${currentExercise.repetitions}` : formatExerciseTime(currentExercise.timeExec || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentExercise.repetitions ? 'Repetições' : 'Tempo'}
                </p>
              </div>
            </div>

            {currentExercise.weight && (
              <div className="text-center bg-muted p-3 rounded-lg">
                <p className="text-lg font-bold">{currentExercise.weight}kg</p>
                <p className="text-xs text-muted-foreground">Peso</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rest Timer */}
        {isResting && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="text-center py-6">
              <Timer className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-lg font-bold text-orange-800">Descansando</p>
              <p className="text-3xl font-bold text-orange-600 mb-4">{formatTime(restTime)}</p>
              <Button 
                onClick={skipToNextSeries}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
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
              className="w-full"
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
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Pular
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setLocation('/')}
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
