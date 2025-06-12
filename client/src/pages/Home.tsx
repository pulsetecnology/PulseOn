import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Flame, Play } from "lucide-react";
import { Link } from "wouter";
import { useGlobalNotification } from "@/components/NotificationProvider";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  
  const { user } = useAuth();

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Olá, {user?.name?.split(' ')[0] || 'usuário'}!</h1>
        <p className="text-muted-foreground">Pronto para o seu treino de hoje?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Treinos Concluídos</span>
              <Dumbbell className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xl font-bold">24</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Sequência Atual</span>
              <Flame className="h-3 w-3 text-error" />
            </div>
            <span className="text-xl font-bold">7 dias</span>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Treino de Hoje</h2>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-2xl dark:shadow-black/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Treino de Pernas</h3>
              <span className="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-full text-xs text-primary">45 min</span>
            </div>
            <p className="text-muted-foreground mb-3 text-sm">5 exercícios • Nível Intermediário</p>
            <Link href="/active-workout">
              <Button className="w-full py-2 bg-primary hover:bg-primary/90 font-semibold">
                <Play className="mr-2 h-4 w-4" />
                Iniciar Treino
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      

      {/* Upcoming Workouts */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Próximos Treinos</h2>
        <div className="space-y-2">
          <Card>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Treino de Peito</h3>
                <p className="text-xs text-muted-foreground">Amanhã • 6 exercícios</p>
              </div>
              <Button variant="ghost" size="sm">
                <Play className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Treino de Costas</h3>
                <p className="text-xs text-muted-foreground">Quinta-feira • 7 exercícios</p>
              </div>
              <Button variant="ghost" size="sm">
                <Play className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
