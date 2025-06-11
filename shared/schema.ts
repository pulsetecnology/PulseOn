import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  birthDate: text("birth_date"),
  age: integer("age"),
  weight: integer("weight"), // in kg
  height: integer("height"), // in cm
  gender: text("gender"), // "male", "female", "other"
  fitnessGoal: text("fitness_goal"), // "lose_weight", "gain_muscle", "improve_conditioning"
  experienceLevel: text("experience_level"), // "beginner", "intermediate", "advanced"
  weeklyFrequency: integer("weekly_frequency"), // number of workouts per week
  availableEquipment: jsonb("available_equipment").$type<string[]>(),
  physicalRestrictions: text("physical_restrictions"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration"), // in minutes
  difficulty: text("difficulty"), // "beginner", "intermediate", "advanced"
  exercises: jsonb("exercises").$type<Exercise[]>(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  workoutId: integer("workout_id").references(() => workouts.id),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  exercises: jsonb("exercises").$type<CompletedExercise[]>(),
  totalDuration: integer("total_duration") // in minutes
});

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  suggestedWeight?: number;
  restTime: number; // in seconds
  instructions?: string;
  muscleGroups: string[];
}

export interface CompletedExercise extends Exercise {
  actualWeight?: number;
  effortLevel: number; // 1-10 scale
  completed: boolean;
  notes?: string;
}

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  onboardingCompleted: true
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  createdAt: true,
  completedAt: true
});

export const insertWorkoutSessionSchema = createInsertSchema(workoutSessions).omit({
  id: true,
  startedAt: true
});

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória")
});

export const onboardingSchema = z.object({
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  weight: z.number().min(30).max(300),
  height: z.number().min(120).max(250),
  gender: z.enum(["male", "female", "other"]),
  fitnessGoal: z.enum(["lose_weight", "gain_muscle", "improve_conditioning"]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  weeklyFrequency: z.number().min(1).max(7),
  availableEquipment: z.array(z.string()),
  physicalRestrictions: z.string().optional()
});

export const profileUpdateSchema = z.object({
  name: z.string().optional(),
  birthDate: z.string().optional(),
  age: z.number().min(13, "Idade deve ser maior que 13 anos").max(120, "Idade inválida").optional(),
  weight: z.number().min(30, "Peso deve ser maior que 30kg").max(300, "Peso inválido").optional(),
  height: z.number().min(100, "Altura deve ser maior que 100cm").max(250, "Altura inválida").optional(),
  fitnessGoal: z.enum(["lose_weight", "gain_muscle", "improve_conditioning"]).optional(),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  weeklyFrequency: z.number().min(1).max(7).optional(),
  availableEquipment: z.array(z.string()).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  physicalRestrictions: z.string().optional()
});

// N8N Integration schema
export const n8nWorkoutRequestSchema = z.object({
  userId: z.number(),
  age: z.number(),
  weight: z.number(),
  height: z.number(),
  fitnessGoal: z.string(),
  experienceLevel: z.string(),
  weeklyFrequency: z.number(),
  availableEquipment: z.array(z.string()),
  physicalRestrictions: z.string().optional()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type OnboardingData = z.infer<typeof onboardingSchema>;
export type N8NWorkoutRequest = z.infer<typeof n8nWorkoutRequestSchema>;