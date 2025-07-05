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
  customEquipment: text("custom_equipment"),
  physicalRestrictions: text("physical_restrictions"),
  // Lifestyle fields
  smokingStatus: text("smoking_status"), // "never", "yes", "ex_smoker"
  alcoholConsumption: text("alcohol_consumption"), // "never", "rarely", "socially", "frequently"
  dietType: text("diet_type"), // "balanced", "high_protein", "high_carb", "fast_food", "vegetarian_vegan", "other"
  sleepHours: text("sleep_hours"), // "4-5", "6-7", "8-9", "9+"
  stressLevel: text("stress_level"), // "low", "moderate", "high", "very_high"
  preferredWorkoutTime: text("preferred_workout_time"), // "morning", "afternoon", "evening", "variable"
  availableDaysPerWeek: integer("available_days_per_week"), // 1-7
  averageWorkoutDuration: text("average_workout_duration"), // "15-20min", "30min", "45min", "1h_or_more"
  preferredLocation: text("preferred_location"), // "home", "outdoor", "gym", "other"
  avatarUrl: text("avatar_url"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Scheduled workouts from AI
export const scheduledWorkouts = pgTable("scheduled_workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"), // workout observations from AI
  exercises: jsonb("exercises").$type<AIExercise[]>(),
  totalCalories: integer("total_calories"),
  totalDuration: integer("total_duration"), // in minutes
  status: text("status").default("pending"), // "pending", "completed", "skipped"
  createdAt: timestamp("created_at").defaultNow(),
  scheduledFor: timestamp("scheduled_for").defaultNow()
});

// Completed workout sessions
export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  scheduledWorkoutId: integer("scheduled_workout_id").references(() => scheduledWorkouts.id),
  name: text("name").notNull(),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  exercises: jsonb("exercises").$type<CompletedExercise[]>(),
  totalDuration: integer("total_duration"), // in minutes (actual)
  totalCalories: integer("total_calories"), // actual calories burned
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// AI Exercise format from N8N
export interface AIExercise {
  exercise: string;
  muscleGroup: string;
  type: string; // "Cardio", "Força", "Resistência", "Mobilidade", "Funcional"
  instructions: string;
  time: number; // in minutes (0 if not applicable)
  series: number;
  repetitions: number;
  restBetweenSeries: number; // in seconds
  restBetweenExercises: number; // in seconds
  weight: number; // in kg (0 if not applicable)
  calories: number; // in kcal
}

// Completed exercise tracking
export interface CompletedExercise extends AIExercise {
  actualWeight?: number;
  actualTime?: number; // actual time spent in minutes
  actualCalories?: number;
  effortLevel: number; // 1-10 scale
  completed: boolean;
  status?: "completed" | "incomplete" | "not-started"; // Status para diferenciar exercícios incompletos
  notes?: string;
}

export const insertUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(1, "Nome é obrigatório"),
  birthDate: z.string().optional(),
  age: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  gender: z.enum(["male", "female", "other", "not_specified"]).optional(),
  fitnessGoal: z.enum([
    "lose_weight", 
    "gain_muscle", 
    "improve_conditioning", 
    "maintain_weight", 
    "increase_flexibility", 
    "stress_relief", 
    "improve_posture", 
    "general_fitness",
    "athletic_performance",
    "injury_recovery"
  ]).optional(),
  experienceLevel: z.enum([
    "beginner", 
    "intermediate", 
    "advanced", 
    "expert", 
    "professional", 
    "competitive_athlete"
  ]).optional(),
  weeklyFrequency: z.number().min(1).max(7).optional(),
  availableEquipment: z.array(z.string()).optional(),
  customEquipment: z.string().optional(),
  physicalRestrictions: z.string().optional(),
  onboardingCompleted: z.boolean().default(false),
  avatarUrl: z.string().optional()
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true
});

export const insertScheduledWorkoutSchema = createInsertSchema(scheduledWorkouts).omit({
  id: true,
  createdAt: true
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
  fitnessGoal: z.enum([
    "lose_weight", 
    "gain_muscle", 
    "improve_conditioning", 
    "maintain_weight", 
    "increase_flexibility", 
    "stress_relief", 
    "improve_posture", 
    "general_fitness",
    "athletic_performance",
    "injury_recovery"
  ]),
  experienceLevel: z.enum([
    "beginner", 
    "intermediate", 
    "advanced", 
    "expert", 
    "professional", 
    "competitive_athlete"
  ]),
  weeklyFrequency: z.number().min(1).max(7),
  availableEquipment: z.array(z.string()),
  physicalRestrictions: z.string().optional(),
  // Lifestyle fields
  smokingStatus: z.enum(["never", "yes", "ex_smoker"]),
  alcoholConsumption: z.enum(["never", "rarely", "socially", "frequently"]),
  dietType: z.enum(["balanced", "high_protein", "high_carb", "fast_food", "vegetarian_vegan", "other"]),
  sleepHours: z.enum(["4-5", "6-7", "8-9", "9+"]),
  stressLevel: z.enum(["low", "moderate", "high", "very_high"]),
  preferredWorkoutTime: z.enum(["morning", "afternoon", "evening", "variable"]),
  availableDaysPerWeek: z.number().min(1).max(7),
  averageWorkoutDuration: z.enum(["15-20min", "30min", "45min", "1h_or_more"]),
  preferredLocation: z.enum(["home", "outdoor", "gym", "other"])
});

export const profileUpdateSchema = z.object({
  name: z.string().optional(),
  birthDate: z.string().optional(),
  age: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  gender: z.enum(["male", "female", "other", "not_specified"]).optional(),
  fitnessGoal: z.enum([
    "lose_weight", 
    "gain_muscle", 
    "improve_conditioning", 
    "maintain_weight", 
    "increase_flexibility", 
    "stress_relief", 
    "improve_posture", 
    "general_fitness",
    "athletic_performance",
    "injury_recovery"
  ]).optional(),
  experienceLevel: z.enum([
    "beginner", 
    "intermediate", 
    "advanced", 
    "expert", 
    "professional", 
    "competitive_athlete"
  ]).optional(),
  weeklyFrequency: z.number().min(1).max(7).optional(),
  availableEquipment: z.array(z.string()).optional(),
  customEquipment: z.string().optional(),
  physicalRestrictions: z.string().optional(),
  avatarUrl: z.string().optional(),
  // Lifestyle fields
  smokingStatus: z.enum(["never", "yes", "ex_smoker"]).optional(),
  alcoholConsumption: z.enum(["never", "rarely", "socially", "frequently"]).optional(),
  dietType: z.enum(["balanced", "high_protein", "high_carb", "fast_food", "vegetarian_vegan", "other"]).optional(),
  sleepHours: z.enum(["4-5", "6-7", "8-9", "9+"]).optional(),
  stressLevel: z.enum(["low", "moderate", "high", "very_high"]).optional(),
  preferredWorkoutTime: z.enum(["morning", "afternoon", "evening", "variable"]).optional(),
  availableDaysPerWeek: z.number().min(1).max(7).optional(),
  averageWorkoutDuration: z.enum(["15-20min", "30min", "45min", "1h_or_more"]).optional(),
  preferredLocation: z.enum(["home", "outdoor", "gym", "other"]).optional()
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
export type InsertScheduledWorkout = z.infer<typeof insertScheduledWorkoutSchema>;
export type ScheduledWorkout = typeof scheduledWorkouts.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type OnboardingData = z.infer<typeof onboardingSchema>;
export type N8NWorkoutRequest = z.infer<typeof n8nWorkoutRequestSchema>;

// AI Workout Response Schema (from N8N)
export const aiWorkoutResponseSchema = z.object({
  userId: z.number(),
  workoutPlan: z.array(z.object({
    exercise: z.string(),
    muscleGroup: z.string(),
    type: z.string(),
    instructions: z.string(),
    time: z.number(),
    series: z.number(),
    repetitions: z.number(),
    restBetweenSeries: z.number(),
    restBetweenExercises: z.number(),
    weight: z.number(),
    calories: z.number()
  }))
});

export type AIWorkoutResponse = z.infer<typeof aiWorkoutResponseSchema>;