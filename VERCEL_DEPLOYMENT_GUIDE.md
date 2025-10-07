# 🚀 Vercel Deployment Guide for ON TOP App

This guide will walk you through deploying your ON TOP mobile app backend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Database**: Set up a PostgreSQL database (recommended: Supabase)
3. **OpenAI API Key**: For Emma AI therapy features
4. **Apple Developer Account**: For iOS in-app purchases (optional)

## Quick Deployment

### Option 1: Automated Script
```bash
./deploy-vercel.sh
```

### Option 2: Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

## Environment Variables Setup

After deployment, set these environment variables in your Vercel dashboard:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `JWT_SECRET` | JWT signing key | Generate with: `openssl rand -hex 64` |
| `DATABASE_PROVIDER` | Database type | `pg` |
| `DB_HOST` | Database host | `your-project.supabase.co` |
| `DB_NAME` | Database name | `postgres` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | Your secure password |
| `DB_PORT` | Database port | `5432` |
| `DB_SSL` | Use SSL | `true` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_MODEL` | AI model | `gpt-4o-mini` |
| `APPLE_SHARED_SECRET` | iOS IAP secret | Your Apple secret |
| `APPLE_VERIFY_ENV` | Apple env | `production` |
| `SUPABASE_URL` | Supabase URL | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase key | Your service role key |

## Database Setup

### Using Supabase (Recommended)

1. **Create Project**: Go to [supabase.com](https://supabase.com)
2. **Get Connection Details**: 
   - Host: `your-project.supabase.co`
   - Database: `postgres`
   - User: `postgres`
   - Password: Your project password
   - Port: `5432`

3. **Run Migrations**: Your app will auto-create tables on first run

### Using Other PostgreSQL Providers

- **Railway**: [railway.app](https://railway.app)
- **Neon**: [neon.tech](https://neon.tech)
- **PlanetScale**: [planetscale.com](https://planetscale.com)

## Mobile App Configuration

After deployment, update your mobile app's API endpoint:

### iOS (capacitor.config.json)
```json
{
  "server": {
    "url": "https://your-app-name.vercel.app",
    "cleartext": false
  }
}
```

### Android (capacitor.config.json)
```json
{
  "server": {
    "url": "https://your-app-name.vercel.app",
    "cleartext": false
  }
}
```

## Testing Your Deployment

1. **Health Check**: Visit `https://your-app.vercel.app/api/health`
2. **Web Interface**: Visit `https://your-app.vercel.app`
3. **API Endpoints**: Test with your mobile app

## Common Issues & Solutions

### CORS Errors
- Your Vercel URL is automatically whitelisted
- For custom domains, update `prodAllowedOrigins` in `server.js`

### Database Connection Issues
- Ensure all DB environment variables are set
- Check if your database allows external connections
- Verify SSL settings

### Function Timeouts
- Vercel functions timeout after 10s on Hobby plan
- Upgrade to Pro for 60s timeout
- Consider breaking down large operations

### Cold Starts
- First request may be slow (cold start)
- Consider implementing keep-alive pings
- Use Vercel's Edge Functions for faster response

## Security Checklist

- [ ] Strong JWT secret (64+ characters)
- [ ] Database password is secure
- [ ] API keys are set as environment variables
- [ ] HTTPS only in production
- [ ] Rate limiting enabled
- [ ] CORS properly configured

## Monitoring & Maintenance

### Vercel Dashboard
- Monitor function invocations
- Check error logs
- Review performance metrics

### Database Monitoring
- Set up connection pooling
- Monitor query performance
- Regular backups

### Error Tracking
- Consider adding Sentry for error tracking
- Monitor API response times
- Set up uptime monitoring

## Scaling Considerations

### Free Tier Limits
- 100GB bandwidth/month
- 100 serverless function executions/day
- 10s function timeout

### Pro Tier Benefits
- Unlimited bandwidth
- Unlimited function executions
- 60s function timeout
- Custom domains

## Support

If you encounter issues:

1. Check Vercel function logs
2. Verify environment variables
3. Test database connection
4. Review CORS configuration
5. Check mobile app API endpoints

## Next Steps

After successful deployment:

1. **Update Mobile Apps**: Point to new API endpoint
2. **Test All Features**: Ensure everything works in production
3. **Set Up Monitoring**: Track performance and errors
4. **Configure Backups**: Regular database backups
5. **Custom Domain**: Add your own domain (optional)

---

🎉 **Congratulations!** Your ON TOP app is now live on Vercel!
