import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useGlobalNotification } from "@/components/NotificationProvider";
import { Calendar, Activity, Target, Dumbbell, Camera, Scale, User, Settings, Check, X, AlertCircle, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";

interface UserData {
  id: number;
  email: string;
  name: string;
  phone?: string;
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
  // Lifestyle fields
  smokingStatus?: string;
  alcoholConsumption?: string;
  dietType?: string;
  sleepHours?: string;
  stressLevel?: string;
  preferredWorkoutTime?: string;
  availableDaysPerWeek?: number;
  averageWorkoutDuration?: string;
  preferredLocation?: string;
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
  improve_conditioning: "Condicionamento geral",
  maintain_weight: "Manter peso",
  increase_flexibility: "Aumentar flexibilidade",
  stress_relief: "Alívio do estresse",
  improve_posture: "Melhorar postura",
  general_fitness: "Fitness geral",
  athletic_performance: "Performance atlética",
  injury_recovery: "Recuperação de lesão"
};

const experienceLevels = {
  beginner: "Iniciante",
  intermediate: "Intermediário", 
  advanced: "Avançado",
  expert: "Expert",
  professional: "Profissional",
  competitive_athlete: "Atleta competitivo"
};

const lifestyleMappings = {
  smokingStatus: {
    never: "Nunca fumei",
    yes: "Sim, fumo",
    ex_smoker: "Ex-fumante"
  },
  alcoholConsumption: {
    never: "Nunca",
    rarely: "Raramente",
    socially: "Socialmente",
    frequently: "Frequentemente"
  },
  dietType: {
    balanced: "Balanceada",
    high_protein: "Rica em proteínas",
    high_carb: "Rica em carboidratos",
    fast_food: "Fast-food",
    vegetarian_vegan: "Vegetariana/Vegana",
    other: "Outro"
  },
  sleepHours: {
    "4-5": "4-5 horas",
    "6-7": "6-7 horas",
    "8-9": "8-9 horas",
    "9+": "9+ horas"
  },
  stressLevel: {
    low: "Baixo",
    moderate: "Moderado",
    high: "Alto",
    very_high: "Muito alto"
  },
  preferredWorkoutTime: {
    morning: "Manhã",
    afternoon: "Tarde",
    evening: "Noite",
    variable: "Variável"
  },
  averageWorkoutDuration: {
    "15-20min": "15-20 minutos",
    "30min": "30 minutos",
    "45min": "45 minutos",
    "1h_or_more": "1 hora ou mais"
  },
  preferredLocation: {
    home: "Em casa",
    outdoor: "Ao ar livre",
    gym: "Academia",
    other: "Outro"
  }
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
  const [editingCard, setEditingCard] = useState<string | null>(null);
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

      const currentUserEquipment = user?.availableEquipment 
        ? (typeof user.availableEquipment === 'string' 
            ? (() => {
                try {
                  return JSON.parse(user.availableEquipment);
                } catch {
                  return [user.availableEquipment];
                }
              })()
            : user.availableEquipment)
        : [];
      
      if (data.availableEquipment && JSON.stringify(data.availableEquipment) !== JSON.stringify(currentUserEquipment)) {
        updatePayload.availableEquipment = data.availableEquipment;
      }

      if (data.phone !== user?.phone) {
        updatePayload.phone = data.phone;
      }

      if (data.physicalRestrictions !== user?.physicalRestrictions) {
        updatePayload.physicalRestrictions = data.physicalRestrictions;
      }

      if (data.customEquipment !== user?.customEquipment) {
        updatePayload.customEquipment = data.customEquipment;
      }

      // Lifestyle fields
      if (data.smokingStatus && data.smokingStatus !== user?.smokingStatus) {
        updatePayload.smokingStatus = data.smokingStatus;
      }

      if (data.alcoholConsumption && data.alcoholConsumption !== user?.alcoholConsumption) {
        updatePayload.alcoholConsumption = data.alcoholConsumption;
      }

      if (data.dietType && data.dietType !== user?.dietType) {
        updatePayload.dietType = data.dietType;
      }

      if (data.sleepHours && data.sleepHours !== user?.sleepHours) {
        updatePayload.sleepHours = data.sleepHours;
      }

      if (data.stressLevel && data.stressLevel !== user?.stressLevel) {
        updatePayload.stressLevel = data.stressLevel;
      }

      if (data.preferredWorkoutTime && data.preferredWorkoutTime !== user?.preferredWorkoutTime) {
        updatePayload.preferredWorkoutTime = data.preferredWorkoutTime;
      }

      if (data.availableDaysPerWeek && data.availableDaysPerWeek !== user?.availableDaysPerWeek) {
        updatePayload.availableDaysPerWeek = data.availableDaysPerWeek;
      }

      if (data.averageWorkoutDuration && data.averageWorkoutDuration !== user?.averageWorkoutDuration) {
        updatePayload.averageWorkoutDuration = data.averageWorkoutDuration;
      }

      if (data.preferredLocation && data.preferredLocation !== user?.preferredLocation) {
        updatePayload.preferredLocation = data.preferredLocation;
      }

      console.log('Sending update payload:', updatePayload);

      return apiRequest("/api/users/" + user?.id, "PATCH", updatePayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      // Forçar atualização dos dados do usuário
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
      setEditingCard(null);
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
      console.log('Starting avatar upload for file:', file.name, 'size:', file.size);

      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      try {
        const response = await fetch("/api/profile/avatar", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        console.log('Avatar upload response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Avatar upload error response:', errorText);

          let errorMessage = "Erro ao fazer upload da imagem";
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            // Fallback to default message if parsing fails
          }

          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('Avatar upload success:', result);
        return result;
      } catch (error) {
        console.error('Network error during avatar upload:', error);
        throw new Error("Erro de rede. Verifique sua conexão e tente novamente.");
      }
    },
    onSuccess: (data) => {
      console.log('Avatar upload mutation success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      showSuccess("Avatar atualizado com sucesso!");
    },
    onError: (error: Error) => {
      console.error('Avatar upload mutation error:', error);
      showError(error.message || "Erro ao fazer upload da imagem. Tente novamente.");
    }
  });

  const sendToN8NMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/n8n/sync-user-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to sync data: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('N8N sync response:', data);
      if (data.n8nResponse) {
        console.log('N8N webhook response:', data.n8nResponse);
        showSuccess("Treino atualizado com sucesso!");
      } else {
        showSuccess("Treino atualizado com sucesso!");
      }
    },
    onError: (error: Error) => {
      console.error('N8N sync error:', error);
      showError("Erro ao atualizar treino. Tente novamente.");
    }
  });

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError("Arquivo muito grande. Tamanho máximo: 5MB");
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showError("Tipo de arquivo não suportado. Use JPEG, PNG, GIF ou WebP");
        return;
      }

      avatarUploadMutation.mutate(file);
    }

    // Reset the input so the same file can be selected again if needed
    event.target.value = '';
  };

  const handleSendToN8N = () => {
    sendToN8NMutation.mutate();
  };

  // Mutação para limpar todos os dados de treinos
  const clearWorkoutDataMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/clear-workout-data", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao limpar dados: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a treinos
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["workout-sessions"] });
      
      // Forçar refresh completo da página para garantir que todos os cards sejam atualizados
      window.location.reload();
      
      showSuccess("Todos os dados de treinos foram limpos com sucesso!");
    },
    onError: (error: Error) => {
      console.error('Erro ao limpar dados:', error);
      showError("Erro ao limpar dados. Tente novamente.");
    }
  });

  const handleClearWorkoutData = () => {
    if (confirm("Tem certeza que deseja limpar todos os treinos executados, histórico e treino sugerido ativo? Esta ação não pode ser desfeita.")) {
      clearWorkoutDataMutation.mutate();
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = ('' + value).replace(/\D/g, '');
    
    // Apply formatting for Brazilian phone numbers
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    // Partial formatting for incomplete numbers
    if (cleaned.length >= 2) {
      const ddd = cleaned.slice(0, 2);
      const remaining = cleaned.slice(2);
      
      if (remaining.length >= 5) {
        const firstPart = remaining.slice(0, 5);
        const secondPart = remaining.slice(5, 9);
        return `(${ddd}) ${firstPart}${secondPart ? '-' + secondPart : ''}`;
      } else if (remaining.length > 0) {
        return `(${ddd}) ${remaining}`;
      } else {
        return `(${ddd}`;
      }
    }
    
    return cleaned;
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setFormData(user || {});
  };

  const handleSaveEdit = async () => {
    try {
      // Filter out empty or unchanged values
      const updatesToSend = Object.fromEntries(
        Object.entries(formData).filter(([key, value]) => {
          // Skip if value is empty, null, undefined, or unchanged from original
          if (value === null || value === undefined || value === '') {
            return false;
          }
          // Check if value is different from current user data
          const currentValue = user[key as keyof typeof user];
          return value !== currentValue;
        })
      );

      console.log("Sending update payload:", updatesToSend);

      // Only send request if there are actual changes
      if (Object.keys(updatesToSend).length > 0) {
        await updateMutation.mutateAsync(updatesToSend);
      } else {
        console.log("No changes detected, skipping update");
      }

      setEditingCard(null);
    } catch (error) {
      console.error("Error updating profile:", error);
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
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e preferências</p>
      </div>

      {/* Profile Header */}
      <div className="w-full bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 mb-6">
        <div className="flex flex-row items-start space-x-4">
          <div className="relative">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 border-2 border-primary/20">
              <AvatarImage 
                src={user.avatarUrl ? `${window.location.origin}${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Usuario')}&background=0CE6D6&color=fff&size=80`} 
                alt="Avatar do usuário"
                onError={(e) => {
                  console.log('Error loading avatar:', user.avatarUrl);
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Usuario')}&background=0CE6D6&color=fff&size=80`;
                }}
              />
              <AvatarFallback className="text-xl sm:text-2xl bg-primary text-primary-foreground">
                {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              variant="secondary"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0 shadow-md hover:shadow-lg transition-all border border-primary/20"
              onClick={() => document.getElementById('avatar-upload')?.click()}
              disabled={avatarUploadMutation.isPending}
            >
              {avatarUploadMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div className="flex-1 text-left min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              {user.name || 'Usuário'}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-2">
              {user.email}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">
                {userAge} anos • {user.gender === 'female' ? 'Feminino' : user.gender === 'male' ? 'Masculino' : 'Não informado'}
              </span>
            </div>
          </div>

        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card className="w-full">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 flex-shrink-0" />
                <span>Informações Pessoais</span>
              </CardTitle>
              <div className="flex gap-2">
                {editingCard === 'personal' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingCard('personal')}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                {editingCard === 'personal' ? (
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
                <Label>Telefone</Label>
                {editingCard === 'personal' ? (
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone || ""}
                    onChange={(e) => {
                      const formattedValue = formatPhoneNumber(e.target.value);
                      setFormData({ ...formData, phone: formattedValue });
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{user.phone || "Não informado"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                {editingCard === 'personal' ? (
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="h-5 w-5 flex-shrink-0" />
                <span>Dados Físicos</span>
              </CardTitle>
              <div className="flex gap-2">
                {editingCard === 'physical' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingCard('physical')}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Peso (kg)</Label>
                {editingCard === 'physical' ? (
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
                {editingCard === 'physical' ? (
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
                {editingCard === 'physical' ? (
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Objetivos de Treino
              </CardTitle>
              <div className="flex gap-2">
                {editingCard === 'goals' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingCard('goals')}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Objetivo Principal</Label>
              {editingCard === 'goals' ? (
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
              {editingCard === 'goals' ? (
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
              <Label>Horário Preferido para Treino</Label>
              {editingCard === 'goals' ? (
                <Select 
                  value={formData.preferredWorkoutTime || ""} 
                  onValueChange={(value) => setFormData({ ...formData, preferredWorkoutTime: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Manhã</SelectItem>
                    <SelectItem value="afternoon">Tarde</SelectItem>
                    <SelectItem value="evening">Noite</SelectItem>
                    <SelectItem value="variable">Variável</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {user.preferredWorkoutTime && lifestyleMappings.preferredWorkoutTime[user.preferredWorkoutTime as keyof typeof lifestyleMappings.preferredWorkoutTime] || "Não informado"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Dias Disponíveis por Semana</Label>
              {editingCard === 'goals' ? (
                <Select 
                  value={formData.availableDaysPerWeek?.toString() || ""} 
                  onValueChange={(value) => setFormData({ ...formData, availableDaysPerWeek: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <SelectItem key={day} value={day.toString()}>{day} dia{day > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {user.availableDaysPerWeek ? `${user.availableDaysPerWeek} dia${user.availableDaysPerWeek > 1 ? 's' : ''}` : "Não informado"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Duração Média dos Treinos</Label>
              {editingCard === 'goals' ? (
                <Select 
                  value={formData.averageWorkoutDuration || ""} 
                  onValueChange={(value) => setFormData({ ...formData, averageWorkoutDuration: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15-20min">15-20 minutos</SelectItem>
                    <SelectItem value="30min">30 minutos</SelectItem>
                    <SelectItem value="45min">45 minutos</SelectItem>
                    <SelectItem value="1h_or_more">1 hora ou mais</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {user.averageWorkoutDuration && lifestyleMappings.averageWorkoutDuration[user.averageWorkoutDuration as keyof typeof lifestyleMappings.averageWorkoutDuration] || "Não informado"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estrutura de Treino */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Estrutura de treino
              </CardTitle>
              <div className="flex gap-2">
                {editingCard === 'equipment' ? (
                                    <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingCard('equipment')}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Equipamentos */}
              <div>
                <Label className="text-base font-medium mb-3 block">Equipamentos Disponíveis</Label>
                {editingCard === 'equipment' ? (
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
                    {user.availableEquipment && (
                       typeof user.availableEquipment === 'string' 
                         ? (() => {
                             try {
                               return JSON.parse(user.availableEquipment).length > 0;
                             } catch {
                               return user.availableEquipment.length > 0;
                             }
                           })()
                         : user.availableEquipment.length > 0
                     ) ? (
                      <div className="grid grid-cols-2 gap-2">
                        {(typeof user.availableEquipment === 'string' 
                          ? (() => {
                              try {
                                return JSON.parse(user.availableEquipment);
                              } catch {
                                // Se não for JSON válido, trata como string simples
                                return [user.availableEquipment];
                              }
                            })()
                          : user.availableEquipment
                        ).map((equipmentId) => {
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
              </div>

              {/* Local Preferido */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Local Preferido para Treinar</Label>
                {editingCard === 'equipment' ? (
                  <Select 
                    value={formData.preferredLocation || ""} 
                    onValueChange={(value) => setFormData({ ...formData, preferredLocation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Em casa</SelectItem>
                      <SelectItem value="outdoor">Ao ar livre</SelectItem>
                      <SelectItem value="gym">Academia</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {user.preferredLocation && lifestyleMappings.preferredLocation[user.preferredLocation as keyof typeof lifestyleMappings.preferredLocation] || "Não informado"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estilo de Vida */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Estilo de Vida
              </CardTitle>
              <div className="flex gap-2">
                {editingCard === 'lifestyle' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingCard('lifestyle')}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tabagismo</Label>
                {editingCard === 'lifestyle' ? (
                  <Select 
                    value={formData.smokingStatus || ""} 
                    onValueChange={(value) => setFormData({ ...formData, smokingStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Nunca fumei</SelectItem>
                      <SelectItem value="yes">Sim, fumo</SelectItem>
                      <SelectItem value="ex_smoker">Ex-fumante</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {user.smokingStatus && lifestyleMappings.smokingStatus[user.smokingStatus as keyof typeof lifestyleMappings.smokingStatus] || "Não informado"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Consumo de Álcool</Label>
                {editingCard === 'lifestyle' ? (
                  <Select 
                    value={formData.alcoholConsumption || ""} 
                    onValueChange={(value) => setFormData({ ...formData, alcoholConsumption: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Nunca</SelectItem>
                      <SelectItem value="rarely">Raramente</SelectItem>
                      <SelectItem value="socially">Socialmente</SelectItem>
                      <SelectItem value="frequently">Frequentemente</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {user.alcoholConsumption && lifestyleMappings.alcoholConsumption[user.alcoholConsumption as keyof typeof lifestyleMappings.alcoholConsumption] || "Não informado"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tipo de Alimentação</Label>
                {editingCard === 'lifestyle' ? (
                  <Select 
                    value={formData.dietType || ""} 
                    onValueChange={(value) => setFormData({ ...formData, dietType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanceada</SelectItem>
                      <SelectItem value="high_protein">Rica em proteínas</SelectItem>
                      <SelectItem value="high_carb">Rica em carboidratos</SelectItem>
                      <SelectItem value="fast_food">Fast-food</SelectItem>
                      <SelectItem value="vegetarian_vegan">Vegetariana/Vegana</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {user.dietType && lifestyleMappings.dietType[user.dietType as keyof typeof lifestyleMappings.dietType] || "Não informado"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Horas de Sono</Label>
                {editingCard === 'lifestyle' ? (
                  <Select 
                    value={formData.sleepHours || ""} 
                    onValueChange={(value) => setFormData({ ...formData, sleepHours: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4-5">4-5 horas</SelectItem>
                      <SelectItem value="6-7">6-7 horas</SelectItem>
                      <SelectItem value="8-9">8-9 horas</SelectItem>
                      <SelectItem value="9+">9+ horas</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {user.sleepHours && lifestyleMappings.sleepHours[user.sleepHours as keyof typeof lifestyleMappings.sleepHours] || "Não informado"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nível de Estresse</Label>
                {editingCard === 'lifestyle' ? (
                  <Select 
                    value={formData.stressLevel || ""} 
                    onValueChange={(value) => setFormData({ ...formData, stressLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="moderate">Moderado</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                      <SelectItem value="very_high">Muito alto</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {user.stressLevel && lifestyleMappings.stressLevel[user.stressLevel as keyof typeof lifestyleMappings.stressLevel] || "Não informado"}
                  </p>
                )}
              </div>

            </div>
          </CardContent>
        </Card>



        {/* Restrições Físicas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Restrições Físicas
              </CardTitle>
              <div className="flex gap-2">
                {editingCard === 'restrictions' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingCard('restrictions')}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Descreva suas restrições físicas (lesões, limitações, etc.)</Label>
              {editingCard === 'restrictions' ? (
                <textarea
                  className="w-full min-h-[100px] p-3 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholder="Ex: Lesão no joelho direito, problemas na coluna lombar, etc."
                  value={formData.physicalRestrictions || ""}
                  onChange={(e) => setFormData({ ...formData, physicalRestrictions: e.target.value })}
                />
              ) : (
                <div className="min-h-[60px] p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    {user.physicalRestrictions || "Nenhuma restrição física informada"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações
              </div>
              {editingCard !== "settings" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCard("settings")}
                  className="h-8 w-8 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              {editingCard === "settings" && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCard(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Gerencie os dados do seu aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingCard === "settings" ? (
              <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-destructive">Zona de Perigo</h4>
                    <p className="text-sm text-muted-foreground">
                      Esta ação irá apagar permanentemente todos os seus treinos executados, 
                      histórico de exercícios e treino sugerido ativo. Esta ação não pode ser desfeita.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleClearWorkoutData}
                      disabled={clearWorkoutDataMutation.isPending}
                      className="mt-2"
                    >
                      {clearWorkoutDataMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Limpando dados...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpar todos os dados de treinos
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique no ícone de configurações para acessar opções avançadas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}