#!/bin/bash

# GoSwish Development Server Startup Script
# This script ensures a clean start of the development environment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   GoSwish Development Server${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on a port
kill_port() {
    local port=$1
    echo -e "${YELLOW}⚠️  Killing existing process on port $port...${NC}"
    lsof -ti :$port | xargs kill -9 2>/dev/null
    sleep 1
}

# Step 1: Check for node_modules
echo -e "${BLUE}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Step 2: Check if port 5174 is already in use
echo ""
echo -e "${BLUE}🔍 Checking port 5174...${NC}"
if check_port 5174; then
    echo -e "${YELLOW}⚠️  Port 5174 is already in use${NC}"
    read -p "Kill existing process? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 5174
        echo -e "${GREEN}✅ Port 5174 is now free${NC}"
    else
        echo -e "${YELLOW}Using the existing server...${NC}"
        echo -e "${GREEN}🌐 App should be running at: http://localhost:5174/${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✅ Port 5174 is available${NC}"
fi

# Step 3: Clear any cached files that might cause issues
echo ""
echo -e "${BLUE}🧹 Clearing Vite cache...${NC}"
rm -rf node_modules/.vite 2>/dev/null
echo -e "${GREEN}✅ Cache cleared${NC}"

# Step 4: Start the development server
echo ""
echo -e "${BLUE}🚀 Starting development server...${NC}"
echo -e "${YELLOW}   Press Ctrl+C to stop the server${NC}"
echo ""

# Start npm with proper error handling
npm run dev

# If npm exits with an error
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Server stopped unexpectedly${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting tips:${NC}"
    echo "  1. Try running: npm install"
    echo "  2. Check for syntax errors in your code"
    echo "  3. Run: npm run build to see detailed errors"
    echo "  4. Check the console output above for specific error messages"
    exit 1
fi
