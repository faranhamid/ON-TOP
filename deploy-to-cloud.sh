#!/bin/bash

# ON TOP - Google Cloud Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 ON TOP - Google Cloud Deployment${NC}"
echo "================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI is not installed.${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project variables
PROJECT_ID="ontop-productivity-app"
SERVICE_NAME="ontop-backend"
REGION="us-central1"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Check if user is logged in
echo -e "${YELLOW}🔐 Checking authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "Please log in to Google Cloud:"
    gcloud auth login
fi

# Set the project
echo -e "${YELLOW}📁 Setting project...${NC}"
gcloud config set project $PROJECT_ID

# Create Dockerfile for deployment
echo -e "${YELLOW}🐳 Creating Dockerfile...${NC}"
cat > Dockerfile << 'EOF'
# Use Node.js 18 LTS
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Start the application
CMD ["node", "server-cloud.js"]
EOF

# Create .dockerignore
echo -e "${YELLOW}📝 Creating .dockerignore...${NC}"
cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
.env
.nyc_output
coverage
.cache
.DS_Store
*.md
android
ios
www
MOBILE_DEPLOYMENT_GUIDE.md
SETUP_INSTRUCTIONS.md
GOOGLE_CLOUD_SETUP.md
ontop_users.db
EOF

# Update package.json for cloud deployment
echo -e "${YELLOW}📦 Updating package.json for cloud...${NC}"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.start = 'node server-cloud.js';
pkg.engines = { node: '>=18.0.0' };
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Build and deploy to Cloud Run
echo -e "${YELLOW}🏗️ Building and deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production \
    --set-env-vars PORT=8080

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "================================================="
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
echo -e "${GREEN}📊 Health Check: $SERVICE_URL/api/health${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Set up your environment variables in Cloud Run:"
echo "   - OPENAI_API_KEY"
echo "   - DB_HOST, DB_NAME, DB_USER, DB_PASSWORD"
echo "   - JWT_SECRET"
echo "   - GOOGLE_CLOUD_PROJECT_ID"
echo ""
echo "2. Update your frontend API_BASE_URL to: $SERVICE_URL"
echo ""
echo "3. Test your deployment:"
echo "   curl $SERVICE_URL/api/health"
echo ""
echo -e "${GREEN}🎉 Your ON TOP app is now running in the cloud!${NC}"
