import type { N8NWorkoutRequest, AIExercise } from "@shared/schema";

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://example.com/webhook/default";

export interface AIWorkoutResponse {
  userId: number;
  workoutPlan: AIExercise[];
  workoutName?: string;
  workoutObs?: string;
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
  workoutName?: string;
  workoutPlan?: AIExercise[];
}

export async function requestWorkoutFromAI(data: N8NWorkoutRequest): Promise<AIWorkoutResponse> {
  try {
    console.log("=== N8N REQUEST DEBUG ===");
    console.log("Sending request to N8N:", N8N_WEBHOOK_URL);
    console.log("N8N_WEBHOOK_URL from env:", process.env.N8N_WEBHOOK_URL || "NOT SET");
    console.log("Request data:", JSON.stringify(data, null, 2));
    console.log("========================");
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    console.log("Request headers:", Object.keys(headers));
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    console.log("=== N8N RESPONSE DEBUG ===");
    console.log("Response status:", response.status);
    console.log("Response statusText:", response.statusText);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    console.log("=========================");

    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
        console.error("N8N Error response body:", errorBody);
      } catch (e) {
        console.error("Could not read error response body");
      }
      
      console.error(`N8N API error: ${response.status} ${response.statusText}`);
      throw new Error(`N8N API error: ${response.status} - ${errorBody || response.statusText}`);
    }

    const n8nResponse: N8NWorkoutResponse = await response.json();
    console.log("N8N Response received:", JSON.stringify(n8nResponse, null, 2));
    
    // Check if we have a savedWorkout in the response
    if (n8nResponse.savedWorkout) {
      console.log("Found savedWorkout in N8N response, using it directly");
      return {
        userId: n8nResponse.savedWorkout.userId,
        workoutPlan: n8nResponse.savedWorkout.exercises,
        workoutName: n8nResponse.savedWorkout.name
      };
    }
    
    // Check if we have direct workoutPlan in response
    if (n8nResponse.workoutPlan) {
      return {
        userId: data.userId,
        workoutPlan: n8nResponse.workoutPlan,
        workoutName: n8nResponse.workoutName
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
              workoutPlan: parsed.workoutPlan,
              workoutName: parsed.workoutName,
              workoutObs: parsed.workoutObs
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
  const { fitnessGoal, experienceLevel, phone } = data;
  
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