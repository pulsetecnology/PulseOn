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

// Prevent uncaught exceptions from crashing the server
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`);
  // Don't exit, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  // Don't exit, just log the error
});

(async () => {
  try {
    const server = await registerRoutes(app);

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
        log(`Port ${port} is in use, attempting restart in 3 seconds...`);
        setTimeout(() => {
          server.close(() => {
            server.listen(port, "0.0.0.0", () => {
              log(`serving on port ${port} (restarted)`);
            });
          });
        }, 3000);
      } else {
        log(`Server error: ${error.message}`);
      }
    });

    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });

    // Keep process alive
    setInterval(() => {
      // Heartbeat to keep process running
    }, 30000);

  } catch (error: any) {
    log(`Server initialization error: ${error.message}`);
    // Don't exit, try to continue
  }
})();
