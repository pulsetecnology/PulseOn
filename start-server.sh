#!/bin/bash

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if server is running
is_server_running() {
    curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null | grep -q "200"
}

# Function to kill existing processes
cleanup() {
    log "Cleaning up existing processes..."
    pkill -f "tsx server/index.ts" 2>/dev/null || true
    sleep 2
}

# Function to start the server
start_server() {
    log "Starting server..."
    NODE_ENV=development npx tsx server/index.ts &
    SERVER_PID=$!
    log "Server started with PID: $SERVER_PID"
}

# Function to monitor and restart server
monitor_server() {
    local restart_count=0
    local max_restarts=50
    
    while [ $restart_count -lt $max_restarts ]; do
        sleep 10
        
        if ! is_server_running; then
            log "Server health check failed. Attempting restart..."
            cleanup
            start_server
            restart_count=$((restart_count + 1))
            log "Restart attempt: $restart_count/$max_restarts"
            sleep 5
        fi
    done
    
    log "Maximum restart attempts reached. Exiting."
    exit 1
}

# Signal handlers for graceful shutdown
trap 'log "Received SIGTERM, shutting down..."; cleanup; exit 0' TERM
trap 'log "Received SIGINT, shutting down..."; cleanup; exit 0' INT

# Main execution
log "=== Application Startup Script ==="
cleanup
start_server

# Wait for server to start
sleep 5

if is_server_running; then
    log "Server started successfully and health check passed"
else
    log "Initial server startup failed, starting monitor..."
fi

# Start monitoring
monitor_server