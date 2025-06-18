import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-postgres";
import type { InsertUser, User, Session, InsertSession, ScheduledWorkout, InsertScheduledWorkout, WorkoutSession, InsertWorkoutSession, RegisterData, LoginData, OnboardingData, N8NWorkoutRequest, CompletedExercise } from "@shared/schema";
import { insertUserSchema, insertScheduledWorkoutSchema, insertWorkoutSessionSchema, onboardingSchema, registerSchema, loginSchema, profileUpdateSchema, n8nWorkoutRequestSchema, aiWorkoutResponseSchema, users, type AIWorkoutResponse, type AIExercise } from "@shared/schema";
import { z } from "zod";
import { hashPassword, verifyPassword, generateJWT, sanitizeUser } from "./auth";
import { authenticateToken, optionalAuth } from "./middleware";
import { Request, Response } from "express";
import { db } from "./database";
import { eq } from "drizzle-orm";
import { generateAIWorkout } from "./ai-workout-endpoint";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id || 'unknown';
    const extension = path.extname(file.originalname);
    cb(null, `profile-${userId}-${Date.now()}${extension}`);
  }
});

const upload = multer({ 
  storage: storageConfig,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth setup route
  app.post("/api/auth/setup", async (req, res) => {
    try {
      const userData = req.body;
      console.log("Setup attempt for email:", userData.email);

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        console.log("User already exists:", existingUser.email);
        return res.status(400).json({ message: "Email já está em uso" });
      }

      const hashedPassword = await hashPassword(userData.password);
      const newUser = await storage.createUser({
        email: userData.email,
        password: hashedPassword,
        name: userData.name || userData.email,
        onboardingCompleted: false
      });

      const token = generateJWT(newUser);
      console.log("User created successfully:", newUser.email);

      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: sanitizeUser(newUser),
        token
      });
    } catch (error) {
      console.error("Setup error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const token = generateJWT(user);

      res.json({
        message: "Login realizado com sucesso",
        user: sanitizeUser(user),
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const fullUser = await storage.getUser(user.id);
      
      if (!fullUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({
        user: sanitizeUser(fullUser)
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Onboarding route
  app.post("/api/onboarding", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const onboardingData = onboardingSchema.parse(req.body);

      const updatedUser = await storage.updateUser(userId, {
        ...onboardingData,
        onboardingCompleted: true
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({
        message: "Onboarding concluído com sucesso",
        user: sanitizeUser(updatedUser)
      });
    } catch (error) {
      console.error("Onboarding error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Profile update route
  app.patch("/api/profile/update", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const profileData = profileUpdateSchema.parse(req.body);

      const updatedUser = await storage.updateUser(userId, profileData);

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({ 
        message: "Perfil atualizado com sucesso",
        user: sanitizeUser(updatedUser)
      });
    } catch (error) {
      console.error('Profile update error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // AI Workout Generation - using clean implementation
  app.post("/api/ai/generate-workout", authenticateToken, generateAIWorkout);

  // Scheduled workouts routes
  app.get("/api/scheduled-workouts", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const workouts = await storage.getScheduledWorkouts(user.id);
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching scheduled workouts:", error);
      res.status(500).json({ message: "Erro ao buscar treinos programados" });
    }
  });

  app.get("/api/scheduled-workouts/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const workoutId = parseInt(req.params.id);
      const workout = await storage.getScheduledWorkout(workoutId);

      if (!workout) {
        return res.status(404).json({ message: "Treino não encontrado" });
      }

      if (workout.userId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(workout);
    } catch (error) {
      console.error("Error fetching scheduled workout:", error);
      res.status(500).json({ message: "Erro ao buscar treino" });
    }
  });

  // Start workout session
  app.post("/api/workout-sessions/start", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { scheduledWorkoutId, workoutName } = req.body;

      const session = await storage.createWorkoutSession({
        userId: user.id,
        scheduledWorkoutId: scheduledWorkoutId || null,
        name: workoutName || "Sessão de Treino",
        startedAt: new Date()
      });

      res.status(201).json(session);
    } catch (error) {
      console.error("Error starting workout session:", error);
      res.status(500).json({ message: "Erro ao iniciar sessão de treino" });
    }
  });

  // Health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}