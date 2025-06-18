import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useGlobalNotification } from "@/components/NotificationProvider";
import { Clock, Dumbbell, User, Trophy, CheckCircle, AlertCircle, BarChart3, Calendar, Target, ChevronDown, ChevronUp, X, Scale, Heart, Flame, Play, Loader2, Sparkles } from "lucide-react";
import FitnessIcon from "@/components/FitnessIcon";

// Mock workout data with exercise details
const mockTodaysWorkout = {
  id: 1,
  name: "Treino de Pernas",
  duration: 45,
  difficulty: "Intermediário",
  exercises: [
    {
      id: "leg-1",
      name: "Agachamento",
      sets: 4,
      reps: 12,
      weight: "80kg",
      restTime: 90,
      instructions: "Mantenha os pés paralelos, desça até formar 90° nos joelhos",
      muscleGroups: ["quadríceps", "glúteos"]
    },
    {
      id: "leg-2", 
      name: "Leg Press",
      sets: 3,
      reps: 15,
      weight: "120kg",
      restTime: 60,
      instructions: "Posicione os pés na largura dos ombros, controle a descida",
      muscleGroups: ["quadríceps", "glúteos"]
    },
    {
      id: "leg-3",
      name: "Extensão de Pernas",
      sets: 3,
      reps: 12,
      weight: "40kg", 
      restTime: 45,
      instructions: "Movimento controlado, pausa de 1 segundo no topo",
      muscleGroups: ["quadríceps"]
    },
    {
      id: "leg-4",
      name: "Flexão de Pernas",
      sets: 3,
      reps: 12,
      weight: "35kg",
      restTime: 45,
      instructions: "Controle a fase excêntrica, não deixe o peso bater",
      muscleGroups: ["isquiotibiais"]
    },
    {
      id: "leg-5",
      name: "Panturrilha em Pé",
      sets: 4,
      reps: 20,
      weight: "60kg",
      restTime: 30,
      instructions: "Amplitude completa, pausa de 1 segundo no topo",
      muscleGroups: ["panturrilha"]
    }
  ]
};

const mockUpcomingWorkouts = [
  {
    id: 2,
    name: "Treino de Peito",
    date: "Amanhã",
    difficulty: "Intermediário",
    exercises: [
      {
        id: "chest-1",
        name: "Supino Reto",
        sets: 4,
        reps: 10,
        weight: "70kg",
        restTime: 90,
        instructions: "Controle a barra, toque levemente no peito",
        muscleGroups: ["peitoral", "tríceps"]
      },
      {
        id: "chest-2",
        name: "Supino Inclinado",
        sets: 3,
        reps: 12,
        weight: "60kg",
        restTime: 75,
        instructions: "Inclinação de 45°, foco na porção superior do peitoral",
        muscleGroups: ["peitoral superior"]
      },
      {
        id: "chest-3",
        name: "Flexão de Braços",
        sets: 3,
        reps: 15,
        weight: "Peso Corporal",
        restTime: 60,
        instructions: "Mantenha o corpo alinhado, descida controlada",
        muscleGroups: ["peitoral", "tríceps"]
      },
      {
        id: "chest-4",
        name: "Voador",
        sets: 3,
        reps: 12,
        weight: "25kg",
        restTime: 45,
        instructions: "Movimento em arco, contração no final",
        muscleGroups: ["peitoral"]
      },
      {
        id: "chest-5",
        name: "Crucifixo",
        sets: 3,
        reps: 12,
        weight: "20kg",
        restTime: 45,
        instructions: "Leve flexão dos cotovelos, movimento controlado",
        muscleGroups: ["peitoral"]
      },
      {
        id: "chest-6",
        name: "Paralelas",
        sets: 3,
        reps: 10,
        weight: "Peso Corporal",
        restTime: 75,
        instructions: "Incline o tronco levemente para frente",
        muscleGroups: ["peitoral inferior", "tríceps"]
      }
    ]
  },
  {
    id: 3,
    name: "Treino de Costas",
    date: "Quinta-feira",
    difficulty: "Avançado",
    exercises: [
      {
        id: "back-1",
        name: "Barra Fixa",
        sets: 4,
        reps: 8,
        weight: "Peso Corporal",
        restTime: 90,
        instructions: "Pegada pronada, puxada até o queixo",
        muscleGroups: ["latíssimo", "bíceps"]
      },
      {
        id: "back-2",
        name: "Remada Curvada",
        sets: 4,
        reps: 10,
        weight: "65kg",
        restTime: 75,
        instructions: "Tronco inclinado 45°, puxada até o abdômen",
        muscleGroups: ["latíssimo", "rombóides"]
      },
      {
        id: "back-3",
        name: "Puxada Frontal",
        sets: 3,
        reps: 12,
        weight: "55kg",
        restTime: 60,
        instructions: "Pegada aberta, puxada até a altura do peito",
        muscleGroups: ["latíssimo", "rombóides"]
      },
      {
        id: "back-4",
        name: "Remada Sentado",
        sets: 3,
        reps: 12,
        weight: "50kg",
        restTime: 60,
        instructions: "Tronco ereto, puxada até o abdômen",
        muscleGroups: ["latíssimo", "rombóides"]
      },
      {
        id: "back-5",
        name: "Levantamento Terra",
        sets: 4,
        reps: 8,
        weight: "90kg",
        restTime: 120,
        instructions: "Mantenha as costas retas, força nas pernas",
        muscleGroups: ["lombar", "glúteos", "isquiotibiais"]
      },
      {
        id: "back-6",
        name: "Pullover",
        sets: 3,
        reps: 12,
        weight: "25kg",
        restTime: 45,
        instructions: "Movimento em arco, abertura da caixa torácica",
        muscleGroups: ["latíssimo", "serrátil"]
      },
      {
        id: "back-7",
        name: "Encolhimento",
        sets: 3,
        reps: 15,
        weight: "30kg",
        restTime: 45,
        instructions: "Movimento vertical, contração no topo",
        muscleGroups: ["trapézio"]
      }
    ]
  }
];

// Component for expandable onboarding card
function OnboardingCard({ user }: { user: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMissingFields = () => {
    const missingFields = [];

    if (!user?.birthDate) {
      missingFields.push({
        field: "Data de nascimento",
        description: "Necessária para calcular sua idade e personalizar treinos",
        icon: Calendar
      });
    }

    if (!user?.weight || user.weight <= 0) {
      missingFields.push({
        field: "Peso",
        description: "Importante para calcular cargas e intensidade dos exercícios",
        icon: Scale
      });
    }

    if (!user?.height || user.height <= 0) {
      missingFields.push({
        field: "Altura",
        description: "Usada para cálculos de IMC e metabolismo basal",
        icon: User
      });
    }

    if (!user?.gender || user.gender === "not_specified") {
      missingFields.push({
        field: "Gênero",
        description: "Influencia no cálculo de necessidades calóricas",
        icon: User
      });
    }

    if (!user?.fitnessGoal) {
      missingFields.push({
        field: "Objetivo fitness",
        description: "Define o tipo de treino (perder peso, ganhar massa, etc.)",
        icon: Target
      });
    }

    if (!user?.experienceLevel) {
      missingFields.push({
        field: "Nível de experiência",
        description: "Determina a complexidade e intensidade dos exercícios",
        icon: Trophy
      });
    }

    if (!user?.weeklyFrequency || user.weeklyFrequency <= 0) {
      missingFields.push({
        field: "Frequência semanal",
        description: "Quantas vezes por semana você pretende treinar",
        icon: Calendar
      });
    }

    if (!user?.availableEquipment || user.availableEquipment.length === 0) {
      missingFields.push({
        field: "Equipamentos disponíveis",
        description: "Tipos de equipamentos que você tem acesso para treinar",
        icon: Dumbbell
      });
    }

    // Adicionar validações para campos de estilo de vida se necessário
    if (!user?.smokingStatus) {
      missingFields.push({
        field: "Status de tabagismo",
        description: "Informação importante para personalizar treinos",
        icon: Heart
      });
    }

    if (!user?.alcoholConsumption) {
      missingFields.push({
        field: "Consumo de álcool",
        description: "Influencia no planejamento de treinos",
        icon: Heart
      });
    }

    if (!user?.dietType) {
      missingFields.push({
        field: "Tipo de alimentação",
        description: "Importante para recomendações personalizadas",
        icon: Heart
      });
    }

    if (!user?.sleepHours) {
      missingFields.push({
        field: "Horas de sono",
        description: "Essencial para planejamento de recuperação",
        icon: Heart
      });
    }

    if (!user?.stressLevel) {
      missingFields.push({
        field: "Nível de estresse",
        description: "Influencia na intensidade dos treinos",
        icon: Heart
      });
    }

    if (!user?.preferredWorkoutTime) {
      missingFields.push({
        field: "Horário preferido",
        description: "Para otimizar seus treinos",
        icon: Clock
      });
    }

    if (!user?.availableDaysPerWeek || user.availableDaysPerWeek <= 0) {
      missingFields.push({
        field: "Dias disponíveis",
        description: "Quantos dias por semana você pode treinar",
        icon: Calendar
      });
    }

    if (!user?.averageWorkoutDuration) {
      missingFields.push({
        field: "Duração dos treinos",
        description: "Tempo médio que você tem para treinar",
        icon: Clock
      });
    }

    if (!user?.preferredLocation) {
      missingFields.push({
        field: "Local preferido",
        description: "Onde você prefere treinar",
        icon: Target
      });
    }

    return missingFields;
  };

  const missingFields = getMissingFields();
  const totalFields = 16; // Total de campos obrigatórios
  const completionPercentage = Math.round(((totalFields - missingFields.length) / totalFields) * 100);

  // Se não há campos faltando, não exibir o card
  if (missingFields.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Complete seu perfil
                </h3>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <div className="mb-3">
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                  Finalize suas informações para receber treinos personalizados pela IA.
                </p>
                <div className="flex items-center space-x-2 mb-2">
                  <Progress value={completionPercentage} className="flex-1 h-2" />
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    {completionPercentage}%
                  </span>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  {missingFields.length} {missingFields.length === 1 ? 'campo faltando' : 'campos faltando'}
                </p>
              </div>

              <CollapsibleContent>
                <div className="space-y-3 mb-4">
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Informações necessárias:
                  </h4>
                  {missingFields.map((field, index) => {
                    const Icon = field.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                            {field.field}
                          </p>
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            {field.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>

              <Link href="/onboarding">
                <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  Completar Onboarding
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showSuccess, showError, showWarning, showWorkoutSuccess, showWorkoutError } = useGlobalNotification();
  const queryClient = useQueryClient();
  const [expandedTodaysWorkout, setExpandedTodaysWorkout] = useState(false);
  const [expandedUpcomingWorkout, setExpandedUpcomingWorkout] = useState<number | null>(null);
  const [expandedStatsCard, setExpandedStatsCard] = useState<string | null>(null);
  const [expandedWeeklyProgress, setExpandedWeeklyProgress] = useState(false);
  const [expandedCaloriesCard, setExpandedCaloriesCard] = useState(false);

  const hasCompletedOnboarding = user?.onboardingCompleted || false;

  // Fetch scheduled workouts from database
  const { data: scheduledWorkouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ["scheduled-workouts"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/scheduled-workouts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar treinos programados');
      }
      
      return response.json();
    },
    enabled: hasCompletedOnboarding,
  });

  // Fetch workout sessions for statistics
  const { data: workoutSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["workout-sessions"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/workout-sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar sessões de treino');
      }
      
      return response.json();
    },
    enabled: hasCompletedOnboarding,
  });

  // AI workout generation mutation
  const generateWorkoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/n8n/sync-user-data", "POST");
    },
    onSuccess: (data) => {
      showWorkoutSuccess(5000);
      // Invalidate all scheduled workouts queries
      queryClient.invalidateQueries({ queryKey: ["scheduled-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-workouts"] });
    },
    onError: (error) => {
      showWorkoutError(5000);
    },
  });

  const completedWorkouts = Array.isArray(workoutSessions) ? workoutSessions.filter((session: any) => session.completedAt).length : 0;
  const currentStreak = 7; // Calculate based on consecutive workout days
  const hasWorkoutsAvailable = Array.isArray(scheduledWorkouts) && scheduledWorkouts.length > 0;
  const todaysWorkout = Array.isArray(scheduledWorkouts) && scheduledWorkouts.length > 0 ? scheduledWorkouts[0] : null;

  const toggleUpcomingWorkout = (workoutId: number) => {
    setExpandedUpcomingWorkout(expandedUpcomingWorkout === workoutId ? null : workoutId);
  };

  const toggleStatsCard = (cardId: string) => {
    setExpandedStatsCard(expandedStatsCard === cardId ? null : cardId);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">Olá, {user?.name?.split(' ')[0] || 'usuário'}!</h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso e veja seus treinos planejados
        </p>
      </div>

      {/* Status Alerts */}
      {(!hasCompletedOnboarding || (user && !user.onboardingCompleted)) && (
        <OnboardingCard user={user} />
      )}

      

      {/* Quick Stats */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {expandedStatsCard !== 'streak' && (
            <Card 
              className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                expandedStatsCard === 'workouts' ? 'col-span-2' : ''
              }`}
              onClick={() => toggleStatsCard('workouts')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Treinos Concluídos</span>
                  <div className="flex items-center gap-1">
                    <FitnessIcon className="h-3 w-3" />
                    {expandedStatsCard === 'workouts' ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <span className="text-xl font-bold">{completedWorkouts}</span>
                {completedWorkouts > 0 && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    +3 esta semana
                  </Badge>
                )}

                {/* Expanded Content */}
                {expandedStatsCard === 'workouts' && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Esta semana:</span>
                      <span className="font-medium">3 treinos</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Este mês:</span>
                      <span className="font-medium">12 treinos</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Média/semana:</span>
                      <span className="font-medium">2.8 treinos</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Maior sequência:</span>
                      <span className="font-medium text-orange-600">14 dias</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Treino favorito:</span>
                      <span className="font-medium">Pernas</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {expandedStatsCard !== 'workouts' && (
            <Card 
              className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                expandedStatsCard === 'streak' ? 'col-span-2' : ''
              }`}
              onClick={() => toggleStatsCard('streak')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Sequência Atual</span>
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {expandedStatsCard === 'streak' ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">{currentStreak} dias</span>
                  {currentStreak >= 7 && (
                    <Badge variant="destructive" className="text-xs">
                      Em chamas!
                    </Badge>
                  )}
                </div>

                {/* Expanded Content */}
                {expandedStatsCard === 'streak' && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Iniciou em:</span>
                      <span className="font-medium">05/01/2025</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Próxima meta:</span>
                      <span className="font-medium text-blue-600">10 dias</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Recorde pessoal:</span>
                      <span className="font-medium text-green-600">14 dias</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Último treino:</span>
                      <span className="font-medium">Hoje</span>
                    </div>
                    <div className="w-full mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progresso até 10 dias</span>
                        <span className="font-medium">70%</span>
                      </div>
                      <Progress value={70} className="h-1" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>


      </div>

      {/* Extended Stats */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {expandedStatsCard !== 'time' && (
            <Card 
              className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                expandedStatsCard === 'calories' ? 'col-span-2' : ''
              }`}
              onClick={() => toggleStatsCard('calories')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Calorias Queimadas</span>
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-red-500" />
                    {expandedStatsCard === 'calories' ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <span className="text-xl font-bold">{hasCompletedOnboarding ? "1,845" : "0"}</span>
                {hasCompletedOnboarding && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Esta semana
                  </Badge>
                )}

                {/* Expanded Content */}
                {expandedStatsCard === 'calories' && hasCompletedOnboarding && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Hoje:</span>
                      <span className="font-medium">420 kcal</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Ontem:</span>
                      <span className="font-medium">385 kcal</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Média/dia:</span>
                      <span className="font-medium">263 kcal</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Meta semanal:</span>
                      <span className="font-medium text-blue-600">2,100 kcal</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Maior queima:</span>
                      <span className="font-medium text-orange-600">520 kcal</span>
                    </div>
                    <div className="w-full mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Meta semanal</span>
                        <span className="font-medium">88%</span>
                      </div>
                      <Progress value={88} className="h-1" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {expandedStatsCard !== 'calories' && (
            <Card 
              className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                expandedStatsCard === 'time' ? 'col-span-2' : ''
              }`}
              onClick={() => toggleStatsCard('time')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Tempo Total</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-500" />
                    {expandedStatsCard === 'time' ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <span className="text-xl font-bold">{hasCompletedOnboarding ? "18h" : "0h"}</span>
                {hasCompletedOnboarding && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Este mês
                  </Badge>
                )}

                {/* Expanded Content */}
                {expandedStatsCard === 'time' && hasCompletedOnboarding && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Esta semana:</span>
                      <span className="font-medium">2h 15min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Último treino:</span>
                      <span className="font-medium">45min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Média/treino:</span>
                      <span className="font-medium">45min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Maior treino:</span>
                      <span className="font-medium text-green-600">1h 20min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Meta mensal:</span>
                      <span className="font-medium text-blue-600">20h</span>
                    </div>
                    <div className="w-full mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Meta mensal</span>
                        <span className="font-medium">90%</span>
                      </div>
                      <Progress value={90} className="h-1" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Weekly Progress */}
      {hasCompletedOnboarding && (
        <Card 
          className="cursor-pointer transition-all duration-200"
          onClick={() => setExpandedWeeklyProgress(!expandedWeeklyProgress)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Progresso da Semana
              </div>
              {expandedWeeklyProgress ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Meta Semanal</span>
                <span className="text-muted-foreground">3/3 treinos</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Calorias</p>
                <p className="text-sm font-semibold">645 kcal</p>
                <div className="w-full bg-muted rounded-full h-1">
                  <div className="bg-red-500 h-1 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tempo</p>
                <p className="text-sm font-semibold">2h 15min</p>
                <div className="w-full bg-muted rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Exercícios</p>
                <p className="text-sm font-semibold">15</p>
                <div className="w-full bg-muted rounded-full h-1">
                  <div className="bg-green-500 h-1 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedWeeklyProgress && (
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                <h4 className="font-semibold text-sm">Detalhes Semanais</h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Segunda-feira</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Pernas - 45min</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Terça-feira</span>
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Descanso</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Quarta-feira</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Peito - 50min</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Quinta-feira</span>
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Descanso</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sexta-feira</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Costas - 40min</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sábado</span>
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Descanso</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Domingo</span>
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Descanso</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Resumo da Semana</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de calorias:</span>
                      <span className="font-medium">1,845 kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tempo total:</span>
                      <span className="font-medium">2h 15min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exercícios únicos:</span>
                      <span className="font-medium">15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Grupos musculares:</span>
                      <span className="font-medium">8</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Today's Workout */}
      {hasCompletedOnboarding && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Treino de Hoje</h2>
            <Button
              onClick={() => generateWorkoutMutation.mutate()}
              disabled={generateWorkoutMutation.isPending}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {generateWorkoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Atualizar treino
                </>
              )}
            </Button>
          </div>
          
          {workoutsLoading ? (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-blue-800 dark:text-blue-200">Carregando treino...</span>
                </div>
              </CardContent>
            </Card>
          ) : hasWorkoutsAvailable && todaysWorkout ? (
            <Card 
              className="cursor-pointer transition-all duration-200 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
              onClick={() => setExpandedTodaysWorkout(!expandedTodaysWorkout)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-blue-800 dark:text-blue-200">{todaysWorkout.name}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {todaysWorkout.exercises?.length || 0} exercícios • {todaysWorkout.totalDuration || 0} min • {todaysWorkout.totalCalories || 0} kcal
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-white">Hoje</Badge>
                    {expandedTodaysWorkout ? (
                      <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <Link href="/active-workout">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Play className="mr-2 h-4 w-4" />
                      Ir para treino
                    </Button>
                  </Link>
                  <div className="text-right">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Recomendado pela IA</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Baseado no seu progresso</p>
                  </div>
                </div>

                {/* Expanded Exercise Details */}
                {expandedTodaysWorkout && (
                  <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <h4 className="font-semibold text-sm mb-3 text-blue-800 dark:text-blue-200">Exercícios do Treino</h4>
                    <div className="space-y-2">
                      {todaysWorkout.exercises?.map((exercise: any, index: number) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between py-2 px-3 rounded-md bg-blue-100 dark:bg-blue-900/30"
                        >
                          <div className="flex-1">
                            <div className="flex flex-col">
                              <h5 className="font-medium text-sm text-blue-800 dark:text-blue-200">
                                {exercise.exercise}
                              </h5>
                              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                {exercise.series} séries × {exercise.repetitions} reps
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                {exercise.instructions}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-3">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {exercise.weight > 0 ? `${exercise.weight}kg` : 'Peso corporal'}
                            </span>
                            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center justify-end">
                              <Flame className="mr-1 h-2 w-2" />
                              {exercise.calories} kcal
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">
                      Nenhum treino encontrado
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Clique em "Atualizar IA" para gerar um novo treino personalizado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Upcoming Workouts */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Próximos Treinos</h2>
        <div className="space-y-2">
          {mockUpcomingWorkouts.map((workout) => (
            <Card 
              key={workout.id} 
              className="cursor-pointer transition-all duration-200"
              onClick={() => toggleUpcomingWorkout(workout.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{workout.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {workout.date} • {workout.exercises.length} exercícios • {workout.difficulty}
                    </p>
                  </div>
                  {expandedUpcomingWorkout === workout.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Expanded Exercise Details */}
                {expandedUpcomingWorkout === workout.id && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <h4 className="font-semibold text-sm mb-3 text-foreground">Exercícios do Treino</h4>
                    <div className="space-y-2">
                      {workout.exercises.map((exercise, index) => (
                        <div 
                          key={exercise.id} 
                          className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30"
                        >
                          <div className="flex-1">
                            <div className="flex flex-col">
                              <h5 className="font-medium text-sm text-foreground">
                                {exercise.name}
                              </h5>
                              <p className="text-xs text-muted-foreground mt-1">
                                {exercise.sets} séries × {exercise.reps} reps
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {exercise.instructions}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-3">
                            <span className="text-sm font-semibold text-primary">
                              {exercise.weight}
                            </span>
                            <p className="text-xs text-muted-foreground flex items-center justify-end">
                              <Clock className="mr-1 h-2 w-2" />
                              {exercise.restTime}s
                            </p>
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
      </div>
    </div>
  );
}