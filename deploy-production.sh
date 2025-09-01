#!/bin/bash

# ON TOP - Production Deployment Script
# This script automates the deployment process for production

set -e  # Exit on any error

echo "🚀 ON TOP Production Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Install production dependencies
install_dependencies() {
    print_status "Installing production dependencies..."
    npm ci --only=production
    print_success "Dependencies installed"
}

# Run database migration
run_migration() {
    print_status "Running database migration..."
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please create it from production.env.template"
        exit 1
    fi
    
    # Check if DATABASE_PROVIDER is set to pg
    if grep -q "DATABASE_PROVIDER=pg" .env; then
        node migrate-to-production.js
        print_success "Database migration completed"
    else
        print_warning "DATABASE_PROVIDER is not set to 'pg'. Skipping migration."
        print_warning "For production, you should use PostgreSQL instead of SQLite."
    fi
}

# Build mobile apps (if Capacitor is configured)
build_mobile_apps() {
    print_status "Building mobile apps..."
    
    if [ -d "android" ] && [ -d "ios" ]; then
        # Sync web assets to mobile platforms
        npx cap sync
        
        print_success "Mobile apps synced"
        print_warning "To build actual mobile apps, run:"
        print_warning "  npx cap build android  # for Android"
        print_warning "  npx cap build ios      # for iOS"
    else
        print_warning "Mobile app folders not found. Skipping mobile build."
    fi
}

# Test the application
test_application() {
    print_status "Testing application..."
    
    # Start server in background
    node server.js &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Test health endpoint
    if curl -f http://localhost:3002/api/health > /dev/null 2>&1; then
        print_success "Application is running and healthy"
    else
        print_error "Application health check failed"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
    # Stop test server
    kill $SERVER_PID 2>/dev/null || true
}

# Create production build
create_production_build() {
    print_status "Creating production build..."
    
    # Create www directory if it doesn't exist
    mkdir -p www
    
    # Copy production files
    cp -r *.html www/ 2>/dev/null || true
    cp -r *.js www/ 2>/dev/null || true
    cp -r *.css www/ 2>/dev/null || true
    
    # Update API URLs in production files
    if [ -f "www/paywall.html" ]; then
        sed -i.bak 's/api.ontop-app.com/your-actual-domain.com/g' www/paywall.html
        rm www/paywall.html.bak 2>/dev/null || true
    fi
    
    print_success "Production build created in www/ directory"
}

# Main deployment function
main() {
    echo ""
    print_status "Starting production deployment process..."
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "server.js" ]; then
        print_error "This doesn't appear to be the ON TOP project directory."
        print_error "Please run this script from the project root."
        exit 1
    fi
    
    # Run deployment steps
    check_dependencies
    install_dependencies
    run_migration
    create_production_build
    build_mobile_apps
    test_application
    
    echo ""
    print_success "🎉 Production deployment completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Update your domain in the production files"
    echo "2. Set up your production server (AWS, Google Cloud, etc.)"
    echo "3. Configure SSL certificates"
    echo "4. Set up monitoring and backups"
    echo "5. Deploy to your hosting platform"
    echo ""
    print_warning "Don't forget to:"
    echo "- Update API URLs in your code with your actual domain"
    echo "- Set up your production environment variables"
    echo "- Test the mobile app builds on real devices"
    echo "- Submit to app stores if deploying mobile apps"
    echo ""
}

# Run main function
main "$@"
