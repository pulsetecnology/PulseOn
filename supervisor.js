const { spawn } = require('child_process');
const path = require('path');

let serverProcess = null;
let restartCount = 0;
const MAX_RESTARTS = 100;

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [supervisor] ${message}`);
}

function startServer() {
  if (serverProcess) {
    serverProcess.kill('SIGKILL');
  }

  log('Starting server...');
  
  serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
    cwd: process.cwd()
  });

  serverProcess.on('close', (code) => {
    log(`Server process exited with code ${code}`);
    
    if (code !== 0 && restartCount < MAX_RESTARTS) {
      restartCount++;
      log(`Restarting server (attempt ${restartCount}/${MAX_RESTARTS})...`);
      setTimeout(startServer, 2000);
    } else if (restartCount >= MAX_RESTARTS) {
      log('Max restart attempts reached. Stopping supervisor.');
      process.exit(1);
    }
  });

  serverProcess.on('error', (error) => {
    log(`Server process error: ${error.message}`);
    setTimeout(startServer, 3000);
  });
}

// Handle supervisor shutdown
process.on('SIGINT', () => {
  log('Supervisor shutting down...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Supervisor terminating...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

// Start initial server
startServer();

// Keep supervisor alive
setInterval(() => {
  if (!serverProcess || serverProcess.killed) {
    log('Server process not running, restarting...');
    startServer();
  }
}, 10000);