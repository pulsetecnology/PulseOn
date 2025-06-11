import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Scale, Dumbbell, Heart, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

const userSetupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  weight: z.number().min(30, "Peso deve ser maior que 30kg").max(300, "Peso inválido"),
  height: z.number().min(100, "Altura deve ser maior que 100cm").max(250, "Altura inválida"),
  fitnessGoal: z.enum(["lose_weight", "gain_muscle", "improve_conditioning"]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  weeklyFrequency: z.number().min(1).max(7),
  availableEquipment: z.array(z.string()).min(1, "Selecione pelo menos um equipamento"),
  gender: z.enum(["male", "female", "other"]),
  physicalRestrictions: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
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
      confirmPassword: "",
      name: "",
      birthDate: "",
      weight: 70,
      height: 170,
      fitnessGoal: "gain_muscle",
      experienceLevel: "beginner",
      weeklyFrequency: 3,
      availableEquipment: [],
      gender: "male",
      physicalRestrictions: ""
    }
  });

  const setupMutation = useMutation({
    mutationFn: async (data: UserSetupData) => {
      // Calcular idade a partir da data de nascimento
      const birthDate = new Date(data.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear() - 
        (today.getMonth() < birthDate.getMonth() || 
         (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
      
      const { confirmPassword, birthDate: _, ...registrationData } = data;
      const payload = {
        ...registrationData,
        age: age
      };
      
      return await apiRequest("/api/auth/setup", "POST", payload);
    },
    onSuccess: () => {
      toast({
        title: "Conta criada com sucesso!",
        description: "Redirecionando para o dashboard...",
      });
      setTimeout(() => setLocation("/"), 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserSetupData) => {
    setupMutation.mutate(data);
  };

  const equipmentOptions = [
    { id: "bodyweight", label: "Peso corporal" },
    { id: "dumbbells", label: "Halteres" },
    { id: "barbell", label: "Barra" },
    { id: "resistance_bands", label: "Faixas elásticas" },
    { id: "pull_up_bar", label: "Barra de flexão" },
    { id: "kettlebells", label: "Kettlebells" },
    { id: "gym_access", label: "Academia completa" },
    { id: "outdoor_gym", label: "Academia ao ar livre (padrão prefeituras)" }
  ];

  // Função para remover zeros à esquerda
  const handleNumericInput = (value: string, field: any) => {
    const numericValue = value.replace(/^0+/, '') || '0';
    const parsed = parseInt(numericValue);
    if (!isNaN(parsed)) {
      field.onChange(parsed);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800/90 border-slate-700 text-white">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-8 w-8 text-cyan-400" />
            <CardTitle className="text-3xl font-bold">
              Pulse<span className="text-cyan-400">On</span>
            </CardTitle>
          </div>
          <CardDescription className="text-slate-300 text-lg">
            Crie sua conta e configure seu perfil personalizado
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados de Login */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Dados de Acesso
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            placeholder="seu@email.com"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
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
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Seu nome"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
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
                          <Input 
                            {...field} 
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password"
                            placeholder="Repita sua senha"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Dados Pessoais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            className="bg-slate-700 border-slate-600 text-white"
                            {...field}
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
                            className="bg-slate-700 border-slate-600 text-white"
                            onChange={(e) => handleNumericInput(e.target.value, field)}
                            value={field.value || ''}
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
                            className="bg-slate-700 border-slate-600 text-white"
                            onChange={(e) => handleNumericInput(e.target.value, field)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Selecione seu gênero" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-700 border-slate-600">
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

              {/* Objetivos de Treino */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Objetivos de Treino
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fitnessGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objetivo Principal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Escolha seu objetivo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="lose_weight">Perder peso</SelectItem>
                            <SelectItem value="gain_muscle">Ganhar massa muscular</SelectItem>
                            <SelectItem value="improve_conditioning">Melhorar condicionamento</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível de Experiência</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Seu nível atual" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="beginner">Iniciante</SelectItem>
                            <SelectItem value="intermediate">Intermediário</SelectItem>
                            <SelectItem value="advanced">Avançado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weeklyFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência Semanal</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="1"
                            max="7"
                            placeholder="3"
                            className="bg-slate-700 border-slate-600 text-white"
                            onChange={(e) => handleNumericInput(e.target.value, field)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Equipamentos Disponíveis */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-400">Equipamentos Disponíveis</h3>
                <FormField
                  control={form.control}
                  name="availableEquipment"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {equipmentOptions.map((equipment) => (
                          <FormField
                            key={equipment.id}
                            control={form.control}
                            name="availableEquipment"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={equipment.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(equipment.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, equipment.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== equipment.id
                                              )
                                            )
                                      }}
                                      className="border-slate-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal text-slate-300">
                                    {equipment.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Restrições Físicas */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="physicalRestrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restrições Físicas (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Descreva qualquer limitação física ou lesão"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={setupMutation.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 text-lg"
              >
                {setupMutation.isPending ? "Criando conta..." : "Criar Conta e Começar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}