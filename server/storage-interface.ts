// Import types from database schema
import { User, Session, ScheduledWorkout, WorkoutSession, InsertUser, InsertSession, InsertScheduledWorkout, InsertWorkoutSession } from "./database-config.js";

// Type for completed exercise
export type CompletedExercise = {
  exerciseId: number;
  sets: number;
  reps: number;
  weight: number;
  duration: number;
  calories: number;
};

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteUserSessions(userId: number): Promise<void>;

  // Scheduled workout methods
  getScheduledWorkouts(userId: number): Promise<ScheduledWorkout[]>;
  getScheduledWorkout(id: number): Promise<ScheduledWorkout | undefined>;
  createScheduledWorkout(workout: InsertScheduledWorkout): Promise<ScheduledWorkout>;
  updateScheduledWorkout(id: number, updates: Partial<InsertScheduledWorkout>): Promise<ScheduledWorkout | undefined>;
  deleteScheduledWorkout(id: number): Promise<void>;

  // Workout session methods
  getWorkoutSessions(userId: number): Promise<WorkoutSession[]>;
  getWorkoutSession(id: number): Promise<WorkoutSession | undefined>;
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  updateWorkoutSession(id: number, updates: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined>;
  deleteWorkoutSession(id: number): Promise<void>;
  completeWorkoutSession(id: number, exercises: CompletedExercise[], totalDuration: number, totalCalories: number, notes?: string): Promise<WorkoutSession | undefined>;

  // Statistics methods
  getUserStats(userId: number): Promise<{
    totalWorkouts: number;
    totalCalories: number;
    totalMinutes: number;
    currentStreak: number;
    averageWorkoutDuration: number;
  }>;
  getWeeklyStats(userId: number, startDate: Date, endDate: Date): Promise<WorkoutSession[]>;
}