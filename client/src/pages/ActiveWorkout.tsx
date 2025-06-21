import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Pause, Play, RotateCcw, ChevronRight, CheckCircle2, SkipForward, AlertCircle, Timer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useGlobalNotification } from "@/components/NotificationProvider";
import { useLocation } from "wouter";

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

export default function ActiveWorkout() {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [weight, setWeight] = useState(40);
  const [effortLevel, setEffortLevel] = useState([7]);
  const [restTime, setRestTime] = useState(90);
  const [isResting, setIsResting] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showSetFeedback, setShowSetFeedback] = useState(false);
  const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);
  const [completedSets, setCompletedSets] = useState<Array<{exerciseIndex: number, set: number, weight: number, effort: number}>>([]);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [restTimeRemaining, setRestTimeRemaining] = useState(90);
  const { showSuccess, showWarning, showWorkoutSuccess, showWorkoutError, showWorkoutWarning } = useGlobalNotification();
  const [, setLocation] = useLocation();
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: scheduledWorkouts, isLoading, error } = useQuery({
    queryKey: ["scheduled-workouts"],
    queryFn: fetchScheduledWorkouts,
  });

  const todaysWorkout = scheduledWorkouts?.[0];
  const exercises = todaysWorkout?.exercises || [];
  const totalExercises = exercises.length;
  const progressPercentage = totalExercises > 0 ? ((currentExerciseIndex + 1) / totalExercises) * 100 : 0;
  
  // Safely get current exercise
  const currentExercise = exercises.length > 0 ? exercises[currentExerciseIndex] : null;

  // Initialize weight when workout loads
  useEffect(() => {
    if (currentExercise && exercises.length > 0) {
      setWeight(currentExercise.weight || 40);
      setRestTime(currentExercise.restBetweenSeries || 90);
      setRestTimeRemaining(currentExercise.restBetweenSeries || 90);
    }
  }, [currentExercise, currentExerciseIndex, exercises.length]);

  // Workout timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkoutTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Rest timer effect
  useEffect(() => {
    if (isResting && isTimerRunning) {
      restIntervalRef.current = setInterval(() => {
        setRestTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            setIsTimerRunning(false);
            showSuccess("Tempo de descanso finalizado!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    }

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, [isResting, isTimerRunning, showSuccess]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishWorkout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.error('No auth token found');
        showWorkoutError();
        setLocation("/login");
        return;
      }
      
      // Calculate total duration (in minutes)
      const totalDuration = Math.floor(workoutTimer / 60);
      
      // Calculate total calories
      const totalCalories = exercises.reduce((sum, exercise) => sum + (exercise.calories || 0), 0);
      
      // Prepare completed exercises data
      const completedExercises = exercises.map(exercise => {
        const exerciseCompletedSets = completedSets.filter(set => 
          exercises[set.exerciseIndex]?.exercise === exercise.exercise
        );
        
        return {
          exercise: exercise.exercise,
          muscleGroup: exercise.muscleGroup,
          type: exercise.type,
          instructions: exercise.instructions,
          time: exercise.time,
          series: exercise.series,
          repetitions: exercise.repetitions,
          restBetweenSeries: exercise.restBetweenSeries,
          restBetweenExercises: exercise.restBetweenExercises,
          weight: exercise.weight,
          calories: exercise.calories,
          actualWeight: exerciseCompletedSets.length > 0 ? exerciseCompletedSets[exerciseCompletedSets.length - 1].weight : exercise.weight,
          actualTime: exercise.time,
          actualCalories: exercise.calories,
          effortLevel: exerciseCompletedSets.length > 0 ? exerciseCompletedSets[exerciseCompletedSets.length - 1].effort : 5,
          completed: exerciseCompletedSets.length > 0,
          notes: ""
        };
      });

      // Create workout session
      const workoutSessionData = {
        scheduledWorkoutId: todaysWorkout?.id || null,
        name: todaysWorkout?.name || "Treino Personalizado",
        startedAt: new Date(Date.now() - workoutTimer * 1000).toISOString(),
        completedAt: new Date().toISOString(),
        exercises: completedExercises,
        totalDuration: totalDuration,
        totalCalories: totalCalories,
        notes: ""
      };

      console.log('Sending workout session data:', workoutSessionData);

      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(workoutSessionData),
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        console.error('Server error:', responseData);
        throw new Error(responseData.message || 'Erro ao salvar treino');
      }

      console.log('Workout session saved successfully:', responseData);
      showWorkoutSuccess();
      // Redirect to workout details page
      setLocation(`/workout-history/${responseData.id}`);
      
    } catch (error) {
      console.error('Error saving workout session:', error);
      showWorkoutError();
      // Still redirect to history to see if data was saved
      setLocation("/history");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando treino...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar treino: {error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // No workout state
  if (!todaysWorkout || exercises.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
          <h2 className="text-xl font-semibold">Nenhum treino programado</h2>
          <p className="text-muted-foreground">Vá para a aba Treino para gerar um novo treino personalizado</p>
          <Button onClick={() => setLocation("/workout")}>
            Ir para Treino
          </Button>
        </div>
      </div>
    );
  }

  // Safety check for current exercise
  if (!currentExercise) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando exercício...</p>
        </div>
      </div>
    );
  }

  // Rest Timer Component
  const RestTimerCard = () => {
    const [timeRemaining, setTimeRemaining] = useState(restTime);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (isResting && isTimerRunning) {
        intervalRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              setIsResting(false);
              setIsTimerRunning(false);
              showSuccess("Tempo de descanso finalizado!");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [isResting, isTimerRunning, showSuccess]);

    useEffect(() => {
      setTimeRemaining(restTime);
    }, [restTime]);

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
      setIsTimerRunning(!isTimerRunning);
    };

    const resetTimer = () => {
      setTimeRemaining(restTime);
      setIsTimerRunning(false);
    };

    return (
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Tempo de Descanso</h3>
            </div>
            
            <div className="text-4xl font-bold text-blue-900 dark:text-blue-100">
              {formatTime(timeRemaining)}
            </div>
            
            <div className="flex justify-center space-x-3">
              <Button
                onClick={toggleTimer}
                variant="outline"
                size="sm"
                className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
              >
                {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                onClick={resetTimer}
                variant="outline"
                size="sm"
                className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isWorkoutComplete) {
    return (
      <div className="px-4 py-6 space-y-6">
        {/* Workout Complete Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Treino Concluído!</h1>
          <p className="text-muted-foreground">Parabéns por completar seu treino</p>
        </div>

        {/* Workout Summary */}
        <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Resumo do Treino</h2>
            <div className="space-y-4">
              {completedSets.map((set, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <div>
                    <span className="font-medium">{exercises[set.exerciseIndex]?.exercise}</span>
                    <p className="text-sm text-muted-foreground">Série {set.set}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{set.weight > 0 ? `${set.weight}kg` : 'Peso corporal'}</p>
                    <p className="text-sm text-muted-foreground">Esforço: {set.effort}/10</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleFinishWorkout}
          className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          Finalizar Treino
          <CheckCircle2 className="ml-2 h-5 w-5" />
        </Button>
      </div>
    );
  }

  const updateWeight = (newWeight: number) => {
    setWeight(newWeight);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Fixed Header - Always visible */}
      <div className="flex-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg dark:shadow-2xl dark:shadow-black/50 border-b border-slate-200 dark:border-slate-700 sticky top-12 z-40">
        <div className="px-4 py-4">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold">
              {currentExercise ? currentExercise.exercise : "Treino Ativo"}
            </h1>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Exercício {currentExerciseIndex + 1} de {totalExercises}</span>
              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4" />
                <span className="font-mono">{formatTime(workoutTimer)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progresso</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          

        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Current Exercise Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {currentExercise.muscleGroup}
                </Badge>
                <Badge variant="outline" className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                  {currentExercise.type}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                {currentExercise.exercise}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Instructions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Instruções:</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentExercise.instructions}
                </p>
              </div>

              {/* Exercise Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {currentExercise.series}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Séries</p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {currentExercise.repetitions}
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Repetições</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {currentExercise.time > 0 ? `${currentExercise.time}min` : '--'}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">Tempo</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {currentExercise.calories}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">Calorias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Set Control Card */}
          <div className="relative">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-center text-slate-900 dark:text-white">
                  Série {currentSet} de {currentExercise.series}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
              {/* Weight Control */}
              {currentExercise.weight > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-900 dark:text-white">
                    Peso: {weight}kg
                  </label>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateWeight(Math.max(0, weight - 2.5))}
                      className="h-10 w-10 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <Input
                      type="number"
                      value={weight}
                      onChange={(e) => updateWeight(parseFloat(e.target.value) || 0)}
                      className="text-center font-semibold"
                      step="0.5"
                      min="0"
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateWeight(weight + 2.5)}
                      className="h-10 w-10 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Effort Level */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-900 dark:text-white">
                  Nível de esforço: {effortLevel[0]}/10
                </label>
                <Slider
                  value={effortLevel}
                  onValueChange={setEffortLevel}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Muito fácil</span>
                  <span>Muito difícil</span>
                </div>
              </div>

              {/* Set Completion Button */}
              <Button
                onClick={() => {
                  const newCompletedSet = {
                    exerciseIndex: currentExerciseIndex,
                    set: currentSet,
                    weight: weight,
                    effort: effortLevel[0]
                  };
                  
                  setCompletedSets(prev => [...prev, newCompletedSet]);
                  setShowSetFeedback(true);
                  
                  // Reset feedback after 2 seconds
                  setTimeout(() => setShowSetFeedback(false), 2000);
                  
                  if (currentSet < currentExercise.series) {
                    setCurrentSet(currentSet + 1);
                    // Start rest timer if there are more sets
                    if (currentExercise.restBetweenSeries > 0) {
                      setRestTimeRemaining(currentExercise.restBetweenSeries);
                      setIsResting(true);
                      setIsTimerRunning(true);
                    }
                    showSuccess(`Série ${currentSet} concluída!`);
                  } else {
                    // Exercise completed
                    showSuccess(`${currentExercise.exercise} concluído!`);
                    
                    if (currentExerciseIndex < exercises.length - 1) {
                      // Move to next exercise
                      setTimeout(() => {
                        setCurrentExerciseIndex(currentExerciseIndex + 1);
                        setCurrentSet(1);
                        const nextExercise = exercises[currentExerciseIndex + 1];
                        if (nextExercise) {
                          setWeight(nextExercise.weight || 40);
                          setRestTime(nextExercise.restBetweenSeries || 90);
                        }
                      }, 1500);
                    } else {
                      // Workout completed
                      setTimeout(() => {
                        setIsWorkoutComplete(true);
                      }, 1500);
                    }
                  }
                }}
                className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {showSetFeedback ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Série Concluída!
                  </>
                ) : (
                  <>
                    Concluir Série {currentSet}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Skip Exercise Button */}
              <Button
                variant="outline"
                onClick={() => {
                  if (currentExerciseIndex < exercises.length - 1) {
                    setCurrentExerciseIndex(currentExerciseIndex + 1);
                    setCurrentSet(1);
                    const nextExercise = exercises[currentExerciseIndex + 1];
                    if (nextExercise) {
                      setWeight(nextExercise.weight || 40);
                      setRestTime(nextExercise.restBetweenSeries || 90);
                    }
                    showWarning("Exercício ignorado");
                  } else {
                    setIsWorkoutComplete(true);
                  }
                }}
                className="w-full"
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Pular Exercício
              </Button>
            </CardContent>
            </Card>
            
            {/* Floating Rest Timer */}
            {isResting && (
              <div className="absolute -top-4 right-4 bg-blue-600 dark:bg-blue-500 text-white rounded-full p-3 shadow-lg animate-pulse z-50">
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4" />
                  <span className="text-sm font-bold">
                    {formatTime(restTimeRemaining)}
                  </span>
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-white hover:bg-blue-700"
                    >
                      {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button
                      onClick={() => {
                        setRestTimeRemaining(restTime);
                        setIsTimerRunning(false);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-white hover:bg-blue-700"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}