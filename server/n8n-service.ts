import type { N8NWorkoutRequest, AIExercise } from "@shared/schema";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://n8n.example.com/webhook/pulseon-workout";

export interface AIWorkoutResponse {
  userId: number;
  workoutPlan: AIExercise[];
}

export interface N8NWorkoutResponse {
  savedWorkout?: {
    id: number;
    userId: number;
    name: string;
    exercises: AIExercise[];
    totalCalories: number;
    totalDuration: number;
    status: string;
    createdAt: string;
    scheduledFor: string;
  };
  output?: string;
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

    const n8nResponse: N8NWorkoutResponse = await response.json();
    console.log("N8N Response received:", JSON.stringify(n8nResponse, null, 2));
    
    // Check if we have a savedWorkout in the response
    if (n8nResponse.savedWorkout) {
      console.log("Found savedWorkout in N8N response, using it directly");
      return {
        userId: n8nResponse.savedWorkout.userId,
        workoutPlan: n8nResponse.savedWorkout.exercises
      };
    }
    
    // Fallback to parsing output if available
    if (n8nResponse.output) {
      try {
        // Extract JSON from the output string (it may be wrapped in ```json)
        const jsonMatch = n8nResponse.output.match(/```json\n([\s\S]*?)\n```/) || n8nResponse.output.match(/({[\s\S]*})/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.workoutPlan) {
            return {
              userId: parsed.userId || data.userId,
              workoutPlan: parsed.workoutPlan
            };
          }
        }
      } catch (parseError) {
        console.error("Error parsing N8N output:", parseError);
      }
    }
    
    throw new Error("No valid workout data found in N8N response");

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