# Development mode script for Windows PowerShell
# Usage: .\dev.ps1 [command]
#
# Commands:
#   db      - Start only database (recommended for local dev)
#   up      - Start all services in Docker
#   down    - Stop all services
#   logs    - View logs from all services
#   build   - Rebuild containers
#   reset   - Stop, remove volumes, and start fresh
#   local   - Start DB in Docker + run frontend/backend locally

param(
    [string]$Command = "db"
)

switch ($Command) {
    "db" {
        Write-Host "Starting database only..." -ForegroundColor Green
        docker compose -f compose.db-only.yml up -d
        Write-Host ""
        Write-Host "Database started at localhost:5432" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Now run these in separate terminals:" -ForegroundColor Yellow
        Write-Host "  Backend:  cd backend && ./mvnw spring-boot:run" -ForegroundColor Gray
        Write-Host "  Frontend: cd frontend && npm run dev" -ForegroundColor Gray
    }
    "up" {
        Write-Host "Starting full Docker development environment..." -ForegroundColor Green
        docker compose -f compose.dev.yml up -d --build
        Write-Host ""
        Write-Host "Services starting..." -ForegroundColor Yellow
        Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
        Write-Host "  Backend:  http://localhost:8080" -ForegroundColor Cyan
        Write-Host "  Database: localhost:5432" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Use '.\dev.ps1 logs' to view logs" -ForegroundColor Gray
    }
    "down" {
        Write-Host "Stopping all development services..." -ForegroundColor Yellow
        docker compose -f compose.dev.yml down 2>$null
        docker compose -f compose.db-only.yml down 2>$null
        Write-Host "All services stopped." -ForegroundColor Green
    }
    "logs" {
        docker compose -f compose.dev.yml logs -f
    }
    "build" {
        Write-Host "Rebuilding containers..." -ForegroundColor Yellow
        docker compose -f compose.dev.yml build --no-cache
    }
    "reset" {
        Write-Host "Resetting development environment..." -ForegroundColor Red
        docker compose -f compose.dev.yml down -v 2>$null
        docker compose -f compose.db-only.yml down -v 2>$null
        docker compose -f compose.db-only.yml up -d
        Write-Host "Database reset complete." -ForegroundColor Green
    }
    "local" {
        Write-Host "Starting local development environment..." -ForegroundColor Green
        
        # Start database
        docker compose -f compose.db-only.yml up -d
        Write-Host "Database started." -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "Opening terminals for backend and frontend..." -ForegroundColor Yellow
        
        # Start backend in new terminal
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Starting Backend...' -ForegroundColor Green; ./mvnw spring-boot:run"
        
        # Start frontend in new terminal
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Starting Frontend...' -ForegroundColor Green; npm run dev"
        
        Write-Host ""
        Write-Host "Development environment starting in new windows!" -ForegroundColor Green
        Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
        Write-Host "  Backend:  http://localhost:8080" -ForegroundColor Cyan
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host ""
        Write-Host "Available commands:" -ForegroundColor Yellow
        Write-Host "  db     - Start only database (default, recommended)" -ForegroundColor Gray
        Write-Host "  local  - Start DB + open terminals for backend/frontend" -ForegroundColor Gray
        Write-Host "  up     - Start all services in Docker" -ForegroundColor Gray
        Write-Host "  down   - Stop all services" -ForegroundColor Gray
        Write-Host "  logs   - View Docker logs" -ForegroundColor Gray
        Write-Host "  build  - Rebuild Docker containers" -ForegroundColor Gray
        Write-Host "  reset  - Reset database and start fresh" -ForegroundColor Gray
    }
}
