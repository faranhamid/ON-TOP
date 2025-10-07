# 🚀 Quick Deploy to Vercel

## 1-Minute Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy your app
vercel --prod
```

## Essential Environment Variables

Set these in your Vercel dashboard after deployment:

```env
NODE_ENV=production
JWT_SECRET=<generate-with-openssl-rand-hex-64>
DATABASE_PROVIDER=pg
DB_HOST=<your-db-host>
DB_NAME=<your-db-name>
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>
DB_PORT=5432
DB_SSL=true
OPENAI_API_KEY=<your-openai-key>
```

## Test Your Deployment

```bash
# Test the deployment
node test-deployment.js https://your-app.vercel.app

# Check health endpoint
curl https://your-app.vercel.app/api/health
```

## Update Mobile App

Update your `capacitor.config.json`:

```json
{
  "server": {
    "url": "https://your-app.vercel.app"
  }
}
```

## Done! 🎉

Your ON TOP app is now live on Vercel.

Need help? See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions.
