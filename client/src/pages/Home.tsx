import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Flame, Play } from "lucide-react";
import { Link } from "wouter";
import { useGlobalNotification } from "@/components/NotificationProvider";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  
  const { user } = useAuth();

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Olá, {user?.name?.split(' ')[0] || 'usuário'}! 💪</h1>
        <p className="text-muted-foreground">Pronto para o seu treino de hoje?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Treinos Concluídos</span>
              <Dumbbell className="h-4 w-4 text-primary" />
            </div>
            <span className="text-2xl font-bold">24</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Sequência Atual</span>
              <Flame className="h-4 w-4 text-error" />
            </div>
            <span className="text-2xl font-bold">7 dias</span>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Treino de Hoje</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold">Treino de Pernas</h3>
              <span className="bg-secondary px-3 py-1 rounded-full text-sm">45 min</span>
            </div>
            <p className="text-muted-foreground mb-4">5 exercícios • Nível Intermediário</p>
            <Link href="/workout">
              <Button className="w-full font-semibold">
                <Play className="mr-2 h-4 w-4" />
                Iniciar Treino
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      

      {/* Upcoming Workouts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Próximos Treinos</h2>
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Treino de Peito</h3>
                <p className="text-sm text-muted-foreground">Amanhã • 6 exercícios</p>
              </div>
              <Button variant="ghost" size="icon">
                <Play className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Treino de Costas</h3>
                <p className="text-sm text-muted-foreground">Quinta-feira • 7 exercícios</p>
              </div>
              <Button variant="ghost" size="icon">
                <Play className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
