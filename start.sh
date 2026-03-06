#!/bin/bash
# Seeking application startup script for Render

echo "=== Starting Seeking application ==="
echo "Working directory: $(pwd)"
echo "PORT environment variable: $PORT"

# List files for debugging
echo "=== Current directory contents ==="
ls -la
echo "=== Backend directory contents ==="
ls -la backend/

# Change to backend directory
cd backend

# Initialize database
echo "=== Initializing database ==="
python init_db.py

# Start gunicorn
echo "=== Starting gunicorn server ==="
echo "Command: python -m gunicorn app:app --bind 0.0.0.0:$PORT"
exec python -m gunicorn app:app --bind 0.0.0.0:$PORT