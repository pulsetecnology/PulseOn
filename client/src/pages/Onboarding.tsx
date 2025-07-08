import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useGlobalNotification } from "@/components/NotificationProvider";
import { onboardingSchema, type OnboardingData } from "@shared/schema";
import { Scale, Dumbbell, Heart, Check, User, Moon, Sun, ChevronRight, ChevronLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

const TOTAL_STEPS = 7;

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { showSuccess, showError } = useGlobalNotification();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      phone: "",
      birthDate: "",
      weight: 30,
      height: 120,
      gender: "male",
      fitnessGoal: "lose_weight",
      experienceLevel: "beginner",
      weeklyFrequency: 1,
      availableEquipment: [],
      physicalRestrictions: "",
      smokingStatus: "never",
      alcoholConsumption: "never",
      dietType: "balanced",
      sleepHours: "6-7",
      stressLevel: "low",
      preferredWorkoutTime: "morning",
      availableDaysPerWeek: 3,
      averageWorkoutDuration: "30min",
      preferredLocation: "home"
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Calcular idade a partir da data de nascimento
      const birthDate = new Date(data.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      const { birthDate: _, ...restData } = data;

      return apiRequest(`/api/users/${user.id}`, "PATCH", { 
        ...restData,
        age,
        birthDate: data.birthDate,
        onboardingCompleted: true 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      showSuccess();
      setTimeout(() => {
        setLocation("/");
      }, 1500);
    },
    onError: (error: any) => {
      showError();
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
        return form.getValues("weeklyFrequency") > 0 && !!form.getValues("preferredWorkoutTime") &&
               form.getValues("availableDaysPerWeek") > 0 && !!form.getValues("averageWorkoutDuration");
      case 4:
        return form.getValues("availableEquipment").length > 0 && !!form.getValues("preferredLocation");
      case 5:
        return !!form.getValues("birthDate") && !!form.getValues("gender");
      case 6:
        return !!form.getValues("smokingStatus") && !!form.getValues("alcoholConsumption") && 
               !!form.getValues("dietType") && !!form.getValues("sleepHours") && 
               !!form.getValues("stressLevel");
      case 7:
        return form.getValues("weight") > 0 && form.getValues("height") > 0;
      default:
        return false;
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold mb-2">Vamos personalizar seu treino!</h1>
          <p className="text-muted-foreground">Responda algumas perguntas para criarmos o plano perfeito</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="h-10 w-10"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-muted-foreground">Pergunta {currentStep} de {TOTAL_STEPS}</span>
          <span className="font-medium text-primary">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="relative">
          <Progress value={progressPercentage} className="h-3 bg-secondary" />
          <div className="absolute top-0 left-0 w-full h-3 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-3">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i + 1 <= currentStep ? 'bg-primary scale-110' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Step 1: Objetivo */}
          {currentStep === 1 && (
            <Card className="transition-all duration-300 ease-in-out transform hover:shadow-lg">
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
                          { value: "maintain_weight", label: "Manter peso", description: "Manter forma física atual e peso ideal", icon: Check },
                          { value: "increase_flexibility", label: "Aumentar flexibilidade", description: "Melhorar mobilidade e alongamento", icon: User },
                          { value: "stress_relief", label: "Alívio do estresse", description: "Reduzir tensão e melhorar bem-estar mental", icon: Heart },
                          { value: "improve_posture", label: "Melhorar postura", description: "Corrigir postura e fortalecer core", icon: User },
                          { value: "general_fitness", label: "Fitness geral", description: "Manter saúde e condição física geral", icon: Dumbbell },
                          { value: "athletic_performance", label: "Performance atlética", description: "Melhorar desempenho esportivo", icon: Dumbbell },
                          { value: "injury_recovery", label: "Recuperação de lesão", description: "Reabilitação e fortalecimento pós-lesão", icon: Heart },
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
            <Card className="transition-all duration-300 ease-in-out transform hover:shadow-lg">
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
                          { value: "expert", label: "Expert", description: "3-5 anos de treino consistente" },
                          { value: "professional", label: "Profissional", description: "Personal trainer ou instrutor" },
                          { value: "competitive_athlete", label: "Atleta competitivo", description: "Participa de competições esportivas" },
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

          {/* Step 3: Frequência e planejamento de treinos */}
          {currentStep === 3 && (
            <Card className="transition-all duration-300 ease-in-out transform hover:shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Planejamento dos seus treinos</h2>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="weeklyFrequency"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base font-medium">Quantas vezes por semana você quer treinar?</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="preferredWorkoutTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Horário preferido para treinar</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morning">Manhã</SelectItem>
                            <SelectItem value="afternoon">Tarde</SelectItem>
                            <SelectItem value="evening">Noite</SelectItem>
                            <SelectItem value="variable">Variável</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availableDaysPerWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Dias disponíveis por semana</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                              <SelectItem key={day} value={day.toString()}>{day} dia{day > 1 ? 's' : ''}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="averageWorkoutDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Tempo médio por treino</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="15-20min">15-20 minutos</SelectItem>
                            <SelectItem value="30min">30 minutos</SelectItem>
                            <SelectItem value="45min">45 minutos</SelectItem>
                            <SelectItem value="1h_or_more">1 hora ou mais</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Equipamentos e local */}
          {currentStep === 4 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Equipamentos e local de treino</h2>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="availableEquipment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Quais equipamentos você tem acesso?</FormLabel>
                        <div className="space-y-3">
                          {[
                            { id: "bodyweight", label: "Peso corporal" },
                            { id: "dumbbells", label: "Halteres" },
                            { id: "barbell", label: "Barra" },
                            { id: "resistance_bands", label: "Faixas elásticas" },
                            { id: "pull_up_bar", label: "Barra de flexão" },
                            { id: "kettlebells", label: "Kettlebells" },
                            { id: "gym_access", label: "Academia completa" },
                            { id: "outdoor_gym", label: "Academia ao ar livre (padrão prefeituras)" },
                            { id: "others", label: "Outros" }
                          ].map((equipment) => (
                            <label
                              key={equipment.id}
                              className={cn(
                                "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                                field.value.includes(equipment.id)
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                              onClick={(e) => {
                                e.preventDefault();
                                const newEquipment = field.value.includes(equipment.id)
                                  ? field.value.filter(e => e !== equipment.id)
                                  : [...field.value, equipment.id];
                                field.onChange(newEquipment);
                              }}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center",
                                field.value.includes(equipment.id)
                                  ? "border-primary bg-primary"
                                  : "border-border"
                              )}>
                                {field.value.includes(equipment.id) && (
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                )}
                              </div>
                              <span className="font-medium">{equipment.label}</span>
                            </label>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Local preferido para treinar</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="home">Em casa</SelectItem>
                            <SelectItem value="outdoor">Ao ar livre</SelectItem>
                            <SelectItem value="gym">Academia</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Dados pessoais */}
          {currentStep === 5 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados pessoais
                </h2>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="(11) 99999-9999"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gênero</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione seu gênero" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Masculino</SelectItem>
                            <SelectItem value="female">Feminino</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Estilo de Vida */}
          {currentStep === 6 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Estilo de Vida
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="smokingStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Você fuma?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="never">Nunca fumei</SelectItem>
                              <SelectItem value="yes">Sim, fumo</SelectItem>
                              <SelectItem value="ex_smoker">Ex-fumante</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="alcoholConsumption"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consumo de álcool</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="never">Nunca</SelectItem>
                              <SelectItem value="rarely">Raramente</SelectItem>
                              <SelectItem value="socially">Socialmente</SelectItem>
                              <SelectItem value="frequently">Frequentemente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dietType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de alimentação</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="balanced">Balanceada</SelectItem>
                              <SelectItem value="high_protein">Rica em proteínas</SelectItem>
                              <SelectItem value="high_carb">Rica em carboidratos</SelectItem>
                              <SelectItem value="fast_food">Fast-food</SelectItem>
                              <SelectItem value="vegetarian_vegan">Vegetariana/Vegana</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sleepHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horas de sono por noite</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="4-5">4-5 horas</SelectItem>
                              <SelectItem value="6-7">6-7 horas</SelectItem>
                              <SelectItem value="8-9">8-9 horas</SelectItem>
                              <SelectItem value="9+">9+ horas</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stressLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nível de estresse</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Baixo</SelectItem>
                              <SelectItem value="moderate">Moderado</SelectItem>
                              <SelectItem value="high">Alto</SelectItem>
                              <SelectItem value="very_high">Muito alto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 7: Informações físicas */}
          {currentStep === 7 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Informações físicas
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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

          {/* Enhanced Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`transition-all duration-200 ${
                currentStep === 1 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105 active:scale-95'
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={`transition-all duration-200 ${
                  !canProceed() 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105 active:scale-95'
                }`}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => form.handleSubmit(onSubmit)()}
                disabled={!canProceed() || updateUserMutation.isPending}
                className="transition-all duration-200 bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Finalizando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Finalizar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Form>
    </div>
  );
}