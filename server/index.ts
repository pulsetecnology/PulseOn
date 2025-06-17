import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add detailed request logging
app.use((req, res, next) => {
  log(`Incoming: ${req.method} ${req.path} from ${req.ip}`);
  if (req.path === "/" || req.path.startsWith("/api") || req.path === "/health" || req.path === "/debug") {
    log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  }
  next();
});

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
  log("Starting application...");
  
  const server = await registerRoutes(app);
  log("Routes registered successfully");

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    log(`Error on ${req.method} ${req.path}: ${status} - ${message}`);
    log(`Error stack: ${err.stack}`);
    
    res.status(status).json({ 
      message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });

  // Add health check route
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
  });

  // Add root route for testing
  app.get("/", (_req, res) => {
    res.json({ message: "PulseOn API is running", timestamp: new Date().toISOString() });
  });

  // Add comprehensive debug endpoint
  app.get("/debug", (_req, res) => {
    res.json({
      status: "ok",
      environment: process.env.NODE_ENV,
      port: port,
      timestamp: new Date().toISOString(),
      routes: [
        "/health",
        "/api/health", 
        "/debug",
        "/api/auth/me",
        "/api/auth/login",
        "/api/auth/register"
      ],
      vite_mode: isDevelopment ? "development" : "production"
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const isDevelopment = process.env.NODE_ENV !== "production";
  log(`Environment: ${isDevelopment ? 'development' : 'production'}`);
  log(`NODE_ENV: ${process.env.NODE_ENV}`);
  
  if (isDevelopment) {
    log("Setting up Vite development server...");
    await setupVite(app, server);
    log("Vite setup completed");
  } else {
    log("Setting up static file serving...");
    serveStatic(app);
    log("Static file serving setup completed");
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    log(`Application available at: http://0.0.0.0:${port}`);
    log(`Health check available at: http://0.0.0.0:${port}/health`);
    log(`API available at: http://0.0.0.0:${port}/api/health`);
    
    // Test if server is responding
    setTimeout(() => {
      log("Server startup completed successfully");
    }, 1000);
  });
})();
