import { configDotenv } from "dotenv";

// Carrega as variáveis de ambiente antes de importar outros módulos
configDotenv();

import path from 'path';

console.log("PATH.resolve with undefined test:");
try {
  path.resolve(undefined as any);
} catch(e) {
  console.error("Expected error:", e.message);
}

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { DATABASE_TYPE } from "./database-config";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
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

(async () => {
  // Initialize database based on configured type
  try {
    if (DATABASE_TYPE === 'postgres') {
      import("./database-postgres").then(module => {
        module.initializeDatabase();
      });
    } else {
      import("./database").then(module => {
        module.initializeDatabase();
      });
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }

  // Log environment variables on startup
  console.log("=== ENVIRONMENT VARIABLES CHECK ===");
  console.log("N8N_WEBHOOK_URL:", process.env.N8N_WEBHOOK_URL ? `${process.env.N8N_WEBHOOK_URL.substring(0, 30)}...` : "NOT SET");
  console.log("N8N_API_KEY:", process.env.N8N_API_KEY ? `${process.env.N8N_API_KEY.substring(0, 8)}...` : "NOT SET");
  console.log("JWT_SECRET:", process.env.JWT_SECRET ? "CONFIGURED" : "NOT SET");
  console.log("NODE_ENV:", process.env.NODE_ENV || "development");
  console.log("===================================");

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on the configured port or default to 3000
  // this serves both the API and the client.
  const port = process.env.PORT || 3000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();