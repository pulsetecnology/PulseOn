import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Edit, RotateCcw, Bell, Shield, LogOut, Dumbbell } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const userStats = {
    weight: 75,
    height: 180,
    age: 28
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* User Info */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold mb-1">João Silva</h1>
          <p className="text-muted-foreground mb-4">joao@email.com</p>
          <div className="flex justify-center space-x-6 text-sm">
            <div className="text-center">
              <div className="font-bold">{userStats.weight}kg</div>
              <div className="text-muted-foreground">Peso</div>
            </div>
            <div className="text-center">
              <div className="font-bold">{userStats.height}cm</div>
              <div className="text-muted-foreground">Altura</div>
            </div>
            <div className="text-center">
              <div className="font-bold">{userStats.age}</div>
              <div className="text-muted-foreground">Idade</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fitness Goals */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Objetivo Atual</h3>
          <div className="flex items-center">
            <Dumbbell className="text-success mr-3 h-5 w-5" />
            <div>
              <div className="font-medium">Ganhar massa muscular</div>
              <div className="text-sm text-muted-foreground">Nível intermediário • 4x por semana</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Menu */}
      <div className="space-y-2">
        <Button variant="ghost" className="w-full justify-between h-auto p-4">
          <div className="flex items-center">
            <Edit className="text-primary mr-3 h-5 w-5" />
            <span>Editar Perfil</span>
          </div>
          <span className="text-muted-foreground">›</span>
        </Button>

        <Link href="/onboarding">
          <Button variant="ghost" className="w-full justify-between h-auto p-4">
            <div className="flex items-center">
              <RotateCcw className="text-primary mr-3 h-5 w-5" />
              <span>Refazer Questionário</span>
            </div>
            <span className="text-muted-foreground">›</span>
          </Button>
        </Link>

        <Button variant="ghost" className="w-full justify-between h-auto p-4">
          <div className="flex items-center">
            <Bell className="text-primary mr-3 h-5 w-5" />
            <span>Notificações</span>
          </div>
          <span className="text-muted-foreground">›</span>
        </Button>

        <Button variant="ghost" className="w-full justify-between h-auto p-4">
          <div className="flex items-center">
            <Shield className="text-primary mr-3 h-5 w-5" />
            <span>Privacidade</span>
          </div>
          <span className="text-muted-foreground">›</span>
        </Button>

        <Button variant="ghost" className="w-full justify-between h-auto p-4 text-destructive">
          <div className="flex items-center">
            <LogOut className="mr-3 h-5 w-5" />
            <span>Sair</span>
          </div>
          <span className="text-muted-foreground">›</span>
        </Button>
      </div>

      {/* Achievement Section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Conquistas Recentes</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center mr-3">
                  🔥
                </div>
                <div>
                  <div className="font-medium text-sm">Sequência de 7 dias</div>
                  <div className="text-xs text-muted-foreground">Manteve consistência por uma semana</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                  💪
                </div>
                <div>
                  <div className="font-medium text-sm">24 treinos concluídos</div>
                  <div className="text-xs text-muted-foreground">Mantendo o foco nos objetivos</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
