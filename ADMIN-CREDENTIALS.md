# Admin Credentials Setup

This guide explains how to set up admin credentials for the Donaro app.

## Security Best Practices

### Password Requirements
- Use a strong, unique password with at least 12 characters
- Include uppercase and lowercase letters, numbers, and special characters
- Never reuse passwords from other accounts
- Change passwords regularly

### Account Security
- Use a dedicated email address for admin access
- Monitor login activity regularly
- Restrict admin access to trusted individuals only

### Environment Variables
Store admin credentials securely in environment variables:

```env
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-super-secure-password
ADMIN_NAME=Admin User
ADMIN_PHONE=0000000000
```

### Setup Process
1. Configure the environment variables in your deployment platform
2. Restart the application to apply changes
3. Access the admin panel at `/admin`
4. Log in with your admin credentials

### Troubleshooting
If you're unable to access the admin panel:
1. Verify that ADMIN_EMAIL and ADMIN_PASSWORD are correctly set
2. Check that the admin user was created during the first application startup
3. Ensure the database is properly configured and accessible
4. Review application logs for authentication errors

### Password Recovery
There is no automated password recovery for admin accounts. If you lose access:
1. Access the database directly
2. Update the admin user's password hash manually
3. Or reset the admin credentials in environment variables and restart the app