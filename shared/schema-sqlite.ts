import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// SQLite schema definitions
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  phone: text("phone"),
  birthDate: text("birth_date"),
  age: integer("age"),
  weight: integer("weight"), // in kg
  height: integer("height"), // in cm
  gender: text("gender"), // "male", "female", "other"
  fitnessGoal: text("fitness_goal"), // "lose_weight", "gain_muscle", "improve_conditioning"
  experienceLevel: text("experience_level"), // "beginner", "intermediate", "advanced"
  weeklyFrequency: integer("weekly_frequency"), // number of workouts per week
  availableEquipment: text("available_equipment"), // JSON string for SQLite
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
  onboardingCompleted: integer("onboarding_completed", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP")
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP")
});

// Scheduled workouts from AI
export const scheduledWorkouts = sqliteTable("scheduled_workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"), // workout observations from AI
  exercises: text("exercises"), // JSON string for SQLite
  totalCalories: integer("total_calories"),
  totalDuration: integer("total_duration"), // in minutes
  status: text("status").default("pending"), // "pending", "completed", "skipped"
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  scheduledFor: text("scheduled_for").default("CURRENT_TIMESTAMP")
});

// Completed workout sessions
export const workoutSessions = sqliteTable("workout_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  scheduledWorkoutId: integer("scheduled_workout_id").references(() => scheduledWorkouts.id),
  name: text("name").notNull(),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  exercises: text("exercises"), // JSON string for SQLite
  totalDuration: integer("total_duration"), // in minutes (actual)
  totalCalories: integer("total_calories"), // actual calories burned
  notes: text("notes"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP")
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

// Types for inserting data
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export type ScheduledWorkout = typeof scheduledWorkouts.$inferSelect;
export type InsertScheduledWorkout = typeof scheduledWorkouts.$inferInsert;

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = typeof workoutSessions.$inferInsert;