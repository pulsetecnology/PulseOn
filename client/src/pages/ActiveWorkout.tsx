import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Pause, Play, RotateCcw, ChevronRight, CheckCircle2, SkipForward, AlertCircle, Timer } from "lucide-react";
import { sampleExercises } from "@/lib/workouts";
import { useGlobalNotification } from "@/components/NotificationProvider";
import { useLocation } from "wouter";

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
  const { showSuccess, showWarning, showWorkoutSuccess, showWorkoutError, showWorkoutWarning } = useGlobalNotification();
  const [, setLocation] = useLocation();

  const currentExercise = sampleExercises[currentExerciseIndex];
  const totalExercises = sampleExercises.length;
  const progressPercentage = ((currentExerciseIndex + 1) / totalExercises) * 100;

  useEffect(() => {
    if (isTimerRunning && restTime > 0) {
      const timer = setTimeout(() => setRestTime(restTime - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (restTime === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setIsResting(false);
      showWorkoutSuccess();
    }
  }, [isTimerRunning, restTime, showSuccess]);

  const completeSet = () => {
    const newCompletedSet = {
      exerciseIndex: currentExerciseIndex,
      set: currentSet,
      weight: weight,
      effort: effortLevel[0]
    };

    setCompletedSets([...completedSets, newCompletedSet]);
    setShowSetFeedback(true);

    // Show workout progress notification
    showWorkoutSuccess();

    setTimeout(() => {
      setShowSetFeedback(false);

      if (currentSet < currentExercise.sets) {
        setCurrentSet(currentSet + 1);
        setIsResting(true);
        setRestTime(currentExercise.restTime);
        setIsTimerRunning(true);
        // Show set completion notification
        showWorkoutSuccess();
      } else {
        // Move to next exercise or complete workout
        if (currentExerciseIndex < sampleExercises.length - 1) {
          setCurrentExerciseIndex(currentExerciseIndex + 1);
          setCurrentSet(1);
          setWeight(sampleExercises[currentExerciseIndex + 1].suggestedWeight || 40);
          setEffortLevel([7]);
          showWorkoutSuccess();
        } else {
          setIsWorkoutComplete(true);
          showWorkoutSuccess();
        }
      }
    }, 2000);
  };

  const skipExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setWeight(sampleExercises[currentExerciseIndex + 1].suggestedWeight || 40);
      setEffortLevel([7]);
      setShowSetFeedback(false);
      showWorkoutWarning();
    } else {
      setIsWorkoutComplete(true);
    }
  };

  const startNextSet = () => {
    setIsResting(false);
    setIsTimerRunning(false);
    setShowSetFeedback(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                    <span className="font-medium">{sampleExercises[set.exerciseIndex].name}</span>
                    <p className="text-sm text-muted-foreground">Série {set.set}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{set.weight}kg</p>
                    <p className="text-sm text-muted-foreground">Esforço: {set.effort}/10</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={() => setLocation("/workout")}
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
      <div className="flex-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-lg dark:shadow-2xl dark:shadow-black/50 border-b border-slate-200 dark:border-slate-700"></div>
        <div className="px-4 py-6">
          <div className="text-center space-y-2">
            <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"></Badge>
              Exercício {currentExerciseIndex + 1}/{totalExercises}
            </Badge>
            <h1 className="text-2xl font-bold">{currentExercise.name}</h1>
            <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400"></div>
              Série {currentSet} de {currentExercise.sets}
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-lg">{currentExercise.reps} repetições</p>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2 bg-slate-300 dark:bg-slate-700" />
          </div>
        </div>
      </div>

      {/* Content Area - Fixed height, no scroll jump */}
      <div className="flex-1 px-4 py-0 flex items-start justify-center">
        <div className="w-full max-w-md mt-2">
          {/* During Exercise Phase */}
          {!isResting && !showSetFeedback && (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-2xl dark:shadow-black/30">
              <CardContent className="p-8 text-center">
                <Timer className="h-12 w-12 mx-auto mb-4 text-cyan-600" />
                <h2 className="text-xl font-semibold mb-2">Execute o exercício</h2>
                <p className="text-muted-foreground mb-6">
                  Concentre-se na execução correta dos movimentos
                </p>

                <Button 
                  onClick={() => setShowSetFeedback(true)}
                  className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
                >
                  Concluir Série
                  <CheckCircle2 className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Rest Timer Phase */}
          {isResting && (
            <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 shadow-lg dark:shadow-2xl dark:shadow-black/30">
              <CardContent className="p-8 text-center">
                <div className="text-6xl font-bold text-orange-600 dark:text-orange-400 mb-4">
                  {formatTime(restTime)}
                </div>
                <h2 className="text-xl font-semibold mb-2">Tempo de Descanso</h2>
                <p className="text-muted-foreground mb-6">
                  Relaxe e prepare-se para a próxima série
                </p>

                <div className="flex justify-center space-x-4 mb-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTimerRunning(!isTimerRunning)} 
                    size="lg"
                    className="border-orange-300 dark:border-orange-700"
                  >
                    {isTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setRestTime(currentExercise.restTime)} 
                    size="lg"
                    className="border-orange-300 dark:border-orange-700"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </div>

                <Button 
                  onClick={startNextSet}
                  className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                >
                  Começar Próxima Série
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Set Feedback Phase */}
          {showSetFeedback && (
            <div className="space-y-1">

              {/* Weight Selection */}
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-2xl dark:shadow-black/30">
                <CardContent className="p-2">
                  <h3 className="font-semibold mb-2 text-center text-sm">Peso utilizado</h3>
                  <div className="flex items-center justify-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWeight(Math.max(0, weight - 2.5))}
                      disabled={weight <= 2.5}
                      className="h-8 w-8"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{weight}</div>
                      <div className="text-xs text-muted-foreground">kg</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWeight(weight + 2.5)}
                      className="h-8 w-8"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Effort Level */}
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-2xl dark:shadow-black/30">
                <CardContent className="p-2">
                  <h3 className="font-semibold mb-2 text-center text-sm">Nível de esforço</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Fácil</span>
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
                      <span className="text-base font-semibold text-cyan-600">
                        Esforço: {effortLevel[0]}/10
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-1">
                <Button 
                  onClick={completeSet}
                  className="w-full py-2 font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
                >
                  {currentSet < currentExercise.sets ? "Começar próxima série" : 
                   currentExerciseIndex < totalExercises - 1 ? "Próximo exercício" : "Finalizar treino"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="grid grid-cols-2 gap-1">
                  <Button 
                    variant="outline" 
                    onClick={skipExercise}
                    className="py-1 text-sm font-semibold border-2 border-slate-300 dark:border-slate-600"
                  >
                    <SkipForward className="mr-1 h-3 w-3" />
                    Pular
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSetFeedback(false)}
                    className="py-1 text-sm font-semibold border-2 border-slate-300 dark:border-slate-600"
                  >
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Finalizar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}