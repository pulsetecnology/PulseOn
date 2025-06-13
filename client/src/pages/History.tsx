import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";

const mockHistory = [
  {
    id: 1,
    name: "Treino de Pernas",
    date: "Hoje",
    duration: 42,
    exercises: 5,
    status: "completed",
    exerciseDetails: [
      { name: "Agachamento", sets: 4, reps: 12, weight: "80kg" },
      { name: "Leg Press", sets: 3, reps: 15, weight: "120kg" },
      { name: "Extensão de Pernas", sets: 3, reps: 12, weight: "40kg" },
      { name: "Flexão de Pernas", sets: 3, reps: 12, weight: "35kg" },
      { name: "Panturrilha em Pé", sets: 4, reps: 20, weight: "60kg" }
    ]
  },
  {
    id: 2,
    name: "Treino de Peito",
    date: "Ontem",
    duration: 38,
    exercises: 6,
    status: "completed",
    exerciseDetails: [
      { name: "Supino Reto", sets: 4, reps: 10, weight: "70kg" },
      { name: "Supino Inclinado", sets: 3, reps: 12, weight: "60kg" },
      { name: "Flexão de Braços", sets: 3, reps: 15, weight: "Peso Corporal" },
      { name: "Voador", sets: 3, reps: 12, weight: "25kg" },
      { name: "Crucifixo", sets: 3, reps: 12, weight: "20kg" },
      { name: "Paralelas", sets: 3, reps: 10, weight: "Peso Corporal" }
    ]
  },
  {
    id: 3,
    name: "Treino de Costas",
    date: "3 dias atrás",
    duration: 45,
    exercises: 7,
    status: "completed",
    exerciseDetails: [
      { name: "Barra Fixa", sets: 4, reps: 8, weight: "Peso Corporal" },
      { name: "Remada Curvada", sets: 4, reps: 10, weight: "65kg" },
      { name: "Puxada Frontal", sets: 3, reps: 12, weight: "55kg" },
      { name: "Remada Sentado", sets: 3, reps: 12, weight: "50kg" },
      { name: "Levantamento Terra", sets: 4, reps: 8, weight: "90kg" },
      { name: "Pullover", sets: 3, reps: 12, weight: "25kg" },
      { name: "Encolhimento", sets: 3, reps: 15, weight: "30kg" }
    ]
  },
  {
    id: 4,
    name: "Treino de Ombros",
    date: "5 dias atrás",
    duration: 35,
    exercises: 5,
    status: "completed",
    exerciseDetails: [
      { name: "Desenvolvimento", sets: 4, reps: 10, weight: "45kg" },
      { name: "Elevação Lateral", sets: 3, reps: 12, weight: "15kg" },
      { name: "Elevação Frontal", sets: 3, reps: 12, weight: "12kg" },
      { name: "Remada Alta", sets: 3, reps: 12, weight: "30kg" },
      { name: "Crucifixo Inverso", sets: 3, reps: 15, weight: "10kg" }
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
            className={`cursor-pointer transition-all duration-200 ${
              expandedCard === workout.id ? 'ring-2 ring-primary' : ''
            }`}
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
                <Badge variant="default" className="bg-success text-white text-xs px-2 py-0">
                  Concluído
                </Badge>
              </div>
              
              {/* Expanded Exercise Details */}
              {expandedCard === workout.id && (
                <div className="mt-4 pt-3 border-t border-border">
                  <h4 className="font-semibold text-sm mb-3 text-foreground">Detalhes dos Exercícios</h4>
                  <div className="space-y-2">
                    {workout.exerciseDetails.map((exercise, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm text-foreground">{exercise.name}</h5>
                          <p className="text-xs text-muted-foreground">
                            {exercise.sets} séries × {exercise.reps} repetições
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-primary">{exercise.weight}</span>
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
