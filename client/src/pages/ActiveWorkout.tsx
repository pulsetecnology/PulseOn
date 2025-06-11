
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Pause, RotateCcw, ChevronRight } from "lucide-react";
import { sampleExercises } from "@/lib/workouts";

export default function ActiveWorkout() {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [weight, setWeight] = useState(40);
  const [effortLevel, setEffortLevel] = useState([7]);
  const [restTime, setRestTime] = useState(90);
  const [isResting, setIsResting] = useState(false);

  const currentExercise = sampleExercises[currentExerciseIndex];
  const totalExercises = sampleExercises.length;
  const progressPercentage = ((currentExerciseIndex + 1) / totalExercises) * 100;

  useEffect(() => {
    if (isResting && restTime > 0) {
      const timer = setTimeout(() => setRestTime(restTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isResting, restTime]);

  const nextSet = () => {
    if (currentSet < currentExercise.sets) {
      setCurrentSet(currentSet + 1);
      setRestTime(currentExercise.restTime);
      setIsResting(true);
    } else {
      // Move to next exercise
      if (currentExerciseIndex < totalExercises - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        setWeight(sampleExercises[currentExerciseIndex + 1].suggestedWeight || 40);
        setRestTime(sampleExercises[currentExerciseIndex + 1].restTime);
        setIsResting(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Exercise Progress - Main Card */}
      <Card className="bg-gradient-to-r from-primary to-secondary border-0">
        <CardContent className="p-6 text-primary-foreground text-center">
          <span className="text-sm opacity-90">Exercício {currentExerciseIndex + 1} de {totalExercises}</span>
          <h1 className="text-2xl font-bold mt-1 mb-4">{currentExercise.name}</h1>
          
          {/* Progress Bar */}
          <Progress value={progressPercentage} className="h-2 mb-4 bg-white/20" />
          
          {/* Current Set Info */}
          <div>
            <span className="text-3xl font-bold">Série {currentSet} de {currentExercise.sets}</span>
            <p className="opacity-90 mt-1">{currentExercise.reps} repetições</p>
          </div>
        </CardContent>
      </Card>

      {/* Timer - Prominently displayed */}
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold mb-2 text-lg">
            {isResting ? "⏰ Tempo de Descanso" : "🏃‍♂️ Tempo de Treino"}
          </h3>
          <div className="text-5xl font-bold text-primary mb-4">
            {formatTime(restTime)}
          </div>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => setIsResting(!isResting)} size="lg">
              <Pause className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={() => setRestTime(currentExercise.restTime)} size="lg">
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Action Buttons - Prominently placed */}
      <div className="space-y-3">
        <Button className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-success to-primary" onClick={nextSet}>
          {currentSet < currentExercise.sets ? "Próxima Série" : 
           currentExerciseIndex < totalExercises - 1 ? "Próximo Exercício" : "Finalizar Treino"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
        <Button variant="outline" className="w-full py-3 font-semibold border-2">
          Finalizar Exercício
        </Button>
      </div>

      {/* Weight Input */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-center">Peso utilizado</h3>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setWeight(Math.max(0, weight - 2.5))}
              className="h-12 w-12"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <Input 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(Number(e.target.value))}
                className="text-3xl font-bold text-center border-0 bg-transparent"
              />
              <span className="text-muted-foreground text-lg">kg</span>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setWeight(weight + 2.5)}
              className="h-12 w-12"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Effort Level */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-center">Nível de esforço</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
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
            <div className="flex justify-between text-xs text-muted-foreground">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i + 1}>{i + 1}</span>
              ))}
            </div>
            <div className="text-center">
              <span className="text-xl font-bold text-warning">Esforço: {effortLevel[0]}/10</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
