import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Prevent process crashes from unhandled errors
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`);
  log(`Stack: ${error.stack}`);
  // Don't exit - let the process continue
});

process.on('unhandledRejection', (reason: any, promise) => {
  log(`Unhandled Rejection at: ${promise}`);
  log(`Reason: ${reason}`);
  // Don't exit - let the process continue
});

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

let serverInstance: any = null;
let isStarting = false;

async function startServer() {
  if (isStarting) return;
  isStarting = true;
  
  try {
    if (serverInstance) {
      try {
        serverInstance.close();
      } catch (e) {}
    }

    const server = await registerRoutes(app);
    serverInstance = server;

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error ${status}: ${message}`);
      res.status(status).json({ message });
      // Don't throw to prevent crash
    });

    // Setup Vite with error handling
    if (app.get("env") === "development") {
      try {
        await setupVite(app, server);
      } catch (viteError: any) {
        log(`Vite setup failed: ${viteError.message}`);
        serveStatic(app);
      }
    } else {
      serveStatic(app);
    }

    const port = 5000;
    
    server.on('error', (error: any) => {
      log(`Server error: ${error.message}`);
      if (error.code === 'EADDRINUSE') {
        setTimeout(() => {
          isStarting = false;
          startServer();
        }, 3000);
      }
    });

    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
      isStarting = false;
    });

  } catch (error: any) {
    log(`Failed to start server: ${error.message}`);
    isStarting = false;
    setTimeout(startServer, 3000);
  }
}

// Auto-restart mechanism
setInterval(() => {
  if (!serverInstance || !serverInstance.listening) {
    log('Server not listening, restarting...');
    startServer();
  }
}, 10000);

// Graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM received');
  if (serverInstance) {
    serverInstance.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

startServer();
