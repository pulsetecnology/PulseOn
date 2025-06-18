import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-postgres";
import type { InsertUser, User, Session, InsertSession, ScheduledWorkout, InsertScheduledWorkout, WorkoutSession, InsertWorkoutSession, RegisterData, LoginData, OnboardingData, N8NWorkoutRequest, CompletedExercise } from "@shared/schema";
import { insertUserSchema, insertScheduledWorkoutSchema, insertWorkoutSessionSchema, onboardingSchema, registerSchema, loginSchema, profileUpdateSchema, n8nWorkoutRequestSchema, aiWorkoutResponseSchema, users, type AIWorkoutResponse, type AIExercise } from "@shared/schema";
import { z } from "zod";
import { hashPassword, verifyPassword, generateJWT, sanitizeUser } from "./auth";
import { authenticateToken, optionalAuth } from "./middleware";
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

      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      
      console.log("Creating user with data:", {
        email: userData.email,
        name: userData.name || userData.email,
        hasPassword: !!hashedPassword
      });

      const newUser = await storage.createUser({
        password: hashedPassword,
        email: userData.email,
        name: userData.name || userData.email,
        onboardingCompleted: false
      });

      // Generate JWT token
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

  // Register route
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      
      const newUser = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        onboardingCompleted: false
      });

      // Generate JWT token
      const token = generateJWT(newUser);

      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: sanitizeUser(newUser),
        token
      });
    } catch (error) {
      console.error("Register error:", error);
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

  // User stats route
  app.get("/api/user/stats", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas do usuário" });
    }
  });

  // Generate workout using legacy N8N service (non-AI for testing)
  app.post("/api/generate-workout", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Use N8N service to generate workout
      const aiResponse = await requestWorkoutFromAI({
        userId: user.id,
        fitnessGoal: user.fitnessGoal || "weight_loss",
        experienceLevel: user.experienceLevel || "beginner",
        availableEquipment: user.availableEquipment || [],
        physicalRestrictions: user.physicalRestrictions || [],
        preferredWorkoutTime: user.preferredWorkoutTime || 30
      });

      // Create scheduled workout from AI response
      const workout = await storage.createWorkout({
        userId: userId,
        name: aiResponse.workoutName || "Treino Personalizado",
        description: aiResponse.description || "Treino gerado pela IA",
        duration: aiResponse.duration || 30,
        difficulty: aiResponse.difficulty || "medium",
        exercises: aiResponse.exercises || []
      });

      res.status(201).json({
        message: "Treino gerado com sucesso!",
        workout
      });
    } catch (error) {
      console.error("Error generating workout:", error);
      res.status(500).json({ message: "Erro ao gerar treino" });
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
        console.log('Validation errors:', error.errors);
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // AI Workout Generation - Fixed to handle N8N savedWorkout response properly
  app.post("/api/ai/generate-workout", authenticateToken, async (req: Request, res: Response) => {
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

      // Check if we have a savedWorkout in the response (prioritize this format)
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
  });

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

      // Check if user owns this workout
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

  // Get workout sessions
  app.get("/api/workout-sessions", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const sessions = await storage.getWorkoutSessions(user.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching workout sessions:", error);
      res.status(500).json({ message: "Erro ao buscar sessões de treino" });
    }
  });

  // Health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // N8N endpoints for external integrations
  app.get("/api/n8n/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(user => sanitizeUser(user)));
    } catch (error) {
      console.error("Error fetching users for N8N:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.get("/api/n8n/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Error fetching user for N8N:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.post("/api/n8n/workout-sessions", async (req: Request, res: Response) => {
    try {
      const sessionData = insertWorkoutSessionSchema.parse(req.body);
      const session = await storage.createWorkoutSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating workout session for N8N:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar sessão de treino" });
    }
  });

  // Get workouts for N8N integration
  app.get("/api/n8n/workouts", async (req: Request, res: Response) => {
    try {
      const workouts = await storage.getWorkouts();
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching workouts for N8N:", error);
      res.status(500).json({ message: "Erro ao buscar treinos" });
    }
  });

  // Profile photo upload
  app.post("/api/profile/photo", authenticateToken, upload.single('photo'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const userId = req.user!.id;
      const photoUrl = `/api/uploads/${req.file.filename}`;

      const updatedUser = await storage.updateUser(userId, { photoUrl });

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({
        message: "Foto de perfil atualizada com sucesso",
        photoUrl,
        user: sanitizeUser(updatedUser)
      });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      res.status(500).json({ message: "Erro ao fazer upload da foto" });
    }
  });

  // Avatar upload
  app.post("/api/profile/avatar", authenticateToken, upload.single('avatar'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const userId = req.user!.id;
      const avatarUrl = `/api/uploads/${req.file.filename}`;

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
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Erro ao fazer upload do avatar" });
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

  // N8N response files endpoint
  app.get("/api/n8n/response-files", authenticateToken, (req: Request, res: Response) => {
    try {
      const attachedAssetsDir = path.join(process.cwd(), 'attached_assets');
      
      if (!fs.existsSync(attachedAssetsDir)) {
        return res.json([]);
      }

      const files = fs.readdirSync(attachedAssetsDir)
        .filter(file => file.includes('N8N-Response'))
        .map(file => ({
          name: file,
          path: `/attached_assets/${file}`,
          modified: fs.statSync(path.join(attachedAssetsDir, file)).mtime
        }))
        .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

      res.json(files);
    } catch (error) {
      console.error("Error fetching N8N response files:", error);
      res.json([]);
    }
  });

  // N8N sync user data endpoint
  app.post("/api/n8n/sync-user-data", authenticateToken, async (req: Request, res: Response) => {
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
        const birth = new Date(userData.birthDate);
        age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
      }

      // Prepare the data structure for N8N
      const n8nData = {
        userId: userData.id,
        timestamp: new Date().toISOString(),
        personalInfo: {
          name: userData.name,
          email: userData.email,
          birthDate: userData.birthDate,
          age: age || userData.age,
          weight: userData.weight,
          height: userData.height,
          gender: userData.gender
        },
        fitnessProfile: {
          fitnessGoal: userData.fitnessGoal,
          experienceLevel: userData.experienceLevel,
          weeklyFrequency: userData.weeklyFrequency,
          availableEquipment: userData.availableEquipment,
          customEquipment: userData.customEquipment,
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

      // Send to Railway N8N webhook
      const RAILWAY_WEBHOOK_URL = "https://primary-production-3b832.up.railway.app/webhook-test/onboarding-recebido";
      let n8nResponse = null;
      
      try {
        console.log('Sending data to Railway N8N webhook:', RAILWAY_WEBHOOK_URL);
        const webhookResponse = await fetch(RAILWAY_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(n8nData)
        });

        if (webhookResponse.ok) {
          try {
            n8nResponse = await webhookResponse.json();
            console.log('N8N webhook response:', n8nResponse);
          } catch (parseError) {
            console.error('Error parsing N8N response:', parseError);
            n8nResponse = { error: "Failed to parse response" };
          }
        } else {
          const errorText = await webhookResponse.text();
          console.error('N8N webhook error:', webhookResponse.status, errorText);
          n8nResponse = { error: `HTTP ${webhookResponse.status}`, details: errorText };
        }
      } catch (webhookError: any) {
        console.error('Error sending to N8N webhook:', webhookError);
        n8nResponse = { error: webhookError.message };
      }

      res.json({
        message: "Dados sincronizados com N8N",
        userData: userData,
        n8nResponse: n8nResponse
      });

    } catch (error: any) {
      console.error("Sync user data error:", error);
      res.status(500).json({ 
        message: "Erro ao sincronizar dados",
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}