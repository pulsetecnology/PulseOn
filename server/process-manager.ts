import { spawn, ChildProcess } from 'child_process';
import { log } from './vite';

class ProcessManager {
  private static instance: ProcessManager;
  private serverProcess: ChildProcess | null = null;
  private isShuttingDown = false;

  static getInstance(): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager();
    }
    return ProcessManager.instance;
  }

  async killExistingProcesses(): Promise<void> {
    try {
      // Kill any existing tsx processes
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('pkill -f "tsx server/index.ts" 2>/dev/null || true');
      await execAsync('pkill -f "node.*server/index" 2>/dev/null || true');
      
      // Wait for processes to die
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  setupGracefulShutdown(): void {
    const shutdown = () => {
      if (!this.isShuttingDown) {
        this.isShuttingDown = true;
        log('Shutting down gracefully...');
        
        if (this.serverProcess) {
          this.serverProcess.kill('SIGTERM');
        }
        
        setTimeout(() => {
          if (this.serverProcess) {
            this.serverProcess.kill('SIGKILL');
          }
          process.exit(0);
        }, 5000);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('exit', shutdown);
  }
}

export default ProcessManager;