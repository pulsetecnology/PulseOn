import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Calendar, Activity, Target, Dumbbell } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UserData {
  id: number;
  email: string;
  name: string;
  birthDate?: string;
  weight?: number;
  height?: number;
  gender?: string;
  fitnessGoal?: string;
  experienceLevel?: string;
  weeklyFrequency?: number;
  availableEquipment?: string[];
  physicalRestrictions?: string;
  onboardingCompleted: boolean;
}

const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const fitnessGoals = {
  lose_weight: "Perda de peso",
  gain_muscle: "Ganho de massa",
  improve_conditioning: "Condicionamento geral"
};

const experienceLevels = {
  beginner: "Iniciante",
  intermediate: "Intermediário", 
  advanced: "Avançado"
};

const equipmentOptions = [
  { id: "dumbbells", label: "Halteres" },
  { id: "barbell", label: "Barra" },
  { id: "resistance_bands", label: "Faixas elásticas" },
  { id: "pull_up_bar", label: "Barra de flexão" },
  { id: "kettlebells", label: "Kettlebells" },
  { id: "bodyweight", label: "Peso corporal" }
];

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No token");
      
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    }
  });

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UserData>) => {
      // Only send fields that have actual values and are different from original
      const updatePayload: any = {};
      
      if (data.name && data.name !== user?.name) {
        updatePayload.name = data.name;
      }
      
      if (data.birthDate && data.birthDate !== user?.birthDate) {
        updatePayload.age = calculateAge(data.birthDate);
      }
      
      if (data.weight && data.weight !== user?.weight) {
        updatePayload.weight = data.weight;
      }
      
      if (data.height && data.height !== user?.height) {
        updatePayload.height = data.height;
      }
      
      if (data.gender && data.gender !== user?.gender) {
        updatePayload.gender = data.gender;
      }
      
      if (data.fitnessGoal && data.fitnessGoal !== user?.fitnessGoal) {
        updatePayload.fitnessGoal = data.fitnessGoal;
      }
      
      if (data.experienceLevel && data.experienceLevel !== user?.experienceLevel) {
        updatePayload.experienceLevel = data.experienceLevel;
      }
      
      if (data.weeklyFrequency && data.weeklyFrequency !== user?.weeklyFrequency) {
        updatePayload.weeklyFrequency = data.weeklyFrequency;
      }
      
      if (data.availableEquipment && JSON.stringify(data.availableEquipment) !== JSON.stringify(user?.availableEquipment)) {
        updatePayload.availableEquipment = data.availableEquipment;
      }
      
      if (data.physicalRestrictions !== user?.physicalRestrictions) {
        updatePayload.physicalRestrictions = data.physicalRestrictions;
      }
      
      console.log('Sending update payload:', updatePayload);
      
      return apiRequest("/api/profile/update", "PATCH", updatePayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar perfil",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleEquipmentChange = (equipmentId: string, checked: boolean) => {
    const currentEquipment = formData.availableEquipment || [];
    const updatedEquipment = checked
      ? [...currentEquipment, equipmentId]
      : currentEquipment.filter((id) => id !== equipmentId);
    
    setFormData({ ...formData, availableEquipment: updatedEquipment });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Erro ao carregar perfil</p>
        </div>
      </div>
    );
  }

  const userAge = user.birthDate ? calculateAge(user.birthDate) : null;

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
          </div>
        </div>
        
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setFormData(user);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              {isEditing ? (
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{user.name || "Não informado"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.birthDate || ""}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {user.birthDate ? formatDate(user.birthDate) : "Não informado"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Idade</Label>
              <p className="text-sm text-muted-foreground">
                {userAge ? `${userAge} anos` : "Não calculável"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dados Físicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Dados Físicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.weight || ""}
                  onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {user.weight ? `${user.weight} kg` : "Não informado"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Altura (cm)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.height || ""}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {user.height ? `${user.height} cm` : "Não informado"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gênero</Label>
              {isEditing ? (
                <Select 
                  value={formData.gender || ""} 
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="other">Prefiro não informar</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {user.gender === "male" ? "Masculino" : 
                   user.gender === "female" ? "Feminino" : 
                   user.gender === "other" ? "Prefiro não informar" : "Não especificado"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Objetivos de Treino */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objetivos de Treino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Objetivo Principal</Label>
              {isEditing ? (
                <Select 
                  value={formData.fitnessGoal || ""} 
                  onValueChange={(value) => setFormData({ ...formData, fitnessGoal: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(fitnessGoals).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {user.fitnessGoal && fitnessGoals[user.fitnessGoal as keyof typeof fitnessGoals] || "Não informado"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Nível de Experiência</Label>
              {isEditing ? (
                <Select 
                  value={formData.experienceLevel || ""} 
                  onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(experienceLevels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {user.experienceLevel && experienceLevels[user.experienceLevel as keyof typeof experienceLevels] || "Não informado"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Frequência Semanal</Label>
              {isEditing ? (
                <Select 
                  value={formData.weeklyFrequency?.toString() || ""} 
                  onValueChange={(value) => setFormData({ ...formData, weeklyFrequency: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Quantas vezes por semana?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x por semana</SelectItem>
                    <SelectItem value="2">2x por semana</SelectItem>
                    <SelectItem value="3">3x por semana</SelectItem>
                    <SelectItem value="4">4x por semana</SelectItem>
                    <SelectItem value="5">5x por semana</SelectItem>
                    <SelectItem value="6">6x por semana</SelectItem>
                    <SelectItem value="7">Todos os dias</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {user.weeklyFrequency ? `${user.weeklyFrequency}x por semana` : "Não informado"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Equipamentos Disponíveis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Equipamentos Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                {equipmentOptions.map((equipment) => (
                  <div key={equipment.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={equipment.id}
                      checked={(formData.availableEquipment || []).includes(equipment.id)}
                      onCheckedChange={(checked) => handleEquipmentChange(equipment.id, checked as boolean)}
                    />
                    <Label htmlFor={equipment.id} className="text-sm">
                      {equipment.label}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {user.availableEquipment && user.availableEquipment.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {user.availableEquipment.map((equipmentId) => {
                      const equipment = equipmentOptions.find(eq => eq.id === equipmentId);
                      return equipment ? (
                        <span key={equipmentId} className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded">
                          {equipment.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum equipamento selecionado</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {user.physicalRestrictions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Restrições Físicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{user.physicalRestrictions}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}