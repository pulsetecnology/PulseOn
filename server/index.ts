import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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

// Auto-restart mechanism
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 10;
let serverInstance: any = null;

function scheduleRestart(delay = 3000) {
  if (restartAttempts < MAX_RESTART_ATTEMPTS) {
    restartAttempts++;
    log(`Scheduling restart attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS} in ${delay}ms`);
    setTimeout(() => {
      startServer();
    }, delay);
  } else {
    log('Max restart attempts reached. Server will remain stopped.');
  }
}

// Prevent uncaught exceptions from crashing the server
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`);
  scheduleRestart();
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection: ${reason}`);
  scheduleRestart();
});

async function startServer(): Promise<any> {
  try {
    if (serverInstance) {
      try {
        serverInstance.close();
      } catch (e) {
        // Ignore close errors
      }
    }

    const server = await registerRoutes(app);
    serverInstance = server;

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error ${status}: ${message}`);
      res.status(status).json({ message });
      // Don't throw error to prevent server crash
    });

    // Setup vite or static serving with error handling
    if (app.get("env") === "development") {
      try {
        await setupVite(app, server);
      } catch (viteError: any) {
        log(`Vite setup error: ${viteError.message}`);
        // Continue without Vite if it fails
        serveStatic(app);
      }
    } else {
      serveStatic(app);
    }

    const port = 5000;
    
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is in use, scheduling restart...`);
        scheduleRestart(5000);
      } else {
        log(`Server error: ${error.message}`);
        scheduleRestart();
      }
    });

    server.on('close', () => {
      log('Server closed, scheduling restart...');
      scheduleRestart();
    });

    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
      restartAttempts = 0; // Reset restart counter on successful start
    });

    return server;

  } catch (error: any) {
    log(`Server initialization error: ${error.message}`);
    scheduleRestart();
  }
}

// Start the server initially
startServer();

// Health check and auto-restart monitoring
setInterval(() => {
  if (!serverInstance || serverInstance.listening === false) {
    log('Server health check failed, restarting...');
    startServer();
  }
}, 15000);

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully');
  if (serverInstance) {
    serverInstance.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully');
  if (serverInstance) {
    serverInstance.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
