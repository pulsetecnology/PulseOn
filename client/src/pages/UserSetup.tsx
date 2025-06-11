import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Scale, Dumbbell, Heart, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

const userSetupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  age: z.number().min(13, "Idade deve ser maior que 13 anos").max(120, "Idade inválida"),
  weight: z.number().min(30, "Peso deve ser maior que 30kg").max(300, "Peso inválido"),
  height: z.number().min(100, "Altura deve ser maior que 100cm").max(250, "Altura inválida"),
  fitnessGoal: z.enum(["lose_weight", "gain_muscle", "improve_conditioning"]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  weeklyFrequency: z.number().min(1).max(7),
  availableEquipment: z.array(z.string()).min(1, "Selecione pelo menos um equipamento"),
  physicalRestrictions: z.string().optional()
});

type UserSetupData = z.infer<typeof userSetupSchema>;

export default function UserSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<UserSetupData>({
    resolver: zodResolver(userSetupSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
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

  const setupMutation = useMutation({
    mutationFn: async (data: UserSetupData) => {
      return apiRequest("/api/auth/setup", "POST", data);
    },
    onSuccess: (response) => {
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      toast({
        title: "Perfil criado com sucesso!",
        description: "Bem-vindo ao PulseOn"
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar perfil",
        variant: "destructive"
      });
    }
  });

  const handleEquipmentToggle = (equipment: string, field: any) => {
    const newEquipment = field.value.includes(equipment)
      ? field.value.filter((e: string) => e !== equipment)
      : [...field.value, equipment];
    field.onChange(newEquipment);
  };

  const onSubmit = (data: UserSetupData) => {
    setupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo ao PulseOn!</h1>
          <p className="text-muted-foreground">Configure seu perfil e comece a treinar</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Login Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações de Acesso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Sua senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            {/* Fitness Goal */}
            <Card>
              <CardHeader>
                <CardTitle>Qual é o seu objetivo principal?</CardTitle>
              </CardHeader>
              <CardContent>
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

            {/* Experience Level */}
            <Card>
              <CardHeader>
                <CardTitle>Qual é o seu nível de experiência?</CardTitle>
              </CardHeader>
              <CardContent>
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

            {/* Weekly Frequency */}
            <Card>
              <CardHeader>
                <CardTitle>Quantas vezes por semana você quer treinar?</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="weeklyFrequency"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
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

            {/* Available Equipment */}
            <Card>
              <CardHeader>
                <CardTitle>Quais equipamentos você tem acesso?</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="availableEquipment"
                  render={({ field }) => (
                    <FormItem>
                      <div className="space-y-3">
                        {[
                          "Peso corporal",
                          "Halteres",
                          "Barras",
                          "Máquinas de musculação",
                          "Elásticos",
                          "Kettlebells"
                        ].map((equipment) => (
                          <Button
                            key={equipment}
                            type="button"
                            variant={field.value.includes(equipment) ? "default" : "outline"}
                            className="w-full justify-start h-auto p-4"
                            onClick={() => handleEquipmentToggle(equipment, field)}
                          >
                            <div className="flex items-center">
                              <div className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center mr-3",
                                field.value.includes(equipment)
                                  ? "border-primary-foreground bg-primary-foreground"
                                  : "border-current"
                              )}>
                                {field.value.includes(equipment) && (
                                  <Check className="w-3 h-3 text-primary" />
                                )}
                              </div>
                              <span className="font-medium">{equipment}</span>
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

            {/* Physical Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle>Restrições físicas (opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="physicalRestrictions"
                  render={({ field }) => (
                    <FormItem>
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
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={setupMutation.isPending}
            >
              {setupMutation.isPending ? "Criando perfil..." : "Começar a treinar"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}