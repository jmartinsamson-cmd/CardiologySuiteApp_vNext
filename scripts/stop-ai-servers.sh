#!/bin/bash
# Stop AI-Powered Cardiology Suite servers

echo "🛑 Stopping Cardiology Suite servers..."

# Kill by port
kill $(lsof -t -i:8080) 2>/dev/null && echo "  ✅ Stopped main server (port 8080)" || echo "  ℹ️  No process on port 8080"
kill $(lsof -t -i:8081) 2>/dev/null && echo "  ✅ Stopped AI server (port 8081)" || echo "  ℹ️  No process on port 8081"

# Kill by saved PIDs if they exist
if [ -f /tmp/ai-server.pid ]; then
  kill $(cat /tmp/ai-server.pid) 2>/dev/null
  rm /tmp/ai-server.pid
fi

if [ -f /tmp/main-server.pid ]; then
  kill $(cat /tmp/main-server.pid) 2>/dev/null
  rm /tmp/main-server.pid
fi

echo "✅ All servers stopped"
