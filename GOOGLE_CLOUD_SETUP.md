# Google Cloud Setup Guide for ON TOP App

## Overview
This guide will help you set up Google Cloud services for your ON TOP productivity app, including database storage, file storage, and secure authentication.

## Architecture
- **Google Cloud SQL (PostgreSQL)**: User data, tasks, fitness, finances, Emma sessions
- **Google Cloud Storage**: File uploads, backups, exports
- **Google Cloud Run**: Deploy your Node.js backend (optional)

## Step 1: Google Cloud Project Setup

### 1.1 Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project"
3. Name: `ontop-productivity-app`
4. Click "Create"

### 1.2 Enable Billing
1. Go to Billing → Link a billing account
2. Set up payment method

### 1.3 Enable Required APIs
```bash
# Run these commands in Cloud Shell or local gcloud CLI
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable run.googleapis.com
```

## Step 2: Database Setup (Google Cloud SQL)

### 2.1 Create PostgreSQL Instance
```bash
gcloud sql instances create ontop-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --root-password=YOUR_SECURE_PASSWORD \
    --storage-size=20GB \
    --storage-type=SSD
```

### 2.2 Create Database
```bash
gcloud sql databases create ontop_production --instance=ontop-db
```

### 2.3 Create Database User
```bash
gcloud sql users create ontop_user \
    --instance=ontop-db \
    --password=YOUR_USER_PASSWORD
```

## Step 3: Storage Setup (Google Cloud Storage)

### 3.1 Create Storage Buckets
```bash
# User uploads (profile pictures, exports)
gsutil mb -p ontop-productivity-app -l us-central1 gs://ontop-user-uploads

# App backups
gsutil mb -p ontop-productivity-app -l us-central1 gs://ontop-backups
```

### 3.2 Set Bucket Permissions
```bash
# Make user uploads private
gsutil iam ch allUsers:objectViewer gs://ontop-user-uploads
```

## Step 4: Service Account Setup

### 4.1 Create Service Account
```bash
gcloud iam service-accounts create ontop-backend \
    --display-name="ON TOP Backend Service" \
    --description="Service account for ON TOP app backend"
```

### 4.2 Grant Permissions
```bash
# Database access
gcloud projects add-iam-policy-binding ontop-productivity-app \
    --member="serviceAccount:ontop-backend@ontop-productivity-app.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

# Storage access
gcloud projects add-iam-policy-binding ontop-productivity-app \
    --member="serviceAccount:ontop-backend@ontop-productivity-app.iam.gserviceaccount.com" \
    --role="roles/storage.admin"
```

### 4.3 Create Service Account Key
```bash
gcloud iam service-accounts keys create ./google-cloud-key.json \
    --iam-account=ontop-backend@ontop-productivity-app.iam.gserviceaccount.com
```

## Step 5: Environment Configuration

Create a `.env.production` file with these variables:

```env
# Database
DB_HOST=/cloudsql/ontop-productivity-app:us-central1:ontop-db
DB_NAME=ontop_production
DB_USER=ontop_user
DB_PASSWORD=YOUR_USER_PASSWORD

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=ontop-productivity-app
GOOGLE_CLOUD_KEY_FILE=./google-cloud-key.json
STORAGE_BUCKET_UPLOADS=ontop-user-uploads
STORAGE_BUCKET_BACKUPS=ontop-backups

# OpenAI (keep existing)
OPENAI_API_KEY=your-existing-key

# Security
JWT_SECRET=your-super-secure-jwt-secret
NODE_ENV=production
```

## Step 6: Code Integration

The next steps involve updating your Node.js backend to use these cloud services. This includes:

1. Replacing SQLite with PostgreSQL
2. Adding Google Cloud Storage integration
3. Implementing secure file uploads
4. Adding backup functionality

## Estimated Costs (Monthly)

- **Cloud SQL (f1-micro)**: ~$7-10/month
- **Cloud Storage**: ~$0.50-2/month (depending on usage)
- **Data Transfer**: Minimal for small apps
- **Total**: ~$8-15/month

## Security Best Practices

1. Never commit service account keys to version control
2. Use environment variables for all secrets
3. Enable VPC for database security
4. Set up proper IAM roles with minimal permissions
5. Enable audit logging

## Next Steps

Run the setup commands above, then I'll help you:
1. Update your database schema for PostgreSQL
2. Integrate Google Cloud Storage
3. Add file upload capabilities
4. Set up automated backups
5. Deploy to Google Cloud Run (optional)
