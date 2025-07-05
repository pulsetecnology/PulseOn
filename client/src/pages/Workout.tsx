import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Play, Clock, Target, List, CheckCircle2, Timer, Plus, Minus, Pause, RotateCcw, ChevronRight, Loader2, X } from "lucide-react";
import { Link } from "wouter";
import { useGlobalNotification } from "@/components/NotificationProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id?: string;
  exercise: string;
  muscleGroup: string;
  type: string;
  instructions: string;
  time: number;
  timeExec?: number;
  series: number;
  repetitions: number;
  restBetweenSeries: number;
  restBetweenExercises: number;
  weight: number;
  calories: number;
}

interface ScheduledWorkout {
  id: number;
  userId: number;
  name: string;
  exercises: Exercise[];
  totalCalories: number;
  totalDuration: number;
  status: string;
  createdAt: string;
  scheduledFor?: string;
}

// Fetch scheduled workouts
const fetchScheduledWorkouts = async (): Promise<ScheduledWorkout[]> => {
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
};

export default function Workout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: scheduledWorkouts, isLoading, error } = useQuery({
    queryKey: ['scheduled-workouts'],
    queryFn: fetchScheduledWorkouts,
  });

  // Fetch user data for body weight
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('/api/auth/me'),
  });

  // Fetch workout sessions to check for completed workouts
  const { data: workoutSessions } = useQuery({
    queryKey: ['/api/workout-sessions'],
    queryFn: () => apiRequest('/api/workout-sessions'),
  });

  // AI workout generation mutation
  const generateWorkoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/ai/generate-workout", "POST");
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Novo treino gerado com sucesso!",
        duration: 3000,
      });
      // Invalidate all scheduled workouts queries
      queryClient.invalidateQueries({ queryKey: ["scheduled-workouts"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao gerar novo treino. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const todaysWorkout = scheduledWorkouts?.[0]; // Get the most recent workout
  
  // Função para gerar chave única do treino baseada na data
  const getWorkoutStorageKey = () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return `workout_progress_${user?.id}_${today}`;
  };

  // Carregar progresso salvo do localStorage
  const loadSavedProgress = () => {
    if (!user?.id) return { completedExercises: new Set(), exerciseData: {}, workoutId: null, incompleteExercises: new Set() };
    
    const storageKey = getWorkoutStorageKey();
    const saved = localStorage.getItem(storageKey);
    
    console.log("Progresso carregado do localStorage:", saved ? JSON.parse(saved) : { completedExercises: {}, exerciseData: {}, workoutId: null, incompleteExercises: {} });
    
    if (saved) {
      const data = JSON.parse(saved);
      return {
        completedExercises: new Set(data.completedExercises || []),
        exerciseData: data.exerciseData || {},
        workoutId: data.workoutId || null,
        incompleteExercises: new Set(data.incompleteExercises || [])
      };
    }
    
    console.log("Progresso limpo - novo treino ou sem progresso");
    return { completedExercises: new Set(), exerciseData: {}, workoutId: null, incompleteExercises: new Set() };
  };

  // Salvar progresso no localStorage
  const saveProgress = (completed: Set<string>, exerciseData: any, incompleteExercises: string[] = []) => {
    if (!user?.id) return;
    
    const storageKey = getWorkoutStorageKey();
    const dataToSave = {
      completedExercises: Array.from(completed),
      exerciseData,
      lastUpdate: new Date().toISOString(),
      workoutId: todaysWorkout?.id,
      incompleteExercises
    };
    
    console.log("Salvando progresso:", dataToSave);
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  };

  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [incompleteExercises, setIncompleteExercises] = useState<Set<string>>(new Set());
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [weight, setWeight] = useState(40);
  const [effortLevel, setEffortLevel] = useState([7]);
  const [restTime, setRestTime] = useState(90);
  const [isResting, setIsResting] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showSetFeedback, setShowSetFeedback] = useState(false);
  const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);
  const { showWorkoutSuccess } = useGlobalNotification();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Carregar progresso salvo quando user e todaysWorkout estão disponíveis
  useEffect(() => {
    if (user?.id && todaysWorkout && workoutSessions) {
      // Primeiro, verificar se já existe uma sessão completa para este treino
      const existingSession = workoutSessions.find((session: any) => 
        session.scheduledWorkoutId === todaysWorkout.id && 
        (session.status === 'completed' || session.status === 'completed-partial')
      );

      if (existingSession) {
        // Se já existe uma sessão concluída, marcar todos os exercícios como concluídos
        const completedExerciseIds = existingSession.exercises?.map((ex: any) => ex.exerciseId || ex.exerciseName) || [];
        setCompletedExercises(new Set(completedExerciseIds));
      } else {
        // Se não existe sessão concluída, carregar progresso do localStorage
        const progress = loadSavedProgress();
        if (progress.workoutId === todaysWorkout.id) {
          setCompletedExercises(progress.completedExercises as Set<string>);
          setIncompleteExercises(progress.incompleteExercises as Set<string>);
        } else {
          // Se não há progresso ou é de outro treino, inicializar vazio
          setCompletedExercises(new Set());
          setIncompleteExercises(new Set());
          // Limpar progresso antigo se for um novo treino
          if (progress.workoutId && progress.workoutId !== todaysWorkout.id) {
            const storageKey = getWorkoutStorageKey();
            localStorage.removeItem(storageKey);
          }
        }
      }
    }
  }, [user?.id, todaysWorkout?.id, workoutSessions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatExerciseTime = (timeExec: number) => {
    if (timeExec >= 60) {
      const minutes = Math.floor(timeExec / 60);
      const seconds = timeExec % 60;
      return seconds > 0 ? `${minutes}min ${seconds}s` : `${minutes}min`;
    }
    return `${timeExec}s`;
  };

  // Função para fazer scroll até o card ativo posicionando logo abaixo do header
  const scrollToActiveExercise = (exerciseId: string) => {
    setTimeout(() => {
      const activeCard = document.getElementById(`exercise-${exerciseId}`);
      if (activeCard) {
        // Calcular posição do header fixo (assumindo altura de ~64px)
        const headerHeight = 80; 
        const elementPosition = activeCard.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 200); // Pequeno delay para permitir que o card seja renderizado
  };



  const startIndividualExercise = (exerciseId: string) => {
    const exercise = todaysWorkout?.exercises?.find(ex => (ex.id || ex.exercise) === exerciseId);
    if (exercise) {
      setActiveExercise(exerciseId);
      setCurrentSet(1);
      // Se for peso corporal (weight = 0), usar peso do usuário, senão usar peso do equipamento
      const initialWeight = exercise.weight === 0 ? (user?.weight || 70) : (exercise.weight || 40);
      setWeight(initialWeight);
      setEffortLevel([7]);
      setRestTime(exercise.restBetweenSeries || 90);
      setIsResting(false);
      setIsTimerRunning(false);
      setShowSetFeedback(false);
      
      // Marcar exercício como incompleto quando iniciado (se não já estava completo)
      if (!completedExercises.has(exerciseId)) {
        setIncompleteExercises(prev => {
          const newSet = new Set(prev);
          newSet.add(exerciseId);
          // Salvar progresso com exercício incompleto
          saveProgress(completedExercises, {}, Array.from(newSet));
          return newSet;
        });
      }
      
      // Auto-scroll para o exercício ativo
      scrollToActiveExercise(exerciseId);
    }
  };

  const completeSet = () => {
    const exercise = todaysWorkout?.exercises?.find(ex => (ex.id || ex.exercise) === activeExercise);
    if (!exercise) return;

    showWorkoutSuccess();
    setShowSetFeedback(true);

    setTimeout(() => {
      setShowSetFeedback(false);

      if (currentSet < exercise.series) {
        setCurrentSet(currentSet + 1);
        setIsResting(true);
        setRestTime(exercise.restBetweenSeries || 90);
        setIsTimerRunning(true);
      } else {
        // Exercise completed
        setCompletedExercises(prev => {
          const newSet = new Set(prev);
          newSet.add(activeExercise!);
          
          // Remover dos exercícios incompletos já que foi concluído
          setIncompleteExercises(prevIncomplete => {
            const newIncompleteSet = new Set(prevIncomplete);
            newIncompleteSet.delete(activeExercise!);
            
            // Salvar progresso no localStorage
            const exerciseData = {
              weight,
              effortLevel: effortLevel[0],
              completedAt: new Date().toISOString()
            };
            saveProgress(newSet, { [activeExercise!]: exerciseData }, Array.from(newIncompleteSet));
            
            return newIncompleteSet;
          });
          
          // Verificar se este é o último exercício
          const totalExercises = todaysWorkout?.exercises?.length || 0;
          const completedCount = newSet.size;
          
          if (completedCount >= totalExercises) {
            // Último exercício concluído - mostrar "Finalizando treino..." e scroll para o topo
            setIsFinishingWorkout(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
              finishIndividualWorkoutWithSet(newSet);
            }, 2000); // Pequeno delay para mostrar sucesso do exercício
          } else {
            // Scroll para o topo após completar exercício
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          
          return newSet;
        });
        setActiveExercise(null);
        setCurrentSet(1);
        showWorkoutSuccess();
      }
    }, 1500);
  };

  // Função para finalizar treino antecipadamente
  const finishWorkoutEarly = async () => {
    if (!todaysWorkout || !user?.id) return;

    try {
      // Criar array de exercícios concluídos para salvar no banco
      const completedExercisesList = Array.from(completedExercises).map(exerciseId => {
        const exercise = todaysWorkout.exercises?.find(ex => (ex.id || ex.exercise) === exerciseId);
        if (!exercise) return null;
        
        return {
          exerciseId: exerciseId,
          exerciseName: exercise.exercise,
          muscleGroup: exercise.muscleGroup,
          sets: exercise.series,
          reps: exercise.repetitions,
          weight: exercise.weight || 0,
          effortLevel: 7, // Valor padrão
          completed: true,
          time: exercise.timeExec || exercise.time,
          calories: exercise.calories || 0
        };
      }).filter(Boolean);

      if (completedExercisesList.length > 0) {
        // Salvar sessão de treino parcial no banco
        await apiRequest('/api/workout-sessions', 'POST', {
          scheduledWorkoutId: todaysWorkout.id,
          exercises: completedExercisesList,
          status: 'completed-partial',
          totalDuration: 0, // Pode ser calculado depois
          totalCalories: completedExercisesList.reduce((sum, ex) => sum + (ex?.calories || 0), 0),
          notes: 'Treino finalizado antecipadamente pelo usuário'
        });
      }

      // Limpar progresso do localStorage
      const storageKey = getWorkoutStorageKey();
      localStorage.removeItem(storageKey);

      // Mostrar notificação de sucesso
      toast({
        title: "Treino Finalizado",
        description: `Treino finalizado com ${completedExercises.size} exercícios concluídos.`,
        duration: 3000,
      });

      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/workout-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-workouts'] });

      // Resetar estado
      setCompletedExercises(new Set());
      setIncompleteExercises(new Set());
      setActiveExercise(null);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar progresso do treino.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const startNextSet = () => {
    setIsResting(false);
    setIsTimerRunning(false);
    setShowSetFeedback(true);
  };

  const finishIndividualWorkoutWithSet = async (exercisesSet?: Set<string>) => {
    if (!todaysWorkout) return;

    // Resetar estado de finalização
    setIsFinishingWorkout(false);

    // Usar o set fornecido ou o estado atual
    const currentCompletedExercises = exercisesSet || completedExercises;

    const startTime = new Date();
    const endTime = new Date();
    const durationMinutes = 1; // Assumir pelo menos 1 minuto

    // Criar exercícios com status diferenciado
    const exercisesList = todaysWorkout.exercises.map(exercise => {
      const exerciseId = exercise.id || exercise.exercise;
      const isCompleted = currentCompletedExercises.has(exerciseId);
      const isIncomplete = incompleteExercises.has(exerciseId);
      
      // Determinar status: completed, incomplete (iniciado mas não finalizado), ou not-started
      let status = 'not-started';
      if (isCompleted) {
        status = 'completed';
      } else if (isIncomplete) {
        status = 'incomplete';
      }
      
      return {
        exercise: exercise.exercise,
        muscleGroup: exercise.muscleGroup,
        type: exercise.type,
        instructions: exercise.instructions,
        time: exercise.time || 0,
        series: exercise.series,
        repetitions: exercise.repetitions || 0,
        restBetweenSeries: exercise.restBetweenSeries,
        restBetweenExercises: exercise.restBetweenExercises,
        weight: exercise.weight || 0,
        calories: exercise.calories,
        actualWeight: exercise.weight || 0,
        actualTime: exercise.time || 0,
        actualCalories: isCompleted ? exercise.calories : 0, // Só contar calorias se completado
        effortLevel: 8, // Valor padrão
        completed: isCompleted,
        status: status, // Adicionar campo de status
        notes: null
      };
    });

    // Calcular calorias apenas dos exercícios completados
    const totalCalories = exercisesList
      .filter((ex: any) => ex.completed)
      .reduce((sum: number, exercise: any) => sum + exercise.calories, 0);

    // Criar objeto de sessão de treino
    const workoutSession = {
      scheduledWorkoutId: todaysWorkout.id,
      workoutName: todaysWorkout.name,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: durationMinutes,
      totalCalories: totalCalories,
      exercisesCompleted: currentCompletedExercises.size,
      status: currentCompletedExercises.size === todaysWorkout.exercises.length ? 'completed' : 'partial',
      notes: null,
      exercises: exercisesList
    };

    try {
      // Salvar no backend
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(workoutSession),
      });

      if (response.ok) {
        console.log('Treino individual salvo no histórico com sucesso');
        showWorkoutSuccess();
        // Redirecionar para histórico
        window.location.href = '/history';
      } else {
        throw new Error('Erro ao salvar no backend');
      }
    } catch (error) {
      console.error('Erro ao salvar treino individual no backend:', error);
      
      // Fallback: salvar no localStorage
      const sessionWithId = {
        ...workoutSession,
        id: Date.now(),
        userId: 1,
        createdAt: endTime.toISOString(),
        updatedAt: endTime.toISOString()
      };

      const existingSessions = JSON.parse(localStorage.getItem('workoutSessions') || '[]');
      existingSessions.unshift(sessionWithId);
      localStorage.setItem('workoutSessions', JSON.stringify(existingSessions));
      console.log('Treino individual salvo no localStorage como fallback');
      showWorkoutSuccess();
      // Redirecionar para histórico
      window.location.href = '/history';
    }
  };

  // Wrapper function for backward compatibility
  const finishIndividualWorkout = () => {
    return finishIndividualWorkoutWithSet();
  };

  // Timer effect
  React.useEffect(() => {
    if (isTimerRunning && restTime > 0) {
      const timer = setTimeout(() => setRestTime(restTime - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (restTime === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setIsResting(false);
      showWorkoutSuccess();
    }
  }, [isTimerRunning, restTime, showWorkoutSuccess]);

  const progressPercentage = todaysWorkout?.exercises ? (completedExercises.size / todaysWorkout.exercises.length) * 100 : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Treinos Programados</h1>
          <p className="text-muted-foreground">
            Carregando seus treinos personalizados...
          </p>
        </div>
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Carregando treinos...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Treinos Programados</h1>
          <p className="text-muted-foreground text-red-500">
            Erro ao carregar treinos: {error.message}
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">Não foi possível carregar seus treinos.</p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No workouts state
  if (!todaysWorkout) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Treinos Programados</h1>
          <p className="text-muted-foreground">
            Nenhum treino encontrado. Sincronize com a IA para gerar treinos personalizados.
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">Você ainda não possui treinos programados.</p>
            <Button 
              onClick={() => generateWorkoutMutation.mutate()}
              disabled={generateWorkoutMutation.isPending}
              className="w-full"
            >
              {generateWorkoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando treino...
                </>
              ) : (
                "Gerar novo treino"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Treinos Programados</h1>
        <p className="text-muted-foreground">
          Seus treinos personalizados estão prontos para serem executados
        </p>
      </div>

      {/* Workout Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">{todaysWorkout.name}</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            {(todaysWorkout as any).description || `Treino personalizado gerado pela IA com ${todaysWorkout.exercises?.length} exercícios`}
          </p>

          {/* Progress Counter */}
          {completedExercises.size > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Exercícios concluídos: {completedExercises.size}/{todaysWorkout.exercises?.length}</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center">
              <List className="mr-1 h-4 w-4" />
              {todaysWorkout.exercises?.length} exercícios
            </span>
            <span className="flex items-center">
              <Target className="mr-1 h-4 w-4" />
              {todaysWorkout.totalCalories} kcal
            </span>
          </div>
          <div className="space-y-3">
            {/* Botão "Iniciar treino completo" foi removido conforme solicitado */}
            
            {/* Botão Finalizar Treino - só aparece se há exercícios completados */}
            {(() => {
              // Verificar se há sessões concluídas para este treino
              const hasCompletedSession = workoutSessions?.some((session: any) => 
                session.scheduledWorkoutId === todaysWorkout?.id && 
                (session.status === 'completed' || session.status === 'completed-partial')
              );

              if (completedExercises.size > 0 && !hasCompletedSession) {
                const totalExercises = todaysWorkout.exercises?.length || 1;
                const completedCount = completedExercises.size;
                const progress = completedCount / totalExercises;
                
                // Cores gradativas baseadas no progresso
                let buttonClass = "";
                if (completedCount === totalExercises) {
                  // Azul para treino completo (desabilitado)
                  buttonClass = "border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20 cursor-not-allowed";
                } else if (progress < 0.33) {
                  // Vermelho para baixo progresso
                  buttonClass = "border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20";
                } else if (progress < 0.66) {
                  // Amarelo para progresso médio
                  buttonClass = "border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20";
                } else {
                  // Verde para alto progresso
                  buttonClass = "border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20";
                }
                
                return (
                  <Button 
                    variant="outline"
                    className={`w-full ${buttonClass} py-3 text-lg font-semibold`}
                    onClick={finishIndividualWorkout}
                    data-finish-button
                    disabled={isFinishingWorkout || completedCount === totalExercises}
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    {isFinishingWorkout ? "Finalizando treino..." : 
                     completedCount === totalExercises ? "Treino Completo" : 
                     `Finalizar Treino (${completedCount}/${totalExercises} exercícios)`}
                  </Button>
                );
              }
              return null;
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Exercícios</h2>
        {todaysWorkout.exercises?.map((exercise, index) => {
          const exerciseId = exercise.id || exercise.exercise;
          return (
            <div key={exerciseId}>
              <Card id={`exercise-${exerciseId}`} className={`${completedExercises.has(exerciseId) ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : ''} ${activeExercise === exerciseId ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 ring-2 ring-primary' : ''}`}>
                <CardContent className="p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1">
                      <h3 className="font-semibold text-xs">{exercise.exercise}</h3>
                      {completedExercises.has(exerciseId) && (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {exercise.series}x{exercise.repetitions > 0 ? exercise.repetitions : formatExerciseTime(exercise.timeExec || exercise.time || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Peso: {exercise.weight > 0 ? `${exercise.weight}kg` : 'Peso corporal'}</span>
                    <span className="flex items-center">
                      <Clock className="mr-0.5 h-2 w-2" />
                      {exercise.restBetweenSeries}s
                    </span>
                  </div>
                  <div className="mb-1">
                    <p className="text-xs text-muted-foreground">{exercise.instructions}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                      {exercise.muscleGroup}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                      {exercise.type}
                    </Badge>
                  </div>
                  {!completedExercises.has(exerciseId) ? (
                    <Button 
                      className="w-full" 
                      variant={activeExercise === exerciseId ? "secondary" : "default"}
                      onClick={() => startIndividualExercise(exerciseId)}
                      disabled={activeExercise !== null && activeExercise !== exerciseId}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {activeExercise === exerciseId ? "Exercício ativo" : "Iniciar este exercício"}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      disabled
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Exercício concluído
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Card de Execução - aparece logo abaixo do exercício ativo */}
              {activeExercise === exerciseId && (
                <Card id="execution-card" className="bg-primary dark:bg-primary border-0 animate-in slide-in-from-top duration-300 mt-4">
                  <CardContent className="p-4">
                    <div className="text-center text-primary-foreground mb-4 relative">
                      {/* Botão de cancelar no canto superior direito */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Se o exercício foi cancelado, remover dos incompletos
                          if (activeExercise && !completedExercises.has(activeExercise)) {
                            setIncompleteExercises(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(activeExercise);
                              // Salvar progresso sem o exercício cancelado
                              saveProgress(completedExercises, {}, Array.from(newSet));
                              return newSet;
                            });
                          }
                          
                          setActiveExercise(null);
                          setCurrentSet(1);
                          setIsResting(false);
                          setIsTimerRunning(false);
                          setShowSetFeedback(false);
                        }}
                        className="absolute -top-2 -right-2 h-8 w-8 p-0 text-primary-foreground hover:bg-white/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      <h3 className="text-lg font-semibold">Série {currentSet} de {exercise.series}</h3>
                      <p className="text-sm opacity-90">
                        {exercise.repetitions > 0 
                          ? `${exercise.repetitions} repetições` 
                          : `${formatExerciseTime(exercise.timeExec || exercise.time || 0)}`}
                      </p>
                    </div>

                    {!showSetFeedback && !isResting && (
                      <div className="text-center space-y-3">
                        <p className="opacity-90">Execute o exercício</p>
                        <Button 
                          onClick={() => setShowSetFeedback(true)}
                          className="bg-white text-primary hover:bg-gray-100 dark:bg-white dark:text-primary"
                        >
                          Concluir Série
                          <CheckCircle2 className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {showSetFeedback && (
                      <div className="space-y-2">
                        {/* Weight Input */}
                        <div className="bg-white/20 rounded-lg p-2">
                          <h3 className="font-semibold mb-1 text-sm">Peso utilizado</h3>
                          {(() => {
                            const exercise = todaysWorkout?.exercises?.find(ex => (ex.id || ex.exercise) === activeExercise);
                            const isBodyWeight = exercise?.weight === 0;
                            const userWeight = user?.weight || 70; // Default 70kg if not available
                            
                            if (isBodyWeight) {
                              return (
                                <div className="text-center">
                                  <div className="text-xl font-bold">{userWeight}</div>
                                  <div className="text-xs opacity-75">kg (peso corporal)</div>
                                  <div className="text-xs opacity-60 mt-1">
                                    Peso fixo do seu perfil
                                  </div>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs opacity-75">
                                  <span>0 kg</span>
                                  <span>200 kg</span>
                                </div>
                                <Slider
                                  value={[weight]}
                                  onValueChange={(value) => setWeight(value[0])}
                                  max={200}
                                  min={0}
                                  step={2.5}
                                  className="w-full"
                                />
                                <div className="text-center">
                                  <span className="text-sm font-semibold">
                                    {weight} kg
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Effort Level */}
                        <div className="bg-white/20 rounded-lg p-2">
                          <h3 className="font-semibold mb-1 text-sm">Nível de esforço</h3>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs opacity-75">
                              <span>Suave</span>
                              <span>Intenso</span>
                            </div>
                            <Slider
                              value={effortLevel}
                              onValueChange={setEffortLevel}
                              max={10}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                            <div className="text-center">
                              <span className="text-sm font-semibold">
                                Esforço: {effortLevel[0]}/10
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={completeSet}
                          className="w-full bg-white text-primary hover:bg-gray-100 dark:bg-white dark:text-primary mb-3"
                        >
                          Confirmar e prosseguir
                        </Button>

                        {/* Botão para marcar exercício como incompleto */}
                        <Button 
                          onClick={() => {
                            if (!activeExercise) return;
                            
                            // Marcar exercício como incompleto (diferente de não executado)
                            setIncompleteExercises(prev => {
                              const newSet = new Set(prev);
                              newSet.add(activeExercise);
                              return newSet;
                            });
                            
                            // Salvar progresso
                            const currentIncompleteArray: string[] = [];
                            incompleteExercises.forEach(item => currentIncompleteArray.push(item));
                            currentIncompleteArray.push(activeExercise);
                            saveProgress(completedExercises, {}, currentIncompleteArray);
                            
                            // Resetar estado do exercício
                            setActiveExercise(null);
                            setCurrentSet(1);
                            setIsResting(false);
                            setIsTimerRunning(false);
                            setShowSetFeedback(false);
                            
                            // Scroll para o topo para ver o próximo exercício
                            scrollToActiveExercise('top');
                          }}
                          variant="outline"
                          className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-950"
                        >
                          Não Consigo Continuar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Timer de Descanso - aparece logo abaixo do card de execução */}
              {isResting && activeExercise === exerciseId && (
                <Card className="bg-orange-500 dark:bg-orange-600 border-0 animate-in slide-in-from-top duration-300 mt-4">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-white/20 rounded-full p-2">
                          <Timer className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Descanso entre séries</p>
                          <p className="text-2xl font-bold text-white">{formatTime(restTime)}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                          >
                            {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button 
                            onClick={() => setRestTime(exercise.restBetweenSeries || 90)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button 
                          onClick={startNextSet}
                          size="sm"
                          className="bg-white/20 text-white hover:bg-white/30 text-xs px-3 py-1 rounded-full"
                        >
                          Próxima Série
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}
      </div>



    </div>
  );
}