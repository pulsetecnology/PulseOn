import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertScheduledWorkoutSchema,
  insertWorkoutSessionSchema,
  onboardingSchema,
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  n8nWorkoutRequestSchema,
  aiWorkoutResponseSchema,
  users,
  type AIWorkoutResponse,
  type AIExercise,
} from "@shared/schema";
import { z } from "zod";
import {
  hashPassword,
  verifyPassword,
  generateJWT,
  sanitizeUser,
} from "./auth";
import { authenticateToken } from "./middleware";
import { requestWorkoutFromAI } from "./n8n-service";
import { Request, Response } from "express";
import { db } from "./database";
import { eq } from "drizzle-orm";

import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id || "unknown";
    const extension = path.extname(file.originalname);
    cb(null, `profile-${userId}-${Date.now()}${extension}`);
  },
});

const upload = multer({
  storage: storageConfig,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    console.log("File filter - File type:", file.mimetype, "Original name:", file.originalname);
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.error("File type not allowed:", file.mimetype);
      cb(new Error("Tipo de arquivo não permitido"));
    }
  },
});

// Add multer error handling middleware
const handleMulterError = (error: any, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError) {
    console.error("Multer error:", error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: "Arquivo muito grande. Tamanho máximo: 5MB" });
    }
    return res.status(400).json({ message: "Erro no upload do arquivo" });
  } else if (error) {
    console.error("Upload error:", error);
    return res.status(400).json({ message: error.message });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // New simplified auth setup route
  app.post("/api/auth/setup", async (req, res) => {
    try {
      const userData = req.body;
      console.log("Setup attempt for email:", userData.email);
      console.log("Setup data received:", JSON.stringify(userData, null, 2));

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        console.log("User already exists:", existingUser.email);
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user with all data
      const user = await storage.createUser({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        birthDate: userData.birthDate,
        age: userData.age,
        weight: userData.weight,
        height: userData.height,
        gender: userData.gender || "not_specified",
        fitnessGoal: userData.fitnessGoal,
        experienceLevel: userData.experienceLevel,
        weeklyFrequency: userData.weeklyFrequency,
        availableEquipment: userData.availableEquipment,
        physicalRestrictions: userData.physicalRestrictions || null,
        onboardingCompleted: true,
      });

      console.log("User created successfully:", user.email, "ID:", user.id);
      console.log("Created user data:", JSON.stringify(user, null, 2));

      // Generate JWT token
      const token = generateJWT(user);
      const sanitizedUser = sanitizeUser(user);

      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: sanitizedUser,
        token,
      });
    } catch (error: any) {
      console.error("Setup error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = generateJWT(user);
      const sanitizedUser = sanitizeUser(user);

      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: sanitizedUser,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      console.log("Login attempt for email:", loginData.email);

      // Find user by email
      const user = await storage.getUserByEmail(loginData.email);
      console.log("User found:", user ? user.email : "not found");
      if (!user) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Verify password
      const isValidPassword = await verifyPassword(
        loginData.password,
        user.password,
      );
      if (!isValidPassword) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Generate JWT token
      const token = generateJWT(user);
      const sanitizedUser = sanitizeUser(user);

      res.json({
        message: "Login realizado com sucesso",
        user: sanitizedUser,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req, res) => {
    res.json({ message: "Logout realizado com sucesso" });
  });

  // User routes
  app.get("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Ensure user can only update their own profile
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const updateData = req.body;
      const updatedUser = await storage.updateUser(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const sanitizedUser = sanitizeUser(updatedUser);
      res.json({
        message: "Perfil atualizado com sucesso",
        user: sanitizedUser,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);

      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = insertUserSchema.partial().parse(req.body);

      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Onboarding route
  app.post("/api/onboarding", authenticateToken, async (req, res) => {
    try {
      const onboardingData = onboardingSchema.parse(req.body);
      const userId = req.user!.id;

      // Update user with onboarding data
      const updatedUser = await storage.updateUser(userId, onboardingData);

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Prepare data for AI workout generation
      const aiRequestData = {
        userId: updatedUser.id,
        age: updatedUser.age!,
        weight: updatedUser.weight!,
        height: updatedUser.height!,
        fitnessGoal: updatedUser.fitnessGoal!,
        experienceLevel: updatedUser.experienceLevel!,
        weeklyFrequency: updatedUser.weeklyFrequency!,
        availableEquipment: updatedUser.availableEquipment!,
        physicalRestrictions: updatedUser.physicalRestrictions || undefined,
      };

      // Request workout from AI
      try {
        const aiWorkout = await requestWorkoutFromAI(aiRequestData);

        // Create workout from AI response
        const workout = await storage.createWorkout({
          userId: updatedUser.id,
          name: aiWorkout.workoutName,
          description: aiWorkout.description,
          duration: aiWorkout.duration,
          difficulty: aiWorkout.difficulty,
          exercises: aiWorkout.exercises,
        });

        res.json({
          message: "Onboarding concluído com sucesso",
          user: sanitizeUser(updatedUser),
          firstWorkout: workout,
        });
      } catch (aiError) {
        console.error("AI workout generation failed:", aiError);
        res.json({
          message: "Onboarding concluído com sucesso",
          user: sanitizeUser(updatedUser),
          note: "Treino personalizado será gerado em breve",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Profile update route
  app.patch(
    "/api/profile/update",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        console.log("Profile update request body:", req.body);

        const updateData = profileUpdateSchema.parse(req.body);
        const userId = req.user!.id;

        console.log("Parsed update data:", updateData);

        const updatedUser = await storage.updateUser(userId, updateData);

        if (!updatedUser) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }

        res.json({
          message: "Perfil atualizado com sucesso",
          user: sanitizeUser(updatedUser),
        });
      } catch (error) {
        console.error("Profile update error:", error);
        if (error instanceof z.ZodError) {
          console.log("Validation errors:", error.errors);
          return res.status(400).json({
            message: "Dados inválidos",
            errors: error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
              received: err.received,
            })),
          });
        }
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    },
  );

  // AI Workout Generation - "Atualizar IA" button functionality
  app.post(
    "/api/ai/generate-workout",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const user = req.user!;

        // Get user profile data for AI request
        const userProfile = await storage.getUser(user.id);
        if (!userProfile) {
          return res
            .status(404)
            .json({ message: "Perfil do usuário não encontrado" });
        }

        // Check if user has completed onboarding
        if (!userProfile.onboardingCompleted) {
          return res.status(400).json({
            message:
              "Complete o onboarding primeiro para gerar treinos personalizados",
          });
        }

        // Prepare data for N8N AI request
        const aiRequestData = {
          userId: user.id,
          age: userProfile.age || 25,
          weight: userProfile.weight || 70,
          height: userProfile.height || 170,
          fitnessGoal: userProfile.fitnessGoal || "improve_conditioning",
          experienceLevel: userProfile.experienceLevel || "intermediate",
          weeklyFrequency: userProfile.weeklyFrequency || 3,
          availableEquipment: userProfile.availableEquipment || ["basic"],
          physicalRestrictions: userProfile.physicalRestrictions || "",
        };

        console.log("Requesting AI workout for user:", user.id, aiRequestData);

        // Call N8N service for AI workout generation
        try {
          console.log("Calling N8N for AI workout generation...");

          const response = await fetch(
            process.env.N8N_WEBHOOK_URL ||
              "https://n8n-pulseon-railway.up.railway.app/webhook/pulseon-workout",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(aiRequestData),
              signal: AbortSignal.timeout(30000),
            },
          );

          if (!response.ok) {
            throw new Error(`N8N API error: ${response.status}`);
          }

          const n8nResponse = await response.json();
          console.log("N8N Response:", JSON.stringify(n8nResponse, null, 2));

          // Save AI response to file
          const timestamp = new Date().toLocaleString("pt-BR");
          const logContent = `AI Response Log - PulseOn
=========================

Data da última atualização: ${timestamp}

Request Data:
${JSON.stringify(aiRequestData, null, 2)}

N8N Response:
${JSON.stringify(n8nResponse, null, 2)}

=========================
`;

          try {
            fs.writeFileSync(
              path.join(process.cwd(), "ai-response.txt"),
              logContent,
              "utf8",
            );
            console.log("AI response saved to ai-response.txt");
          } catch (fileError) {
            console.error("Error saving AI response to file:", fileError);
          }

          // Check if N8N already saved the workout (savedWorkout field)
          if (n8nResponse.savedWorkout) {
            console.log(
              "N8N already saved workout with ID:",
              n8nResponse.savedWorkout.id,
            );

            // Return the workout that was already saved by N8N
            return res.status(201).json({
              message: "Treino gerado pela IA com sucesso!",
              workout: {
                id: n8nResponse.savedWorkout.id,
                userId: n8nResponse.savedWorkout.userId,
                name: n8nResponse.savedWorkout.name,
                exercises: n8nResponse.savedWorkout.exercises,
                totalCalories: n8nResponse.savedWorkout.totalCalories,
                totalDuration: n8nResponse.savedWorkout.totalDuration,
                status: n8nResponse.savedWorkout.status,
                createdAt: n8nResponse.savedWorkout.createdAt,
                scheduledFor: n8nResponse.savedWorkout.scheduledFor,
              },
            });
          }

          // Fallback: Create workout locally if N8N didn't save it
          const aiWorkoutResponse = {
            userId: user.id,
            workoutPlan: n8nResponse.workoutPlan || [],
          };

          if (!aiWorkoutResponse.workoutPlan.length) {
            throw new Error("No workout plan received from N8N");
          }

          // Calculate total duration and calories from the workout plan
          const totalDuration = aiWorkoutResponse.workoutPlan.reduce(
            (sum: number, exercise: any) => {
              return (
                sum +
                (exercise.time > 0
                  ? exercise.time
                  : (exercise.series * exercise.repetitions * 0.5) / 60)
              );
            },
            0,
          );

          const totalCalories = aiWorkoutResponse.workoutPlan.reduce(
            (sum: number, exercise: any) => sum + exercise.calories,
            0,
          );

          // Generate workout name
          const workoutName = `Treino IA - ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

          // Save scheduled workout to database as fallback
          const scheduledWorkout = await storage.createScheduledWorkout({
            userId: user.id,
            name: workoutName,
            exercises: aiWorkoutResponse.workoutPlan,
            totalCalories: Math.round(totalCalories),
            totalDuration: Math.round(totalDuration),
            status: "pending",
          });

          console.log(
            "Fallback: AI workout saved to local database:",
            scheduledWorkout.id,
          );

          return res.status(201).json({
            message: "Treino gerado pela IA com sucesso!",
            workout: scheduledWorkout,
          });
        } catch (n8nError) {
          console.error("N8N service error:", n8nError);

          // Generate fallback workout using local logic
          const fallbackExercises = [
            {
              exercise: "Corrida na esteira",
              muscleGroup: "Cardio",
              type: "Cardio",
              instructions:
                "Mantenha um ritmo constante e respire adequadamente",
              time: 20,
              series: 1,
              repetitions: 0,
              restBetweenSeries: 0,
              restBetweenExercises: 60,
              weight: 0,
              calories: 150,
            },
            {
              exercise: "Agachamento com peso corporal",
              muscleGroup: "Pernas",
              type: "Força",
              instructions: "Mantenha as costas retas e desça até 90 graus",
              time: 0,
              series: 3,
              repetitions: 15,
              restBetweenSeries: 60,
              restBetweenExercises: 120,
              weight: 0,
              calories: 80,
            },
          ];

          const fallbackWorkout = await storage.createScheduledWorkout({
            userId: user.id,
            name: `Treino Cardio + Força`,
            exercises: fallbackExercises,
            totalCalories: 230,
            totalDuration: 25,
            status: "pending",
          });

          console.log("Fallback workout created:", fallbackWorkout.id);

          return res.status(201).json({
            message: "Treino gerado com sucesso (modo offline)!",
            workout: fallbackWorkout,
          });
        }
      } catch (error: any) {
        console.error("AI workout generation error:", error);
        res.status(500).json({
          message: "Erro ao gerar treino com IA",
          error: error.message,
        });
      }
    },
  );

  // Scheduled workouts routes
  app.get(
    "/api/scheduled-workouts",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const user = req.user!;
        const workouts = await storage.getScheduledWorkouts(user.id);
        res.json(workouts);
      } catch (error) {
        console.error("Error fetching scheduled workouts:", error);
        res.status(500).json({ message: "Erro ao buscar treinos programados" });
      }
    },
  );

  app.get(
    "/api/scheduled-workouts/:id",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const workoutId = parseInt(req.params.id);
        const workout = await storage.getScheduledWorkout(workoutId);

        if (!workout) {
          return res.status(404).json({ message: "Treino não encontrado" });
        }

        // Check if user owns this workout
        if (workout.userId !== req.user!.id) {
          return res.status(403).json({ message: "Acesso negado" });
        }

        res.json(workout);
      } catch (error) {
        console.error("Error fetching scheduled workout:", error);
        res.status(500).json({ message: "Erro ao buscar treino" });
      }
    },
  );

  // Start workout session
  app.post(
    "/api/workout-sessions/start",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const user = req.user!;
        const { scheduledWorkoutId } = req.body;

        const scheduledWorkout =
          await storage.getScheduledWorkout(scheduledWorkoutId);
        if (!scheduledWorkout) {
          return res
            .status(404)
            .json({ message: "Treino programado não encontrado" });
        }

        if (scheduledWorkout.userId !== user.id) {
          return res.status(403).json({ message: "Acesso negado" });
        }

        // Create workout session
        const session = await storage.createWorkoutSession({
          userId: user.id,
          scheduledWorkoutId: scheduledWorkoutId,
          name: scheduledWorkout.name,
          exercises:
            scheduledWorkout.exercises?.map((ex) => ({
              ...ex,
              completed: false,
              effortLevel: 5,
            })) || [],
        });

        res.status(201).json({
          message: "Treino iniciado com sucesso!",
          session,
        });
      } catch (error) {
        console.error("Error starting workout session:", error);
        res.status(500).json({ message: "Erro ao iniciar treino" });
      }
    },
  );

  // Workout session routes
  app.get("/api/workout-sessions", authenticateToken, async (req, res) => {
    try {
      const sessions = await storage.getWorkoutSessions(req.user!.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching workout sessions:", error);
      res.status(500).json({ message: "Erro ao carregar sessões de treino" });
    }
  });

  app.post("/api/workout-sessions", async (req, res) => {
    try {
      const sessionData = insertWorkoutSessionSchema.parse(req.body);
      const session = await storage.createWorkoutSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/workout-sessions/:id", authenticateToken, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updates = insertWorkoutSessionSchema.partial().parse(req.body);

      const session = await storage.updateWorkoutSession(sessionId, updates);
      if (!session) {
        return res.status(404).json({ message: "Sessão de treino não encontrada" });
      }

      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Complete workout session
  app.put("/api/workout-sessions/:id/complete", authenticateToken, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { exercises, totalDuration, totalCalories, notes } = req.body;

      const session = await storage.completeWorkoutSession(
        sessionId,
        exercises,
        totalDuration,
        totalCalories,
        notes
      );
      
      if (!session) {
        return res.status(404).json({ message: "Sessão de treino não encontrada" });
      }

      res.json({
        message: "Treino concluído com sucesso!",
        session
      });
    } catch (error) {
      console.error("Error completing workout session:", error);
      res.status(500).json({ message: "Erro ao concluir treino" });
    }
  });

  // User stats endpoint
  app.get("/api/user/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Erro ao carregar estatísticas" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // N8N Integration endpoints
  app.get("/api/n8n/users", async (req: Request, res: Response) => {
    try {
      // Basic API key authentication for N8N
      const apiKey = req.headers["x-api-key"];
      if (apiKey !== process.env.N8N_API_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/n8n/users/:id", async (req: Request, res: Response) => {
    try {
      const apiKey = req.headers["x-api-key"];
      if (apiKey !== process.env.N8N_API_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/n8n/workout-sessions", async (req: Request, res: Response) => {
    try {
      const apiKey = req.headers["x-api-key"];
      if (apiKey !== process.env.N8N_API_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const sessionData = insertWorkoutSessionSchema.parse(req.body);
      const session = await storage.createWorkoutSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/n8n/workouts", async (req: Request, res: Response) => {
    try {
      const apiKey = req.headers["x-api-key"];
      if (apiKey !== process.env.N8N_API_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.query.userId
        ? parseInt(req.query.userId as string)
        : undefined;
      const workouts = await storage.getWorkouts(userId);
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Upload profile photo
  app.post(
    "/api/profile/photo",
    authenticateToken,
    upload.single("photo"),
    async (req: Request, res: Response) => {
      try {
        const userId = req.user!.id;

        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const photoUrl = `/api/uploads/${req.file.filename}`;

        // Update user's profile photo in database using storage
        const updatedUser = await storage.updateUser(userId, {
          avatarUrl: photoUrl,
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }

        res.json({
          message: "Foto de perfil atualizada com sucesso",
          photoUrl,
          user: sanitizeUser(updatedUser),
        });
      } catch (error) {
        console.error("Error uploading photo:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    },
  );

  // Upload avatar
  app.post(
    "/api/profile/avatar",
    authenticateToken,
    upload.single("avatar"),
    async (req: Request, res: Response) => {
      try {
        const userId = req.user!.id;

        if (!req.file) {
          console.error("No file uploaded in avatar request");
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        console.log("Avatar upload - File received:", req.file.filename);
        const avatarUrl = `/api/uploads/${req.file.filename}`;

        // Update user's avatar in database using storage
        const updatedUser = await storage.updateUser(userId, { avatarUrl });

        if (!updatedUser) {
          console.error("User not found when updating avatar for userId:", userId);
          return res.status(404).json({ message: "Usuário não encontrado" });
        }

        console.log("Avatar updated successfully for user:", userId);
        res.json({
          message: "Avatar atualizado com sucesso",
          avatarUrl,
          user: sanitizeUser(updatedUser),
        });
      } catch (error: any) {
        console.error("Error uploading avatar:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ 
          message: "Erro ao fazer upload do avatar",
          error: error.message 
        });
      }
    },
  );

  // Serve uploaded files
  app.get("/api/uploads/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filepath = path.join(process.cwd(), "uploads", filename);

    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: "Arquivo não encontrado" });
    }
  });

  // Sync user data with N8N
  app.post(
    "/api/n8n/sync-user-data",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user!.id;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }

        // Remove sensitive data
        const { password, ...userData } = user;

        // Calculate age if birthDate exists
        let age = null;
        if (userData.birthDate) {
          const today = new Date();
          const birthDate = new Date(userData.birthDate);
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        // Prepare sync data for N8N
        const syncData = {
          userId: userData.id,
          timestamp: new Date().toISOString(),
          personalInfo: {
            name: userData.name,
            email: userData.email,
            birthDate: userData.birthDate,
            age: age,
            weight: userData.weight,
            height: userData.height,
            gender: userData.gender
          },
          fitnessProfile: {
            fitnessGoal: userData.fitnessGoal,
            experienceLevel: userData.experienceLevel,
            weeklyFrequency: userData.weeklyFrequency,
            customEquipment: userData.availableEquipment,
            physicalRestrictions: userData.physicalRestrictions,
            preferredWorkoutTime: userData.preferredWorkoutTime,
            availableDaysPerWeek: userData.availableDaysPerWeek,
            averageWorkoutDuration: userData.averageWorkoutDuration,
            preferredLocation: userData.preferredLocation
          },
          lifestyle: {
            smokingStatus: userData.smokingStatus,
            alcoholConsumption: userData.alcoholConsumption,
            dietType: userData.dietType,
            sleepHours: userData.sleepHours,
            stressLevel: userData.stressLevel
          },
          metadata: {
            onboardingCompleted: userData.onboardingCompleted,
            lastUpdated: new Date().toISOString()
          },
          validationField: "test-connection-railway-n8n"
        };

        // Save sync data to file for debugging
        const timestamp = new Date().toLocaleString("pt-BR");
        const logContent = `AI Response Log - PulseOn (Sync Data)
=========================

Data da última atualização: ${timestamp}

Sync Request Data:
${JSON.stringify(syncData, null, 2)}

N8N Sync Response:
[Pending response]

=========================
`;

        try {
          fs.writeFileSync(
            path.join(process.cwd(), "ai-response.txt"),
            logContent,
            "utf8",
          );
          console.log("Sync data saved to ai-response.txt");
        } catch (fileError) {
          console.error("Error saving sync data to file:", fileError);
        }

        // Call N8N webhook for AI workout generation
        try {
          console.log("Calling N8N for AI workout generation...");
          
          const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || "https://pulseon-n8n-automacao.up.railway.app/webhook/pulseon-workout";
          
          const response = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(syncData),
            signal: AbortSignal.timeout(30000),
          });

          if (!response.ok) {
            throw new Error(`N8N API error: ${response.status}`);
          }

          const n8nResponse = await response.json();
          console.log("N8N Response:", JSON.stringify(n8nResponse, null, 2));

          // Check if we have a savedWorkout in the response
          if (n8nResponse.savedWorkout) {
            console.log("Found savedWorkout in N8N response, using it directly");
            
            res.json({
              message: "Treino gerado com sucesso pela IA!",
              workout: n8nResponse.savedWorkout,
              syncData: syncData
            });
          } else if (n8nResponse.output) {
            // Try to parse workout from output
            try {
              const jsonMatch = n8nResponse.output.match(/```json\n([\s\S]*?)\n```/) || n8nResponse.output.match(/({[\s\S]*})/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[1]);
                if (parsed.workoutPlan) {
                  // Generate workout name
                  const workoutName = `Treino IA - ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
                  
                  // Calculate total duration and calories
                  const totalDuration = parsed.workoutPlan.reduce((sum: number, exercise: any) => {
                    return sum + (exercise.time > 0 ? exercise.time : (exercise.series * exercise.repetitions * 0.5) / 60);
                  }, 0);

                  const totalCalories = parsed.workoutPlan.reduce((sum: number, exercise: any) => sum + exercise.calories, 0);

                  // Save scheduled workout to database
                  const scheduledWorkout = await storage.createScheduledWorkout({
                    userId: user.id,
                    name: workoutName,
                    exercises: parsed.workoutPlan,
                    totalCalories: Math.round(totalCalories),
                    totalDuration: Math.round(totalDuration),
                    status: "pending",
                  });

                  res.json({
                    message: "Treino gerado com sucesso pela IA!",
                    workout: scheduledWorkout,
                    syncData: syncData
                  });
                  return;
                }
              }
            } catch (parseError) {
              console.error("Error parsing N8N output:", parseError);
            }
          }

          throw new Error("No valid workout data found in N8N response");

        } catch (n8nError) {
          console.error("N8N API error:", n8nError);
          
          // Generate fallback workout
          const fallbackWorkout = {
            userId: user.id,
            workoutPlan: [
              {
                exercise: "Agachamento com peso corporal",
                muscleGroup: "Pernas",
                type: "strength",
                instructions: "Mantenha os pés paralelos, desça até formar 90° nos joelhos e volte à posição inicial",
                time: 0,
                series: 3,
                repetitions: 15,
                restBetweenSeries: 60,
                restBetweenExercises: 90,
                weight: 0,
                calories: 45
              },
              {
                exercise: "Flexão de braço",
                muscleGroup: "Peito",
                type: "strength", 
                instructions: "Mantenha o corpo alinhado, desça o peito próximo ao chão e empurre de volta",
                time: 0,
                series: 3,
                repetitions: 10,
                restBetweenSeries: 60,
                restBetweenExercises: 90,
                weight: 0,
                calories: 35
              },
              {
                exercise: "Prancha",
                muscleGroup: "Core",
                type: "isometric",
                instructions: "Mantenha o corpo reto apoiado nos antebraços e pontas dos pés",
                time: 30,
                series: 3,
                repetitions: 1,
                restBetweenSeries: 60,
                restBetweenExercises: 90,
                weight: 0,
                calories: 25
              }
            ]
          };

          const totalDuration = fallbackWorkout.workoutPlan.reduce((sum: number, exercise: any) => {
            return sum + (exercise.time > 0 ? exercise.time : (exercise.series * exercise.repetitions * 0.5) / 60);
          }, 0);

          const totalCalories = fallbackWorkout.workoutPlan.reduce((sum: number, exercise: any) => sum + exercise.calories, 0);

          const workoutName = `Treino Offline - ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

          const scheduledWorkout = await storage.createScheduledWorkout({
            userId: user.id,
            name: workoutName,
            exercises: fallbackWorkout.workoutPlan,
            totalCalories: Math.round(totalCalories),
            totalDuration: Math.round(totalDuration),
            status: "pending",
          });

          res.json({
            message: "Treino gerado com sucesso (modo offline)!",
            workout: scheduledWorkout,
            syncData: syncData
          });
        }
      } catch (error) {
        console.error("Sync user data error:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}