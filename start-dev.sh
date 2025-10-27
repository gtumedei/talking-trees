#!/bin/bash

echo "🌳 Starting Monumental Trees Development Environment..."
echo "=================================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Python is installed
if ! command_exists python; then
    echo "❌ Python is not installed or not in PATH"
    exit 1
fi

# Check if Node.js is installed
if ! command_exists node; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Show versions
echo "Python version: $(python --version)"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

# Step 1: Install Python dependencies
echo "📦 Installing Python dependencies..."
cd backend

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install requirements
if [ -f "requirements.txt" ]; then
    echo "Installing from requirements.txt..."
    pip install -r requirements.txt
    
    # Verify critical packages
    echo "Verifying critical packages..."
    python -c "import langchain_community; print('✅ langchain-community installed')"
    python -c "import flask; print('✅ Flask installed')"
    python -c "import faiss; print('✅ FAISS installed')"
else
    echo "❌ requirements.txt not found in backend folder"
    exit 1
fi

# Step 2: Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
cd ..

if [ -f "package.json" ]; then
    echo "Installing npm packages..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed"
        exit 1
    fi
else
    echo "❌ package.json not found"
    exit 1
fi

# Step 3: Start application
echo ""
echo "🚀 Starting Application..."
echo "Backend will run on: http://localhost:5000"
echo "Frontend will run on: http://localhost:3000"
echo "Press Ctrl+C to stop both servers"
echo ""

# Start backend in background
echo "Starting Python Backend..."
cd backend
python chatbot_api.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting Next.js Frontend..."
npm run dev

# When frontend stops, also stop backend
kill $BACKEND_PID 2>/dev/null
echo "Development environment stopped."