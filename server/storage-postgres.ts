import {
  users,
  sessions,
  scheduledWorkouts,
  workoutSessions,
  type User,
  type InsertUser,
  type Session,
  type InsertSession,
  type ScheduledWorkout,
  type InsertScheduledWorkout,
  type WorkoutSession,
  type InsertWorkoutSession,
  type AIExercise,
  type CompletedExercise
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Session methods
  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));
    return session || undefined;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteUserSessions(userId: number): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  // Scheduled workout methods
  async getScheduledWorkouts(userId: number): Promise<ScheduledWorkout[]> {
    return await db
      .select()
      .from(scheduledWorkouts)
      .where(eq(scheduledWorkouts.userId, userId))
      .orderBy(desc(scheduledWorkouts.createdAt));
  }

  async getScheduledWorkout(id: number): Promise<ScheduledWorkout | undefined> {
    const [workout] = await db
      .select()
      .from(scheduledWorkouts)
      .where(eq(scheduledWorkouts.id, id));
    return workout || undefined;
  }

  async createScheduledWorkout(insertWorkout: InsertScheduledWorkout): Promise<ScheduledWorkout> {
    try {
      const workoutData = {
        userId: insertWorkout.userId,
        name: insertWorkout.name,
        exercises: insertWorkout.exercises as any,
        totalCalories: insertWorkout.totalCalories || 0,
        totalDuration: insertWorkout.totalDuration || 0,
        status: insertWorkout.status || "pending",
        scheduledFor: insertWorkout.scheduledFor || new Date()
      };
      
      console.log("Creating scheduled workout with data:", JSON.stringify(workoutData, null, 2));
      
      const [workout] = await db
        .insert(scheduledWorkouts)
        .values([workoutData])
        .returning();
      
      console.log("Scheduled workout created successfully:", workout.id);
      return workout;
    } catch (error) {
      console.error("Error creating scheduled workout:", error);
      throw error;
    }
  }

  async updateScheduledWorkout(id: number, updates: Partial<InsertScheduledWorkout>): Promise<ScheduledWorkout | undefined> {
    const updateData = {
      ...updates,
      exercises: updates.exercises as any
    };
    
    const [workout] = await db
      .update(scheduledWorkouts)
      .set(updateData)
      .where(eq(scheduledWorkouts.id, id))
      .returning();
    return workout || undefined;
  }

  async deleteScheduledWorkout(id: number): Promise<void> {
    await db.delete(scheduledWorkouts).where(eq(scheduledWorkouts.id, id));
  }

  // Workout session methods
  async getWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    return await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.startedAt));
  }

  async getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, id));
    return session || undefined;
  }

  async createWorkoutSession(insertSession: InsertWorkoutSession): Promise<WorkoutSession> {
    const [session] = await db
      .insert(workoutSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateWorkoutSession(id: number, updates: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined> {
    const [session] = await db
      .update(workoutSessions)
      .set(updates)
      .where(eq(workoutSessions.id, id))
      .returning();
    return session || undefined;
  }

  async completeWorkoutSession(
    id: number,
    exercises: CompletedExercise[],
    totalDuration: number,
    totalCalories: number,
    notes?: string
  ): Promise<WorkoutSession | undefined> {
    const [session] = await db
      .update(workoutSessions)
      .set({
        exercises,
        totalDuration,
        totalCalories,
        notes,
        completedAt: new Date()
      })
      .where(eq(workoutSessions.id, id))
      .returning();
    return session || undefined;
  }

  // Statistics methods
  async getUserStats(userId: number): Promise<{
    totalWorkouts: number;
    totalCalories: number;
    totalMinutes: number;
    currentStreak: number;
    averageWorkoutDuration: number;
  }> {
    const completedSessions = await db
      .select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.completedAt, workoutSessions.completedAt) // Only completed sessions
      ))
      .orderBy(desc(workoutSessions.completedAt));

    const totalWorkouts = completedSessions.length;
    const totalCalories = completedSessions.reduce((sum, session) => sum + (session.totalCalories || 0), 0);
    const totalMinutes = completedSessions.reduce((sum, session) => sum + (session.totalDuration || 0), 0);
    const averageWorkoutDuration = totalWorkouts > 0 ? totalMinutes / totalWorkouts : 0;

    // Calculate current streak (consecutive days with workouts)
    let currentStreak = 0;
    const today = new Date();
    const sessions = completedSessions.filter(s => s.completedAt);

    if (sessions.length > 0) {
      const sessionDates = sessions.map(s => {
        const date = new Date(s.completedAt!);
        return date.toDateString();
      });

      // Remove duplicates (same day workouts)
      const uniqueDates = [...new Set(sessionDates)].sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );

      // Check for consecutive days
      for (let i = 0; i < uniqueDates.length; i++) {
        const sessionDate = new Date(uniqueDates[i]);
        const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (i === 0 && daysDiff <= 1) {
          currentStreak = 1;
        } else if (i > 0) {
          const prevDate = new Date(uniqueDates[i - 1]);
          const dateDiff = Math.floor((prevDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dateDiff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      totalWorkouts,
      totalCalories,
      totalMinutes,
      currentStreak,
      averageWorkoutDuration
    };
  }

  async getWeeklyStats(userId: number, startDate: Date, endDate: Date): Promise<WorkoutSession[]> {
    return await db
      .select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        gte(workoutSessions.startedAt, startDate),
        lte(workoutSessions.startedAt, endDate)
      ))
      .orderBy(desc(workoutSessions.startedAt));
  }
}

export const storage = new DatabaseStorage();