import type { User, InsertUser, Session, InsertSession, Workout, InsertWorkout, WorkoutSession, InsertWorkoutSession } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteUserSessions(userId: number): Promise<void>;

  // Workout methods
  getWorkouts(userId?: number): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout | undefined>;

  // Workout session methods
  getWorkoutSessions(userId: number): Promise<WorkoutSession[]>;
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  updateWorkoutSession(id: number, updates: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<string, Session>;
  private workouts: Map<number, Workout>;
  private workoutSessions: Map<number, WorkoutSession>;
  private currentUserId: number;
  private currentWorkoutId: number;
  private currentWorkoutSessionId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.workouts = new Map();
    this.workoutSessions = new Map();
    this.currentUserId = 1;
    this.currentWorkoutId = 1;
    this.currentWorkoutSessionId = 1;
    this.seedData();
  }

  private seedData() {
    // Create default user
    const defaultUser: User = {
      id: 1,
      email: "user@example.com",
      password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lqMrcKdcGfL7DKjNC", // "password"
      name: "Usuário Teste",
      birthDate: "1998-06-11",
      age: 25,
      weight: 70,
      height: 175,
      gender: "male",
      fitnessGoal: "gain_muscle",
      experienceLevel: "beginner",
      weeklyFrequency: 3,
      availableEquipment: ["weight_training", "full_gym"],
      physicalRestrictions: null,
      onboardingCompleted: true,
      createdAt: new Date()
    };
    
    this.users.set(1, defaultUser);
    this.currentUserId = 2;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id,
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name || null,
      birthDate: insertUser.birthDate || null,
      age: insertUser.age || null,
      weight: insertUser.weight || null,
      height: insertUser.height || null,
      gender: insertUser.gender || null,
      fitnessGoal: insertUser.fitnessGoal || null,
      experienceLevel: insertUser.experienceLevel || null,
      weeklyFrequency: insertUser.weeklyFrequency || null,
      availableEquipment: insertUser.availableEquipment as string[] | null,
      physicalRestrictions: insertUser.physicalRestrictions || null,
      onboardingCompleted: false,
      createdAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = { 
      ...user, 
      ...updates,
      onboardingCompleted: updates.age && updates.weight && updates.height ? true : user.onboardingCompleted
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Session methods
  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = {
      id: Date.now(),
      token: insertSession.token,
      userId: insertSession.userId,
      expiresAt: insertSession.expiresAt,
      createdAt: new Date()
    };
    this.sessions.set(session.token, session);
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    return this.sessions.get(token);
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async deleteUserSessions(userId: number): Promise<void> {
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(token);
      }
    }
  }

  async getWorkouts(userId?: number): Promise<Workout[]> {
    const workouts = Array.from(this.workouts.values());
    if (userId) {
      return workouts.filter(w => w.userId === userId);
    }
    return workouts;
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = this.currentWorkoutId++;
    const workout: Workout = {
      id,
      name: insertWorkout.name,
      description: insertWorkout.description || null,
      duration: insertWorkout.duration || null,
      difficulty: insertWorkout.difficulty || null,
      exercises: insertWorkout.exercises || null,
      userId: insertWorkout.userId || null,
      createdAt: new Date(),
      completedAt: null
    };

    this.workouts.set(id, workout);
    return workout;
  }

  async updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout | undefined> {
    const workout = this.workouts.get(id);
    if (!workout) return undefined;

    const updatedWorkout: Workout = { ...workout, ...updates };
    this.workouts.set(id, updatedWorkout);
    return updatedWorkout;
  }

  async getWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    return Array.from(this.workoutSessions.values()).filter(s => s.userId === userId);
  }

  async createWorkoutSession(insertSession: InsertWorkoutSession): Promise<WorkoutSession> {
    const id = this.currentWorkoutSessionId++;
    const session: WorkoutSession = {
      id,
      userId: insertSession.userId || null,
      workoutId: insertSession.workoutId || null,
      exercises: insertSession.exercises || null,
      startedAt: new Date(),
      completedAt: null,
      totalDuration: null
    };

    this.workoutSessions.set(id, session);
    return session;
  }

  async updateWorkoutSession(id: number, updates: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined> {
    const session = this.workoutSessions.get(id);
    if (!session) return undefined;

    const updatedSession: WorkoutSession = { ...session, ...updates };
    this.workoutSessions.set(id, updatedSession);
    return updatedSession;
  }
}

export const storage = new MemStorage();