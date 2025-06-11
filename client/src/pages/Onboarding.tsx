import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { onboardingSchema, type OnboardingData } from "@shared/schema";
import { Scale, Dumbbell, Heart, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      age: 0,
      weight: 0,
      height: 0,
      fitnessGoal: undefined,
      experienceLevel: undefined,
      weeklyFrequency: 0,
      availableEquipment: [],
      physicalRestrictions: ""
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      return apiRequest(`/api/users/${user.id}`, "PATCH", { 
        ...data, 
        onboardingCompleted: true 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Onboarding concluído!",
        description: "Seu perfil foi configurado com sucesso"
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar dados",
        variant: "destructive"
      });
    }
  });

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEquipmentToggle = (equipment: string) => {
    const currentEquipment = form.getValues("availableEquipment");
    const newEquipment = currentEquipment.includes(equipment)
      ? currentEquipment.filter(e => e !== equipment)
      : [...currentEquipment, equipment];
    form.setValue("availableEquipment", newEquipment);
  };

  const onSubmit = (data: OnboardingData) => {
    console.log("Final submit with data:", data);
    updateUserMutation.mutate(data);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!form.getValues("fitnessGoal");
      case 2:
        return !!form.getValues("experienceLevel");
      case 3:
        return form.getValues("weeklyFrequency") > 0;
      case 4:
        return form.getValues("availableEquipment").length > 0;
      case 5:
        return form.getValues("age") > 0 && form.getValues("weight") > 0 && form.getValues("height") > 0;
      default:
        return false;
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Vamos personalizar seu treino!</h1>
        <p className="text-muted-foreground">Responda algumas perguntas para criarmos o plano perfeito</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Pergunta {currentStep} de {TOTAL_STEPS}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Step 1: Objetivo */}
          {currentStep === 1 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Qual é o seu objetivo principal?</h2>
                <FormField
                  control={form.control}
                  name="fitnessGoal"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="space-y-3">
                        {[
                          { value: "lose_weight", label: "Perder peso", description: "Queimar calorias e reduzir gordura", icon: Scale },
                          { value: "gain_muscle", label: "Ganhar massa muscular", description: "Aumentar força e volume muscular", icon: Dumbbell },
                          { value: "improve_conditioning", label: "Melhorar condicionamento", description: "Aumentar resistência cardiovascular", icon: Heart },
                        ].map((goal) => {
                          const Icon = goal.icon;
                          return (
                            <Button
                              key={goal.value}
                              type="button"
                              variant={field.value === goal.value ? "default" : "outline"}
                              className="w-full justify-start h-auto p-4"
                              onClick={() => field.onChange(goal.value)}
                            >
                              <div className="flex items-center text-left">
                                <Icon className="mr-3 h-5 w-5" />
                                <div>
                                  <div className="font-medium">{goal.label}</div>
                                  <div className="text-sm opacity-70">{goal.description}</div>
                                </div>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Nível de experiência */}
          {currentStep === 2 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Qual é o seu nível de experiência?</h2>
                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="space-y-3">
                        {[
                          { value: "beginner", label: "Iniciante", description: "Pouca ou nenhuma experiência" },
                          { value: "intermediate", label: "Intermediário", description: "6 meses a 2 anos de treino" },
                          { value: "advanced", label: "Avançado", description: "Mais de 2 anos de experiência" },
                        ].map((level) => (
                          <Button
                            key={level.value}
                            type="button"
                            variant={field.value === level.value ? "default" : "outline"}
                            className="w-full justify-start h-auto p-4"
                            onClick={() => field.onChange(level.value)}
                          >
                            <div className="text-left">
                              <div className="font-medium">{level.label}</div>
                              <div className="text-sm opacity-70">{level.description}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Frequência semanal */}
          {currentStep === 3 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Quantas vezes por semana você quer treinar?</h2>
                <FormField
                  control={form.control}
                  name="weeklyFrequency"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((freq) => (
                          <Button
                            key={freq}
                            type="button"
                            variant={field.value === freq ? "default" : "outline"}
                            className="h-16"
                            onClick={() => field.onChange(freq)}
                          >
                            {freq}x por semana
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Equipamentos disponíveis */}
          {currentStep === 4 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Quais equipamentos você tem acesso?</h2>
                <div className="space-y-3">
                  {[
                    "Peso corporal",
                    "Halteres",
                    "Barras",
                    "Máquinas de musculação",
                    "Elásticos",
                    "Kettlebells"
                  ].map((equipment) => (
                    <label
                      key={equipment}
                      className={cn(
                        "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                        form.getValues("availableEquipment").includes(equipment)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleEquipmentToggle(equipment)}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center",
                        form.getValues("availableEquipment").includes(equipment)
                          ? "border-primary bg-primary"
                          : "border-border"
                      )}>
                        {form.getValues("availableEquipment").includes(equipment) && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{equipment}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Informações pessoais */}
          {currentStep === 5 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Informações pessoais</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idade</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="25"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso (kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="70"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Altura (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="175"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="physicalRestrictions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restrições físicas (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Problema no joelho, dor nas costas..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Anterior
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Próximo
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => form.handleSubmit(onSubmit)()}
                disabled={!canProceed() || updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? "Finalizando..." : "Finalizar"}
              </Button>
            )}
          </div>
        </div>
      </Form>
    </div>
  );
}