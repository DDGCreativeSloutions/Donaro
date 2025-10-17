# Donaro Backend for Vercel Deployment

This backend is configured to work with Vercel's serverless environment.

## Deployment Instructions

1. Ensure you have set up a PostgreSQL database and have the connection string
2. Set the required environment variables in your Vercel project:
   - DATABASE_URL (PostgreSQL connection string)
   - JWT_SECRET (for JWT token signing)
   - EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS (for sending OTP emails)
   - ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE (for admin user)

3. Deploy to Vercel:
   ```bash
   # Using Vercel CLI
   cd backend
   vercel
   
   # Or use Git integration with Vercel
   ```

4. After deployment, run production database migrations:
   ```bash
   vercel env pull
   npm run migrate:prod
   ```

## Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| JWT_SECRET | Secret for JWT token signing | your-super-secret-jwt-key |
| EMAIL_SERVICE | Email service provider | gmail |
| EMAIL_USER | Email address for sending OTPs | your-email@gmail.com |
| EMAIL_PASS | App password for email service | your-app-password |
| ADMIN_EMAIL | Admin user email | admin@donaro.com |
| ADMIN_PASSWORD | Admin user password | your-admin-password |
| ADMIN_NAME | Admin user name | Admin User |
| ADMIN_PHONE | Admin user phone | 0000000000 |

## Real-time Updates

### Local Development
- Socket.IO is enabled for real-time updates
- Users receive instant notifications for:
  - Donation status changes
  - Withdrawal status updates
  - New donations/withdrawals (admin)

### Vercel Deployment
- **Socket.IO is disabled** as serverless functions don't support long-running connections
- **Real-time updates will not work** in the deployed application
- **Workaround**: Implement polling in frontend applications (refresh every 30 seconds)

## Notes

- File uploads are handled through the /api/upload endpoint
- The admin panel is accessible at /admin