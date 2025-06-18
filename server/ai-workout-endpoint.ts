import type { Request, Response } from "express";
import { storage } from "./storage-postgres";
import { authenticateToken } from "./middleware";

// Simplified AI Workout Generation endpoint that properly handles N8N savedWorkout response
export async function generateAIWorkout(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Check if user has completed onboarding
    if (!user.onboardingCompleted) {
      return res.status(400).json({ message: "Complete o onboarding primeiro para gerar treinos personalizados" });
    }

    // Calculate age if birthDate exists
    let age = null;
    if (user.birthDate) {
      const today = new Date();
      const birth = new Date(user.birthDate);
      age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    // Prepare the data structure for N8N
    const n8nData = {
      userId: user.id,
      timestamp: new Date().toISOString(),
      personalInfo: {
        name: user.name,
        email: user.email,
        birthDate: user.birthDate,
        age: age || user.age,
        weight: user.weight,
        height: user.height,
        gender: user.gender
      },
      fitnessProfile: {
        fitnessGoal: user.fitnessGoal,
        experienceLevel: user.experienceLevel,
        weeklyFrequency: user.weeklyFrequency,
        availableEquipment: user.availableEquipment,
        customEquipment: user.customEquipment,
        physicalRestrictions: user.physicalRestrictions,
        preferredWorkoutTime: user.preferredWorkoutTime,
        availableDaysPerWeek: user.availableDaysPerWeek,
        averageWorkoutDuration: user.averageWorkoutDuration,
        preferredLocation: user.preferredLocation
      },
      lifestyle: {
        smokingStatus: user.smokingStatus,
        alcoholConsumption: user.alcoholConsumption,
        dietType: user.dietType,
        sleepHours: user.sleepHours,
        stressLevel: user.stressLevel
      },
      metadata: {
        onboardingCompleted: user.onboardingCompleted,
        lastUpdated: new Date().toISOString()
      },
      validationField: "test-connection-railway-n8n"
    };

    console.log('Requesting AI workout from N8N for user:', userId);

    // Send to Railway N8N webhook
    const RAILWAY_WEBHOOK_URL = "https://primary-production-3b832.up.railway.app/webhook-test/onboarding-recebido";
    
    const webhookResponse = await fetch(RAILWAY_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nData)
    });

    if (!webhookResponse.ok) {
      throw new Error(`N8N webhook failed: ${webhookResponse.status}`);
    }

    const n8nResponse = await webhookResponse.json();
    console.log('N8N workout response:', n8nResponse);

    // Check if we have a savedWorkout in the response (from the JSON structure you provided)
    if (n8nResponse && n8nResponse.savedWorkout) {
      const savedWorkout = n8nResponse.savedWorkout;
      console.log('Found savedWorkout in N8N response:', savedWorkout.id);
      
      return res.status(201).json({
        message: "Treino gerado pela IA com sucesso!",
        workout: savedWorkout
      });
    }

    // Fallback: Check if we have workout data in the output to parse and save
    if (n8nResponse && n8nResponse.output) {
      const jsonMatch = n8nResponse.output.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const workoutData = JSON.parse(jsonMatch[1]);
        console.log('Parsed workout data from output:', workoutData);
        
        if (workoutData.workoutPlan && Array.isArray(workoutData.workoutPlan)) {
          // Calculate totals
          const totalDuration = workoutData.workoutPlan.reduce((sum: number, exercise: any) => {
            return sum + (exercise.time > 0 ? exercise.time : (exercise.series * exercise.repetitions * 0.5 / 60));
          }, 0);

          const totalCalories = workoutData.workoutPlan.reduce((sum: number, exercise: any) => sum + exercise.calories, 0);

          // Generate workout name
          const workoutName = `Treino IA - ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

          // Save to database
          const scheduledWorkout = await storage.createScheduledWorkout({
            userId: userId,
            name: workoutName,
            exercises: workoutData.workoutPlan,
            totalCalories: Math.round(totalCalories),
            totalDuration: Math.round(totalDuration),
            status: "pending"
          });

          console.log("AI workout saved to database:", scheduledWorkout.id);
          
          return res.status(201).json({
            message: "Treino gerado pela IA com sucesso!",
            workout: scheduledWorkout
          });
        }
      }
    }

    throw new Error("No workout data received from AI service");

  } catch (error: any) {
    console.error("AI workout generation error:", error);
    res.status(500).json({ 
      message: "Erro ao gerar treino com IA",
      error: error.message 
    });
  }
}