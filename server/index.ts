import { configDotenv } from "dotenv";

// Carrega variáveis de ambiente antes de qualquer outra coisa
configDotenv();

import path from "path";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { DATABASE_TYPE } from "./database-config";

// Verificação de comportamento do path.resolve (debug)
console.log("PATH.resolve with undefined test:");
try {
  path.resolve(undefined as any);
} catch (e) {
  console.error("Expected error:", (e as Error).message);
}

const app = express();

// Middleware padrão para JSON e URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware de log para requisições /api
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  // Intercepta resposta JSON
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;

      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Bloco principal de inicialização assíncrona
(async () => {
  try {
    // Inicializa banco de dados conforme o tipo configurado
    if (DATABASE_TYPE === "postgres") {
      const module = await import("./database-postgres");
      await module.initializeDatabase();
    } else {
      const module = await import("./database");
      await module.initializeDatabase();
    }
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }

  // Exibe variáveis de ambiente importantes (sem expor tudo)
  console.log("=== ENVIRONMENT VARIABLES CHECK ===");
  console.log("N8N_WEBHOOK_URL:", process.env.N8N_WEBHOOK_URL?.substring(0, 30) + "..." || "NOT SET");
  console.log("N8N_API_KEY:", process.env.N8N_API_KEY?.substring(0, 8) + "..." || "NOT SET");
  console.log("JWT_SECRET:", process.env.JWT_SECRET ? "CONFIGURED" : "NOT SET");
  console.log("NODE_ENV:", process.env.NODE_ENV || "development");
  console.log("===================================");

  // Inicia rotas da aplicação (REST, etc.)
  const server = await registerRoutes(app);

  // Middleware de erro global
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`Error: ${message}`, "error");

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Ambiente de desenvolvimento usa Vite como middleware
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Produção serve conteúdo estático compilado
    try {
      serveStatic(app);
    } catch (err) {
      console.error("❌ ServeStatic error:", err);
      process.exit(1);
    }
  }

  // Inicializa o servidor Express
  const port = process.env.PORT || 3000;
  server.listen(port, "0.0.0.0", () => {
    log(`🚀 Server running on port ${port}`);
  });
})();
