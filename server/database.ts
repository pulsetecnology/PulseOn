
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@shared/schema";

// Create SQLite database
const sqlite = new Database("pulseon.db");

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Initialize database with test user
export function initializeDatabase() {
  try {
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

    sqlite.exec(createUsersTable);
    sqlite.exec(createSessionsTable);
    sqlite.exec(createWorkoutsTable);
    sqlite.exec(createWorkoutSessionsTable);

    // Check if test user exists
    const existingUser = sqlite.prepare("SELECT id FROM users WHERE email = ?").get("teste@pulseon.com");
    
    if (!existingUser) {
      // Insert test user
      const insertUser = sqlite.prepare(`
        INSERT INTO users (email, password, name, birth_date, age, weight, height, gender, fitness_goal, experience_level, weekly_frequency, available_equipment, physical_restrictions, onboarding_completed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        "Nenhuma",
        1
      );
      
      console.log("Test user created in database");
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}
