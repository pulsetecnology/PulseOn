import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Target, List } from "lucide-react";
import { sampleWorkouts } from "@/lib/workouts";
import { Link } from "wouter";

export default function Workout() {
  const todaysWorkout = sampleWorkouts[0]; // For demo purposes

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Workout Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">{todaysWorkout.name}</h1>
            <Badge variant="secondary">{todaysWorkout.duration} min</Badge>
          </div>
          <p className="text-muted-foreground mb-4">{todaysWorkout.description}</p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center">
              <List className="mr-1 h-4 w-4" />
              {todaysWorkout.exercises?.length} exercícios
            </span>
            <span className="flex items-center">
              <Target className="mr-1 h-4 w-4" />
              {todaysWorkout.difficulty === "intermediate" ? "Intermediário" : todaysWorkout.difficulty}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Exercícios</h2>
        {todaysWorkout.exercises?.map((exercise, index) => (
          <Card key={exercise.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{exercise.name}</h3>
                <span className="text-sm text-muted-foreground">
                  {exercise.sets}x{exercise.reps}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                <span>Peso sugerido: {exercise.suggestedWeight}kg</span>
                <span className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  Descanso: {exercise.restTime}s
                </span>
              </div>
              <div className="mb-3">
                <p className="text-sm">{exercise.instructions}</p>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {exercise.muscleGroups.map((muscle) => (
                  <Badge key={muscle} variant="outline" className="text-xs">
                    {muscle}
                  </Badge>
                ))}
              </div>
              <Button 
                className="w-full" 
                variant={index === 0 ? "default" : "secondary"}
                disabled={index !== 0}
              >
                {index === 0 ? (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar Exercício
                  </>
                ) : (
                  "Aguardando"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Start Workout Button */}
      <div className="pt-4">
        <Link href="/active-workout">
          <Button className="w-full bg-gradient-to-r from-success to-primary text-white py-4 text-lg font-semibold">
            <Play className="mr-2 h-5 w-5" />
            Começar Treino
          </Button>
        </Link>
      </div>
    </div>
  );
}
