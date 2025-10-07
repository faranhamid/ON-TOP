#!/bin/bash

# ON TOP - Vercel Deployment Script
# This script automates the deployment process to Vercel

set -e

echo "🚀 Starting ON TOP deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please log in to Vercel:"
    vercel login
fi

# Set environment variables for production
echo "🔧 Setting up environment variables..."

# Core application variables
vercel env add NODE_ENV production
vercel env add JWT_SECRET $(openssl rand -hex 64)

# Database configuration (you'll need to set these with your actual values)
echo "⚠️  Please set these environment variables in Vercel dashboard:"
echo "   - DATABASE_PROVIDER (set to 'pg' for PostgreSQL)"
echo "   - DB_HOST (your database host)"
echo "   - DB_NAME (your database name)"
echo "   - DB_USER (your database user)"
echo "   - DB_PASSWORD (your database password)"
echo "   - DB_PORT (usually 5432 for PostgreSQL)"
echo "   - DB_SSL (set to 'true')"

# AI Services
echo "   - OPENAI_API_KEY (your OpenAI API key)"
echo "   - OPENAI_MODEL (recommended: gpt-4o-mini)"

# Optional: Apple IAP
echo "   - APPLE_SHARED_SECRET (for iOS in-app purchases)"
echo "   - APPLE_VERIFY_ENV (set to 'production')"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📱 Your app should now be live on Vercel"
echo ""
echo "Next steps:"
echo "1. Update your mobile app's API endpoint to use the new Vercel URL"
echo "2. Test all functionality in production"
echo "3. Set up monitoring and analytics if needed"
echo ""
echo "Remember to set the environment variables in Vercel dashboard!"
