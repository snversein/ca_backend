#!/bin/bash

# TaxPilot Pro Setup Script

echo "================================"
echo "TaxPilot Pro Setup Script"
echo "================================"

# Backend Setup
echo ""
echo "Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "Backend setup complete!"
echo "Edit backend/.env with your Neon and R2 credentials"

# Frontend Setup
echo ""
echo "Setting up Frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

echo ""
echo "Frontend setup complete!"

echo ""
echo "================================"
echo "Setup complete!"
echo ""
echo "To start the backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python run.py"
echo ""
echo "To start the admin panel:"
echo "  cd admin_panel"
echo "  python app.py"
echo ""
echo "To start the mobile app:"
echo "  cd frontend"
echo "  npx expo start"
echo "================================"
