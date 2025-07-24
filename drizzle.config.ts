import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath } from "url";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Para resolver __dirname com ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verifica se está em produção
const isProduction = process.env.NODE_ENV === "production";

// Define o caminho do schema conforme ambiente
const schemaPath = isProduction
  ? path.resolve(__dirname, "dist/shared/schema.js")
  : path.resolve(__dirname, "./shared/schema.ts"); // ajuste conforme onde seu schema está

export default defineConfig({
  out: "./migrations",
  schema: schemaPath,
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
