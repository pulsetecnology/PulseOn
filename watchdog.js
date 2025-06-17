#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');

let serverProcess = null;
let isShuttingDown = false;
let restartCount = 0;
const PORT = 5000;

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] WATCHDOG: ${message}`);
}

function killExistingProcesses() {
  return new Promise((resolve) => {
    exec('pkill -f "tsx server/index.ts"', (error) => {
      // Ignore errors, process might not exist
      setTimeout(resolve, 1000);
    });
  });
}

function checkServerHealth() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
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

async function startServer() {
  if (isShuttingDown) return;

  try {
    // Kill any existing processes first
    await killExistingProcesses();
    
    log(`Starting server (attempt ${restartCount + 1})`);
    
    serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      env: { ...process.env, NODE_ENV: 'development' },
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Forward stdout/stderr
    serverProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    serverProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    serverProcess.on('close', (code) => {
      if (!isShuttingDown) {
        log(`Server process exited with code ${code}`);
        restartCount++;
        
        if (restartCount < 50) {
          log(`Scheduling restart in 3 seconds...`);
          setTimeout(() => {
            startServer();
          }, 3000);
        } else {
          log('Too many restarts, stopping watchdog');
          process.exit(1);
        }
      }
    });

    serverProcess.on('error', (error) => {
      if (!isShuttingDown) {
        log(`Server process error: ${error.message}`);
        setTimeout(() => {
          startServer();
        }, 3000);
      }
    });

    // Wait a bit then check if server started successfully
    setTimeout(async () => {
      const isHealthy = await checkServerHealth();
      if (isHealthy) {
        log('Server health check passed');
        restartCount = 0; // Reset on successful start
      } else {
        log('Server health check failed, will retry');
      }
    }, 5000);

  } catch (error) {
    log(`Failed to start server: ${error.message}`);
    setTimeout(() => {
      startServer();
    }, 5000);
  }
}

// Health monitoring
setInterval(async () => {
  if (isShuttingDown) return;
  
  const isHealthy = await checkServerHealth();
  if (!isHealthy && serverProcess && !serverProcess.killed) {
    log('Health check failed, restarting server');
    serverProcess.kill('SIGTERM');
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}, 20000);

// Graceful shutdown
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  log('Shutting down watchdog...');
  
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
      process.exit(0);
    }, 5000);
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);

// Start initial server
log('Starting application watchdog...');
startServer();