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
} from "@shared/schema-sqlite";
import { db } from "./db.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export class SQLiteStorage {
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
    try {
      // Check if there are any values to update
      if (!updates || Object.keys(updates).length === 0) {
        console.log("No updates provided, returning current user");
        return await this.getUser(id);
      }

      // Filter out undefined values
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      // Check again after filtering
      if (Object.keys(filteredUpdates).length === 0) {
        console.log("No valid updates after filtering, returning current user");
        return await this.getUser(id);
      }

      // Process special fields for SQLite
      const processedUpdates = { ...filteredUpdates };
      
      // Convert availableEquipment array to JSON string for SQLite
      if (processedUpdates.availableEquipment) {
        processedUpdates.availableEquipment = JSON.stringify(processedUpdates.availableEquipment);
      }

      console.log("Updating user with ID:", id, "with processed values:", processedUpdates);

      const [updatedUser] = await db
        .update(users)
        .set(processedUpdates)
        .where(eq(users.id, id))
        .returning();

      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  // Session methods
  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db
      .insert(sessions)
      .values(session)
      .returning();
    return newSession;
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
    const workouts = await db
      .select()
      .from(scheduledWorkouts)
      .where(eq(scheduledWorkouts.userId, userId))
      .orderBy(desc(scheduledWorkouts.createdAt));
    
    // Parse exercises from JSON string to array
    return workouts.map(workout => ({
      ...workout,
      exercises: typeof workout.exercises === 'string' ? JSON.parse(workout.exercises) : workout.exercises
    }));
  }

  async getScheduledWorkout(id: number): Promise<ScheduledWorkout | undefined> {
    const [workout] = await db
      .select()
      .from(scheduledWorkouts)
      .where(eq(scheduledWorkouts.id, id));
    
    if (!workout) return undefined;
    
    // Parse exercises from JSON string to array
    return {
      ...workout,
      exercises: typeof workout.exercises === 'string' ? JSON.parse(workout.exercises) : workout.exercises
    };
  }

  async createScheduledWorkout(workout: InsertScheduledWorkout): Promise<ScheduledWorkout> {
    const [newWorkout] = await db
      .insert(scheduledWorkouts)
      .values(workout)
      .returning();
    return newWorkout;
  }

  async updateScheduledWorkout(
    id: number,
    updates: Partial<InsertScheduledWorkout>
  ): Promise<ScheduledWorkout | undefined> {
    const [updatedWorkout] = await db
      .update(scheduledWorkouts)
      .set(updates)
      .where(eq(scheduledWorkouts.id, id))
      .returning();
    return updatedWorkout;
  }

  async deleteScheduledWorkout(id: number): Promise<void> {
    await db.delete(scheduledWorkouts).where(eq(scheduledWorkouts.id, id));
  }

  // Workout session methods
  async getWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    const sessions = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.startedAt));
    
    // Parse exercises from JSON string to array
    return sessions.map(session => ({
      ...session,
      exercises: typeof session.exercises === 'string' 
        ? JSON.parse(session.exercises) 
        : session.exercises || []
    }));
  }

  async getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    const [session] = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, id));
    
    if (!session) return undefined;
    
    // Parse exercises from JSON string to array
    return {
      ...session,
      exercises: typeof session.exercises === 'string' 
        ? JSON.parse(session.exercises) 
        : session.exercises || []
    };
  }

  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const sessionData = {
      userId: session.userId,
      scheduledWorkoutId: session.scheduledWorkoutId,
      name: session.name,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      exercises: JSON.stringify(session.exercises),
      totalDuration: session.totalDuration,
      totalCalories: session.totalCalories,
      notes: session.notes
    };
    
    const [newSession] = await db
      .insert(workoutSessions)
      .values(sessionData)
      .returning();
    return newSession;
  }

  async updateWorkoutSession(
    id: number,
    updates: Partial<InsertWorkoutSession>
  ): Promise<WorkoutSession | undefined> {
    const [updatedSession] = await db
      .update(workoutSessions)
      .set(updates)
      .where(eq(workoutSessions.id, id))
      .returning();
    return updatedSession;
  }

  async deleteWorkoutSession(id: number): Promise<void> {
    await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
  }

  async completeWorkoutSession(
    id: number,
    exercises: CompletedExercise[],
    totalDuration: number,
    totalCalories: number,
    notes?: string
  ): Promise<WorkoutSession | undefined> {
    const [updatedSession] = await db
      .update(workoutSessions)
      .set({
        completedAt: new Date().toISOString(),
        exercises: JSON.stringify(exercises),
        totalDuration,
        totalCalories,
        notes,
      })
      .where(eq(workoutSessions.id, id))
      .returning();
    return updatedSession;
  }

  // Statistics methods
  async getUserStats(userId: number): Promise<{
    totalWorkouts: number;
    totalCalories: number;
    totalMinutes: number;
    currentStreak: number;
    averageWorkoutDuration: number;
  }> {
    const sessions = await this.getWorkoutSessions(userId);
    const completedSessions = sessions.filter((s) => s.completedAt);

    const totalWorkouts = completedSessions.length;
    const totalCalories = completedSessions.reduce(
      (sum, session) => sum + (session.totalCalories || 0),
      0
    );
    const totalMinutes = completedSessions.reduce(
      (sum, session) => sum + (session.totalDuration || 0),
      0
    );

    // Calculate streak
    let currentStreak = 0;
    if (completedSessions.length > 0) {
      // Sort by completed date, newest first
      const sortedSessions = [...completedSessions].sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime()
      );

      // Start with the most recent workout
      let lastDate = new Date(sortedSessions[0].completedAt!);
      currentStreak = 1;

      // Check for consecutive days
      for (let i = 1; i < sortedSessions.length; i++) {
        const currentDate = new Date(sortedSessions[i].completedAt!);
        const dayDifference = Math.floor(
          (lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (dayDifference === 1) {
          // Consecutive day
          currentStreak++;
          lastDate = currentDate;
        } else if (dayDifference > 1) {
          // Break in streak
          break;
        }
      }
    }

    const averageWorkoutDuration =
      totalWorkouts > 0 ? totalMinutes / totalWorkouts : 0;

    return {
      totalWorkouts,
      totalCalories,
      totalMinutes,
      currentStreak,
      averageWorkoutDuration,
    };
  }

  async getWeeklyStats(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<WorkoutSession[]> {
    return await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.startedAt, startDate.toISOString()),
          lte(workoutSessions.startedAt, endDate.toISOString())
        )
      );
  }
}