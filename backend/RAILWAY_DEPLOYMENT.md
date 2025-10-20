# Railway Deployment Guide

This guide explains how to deploy the Donaro app to Railway, a cloud platform that simplifies deployment and scaling.

## Prerequisites

Before deploying to Railway, ensure you have:

1. A Railway account (free tier available)
2. The Railway CLI installed (`npm install -g @railway/cli`)
3. Your app code ready for deployment

## Environment Variables

Railway automatically manages environment variables through the dashboard. You'll need to configure these variables in your Railway project settings:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| DATABASE_URL | PostgreSQL database connection string | postgresql://user:pass@host:port/db |
| JWT_SECRET | Secret key for JWT token generation | your-super-secret-jwt-key |
| EMAIL_SERVICE | Email service provider | gmail |
| EMAIL_USER | Email address for sending notifications | your-email@gmail.com |
| EMAIL_PASS | App password for email service | your-app-password |
| FROM_EMAIL | Sender email address | your-email@gmail.com |
| ADMIN_EMAIL | Admin user email | admin@yourdomain.com |
| ADMIN_PASSWORD | Admin user password | your-admin-password |
| ADMIN_NAME | Admin user name | Admin User |
| ADMIN_PHONE | Admin user phone | 0000000000 |

Your app uses email services for sending notifications. The email credentials are already configured in your environment variables.

## Deployment Steps

1. **Initialize Railway Project**
   ```bash
   railway login
   railway init
   ```

2. **Configure Environment Variables**
   Go to your Railway project dashboard and set all the required environment variables listed above.

3. **Deploy Backend**
   ```bash
   railway up
   ```

4. **Run Database Migrations**
   After the first deployment, you'll need to run database migrations:
   ```bash
   railway run npm run migrate:prod
   ```

5. **Create Admin User**
   Run the admin user creation script:
   ```bash
   railway run node configure-admin.js
   ```

## Database Setup

The app uses PostgreSQL as its database. Railway provides a free PostgreSQL database addon that you can provision directly from the dashboard.

## Monitoring and Logs

Railway provides built-in logging and monitoring. You can view application logs directly from the Railway dashboard or using the CLI:

```bash
railway logs
```

## Scaling

Railway automatically scales your application based on demand. You can also manually configure scaling options in the Railway dashboard.

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correctly configured
   - Check that the PostgreSQL addon is properly provisioned

2. **Email Delivery Issues**
   - Verify EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASS are correct
   - Check that you're using an app password for Gmail

3. **Admin Access Problems**
   - Ensure ADMIN_EMAIL and ADMIN_PASSWORD are set
   - Run the configure-admin.js script if the admin user wasn't created

### Getting Help

If you encounter issues not covered in this guide:
1. Check the Railway documentation
2. Review application logs
3. Contact Railway support for platform-specific issues
