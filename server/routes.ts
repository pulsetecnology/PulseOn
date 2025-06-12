import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWorkoutSchema, insertWorkoutSessionSchema, onboardingSchema, registerSchema, loginSchema, profileUpdateSchema, n8nWorkoutRequestSchema } from "@shared/schema";
import { z } from "zod";
import { hashPassword, verifyPassword, generateJWT, sanitizeUser } from "./auth";
import { authenticateToken } from "./middleware";
import { requestWorkoutFromAI } from "./n8n-service";
import { Request, Response } from "express";
import { db } from "./database";
import { users } from "./database";
import { eq } from "drizzle-orm";
import { requireAuth } from "./middleware";
import { generateWorkout } from "./n8n-service";
import multer from "multer";
import path from "path";
import fs from "fs";

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
        onboardingCompleted: true
      });

      console.log("User created successfully:", user.email, "ID:", user.id);
      console.log("Created user data:", JSON.stringify(user, null, 2));

      // Generate JWT token
      const token = generateJWT(user);
      const sanitizedUser = sanitizeUser(user);

      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: sanitizedUser,
        token
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
        password: hashedPassword
      });

      // Generate JWT token
      const token = generateJWT(user);
      const sanitizedUser = sanitizeUser(user);

      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: sanitizedUser,
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
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
      const isValidPassword = await verifyPassword(loginData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Generate JWT token
      const token = generateJWT(user);
      const sanitizedUser = sanitizeUser(user);

      res.json({
        message: "Login realizado com sucesso",
        user: sanitizedUser,
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
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
        user: sanitizedUser 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
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
        return res.status(400).json({ message: "Validation error", errors: error.errors });
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
        return res.status(400).json({ message: "Validation error", errors: error.errors });
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
        physicalRestrictions: updatedUser.physicalRestrictions || undefined
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
          exercises: aiWorkout.exercises
        });

        res.json({ 
          message: "Onboarding concluído com sucesso",
          user: sanitizeUser(updatedUser),
          firstWorkout: workout
        });
      } catch (aiError) {
        console.error('AI workout generation failed:', aiError);
        res.json({ 
          message: "Onboarding concluído com sucesso",
          user: sanitizeUser(updatedUser),
          note: "Treino personalizado será gerado em breve"
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Profile update route
  app.patch("/api/profile/update", authenticateToken, async (req: Request, res: Response) => {
    try {
      console.log('Profile update request body:', req.body);

      const updateData = profileUpdateSchema.parse(req.body);
      const userId = req.user!.id;

      console.log('Parsed update data:', updateData);

      const updatedUser = await storage.updateUser(userId, updateData);

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
        console.log('Validation errors:', error.errors);
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.received
          }))
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Avatar upload route
  app.post("/api/profile/avatar", authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const userId = req.user!.id;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Update user with new avatar URL
      const updatedUser = await storage.updateUser(userId, { avatarUrl });

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({
        message: "Avatar atualizado com sucesso",
        avatarUrl,
        user: sanitizeUser(updatedUser)
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ message: "Erro ao fazer upload do avatar" });
    }
  });

  // Workout routes
  app.get("/api/workouts", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const workouts = await storage.getWorkouts(userId);
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.id);
      const workout = await storage.getWorkout(workoutId);

      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }

      res.json(workout);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/workouts", async (req, res) => {
    try {
      const workoutData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout(workoutData);
      res.status(201).json(workout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Workout session routes
  app.get("/api/workout-sessions", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const sessions = await storage.getWorkoutSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/workout-sessions", async (req, res) => {
    try {
      const sessionData = insertWorkoutSessionSchema.parse(req.body);
      const session = await storage.createWorkoutSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/workout-sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const updates = insertWorkoutSessionSchema.partial().parse(req.body);

      const session = await storage.updateWorkoutSession(sessionId, updates);
      if (!session) {
        return res.status(404).json({ message: "Workout session not found" });
      }

      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

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
      const userId = (req as any).userId;
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

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Upload profile photo
  app.post("/api/profile/photo", authenticateToken, upload.single('photo'), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user!.id;

      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const photoUrl = `/api/uploads/${req.file.filename}`;

      // Update user's profile photo in database
      await db.update(users)
        .set({ profilePhoto: photoUrl })
        .where(eq(users.id, userId));

      res.json({ 
        message: "Foto de perfil atualizada com sucesso",
        photoUrl 
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Serve uploaded files
  app.get("/api/uploads/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filepath = path.join(process.cwd(), 'uploads', filename);

    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: "Arquivo não encontrado" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}