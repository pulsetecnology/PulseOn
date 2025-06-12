import type { User, InsertUser, Session, InsertSession, Workout, InsertWorkout, WorkoutSession, InsertWorkoutSession } from "@shared/schema";
import Database from "better-sqlite3";

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

export class SQLiteStorage implements IStorage {
  private db: Database.Database;

  constructor() {
    this.db = new Database("pulseon.db");
    this.initializeTables();
  }

  private initializeTables() {
    // Create tables if they don't exist
    const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT,
      birth_date TEXT,
      age INTEGER,
      weight INTEGER,
      height INTEGER,
      gender TEXT,
      fitness_goal TEXT,
      experience_level TEXT,
      weekly_frequency INTEGER,
      available_equipment TEXT,
      custom_equipment TEXT,
      physical_restrictions TEXT,
      onboarding_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`;

    const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`;

    const createWorkoutsTable = `
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      duration INTEGER,
      difficulty TEXT,
      exercises TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`;

    const createWorkoutSessionsTable = `
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      workout_id INTEGER,
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      exercises TEXT,
      total_duration INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    )`;

    this.db.exec(createUsersTable);
    this.db.exec(createSessionsTable);
    this.db.exec(createWorkoutsTable);
    this.db.exec(createWorkoutSessionsTable);

    // Add migration to add custom_equipment column if it doesn't exist
    this.addCustomEquipmentColumn();
    
    // Add migration to add avatar_url column if it doesn't exist
    this.addAvatarUrlColumn();

    // Seed test user if it doesn't exist
    this.seedTestUser();
  }

  private addCustomEquipmentColumn() {
    try {
      // Check if custom_equipment column exists
      const columns = this.db.prepare("PRAGMA table_info(users)").all();
      const hasCustomEquipment = columns.some((col: any) => col.name === 'custom_equipment');
      
      if (!hasCustomEquipment) {
        console.log('Adding custom_equipment column to users table...');
        this.db.exec('ALTER TABLE users ADD COLUMN custom_equipment TEXT');
        console.log('custom_equipment column added successfully');
      }
    } catch (error) {
      console.error('Error adding custom_equipment column:', error);
    }
  }

  private addAvatarUrlColumn() {
    try {
      // Check if avatar_url column exists
      const columns = this.db.prepare("PRAGMA table_info(users)").all();
      const hasAvatarUrl = columns.some((col: any) => col.name === 'avatar_url');
      
      if (!hasAvatarUrl) {
        console.log('Adding avatar_url column to users table...');
        this.db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
        console.log('avatar_url column added successfully');
      }
    } catch (error) {
      console.error('Error adding avatar_url column:', error);
    }
  }

  private seedTestUser() {
    const existingUser = this.db.prepare("SELECT id FROM users WHERE email = ?").get("teste@pulseon.com");

    if (!existingUser) {
      const insertUser = this.db.prepare(`
        INSERT INTO users (email, password, name, birth_date, age, weight, height, gender, fitness_goal, experience_level, weekly_frequency, available_equipment, custom_equipment, physical_restrictions, onboarding_completed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertUser.run(
        "teste@pulseon.com",
        "$2b$12$C2oOEvCLckSf6.DY8n/tq.RB.vkIwSxamZFMbw.Z/W9/EbHXcV6xa", // "123456"
        "Usuário Teste",
        "1990-05-15",
        null,
        75,
        180,
        "not_specified",
        "lose_weight",
        "beginner",
        3,
        JSON.stringify(["dumbbells", "resistance_bands"]),
        null,
        "Nenhuma",
        1
      );
    }
  }

  private parseUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      birthDate: row.birth_date,
      age: row.age,
      weight: row.weight,
      height: row.height,
      gender: row.gender,
      fitnessGoal: row.fitness_goal,
      experienceLevel: row.experience_level,
      weeklyFrequency: row.weekly_frequency,
      availableEquipment: row.available_equipment ? JSON.parse(row.available_equipment) : null,
      customEquipment: row.custom_equipment,
      physicalRestrictions: row.physical_restrictions,
      onboardingCompleted: Boolean(row.onboarding_completed),
      avatarUrl: row.avatar_url,
      createdAt: new Date(row.created_at)
    };
  }

  async getUser(id: number): Promise<User | undefined> {
    const stmt = this.db.prepare("SELECT * FROM users WHERE id = ?");
    const row = stmt.get(id);
    return row ? this.parseUser(row) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const stmt = this.db.prepare("SELECT * FROM users WHERE email = ?");
    const row = stmt.get(email);
    return row ? this.parseUser(row) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const stmt = this.db.prepare(`
      INSERT INTO users (email, password, name, birth_date, age, weight, height, gender, fitness_goal, experience_level, weekly_frequency, available_equipment, custom_equipment, physical_restrictions, onboarding_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      insertUser.email,
      insertUser.password,
      insertUser.name || null,
      insertUser.birthDate || null,
      insertUser.age || null,
      insertUser.weight || null,
      insertUser.height || null,
      insertUser.gender || null,
      insertUser.fitnessGoal || null,
      insertUser.experienceLevel || null,
      insertUser.weeklyFrequency || null,
      insertUser.availableEquipment ? JSON.stringify(insertUser.availableEquipment) : null,
      insertUser.customEquipment || null,
      insertUser.physicalRestrictions || null,
      0
    );

    const user = await this.getUser(result.lastInsertRowid as number);
    if (!user) {
      throw new Error("Failed to create user");
    }
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const setParts: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key === 'birthDate' ? 'birth_date' :
                     key === 'fitnessGoal' ? 'fitness_goal' :
                     key === 'experienceLevel' ? 'experience_level' :
                     key === 'weeklyFrequency' ? 'weekly_frequency' :
                     key === 'availableEquipment' ? 'available_equipment' :
                     key === 'customEquipment' ? 'custom_equipment':
                     key === 'physicalRestrictions' ? 'physical_restrictions' :
                     key === 'onboardingCompleted' ? 'onboarding_completed' :
                     key === 'avatarUrl' ? 'avatar_url' : key;

        setParts.push(`${dbKey} = ?`);

        if (key === 'availableEquipment' && Array.isArray(value)) {
          values.push(JSON.stringify(value));
        } else if (key === 'onboardingCompleted') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    });

    if (setParts.length === 0) {
      return this.getUser(id);
    }

    // Check if we have the required fields for onboarding completion
    const currentUser = await this.getUser(id);
    if (currentUser && (updates.age || updates.weight || updates.height)) {
      const hasAllRequiredFields = 
        (updates.age || currentUser.age) &&
        (updates.weight || currentUser.weight) &&
        (updates.height || currentUser.height);

      if (hasAllRequiredFields && !setParts.includes('onboarding_completed = ?')) {
        setParts.push('onboarding_completed = ?');
        values.push(1);
      }
    }

    values.push(id);

    const stmt = this.db.prepare(`UPDATE users SET ${setParts.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getUser(id);
  }

  // Session methods
  async createSession(insertSession: InsertSession): Promise<Session> {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      insertSession.userId,
      insertSession.token,
      insertSession.expiresAt.toISOString()
    );

    return {
      id: result.lastInsertRowid as number,
      userId: insertSession.userId,
      token: insertSession.token,
      expiresAt: insertSession.expiresAt,
      createdAt: new Date()
    };
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const stmt = this.db.prepare("SELECT * FROM sessions WHERE token = ?");
    const row = stmt.get(token);

    if (!row) return undefined;

    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at)
    };
  }

  async deleteSession(token: string): Promise<void> {
    const stmt = this.db.prepare("DELETE FROM sessions WHERE token = ?");
    stmt.run(token);
  }

  async deleteUserSessions(userId: number): Promise<void> {
    const stmt = this.db.prepare("DELETE FROM sessions WHERE user_id = ?");
    stmt.run(userId);
  }

  // Workout methods
  async getWorkouts(userId?: number): Promise<Workout[]> {
    const stmt = userId 
      ? this.db.prepare("SELECT * FROM workouts WHERE user_id = ?")
      : this.db.prepare("SELECT * FROM workouts");

    const rows = userId ? stmt.all(userId) : stmt.all();

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      duration: row.duration,
      difficulty: row.difficulty,
      exercises: row.exercises ? JSON.parse(row.exercises) : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      createdAt: new Date(row.created_at)
    }));
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const stmt = this.db.prepare("SELECT * FROM workouts WHERE id = ?");
    const row = stmt.get(id);

    if (!row) return undefined;

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      duration: row.duration,
      difficulty: row.difficulty,
      exercises: row.exercises ? JSON.parse(row.exercises) : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      createdAt: new Date(row.created_at)
    };
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const stmt = this.db.prepare(`
      INSERT INTO workouts (user_id, name, description, duration, difficulty, exercises)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      insertWorkout.userId || null,
      insertWorkout.name,
      insertWorkout.description || null,
      insertWorkout.duration || null,
      insertWorkout.difficulty || null,
      insertWorkout.exercises ? JSON.stringify(insertWorkout.exercises) : null
    );

    const workout = await this.getWorkout(result.lastInsertRowid as number);
    if (!workout) {
      throw new Error("Failed to create workout");
    }
    return workout;
  }

  async updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout | undefined> {
    const setParts: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key === 'userId' ? 'user_id' : 
                     key === 'completedAt' ? 'completed_at' : key;
        setParts.push(`${dbKey} = ?`);

        if (key === 'exercises' && Array.isArray(value)) {
          values.push(JSON.stringify(value));
        } else if (key === 'completedAt' && value instanceof Date) {
          values.push(value.toISOString());
        } else {
          values.push(value);
        }
      }
    });

    if (setParts.length === 0) {
      return this.getWorkout(id);
    }

    values.push(id);

    const stmt = this.db.prepare(`UPDATE workouts SET ${setParts.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getWorkout(id);
  }

  // Workout session methods
  async getWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    const stmt = this.db.prepare("SELECT * FROM workout_sessions WHERE user_id = ?");
    const rows = stmt.all(userId);

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      workoutId: row.workout_id,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      exercises: row.exercises ? JSON.parse(row.exercises) : null,
      totalDuration: row.total_duration
    }));
  }

  async createWorkoutSession(insertSession: InsertWorkoutSession): Promise<WorkoutSession> {
    const stmt = this.db.prepare(`
      INSERT INTO workout_sessions (user_id, workout_id, exercises, total_duration)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      insertSession.userId || null,
      insertSession.workoutId || null,
      insertSession.exercises ? JSON.stringify(insertSession.exercises) : null,
      insertSession.totalDuration || null
    );

    return {
      id: result.lastInsertRowid as number,
      userId: insertSession.userId || null,
      workoutId: insertSession.workoutId || null,
      startedAt: new Date(),
      completedAt: null,
      exercises: insertSession.exercises || null,
      totalDuration: insertSession.totalDuration || null
    };
  }

  async updateWorkoutSession(id: number, updates: Partial<InsertWorkoutSession>): Promise<WorkoutSession | undefined> {
    const setParts: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key === 'userId' ? 'user_id' :
                     key === 'workoutId' ? 'workout_id' :
                     key === 'completedAt' ? 'completed_at' :
                     key === 'totalDuration' ? 'total_duration' : key;
        setParts.push(`${dbKey} = ?`);

        if (key === 'exercises' && Array.isArray(value)) {
          values.push(JSON.stringify(value));
        } else if (key === 'completedAt' && value instanceof Date) {
          values.push(value.toISOString());
        } else {
          values.push(value);
        }
      }
    });

    if (setParts.length === 0) {
      const stmt = this.db.prepare("SELECT * FROM workout_sessions WHERE id = ?");
      const row = stmt.get(id);

      if (!row) return undefined;

      return {
        id: row.id,
        userId: row.user_id,
        workoutId: row.workout_id,
        startedAt: new Date(row.started_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : null,
        exercises: row.exercises ? JSON.parse(row.exercises) : null,
        totalDuration: row.total_duration
      };
    }

    values.push(id);

    const stmt = this.db.prepare(`UPDATE workout_sessions SET ${setParts.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    const updatedStmt = this.db.prepare("SELECT * FROM workout_sessions WHERE id = ?");
    const row = updatedStmt.get(id);

    if (!row) return undefined;

    return {
      id: row.id,
      userId: row.user_id,
      workoutId: row.workout_id,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      exercises: row.exercises ? JSON.parse(row.exercises) : null,
      totalDuration: row.total_duration
    };
  }
}

export const storage = new SQLiteStorage();