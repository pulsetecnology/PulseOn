import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Edit, RotateCcw, Bell, Shield, LogOut, Dumbbell, Scale, Heart } from "lucide-react";
import { Link } from "wouter";
import { z } from "zod";

const profileUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  age: z.number().min(13, "Idade deve ser maior que 13 anos").max(120, "Idade inválida"),
  weight: z.number().min(30, "Peso deve ser maior que 30kg").max(300, "Peso inválido"),
  height: z.number().min(100, "Altura deve ser maior que 100cm").max(250, "Altura inválida"),
  fitnessGoal: z.enum(["lose_weight", "gain_muscle", "improve_conditioning"]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  weeklyFrequency: z.number().min(1).max(7),
  availableEquipment: z.array(z.string()).min(1, "Selecione pelo menos um equipamento"),
  gender: z.enum(["male", "female", "other"]),
  physicalRestrictions: z.string().optional()
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export default function Profile() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const user = response?.user;
  
  // Calcular idade dinamicamente a partir da data de nascimento
  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const userAge = user?.birthDate ? calculateAge(user.birthDate) : user?.age || 0;

  const form = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: "",
      age: 25,
      weight: 70,
      height: 175,
      fitnessGoal: "gain_muscle",
      experienceLevel: "beginner",
      weeklyFrequency: 3,
      availableEquipment: [],
      gender: "male",
      physicalRestrictions: ""
    }
  });

  // Atualizar form quando os dados do usuário carregarem
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        age: user.age || 25,
        weight: user.weight || 70,
        height: user.height || 175,
        fitnessGoal: user.fitnessGoal || "gain_muscle",
        experienceLevel: user.experienceLevel || "beginner",
        weeklyFrequency: user.weeklyFrequency || 3,
        availableEquipment: user.availableEquipment || [],
        gender: user.gender || "male",
        physicalRestrictions: user.physicalRestrictions || ""
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      return apiRequest("/api/profile/update", "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/auth/logout", "POST", {});
    },
    onSuccess: () => {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    },
  });

  const onSubmit = (data: ProfileUpdateData) => {
    updateProfileMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Função para remover zeros à esquerda
  const handleNumericInput = (value: string, field: any) => {
    const numericValue = value.replace(/^0+/, '') || '0';
    const parsed = parseInt(numericValue);
    if (!isNaN(parsed)) {
      field.onChange(parsed);
    }
  };

  const equipmentOptions = [
    { id: "bodyweight", label: "Peso corporal" },
    { id: "dumbbells", label: "Halteres" },
    { id: "barbell", label: "Barra" },
    { id: "resistance_bands", label: "Faixas elásticas" },
    { id: "gym_access", label: "Academia completa" },
    { id: "home_gym", label: "Academia em casa" }
  ];

  const getGoalLabel = (goal: string) => {
    switch (goal) {
      case "lose_weight": return "Perder peso";
      case "gain_muscle": return "Ganhar massa muscular";
      case "improve_conditioning": return "Melhorar condicionamento";
      default: return goal;
    }
  };

  const getExperienceLabel = (level: string) => {
    switch (level) {
      case "beginner": return "Iniciante";
      case "intermediate": return "Intermediário";
      case "advanced": return "Avançado";
      default: return level;
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* User Info */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-1 text-white">{user?.name || "Usuário"}</h1>
          <p className="text-slate-400 mb-4">{user?.email}</p>
          <div className="flex justify-center space-x-6 text-sm">
            <div className="text-center">
              <div className="font-bold text-white">{user?.weight || 0}kg</div>
              <div className="text-slate-400">Peso</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-white">{user?.height || 0}cm</div>
              <div className="text-slate-400">Altura</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-white">{userAge}</div>
              <div className="text-slate-400">Idade</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fitness Goals */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-white">Objetivo Atual</h3>
          <div className="flex items-center">
            <Dumbbell className="text-cyan-400 mr-3 h-5 w-5" />
            <div>
              <div className="font-medium text-white">{getGoalLabel(user?.fitnessGoal || "")}</div>
              <div className="text-sm text-slate-400">
                {getExperienceLabel(user?.experienceLevel || "")} • {user?.weeklyFrequency || 0}x por semana
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipamentos */}
      {user?.availableEquipment && user.availableEquipment.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-white">Equipamentos Disponíveis</h3>
            <div className="flex flex-wrap gap-2">
              {user.availableEquipment.map((equipment) => {
                const option = equipmentOptions.find(opt => opt.id === equipment);
                return (
                  <span
                    key={equipment}
                    className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm"
                  >
                    {option?.label || equipment}
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Menu */}
      <div className="space-y-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-auto p-4 text-white hover:bg-slate-700">
              <div className="flex items-center">
                <Edit className="text-cyan-400 mr-3 h-5 w-5" />
                <span>Editar Perfil</span>
              </div>
              <span className="text-slate-400">›</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Perfil</DialogTitle>
              <DialogDescription className="text-slate-400">
                Atualize suas informações pessoais e objetivos de treino.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Dados Pessoais
                  </h3>
                  
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                          <Select onValueChange={field.onChange} value={field.value}>
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

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                  >
                    {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Link href="/onboarding">
          <Button variant="ghost" className="w-full justify-between h-auto p-4 text-white hover:bg-slate-700">
            <div className="flex items-center">
              <RotateCcw className="text-cyan-400 mr-3 h-5 w-5" />
              <span>Refazer Questionário</span>
            </div>
            <span className="text-slate-400">›</span>
          </Button>
        </Link>

        <Button variant="ghost" className="w-full justify-between h-auto p-4 text-white hover:bg-slate-700">
          <div className="flex items-center">
            <Bell className="text-cyan-400 mr-3 h-5 w-5" />
            <span>Notificações</span>
          </div>
          <span className="text-slate-400">›</span>
        </Button>

        <Button variant="ghost" className="w-full justify-between h-auto p-4 text-white hover:bg-slate-700">
          <div className="flex items-center">
            <Shield className="text-cyan-400 mr-3 h-5 w-5" />
            <span>Privacidade</span>
          </div>
          <span className="text-slate-400">›</span>
        </Button>

        <Button 
          variant="ghost" 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full justify-between h-auto p-4 text-red-400 hover:bg-slate-700"
        >
          <div className="flex items-center">
            <LogOut className="mr-3 h-5 w-5" />
            <span>{logoutMutation.isPending ? "Saindo..." : "Sair"}</span>
          </div>
          <span className="text-slate-400">›</span>
        </Button>
      </div>

      {/* Achievement Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-white">Conquistas Recentes</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center mr-3">
                  🔥
                </div>
                <div>
                  <div className="font-medium text-sm text-white">Perfil Completo</div>
                  <div className="text-xs text-slate-400">Configurou todas as informações pessoais</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  💪
                </div>
                <div>
                  <div className="font-medium text-sm text-white">Pronto para Treinar</div>
                  <div className="text-xs text-slate-400">Objetivos definidos e equipamentos configurados</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}