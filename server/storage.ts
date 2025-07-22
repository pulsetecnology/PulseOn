import { DATABASE_TYPE } from "./database-config.js";
import { DatabaseStorage as PostgresStorage } from "./storage-postgres.js";
import { SQLiteStorage } from "./storage-sqlite.js";
import { IStorage } from "./storage-interface.js";

// Cria a instância de armazenamento com base no tipo de banco de dados configurado
let storage: IStorage;

if (DATABASE_TYPE === 'postgres') {
  console.log("Usando armazenamento PostgreSQL");
  storage = new PostgresStorage();
} else {
  console.log("Usando armazenamento SQLite");
  storage = new SQLiteStorage();
}

export { storage };