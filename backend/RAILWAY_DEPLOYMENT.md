# 🚂 Railway Deployment Guide for Donaro Backend

This guide explains how to deploy the Donaro backend to Railway.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Git Repository**: Push your code to GitHub/GitLab
3. **PostgreSQL Database**: Railway will provide this automatically

## 🚀 Deployment Steps

### 1. Connect Repository to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your Donaro backend repository
5. Railway will automatically detect it's a Node.js project

### 2. Configure Environment Variables

In your Railway project dashboard, go to **Variables** and add:

#### Required Variables:
```bash
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
EMAILJS_SERVICE_ID=service_0zt6x89
EMAILJS_TEMPLATE_ID=template_oe1jicm
EMAILJS_PUBLIC_KEY=bpWDQy63wlpfsWHk7
EMAIL_USER=ayhdiv377@gmail.com
```

#### Database Configuration:
**Option A: Prisma Accelerate (Recommended)**
```bash
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=your-prisma-api-key
```

**Option B: Direct PostgreSQL (Railway)**
```bash
DATABASE_URL=postgresql://... (provided by Railway PostgreSQL)
DIRECT_URL=postgresql://... (same as DATABASE_URL for direct connections)
```

#### Optional Variables:
```bash
EMAILJS_SERVICE_ID=your-emailjs-service-id
EMAILJS_TEMPLATE_ID=your-emailjs-template-id
EMAILJS_PUBLIC_KEY=your-emailjs-public-key
CORS_ORIGIN=https://your-production-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. EmailJS Configuration

Your app uses EmailJS for sending emails (OTP, notifications, etc.). The EmailJS credentials are already configured in your environment variables.

**EmailJS Configuration:**
- **Service ID**: `service_0zt6x89`
- **Template ID**: `template_oe1jicm`
- **Public Key**: `bpWDQy63wlpfsWHk7`
- **Verified Sender**: `ayhdiv377@gmail.com`

### 4. Database Setup

Railway will automatically work with your Prisma Accelerate database. No additional database provisioning needed.

### 4. Deploy

1. Push your code to trigger automatic deployment
2. Railway will:
   - Install dependencies
   - Generate Prisma client
   - Run database migrations
   - Start the server

## 🔧 Configuration Files

### `railway.toml`
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run build && npm start"
healthcheckPath = "/api/health"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### `backend/.env.production`
Contains production environment variables template.

## 🏥 Health Check

Your deployed app will have a health check endpoint:
```
https://your-app.railway.app/api/health
```

## 📊 Monitoring

Railway provides built-in monitoring:
- **Logs**: View real-time application logs
- **Metrics**: CPU, memory, and network usage
- **Deployments**: Track deployment history

## 🔒 Security Checklist

- [ ] Change `JWT_SECRET` to a secure random string (minimum 32 characters)
- [ ] Verify EmailJS credentials are correct and service is active
- [ ] Configure CORS origins for your domain
- [ ] Set up database backups in Railway
- [ ] Enable Railway's built-in security features
- [ ] Verify your Gmail account is verified as sender in EmailJS

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check if `DATABASE_URL` is set in Railway variables
   - Ensure PostgreSQL database is provisioned

2. **Build Failed**
   - Check build logs in Railway dashboard
   - Ensure all dependencies are in `package.json`

3. **Migration Failed**
   - Check if Prisma schema is valid
   - Ensure database is accessible

4. **CORS Errors**
   - Update `CORS_ORIGIN` in environment variables
   - Check if your domain is allowed in server configuration

### Getting Help

- Check Railway [documentation](https://docs.railway.app)
- View logs in Railway dashboard
- Check the health endpoint: `/api/health`

## 📝 Post-Deployment Steps

1. **Test the API**: Verify all endpoints work correctly
2. **Update Frontend**: Point your frontend to the new production API URL
3. **Set Up Domain**: Add custom domain in Railway if needed
4. **Monitor Performance**: Set up alerts for downtime or errors
5. **Backup Strategy**: Configure automated backups

## 🔄 Updates

To deploy updates:

1. Push changes to your Git repository
2. Railway will automatically redeploy
3. Monitor the deployment in Railway dashboard
4. Check health endpoint after deployment

## 💰 Cost Optimization

Railway offers a generous free tier. To optimize costs:

- Use the free PostgreSQL database
- Monitor resource usage in dashboard
- Set up auto-sleep for development environments
- Use Railway's built-in optimizations

---

🎉 **Congratulations!** Your Donaro backend is now deployed on Railway! 🚂