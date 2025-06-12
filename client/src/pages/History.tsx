import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Dumbbell } from "lucide-react";

const mockHistory = [
  {
    id: 1,
    name: "Treino de Pernas",
    date: "Hoje",
    duration: 42,
    exercises: 5,
    status: "completed"
  },
  {
    id: 2,
    name: "Treino de Peito",
    date: "Ontem",
    duration: 38,
    exercises: 6,
    status: "completed"
  },
  {
    id: 3,
    name: "Treino de Costas",
    date: "3 dias atrás",
    duration: 45,
    exercises: 7,
    status: "completed"
  },
  {
    id: 4,
    name: "Treino de Ombros",
    date: "5 dias atrás",
    duration: 35,
    exercises: 5,
    status: "completed"
  }
];

export default function History() {
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
          <Card key={workout.id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm">{workout.name}</h3>
                <span className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="mr-1 h-2 w-2" />
                  {workout.date}
                </span>
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
