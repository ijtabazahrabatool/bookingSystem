#!/bin/bash
# Helper script to kill process on port 5001
PORT=5001
PID=$(lsof -ti:$PORT)

if [ -z "$PID" ]; then
  echo "Port $PORT is already free"
else
  echo "Killing process $PID on port $PORT"
  kill -9 $PID
  echo "Port $PORT is now free"
fi

