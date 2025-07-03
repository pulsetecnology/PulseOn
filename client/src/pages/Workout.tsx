import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Play, Clock, Target, List, CheckCircle2, Timer, Plus, Minus, Pause, RotateCcw, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useGlobalNotification } from "@/components/NotificationProvider";
import { useQuery } from "@tanstack/react-query";

interface Exercise {
  id?: string;
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
}

interface ScheduledWorkout {
  id: number;
  userId: number;
  name: string;
  exercises: Exercise[];
  totalCalories: number;
  totalDuration: number;
  status: string;
  createdAt: string;
  scheduledFor?: string;
}

// Fetch scheduled workouts
const fetchScheduledWorkouts = async (): Promise<ScheduledWorkout[]> => {
  const token = localStorage.getItem('authToken');
  const response = await fetch('/api/scheduled-workouts', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar treinos programados');
  }

  return response.json();
};

export default function Workout() {
  const { data: scheduledWorkouts, isLoading, error } = useQuery({
    queryKey: ['scheduled-workouts'],
    queryFn: fetchScheduledWorkouts,
  });

  const todaysWorkout = scheduledWorkouts?.[0]; // Get the most recent workout
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [weight, setWeight] = useState(40);
  const [effortLevel, setEffortLevel] = useState([7]);
  const [restTime, setRestTime] = useState(90);
  const [isResting, setIsResting] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showSetFeedback, setShowSetFeedback] = useState(false);
  const { showWorkoutSuccess } = useGlobalNotification();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  const startIndividualExercise = (exerciseId: string) => {
    const exercise = todaysWorkout?.exercises?.find(ex => (ex.id || ex.exercise) === exerciseId);
    if (exercise) {
      setActiveExercise(exerciseId);
      setCurrentSet(1);
      setWeight(exercise.weight || 40);
      setEffortLevel([7]);
      setRestTime(exercise.restBetweenSeries || 90);
      setIsResting(false);
      setIsTimerRunning(false);
      setShowSetFeedback(false);
    }
  };

  const completeSet = () => {
    const exercise = todaysWorkout?.exercises?.find(ex => (ex.id || ex.exercise) === activeExercise);
    if (!exercise) return;

    showWorkoutSuccess();
    setShowSetFeedback(true);

    setTimeout(() => {
      setShowSetFeedback(false);

      if (currentSet < exercise.series) {
        setCurrentSet(currentSet + 1);
        setIsResting(true);
        setRestTime(exercise.restBetweenSeries || 90);
        setIsTimerRunning(true);
      } else {
        // Exercise completed
        setCompletedExercises(prev => new Set([...prev, activeExercise!]));
        setActiveExercise(null);
        setCurrentSet(1);
        showWorkoutSuccess();
      }
    }, 1500);
  };

  const startNextSet = () => {
    setIsResting(false);
    setIsTimerRunning(false);
    setShowSetFeedback(true);
  };

  // Timer effect
  React.useEffect(() => {
    if (isTimerRunning && restTime > 0) {
      const timer = setTimeout(() => setRestTime(restTime - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (restTime === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setIsResting(false);
      showWorkoutSuccess();
    }
  }, [isTimerRunning, restTime, showWorkoutSuccess]);

  const progressPercentage = todaysWorkout?.exercises ? (completedExercises.size / todaysWorkout.exercises.length) * 100 : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Treinos Programados</h1>
          <p className="text-muted-foreground">
            Carregando seus treinos personalizados...
          </p>
        </div>
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Carregando treinos...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Treinos Programados</h1>
          <p className="text-muted-foreground text-red-500">
            Erro ao carregar treinos: {error.message}
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">Não foi possível carregar seus treinos.</p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No workouts state
  if (!todaysWorkout) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Treinos Programados</h1>
          <p className="text-muted-foreground">
            Nenhum treino encontrado. Sincronize com a IA para gerar treinos personalizados.
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">Você ainda não possui treinos programados.</p>
            <Link href="/profile">
              <Button>
                Ir para Perfil e Sincronizar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Treinos Programados</h1>
        <p className="text-muted-foreground">
          Seus treinos personalizados estão prontos para serem executados
        </p>
      </div>

      {/* Workout Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">{todaysWorkout.name}</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            Treino personalizado gerado pela IA com {todaysWorkout.exercises?.length} exercícios
          </p>

          {/* Progress Counter */}
          {completedExercises.size > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Exercícios concluídos: {completedExercises.size}/{todaysWorkout.exercises?.length}</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center">
              <List className="mr-1 h-4 w-4" />
              {todaysWorkout.exercises?.length} exercícios
            </span>
            <span className="flex items-center">
              <Target className="mr-1 h-4 w-4" />
              {todaysWorkout.totalCalories} kcal
            </span>
          </div>
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
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
            <Play className="mr-2 h-5 w-5" />
            Iniciar treino completo
          </Button>
        </CardContent>
      </Card>

      {/* Active Exercise Timer */}
      {activeExercise && (
        <Card className="bg-primary border-0">
          <CardContent className="p-6 text-primary-foreground">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">
                {todaysWorkout.exercises?.find(ex => (ex.id || ex.exercise) === activeExercise)?.exercise}
              </h2>
              <div className="text-2xl font-bold mb-2">
                Série {currentSet} de {todaysWorkout.exercises?.find(ex => (ex.id || ex.exercise) === activeExercise)?.series}
              </div>

              {isResting && (
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-orange-300">
                    {formatTime(restTime)}
                  </div>
                  <p className="opacity-90">Tempo de descanso</p>
                  <div className="flex justify-center space-x-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsTimerRunning(!isTimerRunning)} 
                      size="sm"
                      className="bg-white/20 border-white/30"
                    >
                      {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setRestTime(todaysWorkout.exercises?.find(ex => (ex.id || ex.exercise) === activeExercise)?.restBetweenSeries || 90)} 
                      size="sm"
                      className="bg-white/20 border-white/30"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={startNextSet}
                    className="bg-white text-primary hover:bg-gray-100"
                  >
                    Começar Próxima Série
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {!isResting && !showSetFeedback && (
                <div className="space-y-4">
                  <Timer className="h-8 w-8 mx-auto" />
                  <p className="opacity-90">Execute o exercício</p>
                  <Button 
                    onClick={() => setShowSetFeedback(true)}
                    className="bg-white text-primary hover:bg-gray-100"
                  >
                    Concluir Série
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {showSetFeedback && (
                <div className="space-y-4">
                  {/* Weight Input */}
                  <div className="bg-white/20 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-sm">Peso utilizado</h3>
                    <div className="flex items-center justify-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWeight(Math.max(0, weight - 2.5))}
                        disabled={weight <= 2.5}
                        className="bg-white/20 border-white/30 h-8 w-8"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="text-center">
                        <div className="text-xl font-bold">{weight}</div>
                        <div className="text-xs opacity-75">kg</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWeight(weight + 2.5)}
                        className="bg-white/20 border-white/30 h-8 w-8"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Effort Level */}
                  <div className="bg-white/20 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-sm">Nível de esforço</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs opacity-75">
                        <span>Suave</span>
                        <span>Intenso</span>
                      </div>
                      <Slider
                        value={effortLevel}
                        onValueChange={setEffortLevel}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-center">
                        <span className="text-sm font-semibold">
                          Esforço: {effortLevel[0]}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={completeSet}
                    className="w-full bg-white text-primary hover:bg-gray-100"
                  >
                    {currentSet < (todaysWorkout.exercises?.find(ex => (ex.id || ex.exercise) === activeExercise)?.series || 1) 
                      ? "Próxima série" : "Finalizar exercício"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Exercícios</h2>
        {todaysWorkout.exercises?.map((exercise, index) => {
          const exerciseId = exercise.id || exercise.exercise;
          return (
            <Card key={exerciseId} className={`${completedExercises.has(exerciseId) ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : ''} ${activeExercise === exerciseId ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-sm">{exercise.exercise}</h3>
                    {completedExercises.has(exerciseId) && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {exercise.series}x{exercise.repetitions > 0 ? exercise.repetitions : formatExerciseTime(exercise.timeExec || exercise.time || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Peso: {exercise.weight > 0 ? `${exercise.weight}kg` : 'Peso corporal'}</span>
                  <span className="flex items-center">
                    <Clock className="mr-1 h-2 w-2" />
                    {exercise.restBetweenSeries}s
                  </span>
                </div>
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground">{exercise.instructions}</p>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {exercise.muscleGroup}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {exercise.type}
                  </Badge>
                </div>
                {!completedExercises.has(exerciseId) ? (
                  <Button 
                    className="w-full" 
                    variant={activeExercise === exerciseId ? "secondary" : "default"}
                    onClick={() => startIndividualExercise(exerciseId)}
                    disabled={activeExercise !== null && activeExercise !== exerciseId}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {activeExercise === exerciseId ? "Exercício ativo" : "Iniciar este exercício"}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Exercício concluído
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}