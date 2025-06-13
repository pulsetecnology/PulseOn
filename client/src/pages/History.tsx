import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Dumbbell, ChevronDown, ChevronUp, X } from "lucide-react";

const mockHistory = [
  {
    id: 1,
    name: "Treino de Pernas",
    date: "Hoje",
    duration: 42,
    exercises: 5,
    status: "completed",
    completionRate: 100,
    exerciseDetails: [
      { name: "Agachamento", sets: 4, reps: 12, weight: "80kg", completed: true },
      { name: "Leg Press", sets: 3, reps: 15, weight: "120kg", completed: true },
      { name: "Extensão de Pernas", sets: 3, reps: 12, weight: "40kg", completed: true },
      { name: "Flexão de Pernas", sets: 3, reps: 12, weight: "35kg", completed: true },
      { name: "Panturrilha em Pé", sets: 4, reps: 20, weight: "60kg", completed: true }
    ]
  },
  {
    id: 2,
    name: "Treino de Peito",
    date: "Ontem",
    duration: 38,
    exercises: 6,
    status: "partial",
    completionRate: 75,
    exerciseDetails: [
      { name: "Supino Reto", sets: 4, reps: 10, weight: "70kg", completed: true },
      { name: "Supino Inclinado", sets: 3, reps: 12, weight: "60kg", completed: true },
      { name: "Flexão de Braços", sets: 3, reps: 15, weight: "Peso Corporal", completed: true },
      { name: "Voador", sets: 3, reps: 12, weight: "25kg", completed: true },
      { name: "Crucifixo", sets: 3, reps: 12, weight: "20kg", completed: false },
      { name: "Paralelas", sets: 3, reps: 10, weight: "Peso Corporal", completed: false }
    ]
  },
  {
    id: 3,
    name: "Treino de Costas",
    date: "3 dias atrás",
    duration: 45,
    exercises: 7,
    status: "completed",
    completionRate: 100,
    exerciseDetails: [
      { name: "Barra Fixa", sets: 4, reps: 8, weight: "Peso Corporal", completed: true },
      { name: "Remada Curvada", sets: 4, reps: 10, weight: "65kg", completed: true },
      { name: "Puxada Frontal", sets: 3, reps: 12, weight: "55kg", completed: true },
      { name: "Remada Sentado", sets: 3, reps: 12, weight: "50kg", completed: true },
      { name: "Levantamento Terra", sets: 4, reps: 8, weight: "90kg", completed: true },
      { name: "Pullover", sets: 3, reps: 12, weight: "25kg", completed: true },
      { name: "Encolhimento", sets: 3, reps: 15, weight: "30kg", completed: true }
    ]
  },
  {
    id: 4,
    name: "Treino de Ombros",
    date: "5 dias atrás",
    duration: 35,
    exercises: 5,
    status: "partial",
    completionRate: 60,
    exerciseDetails: [
      { name: "Desenvolvimento", sets: 4, reps: 10, weight: "45kg", completed: true },
      { name: "Elevação Lateral", sets: 3, reps: 12, weight: "15kg", completed: true },
      { name: "Elevação Frontal", sets: 3, reps: 12, weight: "12kg", completed: true },
      { name: "Remada Alta", sets: 3, reps: 12, weight: "30kg", completed: false },
      { name: "Crucifixo Inverso", sets: 3, reps: 15, weight: "10kg", completed: false }
    ]
  }
];

export default function History() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const toggleCard = (cardId: number) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };
  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Histórico de Treinos</h1>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">24</div>
            <div className="text-sm text-muted-foreground">Treinos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">18h</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-error">7</div>
            <div className="text-sm text-muted-foreground">Sequência</div>
          </CardContent>
        </Card>
      </div>

      {/* Workout History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Treinos Recentes</h2>
        {mockHistory.map((workout) => (
          <Card 
            key={workout.id} 
            className="cursor-pointer transition-all duration-200"
            onClick={() => toggleCard(workout.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm">{workout.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="mr-1 h-2 w-2" />
                    {workout.date}
                  </span>
                  {expandedCard === workout.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Clock className="mr-1 h-2 w-2" />
                    {workout.duration} min
                  </span>
                  <span className="flex items-center">
                    <Dumbbell className="mr-1 h-2 w-2" />
                    {workout.exercises} exercícios
                  </span>
                </div>
                <Badge 
                  variant="default" 
                  className={`text-white text-xs px-2 py-0 ${
                    workout.status === "completed" 
                      ? "bg-success" 
                      : "bg-orange-500"
                  }`}
                >
                  {workout.status === "completed" ? "Concluído" : "Parcial"}
                </Badge>
              </div>
              
              {/* Expanded Exercise Details */}
              {expandedCard === workout.id && (
                <div className="mt-4 pt-3 border-t border-border">
                  <h4 className="font-semibold text-sm mb-3 text-foreground">Detalhes dos Exercícios</h4>
                  <div className="space-y-2">
                    {workout.exerciseDetails.map((exercise, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between py-2 px-3 rounded-md ${
                          exercise.completed 
                            ? 'bg-muted/30' 
                            : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50'
                        }`}
                      >
                        <div className="flex items-center flex-1">
                          {!exercise.completed && (
                            <X className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <h5 className={`font-medium text-sm ${
                              exercise.completed 
                                ? 'text-foreground' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {exercise.name}
                              {!exercise.completed && (
                                <span className="ml-2 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                                  Não executado
                                </span>
                              )}
                            </h5>
                            <p className={`text-xs ${
                              exercise.completed 
                                ? 'text-muted-foreground' 
                                : 'text-red-500 dark:text-red-400'
                            }`}>
                              {exercise.sets} séries × {exercise.reps} repetições
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-semibold ${
                            exercise.completed 
                              ? 'text-primary' 
                              : 'text-red-500 dark:text-red-400'
                          }`}>
                            {exercise.weight}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Progress */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Progresso Semanal</h3>
          <div className="space-y-2">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day, index) => (
              <div key={day} className="flex items-center justify-between">
                <span className="text-sm">{day}</span>
                <div className={`w-4 h-4 rounded-full ${
                  index < 4 ? "bg-success" : "bg-muted"
                }`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
