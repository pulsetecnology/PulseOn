import { configDotenv } from "dotenv";

// Carrega as variáveis de ambiente
configDotenv();

// Determina o tipo de banco de dados a ser usado
export const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite';

// Configuração para SQLite
export const SQLITE_CONFIG = {
  databasePath: "pulseon.db"
};

// Configuração para PostgreSQL
export const POSTGRES_CONFIG = {
  connectionString: process.env.DATABASE_URL || "postgresql://username:password@localhost:5432/pulseon",
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false
};

// Exporta a configuração apropriada com base no tipo de banco de dados
export const getDatabaseConfig = () => {
  return DATABASE_TYPE === 'postgres' ? POSTGRES_CONFIG : SQLITE_CONFIG;
};