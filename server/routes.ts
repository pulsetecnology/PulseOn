import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWorkoutSchema, insertWorkoutSessionSchema, onboardingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users/:id", async (req, res) => {
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
  app.post("/api/onboarding", async (req, res) => {
    try {
      const onboardingData = onboardingSchema.parse(req.body);
      
      // For demo purposes, update the default user (id: 1)
      const userId = 1;
      const user = await storage.updateUser(userId, onboardingData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Onboarding completed successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
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

  const httpServer = createServer(app);
  return httpServer;
}
