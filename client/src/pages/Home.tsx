
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Plus, Dumbbell, User, Trophy, TrendingUp, CheckCircle, AlertCircle, BarChart3, Calendar, Target, Zap, ChevronDown, ChevronUp, X, Scale, Heart, Flame, Play } from "lucide-react";
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
  const [expandedTodaysWorkout, setExpandedTodaysWorkout] = useState(false);
  const [expandedUpcomingWorkout, setExpandedUpcomingWorkout] = useState<number | null>(null);

  // Simulate user onboarding status and workout data
  const hasCompletedOnboarding = user?.onboardingCompleted || false;
  const hasWorkoutsAvailable = true; // This would come from API
  const completedWorkouts = hasCompletedOnboarding ? 24 : 0;
  const currentStreak = hasCompletedOnboarding ? 7 : 0;

  const toggleUpcomingWorkout = (workoutId: number) => {
    setExpandedUpcomingWorkout(expandedUpcomingWorkout === workoutId ? null : workoutId);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">Olá, {user?.name?.split(' ')[0] || 'usuário'}!</h1>
        <p className="text-muted-foreground">
          {user?.gender === "female" ? "Pronta" : "Pronto"} para iniciar seu treino?
        </p>
      </div>

      {/* Status Alerts */}
      {(!hasCompletedOnboarding || (user && !user.onboardingCompleted)) && (
        <OnboardingCard user={user} />
      )}

      {hasCompletedOnboarding && !hasWorkoutsAvailable && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  IA preparando seus treinos
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Aguarde enquanto nossa IA cria treinos personalizados baseados no seu perfil.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {completedWorkouts === 0 && hasCompletedOnboarding && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  Bem-vindo ao PulseOn!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Seu primeiro treino personalizado está pronto. Vamos começar!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Treinos Concluídos</span>
              <FitnessIcon className="h-3 w-3" />
            </div>
            <span className="text-xl font-bold">{completedWorkouts}</span>
            {completedWorkouts > 0 && (
              <Badge variant="secondary" className="mt-1 text-xs">
                +3 esta semana
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Sequência Atual</span>
              <Flame className="h-3 w-3 text-orange-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">{currentStreak} dias</span>
              {currentStreak >= 7 && (
                <Badge variant="destructive" className="text-xs">
                  Em chamas!
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Treino de Hoje</h2>
        <Card className="bg-slate-50 dark:bg-slate-900 light:bg-slate-100/80 cursor-pointer transition-all duration-200">
          <CardContent className="p-4">
            <div 
              className="mb-3"
              onClick={() => setExpandedTodaysWorkout(!expandedTodaysWorkout)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">{mockTodaysWorkout.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className="bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-full text-xs text-primary">
                    {mockTodaysWorkout.duration} min
                  </span>
                  {expandedTodaysWorkout ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                {mockTodaysWorkout.exercises.length} exercícios • Nível {mockTodaysWorkout.difficulty}
              </p>
            </div>

            {/* Expanded Exercise Details */}
            {expandedTodaysWorkout && (
              <div className="mb-4 pt-3 border-t border-border">
                <h4 className="font-semibold text-sm mb-3 text-foreground">Exercícios do Treino</h4>
                <div className="space-y-2">
                  {mockTodaysWorkout.exercises.map((exercise, index) => (
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
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Clock className="mr-1 h-2 w-2" />
                          {exercise.restTime}s
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                            <p className="text-xs text-muted-foreground flex items-center">
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
