#!/bin/bash
# AI-Powered Note Analyzer - Quick Start Script
# Starts both the AI Search server and the main application

set -e

echo "🚀 Starting Cardiology Suite with AI Note Analyzer..."
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kill any existing processes on our ports
echo "${YELLOW}Cleaning up existing processes...${NC}"
kill $(lsof -t -i:8080) 2>/dev/null || true
kill $(lsof -t -i:8081) 2>/dev/null || true
sleep 1

# Start AI Search Server
echo ""
echo "${BLUE}Starting AI Search Server (port 8081)...${NC}"
cd "$(dirname "$0")"
PORT=8081 node services/ai-search/server.js > /tmp/ai-search-server.log 2>&1 &
AI_PID=$!
echo "  AI Server PID: $AI_PID"

# Wait for AI server to be ready
echo "  Waiting for AI server to start..."
for i in {1..10}; do
  if curl -s http://127.0.0.1:8081/health > /dev/null 2>&1; then
    echo "${GREEN}  ✅ AI Search Server is ready!${NC}"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "${YELLOW}  ⚠️  AI Server may not be ready (continuing anyway)${NC}"
  fi
  sleep 1
done

# Start Main Application Server
echo ""
echo "${BLUE}Starting Main Application (port 8080)...${NC}"
python3 -m http.server 8080 > /tmp/main-server.log 2>&1 &
MAIN_PID=$!
echo "  Main Server PID: $MAIN_PID"

# Wait for main server
echo "  Waiting for main server to start..."
sleep 2
if curl -s http://127.0.0.1:8080 > /dev/null 2>&1; then
  echo "${GREEN}  ✅ Main Application is ready!${NC}"
else
  echo "${YELLOW}  ⚠️  Main server may not be ready (continuing anyway)${NC}"
fi

# Display status
echo ""
echo "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo "${GREEN}🎉 Cardiology Suite with AI Analyzer is running!${NC}"
echo "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "📍 Application URLs:"
echo "   • Main App:    http://localhost:8080"
echo "   • AI API:      http://localhost:8081"
echo "   • Health Check: http://localhost:8081/health"
echo ""
echo "📝 Logs:"
echo "   • AI Server:   /tmp/ai-search-server.log"
echo "   • Main Server: /tmp/main-server.log"
echo ""
echo "🧪 Test the AI Analyzer:"
echo "   curl -X POST http://127.0.0.1:8081/api/analyze-note \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"note\":\"67 year old man with heart failure and chest pain\"}'"
echo ""
echo "🛑 To stop all servers:"
echo "   kill $AI_PID $MAIN_PID"
echo "   or run: ./stop-ai-servers.sh"
echo ""
echo "${BLUE}Opening browser in 3 seconds...${NC}"
sleep 3

# Try to open browser (works in Codespaces with $BROWSER env var)
if [ -n "$BROWSER" ]; then
  $BROWSER http://localhost:8080 &
elif command -v xdg-open > /dev/null; then
  xdg-open http://localhost:8080 &
elif command -v open > /dev/null; then
  open http://localhost:8080 &
else
  echo "${YELLOW}⚠️  Could not auto-open browser. Please navigate to http://localhost:8080${NC}"
fi

# Save PIDs for cleanup script
echo "$AI_PID" > /tmp/ai-server.pid
echo "$MAIN_PID" > /tmp/main-server.pid

echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user interrupt
trap 'echo ""; echo "Stopping servers..."; kill $AI_PID $MAIN_PID 2>/dev/null; echo "✅ Servers stopped"; exit 0' INT

# Keep script running
wait
