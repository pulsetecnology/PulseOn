const { spawn } = require('child_process');
const http = require('http');

class ServerSupervisor {
  constructor() {
    this.process = null;
    this.restartCount = 0;
    this.maxRestarts = 100;
    this.isShuttingDown = false;
    this.healthCheckInterval = null;
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] SUPERVISOR: ${message}`);
  }

  async killExisting() {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec('pkill -f "tsx server/index.ts"', () => {
        setTimeout(resolve, 1500);
      });
    });
  }

  async checkHealth() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/health',
        timeout: 3000
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

  async start() {
    if (this.isShuttingDown) return;

    await this.killExisting();
    
    this.log(`Starting server (attempt ${this.restartCount + 1})`);
    
    this.process = spawn('npx', ['tsx', 'server/index.ts'], {
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: 'inherit',
      detached: false
    });

    this.process.on('exit', (code) => {
      if (this.isShuttingDown) return;
      
      this.log(`Server exited with code ${code}`);
      
      if (this.restartCount < this.maxRestarts) {
        this.restartCount++;
        setTimeout(() => this.start(), 2000);
      } else {
        this.log('Maximum restarts reached');
        process.exit(1);
      }
    });

    this.process.on('error', (error) => {
      if (!this.isShuttingDown) {
        this.log(`Process error: ${error.message}`);
        setTimeout(() => this.start(), 3000);
      }
    });

    // Health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;

      const healthy = await this.checkHealth();
      if (!healthy && this.process && !this.process.killed) {
        this.log('Health check failed, restarting...');
        this.process.kill('SIGTERM');
        setTimeout(() => {
          if (this.process && !this.process.killed) {
            this.process.kill('SIGKILL');
          }
        }, 5000);
      } else if (healthy && this.restartCount > 0) {
        this.log('Server healthy, resetting restart counter');
        this.restartCount = 0;
      }
    }, 15000);
  }

  shutdown() {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    this.log('Shutting down...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.process && !this.process.killed) {
      this.process.kill('SIGTERM');
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill('SIGKILL');
        }
        process.exit(0);
      }, 5000);
    } else {
      process.exit(0);
    }
  }
}

const supervisor = new ServerSupervisor();

process.on('SIGINT', () => supervisor.shutdown());
process.on('SIGTERM', () => supervisor.shutdown());
process.on('exit', () => supervisor.shutdown());

supervisor.log('Starting application supervisor...');
supervisor.start();