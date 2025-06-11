import type { N8NWorkoutRequest } from "@shared/schema";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://n8n.example.com/webhook/pulseon-workout";

export interface AIWorkoutResponse {
  workoutName: string;
  description: string;
  duration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    suggestedWeight?: number;
    restTime: number;
    instructions?: string;
    muscleGroups: string[];
  }>;
}

export async function requestWorkoutFromAI(data: N8NWorkoutRequest): Promise<AIWorkoutResponse> {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: data.userId,
        userProfile: {
          age: data.age,
          weight: data.weight,
          height: data.height,
          fitnessGoal: data.fitnessGoal,
          experienceLevel: data.experienceLevel,
          weeklyFrequency: data.weeklyFrequency,
          availableEquipment: data.availableEquipment,
          physicalRestrictions: data.physicalRestrictions
        }
      })
    });

    if (!response.ok) {
      throw new Error(`N8N API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    // Validate and transform AI response
    return {
      workoutName: aiResponse.workoutName || `Treino Personalizado`,
      description: aiResponse.description || `Treino gerado pela IA baseado no seu perfil`,
      duration: aiResponse.duration || 45,
      difficulty: aiResponse.difficulty || data.experienceLevel,
      exercises: aiResponse.exercises || generateFallbackExercises(data)
    };

  } catch (error) {
    console.error('Error calling N8N AI service:', error);
    
    // Return a personalized fallback workout based on user data
    return generatePersonalizedFallback(data);
  }
}

function generatePersonalizedFallback(data: N8NWorkoutRequest): AIWorkoutResponse {
  const { fitnessGoal, experienceLevel, availableEquipment } = data;
  
  let workoutName = "Treino Personalizado";
  let exercises = [];
  
  if (fitnessGoal === "lose_weight") {
    workoutName = "Treino para Emagrecimento";
    exercises = [
      {
        id: "cardio-1",
        name: "Caminhada Rápida",
        sets: 1,
        reps: 30,
        restTime: 60,
        instructions: "Mantenha um ritmo constante e respiração controlada",
        muscleGroups: ["cardio", "pernas"]
      },
      {
        id: "strength-1",
        name: "Agachamento",
        sets: experienceLevel === "beginner" ? 2 : 3,
        reps: experienceLevel === "beginner" ? 10 : 15,
        restTime: 90,
        instructions: "Mantenha as costas retas e desça até formar 90 graus",
        muscleGroups: ["quadriceps", "glúteos"]
      }
    ];
  } else if (fitnessGoal === "gain_muscle") {
    workoutName = "Treino para Hipertrofia";
    exercises = [
      {
        id: "strength-2",
        name: availableEquipment.includes("Halteres") ? "Supino com Halteres" : "Flexão de Braço",
        sets: experienceLevel === "beginner" ? 3 : 4,
        reps: experienceLevel === "beginner" ? 8 : 12,
        suggestedWeight: availableEquipment.includes("Halteres") ? 15 : undefined,
        restTime: 120,
        instructions: "Movimento controlado, concentre-se na contração muscular",
        muscleGroups: ["peitoral", "tríceps"]
      }
    ];
  } else {
    workoutName = "Treino de Condicionamento";
    exercises = [
      {
        id: "cardio-2",
        name: "Burpees",
        sets: 3,
        reps: experienceLevel === "beginner" ? 5 : 10,
        restTime: 60,
        instructions: "Movimento explosivo, mantenha o core ativo",
        muscleGroups: ["corpo todo", "cardio"]
      }
    ];
  }

  return {
    workoutName,
    description: `Treino personalizado para ${fitnessGoal.replace('_', ' ')} - nível ${experienceLevel}`,
    duration: experienceLevel === "beginner" ? 30 : 45,
    difficulty: experienceLevel as "beginner" | "intermediate" | "advanced",
    exercises
  };
}

function generateFallbackExercises(data: N8NWorkoutRequest) {
  return [
    {
      id: "1",
      name: "Exercício Básico",
      sets: 3,
      reps: 10,
      restTime: 60,
      instructions: "Execute o movimento de forma controlada",
      muscleGroups: ["geral"]
    }
  ];
}