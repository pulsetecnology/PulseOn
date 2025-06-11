import { users, sessions, workouts, workoutSessions, type User, type InsertUser, type Session, type InsertSession, type Workout, type InsertWorkout, type WorkoutSession, type InsertWorkoutSession } from "@shared/schema";

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

    // Add default user and workouts
    this.seedData();
  }

  private seedData() {
    // Create default user
    const defaultUser: User = {
      id: this.currentUserId++,
      email: "joao@email.com",
      password: "password", // In real app, this would be hashed
      name: "João Silva",
      age: 28,
      weight: 75,
      height: 180,
      gender: "male",
      fitnessGoal: "gain_muscle",
      experienceLevel: "intermediate",
      weeklyFrequency: 4,
      availableEquipment: ["Halteres", "Barras", "Máquinas de musculação"],
      physicalRestrictions: null,
      onboardingCompleted: true,
      createdAt: new Date()
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create sample workouts
    const legWorkout: Workout = {
      id: this.currentWorkoutId++,
      userId: defaultUser.id,
      name: "Treino de Pernas",
      description: "Treino focado em quadriceps, glúteos e panturrilhas",
      duration: 45,
      difficulty: "intermediate",
      exercises: [
        {
          id: "1",
          name: "Agachamento Livre",
          sets: 3,
          reps: 12,
          suggestedWeight: 40,
          restTime: 90,
          instructions: "Mantenha os pés afastados na largura dos ombros, desça até os joelhos formarem 90 graus",
          muscleGroups: ["quadriceps", "glúteos", "core"]
        },
        {
          id: "2",
          name: "Leg Press",
          sets: 3,
          reps: 15,
          suggestedWeight: 80,
          restTime: 75,
          instructions: "Posicione os pés na plataforma, desça controladamente até formar 90 graus",
          muscleGroups: ["quadriceps", "glúteos"]
        }
      ],
      completedAt: null,
      createdAt: new Date()
    };
    this.workouts.set(legWorkout.id, legWorkout);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      onboardingCompleted: false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Session methods
  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = {
      id: Date.now(), // Simple ID generation
      ...insertSession,
      createdAt: new Date()
    };
    this.sessions.set(session.token, session);
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const session = this.sessions.get(token);
    if (!session) return undefined;
    
    // Check if session is expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return undefined;
    }
    
    return session;
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

  // Workout methods
  async getWorkouts(userId?: number): Promise<Workout[]> {
    const allWorkouts = Array.from(this.workouts.values());
    if (userId) {
      return allWorkouts.filter(workout => workout.userId === userId);
    }
    return allWorkouts;
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = this.currentWorkoutId++;
    const workout: Workout = {
      ...insertWorkout,
      id,
      completedAt: null,
      createdAt: new Date()
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

  // Workout session methods
  async getWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    return Array.from(this.workoutSessions.values()).filter(
      session => session.userId === userId
    );
  }

  async createWorkoutSession(insertSession: InsertWorkoutSession): Promise<WorkoutSession> {
    const id = this.currentSessionId++;
    const session: WorkoutSession = {
      ...insertSession,
      id,
      startedAt: new Date()
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
