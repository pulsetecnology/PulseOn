import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Flame, Play, Check, X, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useGlobalNotification } from "@/components/NotificationProvider";

export default function Home() {
  const { showSuccess, showError, showWarning } = useGlobalNotification();

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Olá, João! 👋</h1>
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
        <Card className="bg-gradient-to-r from-primary to-secondary border-0">
          <CardContent className="p-6 text-primary-foreground">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold">Treino de Pernas</h3>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">45 min</span>
            </div>
            <p className="text-primary-foreground/80 mb-4">5 exercícios • Nível Intermediário</p>
            <Link href="/workout">
              <Button className="w-full bg-white text-primary hover:bg-white/90 font-semibold">
                <Play className="mr-2 h-4 w-4" />
                Iniciar Treino
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Notification Test Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Sistema de Notificações</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Button 
            onClick={() => showSuccess()}
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950"
          >
            <Check className="h-5 w-5 text-green-600 mb-2" />
            <span className="text-sm">Sucesso</span>
          </Button>
          <Button 
            onClick={() => showError()}
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
          >
            <X className="h-5 w-5 text-red-600 mb-2" />
            <span className="text-sm">Erro</span>
          </Button>
          <Button 
            onClick={() => showWarning()}
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto border-yellow-200 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-950"
          >
            <AlertTriangle className="h-5 w-5 text-yellow-600 mb-2" />
            <span className="text-sm">Aviso</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mb-6">
          Toque nos botões acima para ver os ícones temporários aparecerem no header
        </p>
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
