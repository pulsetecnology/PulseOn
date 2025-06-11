import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  age: integer("age"),
  weight: integer("weight"), // in kg
  height: integer("height"), // in cm
  fitnessGoal: text("fitness_goal"), // "lose_weight", "gain_muscle", "improve_conditioning"
  experienceLevel: text("experience_level"), // "beginner", "intermediate", "advanced"
  weeklyFrequency: integer("weekly_frequency"), // number of workouts per week
  availableEquipment: jsonb("available_equipment").$type<string[]>(),
  physicalRestrictions: text("physical_restrictions"),
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

export const onboardingSchema = z.object({
  age: z.number().min(16).max(100),
  weight: z.number().min(30).max(300),
  height: z.number().min(120).max(250),
  fitnessGoal: z.enum(["lose_weight", "gain_muscle", "improve_conditioning"]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  weeklyFrequency: z.number().min(1).max(7),
  availableEquipment: z.array(z.string()),
  physicalRestrictions: z.string().optional()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type OnboardingData = z.infer<typeof onboardingSchema>;
