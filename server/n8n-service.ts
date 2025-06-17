import type { N8NWorkoutRequest, AIExercise } from "@shared/schema";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://n8n.example.com/webhook/pulseon-workout";

export interface AIWorkoutResponse {
  userId: number;
  workoutPlan: AIExercise[];
}

export async function requestWorkoutFromAI(data: N8NWorkoutRequest): Promise<AIWorkoutResponse> {
  try {
    console.log("Sending request to N8N:", N8N_WEBHOOK_URL);
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      console.error(`N8N API error: ${response.status} ${response.statusText}`);
      throw new Error(`N8N API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("N8N Response received:", JSON.stringify(aiResponse, null, 2));
    
    // Return the response as-is since it should match our expected format
    return aiResponse as AIWorkoutResponse;

  } catch (error) {
    console.error('Error calling N8N AI service:', error);
    
    // Return a personalized fallback workout based on user data
    return generatePersonalizedFallback(data);
  }
}

function generatePersonalizedFallback(data: N8NWorkoutRequest): AIWorkoutResponse {
  const { fitnessGoal, experienceLevel } = data;
  
  // Generate realistic fallback workout based on the actual JSON format
  const fallbackExercises: AIExercise[] = [
    {
      exercise: "Corrida na esteira",
      muscleGroup: "Cardio",
      type: "Cardio",
      instructions: "Ajuste a esteira para uma inclinação suave e mantenha um ritmo constante.",
      time: 30,
      series: 1,
      repetitions: 0,
      restBetweenSeries: 0,
      restBetweenExercises: 90,
      weight: 0,
      calories: 150
    },
    {
      exercise: "Agachamento com peso corporal",
      muscleGroup: "Pernas",
      type: "Força",
      instructions: "Mantenha as costas retas, desça até os joelhos formarem 90 graus.",
      time: 0,
      series: experienceLevel === "beginner" ? 2 : 3,
      repetitions: experienceLevel === "beginner" ? 10 : 15,
      restBetweenSeries: 60,
      restBetweenExercises: 90,
      weight: 0,
      calories: 80
    },
    {
      exercise: "Flexão de braço",
      muscleGroup: "Peito",
      type: "Força",
      instructions: "Mantenha o corpo alinhado, desça até quase tocar o chão.",
      time: 0,
      series: experienceLevel === "beginner" ? 2 : 3,
      repetitions: experienceLevel === "beginner" ? 8 : 12,
      restBetweenSeries: 60,
      restBetweenExercises: 90,
      weight: 0,
      calories: 60
    }
  ];

  return {
    userId: data.userId,
    workoutPlan: fallbackExercises
  };
}
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