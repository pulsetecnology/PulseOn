import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { onboardingSchema, type OnboardingData } from "@shared/schema";
import { Scale, Dumbbell, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const TOTAL_STEPS = 5;

const equipmentOptions = [
  "Halteres",
  "Barras",
  "Máquinas de musculação",
  "Elásticos de resistência",
  "Kettlebells",
  "Apenas peso corporal",
  "Esteira",
  "Bicicleta ergométrica"
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useLocalStorage<Partial<OnboardingData>>("onboarding-data", {});
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      age: onboardingData.age || undefined,
      weight: onboardingData.weight || undefined,
      height: onboardingData.height || undefined,
      fitnessGoal: onboardingData.fitnessGoal || "gain_muscle",
      experienceLevel: onboardingData.experienceLevel || "intermediate",
      weeklyFrequency: onboardingData.weeklyFrequency || 3,
      availableEquipment: onboardingData.availableEquipment || [],
      physicalRestrictions: onboardingData.physicalRestrictions || ""
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          onboardingCompleted: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar perfil");
      }

      return response.json();
    },
    onSuccess: () => {
      localStorage.removeItem("onboarding-data");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

      toast({
        title: "Perfil configurado com sucesso!",
        description: "Agora você pode começar seus treinos personalizados"
      });

      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao finalizar configuração",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  const nextStep = async () => {
    // Validar campos do passo atual antes de avançar
    let fieldsToValidate: (keyof OnboardingData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['fitnessGoal'];
        break;
      case 2:
        fieldsToValidate = ['experienceLevel'];
        break;
      case 3:
        fieldsToValidate = ['age', 'weight', 'height', 'weeklyFrequency'];
        break;
      case 4:
        fieldsToValidate = ['availableEquipment'];
        break;
      case 5:
        // physicalRestrictions é opcional
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);

    if (isValid && currentStep < TOTAL_STEPS) {
      // Salvar dados do passo atual no localStorage
      const currentData = form.getValues();
      setOnboardingData(currentData);
      setCurrentStep(currentStep + 1);
    } else if (!isValid) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios antes de continuar",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      // Salvar dados do passo atual antes de voltar
      const currentData = form.getValues();
      setOnboardingData(currentData);
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: OnboardingData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    setOnboardingData(data);
    updateUserMutation.mutate(data);
  };

  const onError = (errors: any) => {
    console.log("Form validation errors:", errors);
    toast({
      title: "Erro de validação",
      description: "Por favor, verifique os campos obrigatórios",
      variant: "destructive"
    });
  };

  const handleEquipmentToggle = (equipment: string) => {
    const currentEquipment = form.getValues("availableEquipment");
    const newEquipment = currentEquipment.includes(equipment)
      ? currentEquipment.filter(e => e !== equipment)
      : [...currentEquipment, equipment];
    form.setValue("availableEquipment", newEquipment);
    // Revalidar o campo para limpar erros se houver equipamento selecionado
    if (newEquipment.length > 0) {
      form.clearErrors("availableEquipment");
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
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
          {/* Step 1: Objective */}
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

          {/* Step 2: Experience Level */}
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

          {/* Step 3: Physical Data */}
          {currentStep === 3 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Dados físicos</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idade</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")} />
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
                            <Input type="number" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Altura (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weeklyFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantos dias por semana deseja treinar?</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="7" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Equipment */}
          {currentStep === 4 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Quais equipamentos você tem disponível?</h2>
                <FormField
                  control={form.control}
                  name="availableEquipment"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-1 gap-2">
                        {equipmentOptions.map((equipment) => (
                          <Button
                            key={equipment}
                            type="button"
                            variant={field.value.includes(equipment) ? "default" : "outline"}
                            className="justify-start"
                            onClick={() => handleEquipmentToggle(equipment)}
                          >
                            {equipment}
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

          {/* Step 5: Restrictions */}
          {currentStep === 5 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Possui alguma restrição física?</h2>
                <FormField
                  control={form.control}
                  name="physicalRestrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descreva qualquer lesão ou limitação (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Dor no joelho direito, problema na lombar..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            {currentStep < TOTAL_STEPS ? (
              <Button 
                type="button" 
                className="flex-1" 
                onClick={nextStep}
              >
                Próxima
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="flex-1"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? "Finalizando..." : "Finalizar"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}