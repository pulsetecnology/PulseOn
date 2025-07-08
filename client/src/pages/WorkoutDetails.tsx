import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useParams } from "wouter";
import { ArrowLeft, Clock, Flame, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { WorkoutSession } from "@shared/schema";

export default function WorkoutDetails() {
  const [, setLocation] = useLocation();

  const formatExerciseTime = (timeExec: number) => {
    if (timeExec >= 60) {
      const minutes = Math.floor(timeExec / 60);
      const seconds = timeExec % 60;
      return seconds > 0 ? `${minutes}min ${seconds}s` : `${minutes}min`;
    }
    return `${timeExec}s`;
  };
  const params = useParams();
  const sessionId = params.id;

  const { data: session, isLoading } = useQuery<WorkoutSession>({
    queryKey: [`/api/workout-sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md mx-auto text-center mt-20">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Treino não encontrado
          </h1>
          <Button onClick={() => setLocation("/history")}>
            Voltar ao Histórico
          </Button>
        </div>
      </div>
    );
  }

  const exercises = Array.isArray(session.exercises) ? session.exercises : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/history")}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {session.name}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {session.completedAt ? format(new Date(session.completedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                }) : "Data não disponível"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {session.totalDuration}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Minutos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {session.totalCalories}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Calorias</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {exercises.length}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Exercícios</p>
            </CardContent>
          </Card>
        </div>

        {/* Completion Badge */}
        <div className="text-center">
          <Badge variant="default" className="bg-green-600 text-white px-4 py-2">
            <Trophy className="h-4 w-4 mr-2" />
            Treino Concluído
          </Badge>
        </div>

        {/* Exercises */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Exercícios Realizados
          </h2>

          {exercises.map((exercise: any, index: number) => (
            <Card key={index} className="border border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-900 dark:text-white">
                  {exercise.exercise}
                </CardTitle>
                <Badge variant="outline" className="w-fit">
                  {exercise.muscleGroup}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Séries</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {exercise.series}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">
                      {exercise.repetitions > 0 ? "Repetições" : "Tempo de Execução"}
                    </p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {exercise.repetitions > 0 ? exercise.repetitions : (exercise.timeExec ? formatExerciseTime(exercise.timeExec) : `${exercise.time}s`)}
                    </p>
                  </div>
                  {exercise.weight > 0 && (
                    <>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Peso Planejado</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {exercise.weight}kg
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Peso Usado</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {exercise.actualWeight || exercise.weight}kg
                        </p>
                      </div>
                    </>
                  )}
                  {exercise.time > 0 && (
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Tempo</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {exercise.time} min
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Esforço</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {exercise.effortLevel || 5}/10
                    </p>
                  </div>
                </div>

                {exercise.completed && (
                  <Badge variant="default" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    ✓ Concluído
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Notes */}
        {session.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-slate-900 dark:text-white">
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 dark:text-slate-300">{session.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={() => setLocation("/history")}
            className="w-full"
            variant="outline"
          >
            Voltar ao Histórico
          </Button>

          <Button
            onClick={() => setLocation("/workout")}
            className="w-full"
          >
            Novo Treino
          </Button>
        </div>
      </div>
    </div>
  );
}