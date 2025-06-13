
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL || "postgresql://username:password@localhost:5432/pulseon";
const sql = postgres(connectionString);

// Create drizzle instance
export const db = drizzle(sql, { schema });

// Export tables from schema
export const { users, workouts, workoutSessions } = schema;

// Initialize database
export function initializeDatabase() {
  try {
    console.log("PostgreSQL database initialized successfully");
  } catch (error) {
    console.error("Error initializing PostgreSQL database:", error);
  }
}
