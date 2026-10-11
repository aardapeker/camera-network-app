#!/bin/bash

# Development mode script for Linux/macOS
# Usage: ./dev.sh [command]
#
# Commands:
#   db      - Start only database (recommended for local dev)
#   up      - Start all services in Docker
#   down    - Stop all services
#   logs    - View logs from all services
#   build   - Rebuild containers
#   reset   - Stop, remove volumes, and start fresh
#   local   - Start DB in Docker + run frontend/backend locally

COMMAND="${1:-db}"

# Container engine. The server runs Docker; local Linux dev may only have Podman.
# Override with e.g. COMPOSE="podman compose" ./dev.sh up
if [ -z "$COMPOSE" ]; then
    if command -v docker &> /dev/null; then
        COMPOSE="docker compose"
    elif command -v podman &> /dev/null; then
        COMPOSE="podman compose"
    else
        echo "Neither docker nor podman found on PATH." >&2
        exit 1
    fi
fi

# Colors
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
RED='\033[31m'
GRAY='\033[90m'
NC='\033[0m' # No Color

case "$COMMAND" in
    "db")
        echo -e "${GREEN}Starting database only...${NC}"
        $COMPOSE -f compose.db-only.yml up -d
        echo ""
        echo -e "${CYAN}Database started at localhost:5432${NC}"
        echo ""
        echo -e "${YELLOW}Now run these in separate terminals:${NC}"
        echo -e "${GRAY}  Backend:  cd backend && ./mvnw spring-boot:run${NC}"
        echo -e "${GRAY}  Frontend: cd frontend && npm run dev${NC}"
        ;;
    "up")
        echo -e "${GREEN}Starting full Docker development environment...${NC}"
        $COMPOSE -f compose.dev.yml up -d --build
        echo ""
        echo -e "${YELLOW}Services starting...${NC}"
        echo -e "  Frontend: ${CYAN}http://localhost:5173${NC}"
        echo -e "  Backend:  ${CYAN}http://localhost:8080${NC}"
        echo -e "  Database: ${CYAN}localhost:5432${NC}"
        echo ""
        echo -e "${GRAY}Use './dev.sh logs' to view logs${NC}"
        ;;
    "down")
        echo -e "${YELLOW}Stopping all development services...${NC}"
        $COMPOSE -f compose.dev.yml down 2>/dev/null
        $COMPOSE -f compose.db-only.yml down 2>/dev/null
        echo -e "${GREEN}All services stopped.${NC}"
        ;;
    "logs")
        $COMPOSE -f compose.dev.yml logs -f
        ;;
    "build")
        echo -e "${YELLOW}Rebuilding containers...${NC}"
        $COMPOSE -f compose.dev.yml build --no-cache
        ;;
    "reset")
        echo -e "${RED}Resetting development environment...${NC}"
        $COMPOSE -f compose.dev.yml down -v 2>/dev/null
        $COMPOSE -f compose.db-only.yml down -v 2>/dev/null
        $COMPOSE -f compose.db-only.yml up -d
        echo -e "${GREEN}Database reset complete.${NC}"
        ;;
    "local")
        echo -e "${GREEN}Starting local development environment...${NC}"
        
        # Start database
        $COMPOSE -f compose.db-only.yml up -d
        echo -e "${CYAN}Database started.${NC}"
        
        echo ""
        echo -e "${YELLOW}Starting backend and frontend...${NC}"
        
        # Check if we're in a terminal that supports multiple panes
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --tab --title="Backend" -- bash -c "cd backend && echo -e '${GREEN}Starting Backend...${NC}' && ./mvnw spring-boot:run; exec bash"
            gnome-terminal --tab --title="Frontend" -- bash -c "cd frontend && echo -e '${GREEN}Starting Frontend...${NC}' && npm run dev; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -title "Backend" -e "cd backend && ./mvnw spring-boot:run" &
            xterm -title "Frontend" -e "cd frontend && npm run dev" &
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            osascript -e "tell application \"Terminal\" to do script \"cd $(pwd)/backend && ./mvnw spring-boot:run\""
            osascript -e "tell application \"Terminal\" to do script \"cd $(pwd)/frontend && npm run dev\""
        else
            echo -e "${YELLOW}Please open two terminals manually and run:${NC}"
            echo -e "${GRAY}  Terminal 1: cd backend && ./mvnw spring-boot:run${NC}"
            echo -e "${GRAY}  Terminal 2: cd frontend && npm run dev${NC}"
            exit 0
        fi
        
        echo ""
        echo -e "${GREEN}Development environment starting!${NC}"
        echo -e "  Frontend: ${CYAN}http://localhost:5173${NC}"
        echo -e "  Backend:  ${CYAN}http://localhost:8080${NC}"
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        echo ""
        echo -e "${YELLOW}Available commands:${NC}"
        echo -e "${GRAY}  db     - Start only database (default, recommended)${NC}"
        echo -e "${GRAY}  local  - Start DB + open terminals for backend/frontend${NC}"
        echo -e "${GRAY}  up     - Start all services in Docker${NC}"
        echo -e "${GRAY}  down   - Stop all services${NC}"
        echo -e "${GRAY}  logs   - View Docker logs${NC}"
        echo -e "${GRAY}  build  - Rebuild Docker containers${NC}"
        echo -e "${GRAY}  reset  - Reset database (clears data)${NC}"
        ;;
esac
