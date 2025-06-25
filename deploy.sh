#!/bin/bash

# Rocket Assess Deployment Script

echo "🚀 Starting Rocket Assess deployment..."

# Build React frontend
echo "📦 Building React frontend..."
cd frontend
npm install
npm run build
cd ..

# Backend setup
echo "🐍 Setting up Django backend..."
cd backend
pip install -r requirements.prod.txt

# Database migrations
echo "🗄️ Running database migrations..."
python manage.py collectstatic --noinput
python manage.py migrate

echo "✅ Deployment complete!"
echo "🌐 Your Rocket Assess platform is ready!" 