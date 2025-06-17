import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import net from 'net';

class StableServerManager {
  constructor() {
    this.serverProcess = null;
    this.isRunning = false;
    this.restartAttempts = 0;
    this.maxRestarts = 50;
    this.port = 5000;
    this.healthCheckInterval = null;
    this.startupTimeout = null;
  }

  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${timestamp} [SERVER-MANAGER] ${message}`);
  }

  async killAllProcesses() {
    return new Promise((resolve) => {
      exec('pkill -f "tsx server/index.ts" 2>/dev/null || pkill -f "node.*server" 2>/dev/null || true', 
        () => {
          setTimeout(resolve, 2000);
        }
      );
    });
  }

  async checkPort() {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(this.port, '0.0.0.0', () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
  }

  async healthCheck() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: this.port,
        path: '/api/health',
        timeout: 5000
      }, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  }

  async startServer() {
    if (this.isRunning) {
      this.log('Server already starting/running');
      return;
    }

    this.isRunning = true;
    
    try {
      this.log('Cleaning up existing processes...');
      await this.killAllProcesses();

      const portAvailable = await this.checkPort();
      if (!portAvailable) {
        this.log('Port 5000 still busy, waiting...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      this.log(`Starting server attempt ${this.restartAttempts + 1}/${this.maxRestarts}`);
      
      this.serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
        env: { 
          ...process.env, 
          NODE_ENV: 'development',
          PORT: this.port.toString()
        },
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      let serverStarted = false;

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        process.stdout.write(output);
        
        if (output.includes('serving on port') || output.includes('Database indexes created')) {
          serverStarted = true;
          this.restartAttempts = 0;
          this.log('Server startup confirmed');
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        process.stderr.write(error);
        
        if (error.includes('EADDRINUSE')) {
          this.log('Port conflict detected');
        }
      });

      this.serverProcess.on('close', (code) => {
        this.log(`Server process closed with code ${code}`);
        this.isRunning = false;
        
        if (code !== 0 && this.restartAttempts < this.maxRestarts) {
          this.restartAttempts++;
          this.log(`Scheduling restart in 3 seconds...`);
          setTimeout(() => this.startServer(), 3000);
        } else if (this.restartAttempts >= this.maxRestarts) {
          this.log('Maximum restart attempts reached');
          process.exit(1);
        }
      });

      this.serverProcess.on('error', (error) => {
        this.log(`Process error: ${error.message}`);
        this.isRunning = false;
        setTimeout(() => this.startServer(), 3000);
      });

      // Startup timeout
      this.startupTimeout = setTimeout(() => {
        if (!serverStarted) {
          this.log('Server startup timeout, restarting...');
          if (this.serverProcess && !this.serverProcess.killed) {
            this.serverProcess.kill('SIGKILL');
          }
        }
      }, 30000);

      // Health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      this.healthCheckInterval = setInterval(async () => {
        if (this.isRunning) {
          const healthy = await this.healthCheck();
          if (!healthy && this.serverProcess && !this.serverProcess.killed) {
            this.log('Health check failed, restarting server...');
            this.serverProcess.kill('SIGTERM');
            setTimeout(() => {
              if (this.serverProcess && !this.serverProcess.killed) {
                this.serverProcess.kill('SIGKILL');
              }
            }, 5000);
          }
        }
      }, 20000);

    } catch (error) {
      this.log(`Failed to start server: ${error.message}`);
      this.isRunning = false;
      setTimeout(() => this.startServer(), 5000);
    }
  }

  shutdown() {
    this.log('Shutting down server manager...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.startupTimeout) {
      clearTimeout(this.startupTimeout);
    }

    if (this.serverProcess && !this.serverProcess.killed) {
      this.serverProcess.kill('SIGTERM');
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          this.serverProcess.kill('SIGKILL');
        }
        process.exit(0);
      }, 5000);
    } else {
      process.exit(0);
    }
  }
}

const manager = new StableServerManager();

process.on('SIGINT', () => manager.shutdown());
process.on('SIGTERM', () => manager.shutdown());
process.on('exit', () => manager.shutdown());

// Ensure clean startup
process.on('uncaughtException', (error) => {
  manager.log(`Uncaught exception: ${error.message}`);
});

process.on('unhandledRejection', (reason) => {
  manager.log(`Unhandled rejection: ${reason}`);
});

manager.log('Initializing stable server manager...');
manager.startServer();