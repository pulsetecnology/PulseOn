import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import postgres from "postgres";
import Database from "better-sqlite3";
import * as pgSchema from "@shared/schema";
import * as sqliteSchema from "@shared/schema-sqlite";
import { DATABASE_TYPE, getDatabaseConfig } from "./database-config";

// Obter a configuração do banco de dados
const config = getDatabaseConfig();

// Exportar a instância do banco de dados com base no tipo configurado
let db: any;

if (DATABASE_TYPE === 'postgres') {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set for PostgreSQL. Did you forget to provision a database?",
    );
  }
  
  // PostgreSQL connection
  const sql = postgres(process.env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 30,
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false
  });
  
  db = drizzlePostgres(sql, { schema: pgSchema });
} else {
  // SQLite connection
  const sqlite = new Database("pulseon.db");
  db = drizzleSQLite(sqlite, { schema: sqliteSchema });
  
  // Inicializar o banco de dados SQLite se necessário
  console.log("Inicializando banco de dados SQLite...");
  try {
    // Verificar se o banco de dados existe e excluir se necessário
    try {
      // Verificar se a tabela users existe
      const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
      if (tableExists) {
        console.log("Recriando tabelas SQLite para garantir compatibilidade...");
        // Excluir tabelas existentes
        sqlite.exec(`
          DROP TABLE IF EXISTS workout_sessions;
          DROP TABLE IF EXISTS scheduled_workouts;
          DROP TABLE IF EXISTS sessions;
          DROP TABLE IF EXISTS users;
        `);
      }
    } catch (error) {
      console.log("Banco de dados não existe ou está vazio, criando tabelas...");
    }
    
    // Criar tabelas se não existirem
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        phone TEXT,
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
        smoking_status TEXT,
        alcohol_consumption TEXT,
        diet_type TEXT,
        sleep_hours TEXT,
        stress_level TEXT,
        preferred_workout_time TEXT,
        available_days_per_week INTEGER,
        average_workout_duration TEXT,
        preferred_location TEXT,
        avatar_url TEXT,
        onboarding_completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS scheduled_workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        exercises TEXT,
        total_calories INTEGER,
        total_duration INTEGER,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        scheduled_for TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        scheduled_workout_id INTEGER,
        name TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        exercises TEXT,
        total_duration INTEGER,
        total_calories INTEGER,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (scheduled_workout_id) REFERENCES scheduled_workouts(id)
      );
    `);
    console.log("Tabelas SQLite criadas ou verificadas com sucesso.");
  } catch (error) {
    console.error("Erro ao inicializar o banco de dados SQLite:", error);
  }
}

export { db };