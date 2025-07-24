import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Make sure it is set in Railway.");
}

// PostgreSQL connection with SSL if in production
const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Create drizzle instance
export const db = drizzle(sql, { schema });

// Export tables from schema
export const { users, workouts, workoutSessions } = schema;

// Initialize database
export async function initializeDatabase() {
  try {
    // Test connection with a simple query
    await sql`SELECT 1`;
    console.log("✅ PostgreSQL database initialized successfully");
    console.log("🌐 DATABASE_URL is configured:", !!process.env.DATABASE_URL);
  } catch (error) {
    console.error("❌ Error initializing PostgreSQL database:", error);
    throw error;
  }
}
