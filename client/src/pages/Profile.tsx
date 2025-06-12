import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useGlobalNotification } from "@/components/NotificationProvider";
import { User, Settings, Calendar, Activity, Target, Dumbbell, Camera, Scale } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  customEquipment?: string;
  physicalRestrictions?: string;
  onboardingCompleted: boolean;
  avatarUrl?: string;
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
  // Parse the date string manually to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return date.toLocaleDateString('pt-BR');
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
  { id: "bodyweight", label: "Peso corporal" },
  { id: "dumbbells", label: "Halteres" },
  { id: "barbell", label: "Barra" },
  { id: "resistance_bands", label: "Faixas elásticas" },
  { id: "pull_up_bar", label: "Barra de flexão" },
  { id: "kettlebells", label: "Kettlebells" },
  { id: "gym_access", label: "Academia completa" },
  { id: "outdoor_gym", label: "Academia ao ar livre (padrão prefeituras)" }
];

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const { showSuccess, showError } = useGlobalNotification();
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

  const photoUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);

      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/profile/photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error("Failed to upload photo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      showSuccess();
    },
    onError: () => {
      showError();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UserData>) => {
      // Only send fields that have actual values and are different from original
      const updatePayload: any = {};

      if (data.name && data.name !== user?.name) {
        updatePayload.name = data.name;
      }

      if (data.birthDate && data.birthDate !== user?.birthDate) {
        updatePayload.birthDate = data.birthDate;
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

      if (data.customEquipment !== user?.customEquipment) {
        updatePayload.customEquipment = data.customEquipment;
      }

      console.log('Sending update payload:', updatePayload);

      return apiRequest("/api/profile/update", "PATCH", updatePayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
      showSuccess();
    },
    onError: (error: Error) => {
      showError();
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

  const avatarUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Avatar upload error:', errorText);
        throw new Error(`Failed to upload avatar: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      showSuccess("Avatar atualizado com sucesso!");
    },
    onError: (error: Error) => {
      console.error('Avatar upload mutation error:', error);
      showError("Erro ao fazer upload da imagem. Tente novamente.");
    }
  });

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      avatarUploadMutation.mutate(file);
    }
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
    <div className="container mx-auto px-4 py-4 space-y-4 max-w-4xl">
      {/* Profile Header */}
      <Card className="w-full">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
              <AvatarImage 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Usuario')}&background=0CE6D6&color=fff&size=80`} 
              />
              <AvatarFallback className="text-xl sm:text-2xl">
                {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{user.name || 'Usuário'}</h1>
              <p className="text-muted-foreground text-sm sm:text-base truncate">{user.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground mt-1">
                <User className="h-4 w-4 flex-shrink-0" />
                <span>{userAge} anos • {user.gender === 'female' ? 'Feminino' : user.gender === 'male' ? 'Masculino' : 'Não informado'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Informações Detalhadas</h2>
            <p className="text-muted-foreground">Configure seu perfil para treinos personalizados</p>
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
        {/* Personal Information */}
        <Card className="w-full">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 flex-shrink-0" />
              <span>Informações Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Physical Data */}
        <Card className="w-full">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-5 w-5 flex-shrink-0" />
              <span>Dados Físicos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              <div className="space-y-4">
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
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="others"
                      checked={(formData.availableEquipment || []).includes("others")}
                      onCheckedChange={(checked) => handleEquipmentChange("others", checked as boolean)}
                    />
                    <Label htmlFor="others" className="text-sm">
                      Outros
                    </Label>
                  </div>
                </div>

                {(formData.availableEquipment || []).includes("others") && (
                  <div className="space-y-2">
                    <Label htmlFor="customEquipment">Especifique outros equipamentos:</Label>
                    <Input
                      id="customEquipment"
                      placeholder="Ex: Cordas de pular, medicine ball, etc."
                      value={formData.customEquipment || ""}
                      onChange={(e) => setFormData({ ...formData, customEquipment: e.target.value })}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {user.availableEquipment && user.availableEquipment.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {user.availableEquipment.map((equipmentId) => {
                      if (equipmentId === "others") {
                        return (
                          <span key={equipmentId} className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded">
                            Outros: {user.customEquipment || "Não especificado"}
                          </span>
                        );
                      }
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

      {/* Restrições Físicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Restrições Físicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="physicalRestrictions">Descreva suas restrições físicas (opcional):</Label>
              <textarea
                id="physicalRestrictions"
                className="w-full p-3 border border-input rounded-md bg-background text-sm resize-none min-h-[100px]"
                placeholder="Ex: Lesão no joelho direito, problema na coluna, etc."
                value={formData.physicalRestrictions || ""}
                onChange={(e) => setFormData({ ...formData, physicalRestrictions: e.target.value })}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {user.physicalRestrictions || "Nenhuma restrição informada"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}