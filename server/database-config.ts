import { configDotenv } from "dotenv";

configDotenv();

export const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite';

export const SQLITE_CONFIG = {
  databasePath: "pulseon.db"
};

export const POSTGRES_CONFIG = {
  connectionString: process.env.DATABASE_URL || "postgresql://username:password@localhost:5432/pulseon",
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

export const getDatabaseConfig = () => {
  return DATABASE_TYPE === 'postgres' ? POSTGRES_CONFIG : SQLITE_CONFIG;
};
