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
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center">
              <List className="mr-1 h-4 w-4" />
              {todaysWorkout.exercises?.length} exercícios
            </span>
            <span className="flex items-center">
              <Target className="mr-1 h-4 w-4" />
              {todaysWorkout.difficulty === "intermediate" ? "Intermediário" : todaysWorkout.difficulty}
            </span>
          </div>
          <Link href="/active-workout">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold">
              <Play className="mr-2 h-5 w-5" />
              Iniciar treino completo
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Exercícios</h2>
        {todaysWorkout.exercises?.map((exercise, index) => (
          <Card key={exercise.id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{exercise.name}</h3>
                <span className="text-xs text-muted-foreground">
                  {exercise.sets}x{exercise.reps}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Peso: {exercise.suggestedWeight}kg</span>
                <span className="flex items-center">
                  <Clock className="mr-1 h-2 w-2" />
                  {exercise.restTime}s
                </span>
              </div>
              <div className="mb-2">
                <p className="text-xs text-muted-foreground">{exercise.instructions}</p>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {exercise.muscleGroups.map((muscle) => (
                  <Badge key={muscle} variant="outline" className="text-xs px-1 py-0">
                    {muscle}
                  </Badge>
                ))}
              </div>
              <Button 
                className="w-full" 
                variant="default"
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar este exercício
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
