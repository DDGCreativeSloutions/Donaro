# Email Service Configuration

This document explains how to configure email services for the Donaro App OTP verification system.

## Overview

The app uses Nodemailer to send OTP emails. You can configure various email services including Gmail, SendGrid, and others.

## Environment Variables

Update the `.env` file in the backend directory with your email service credentials:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Gmail Configuration

### Steps to Configure Gmail

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to your Google Account settings
   - Navigate to Security > 2-Step Verification > App passwords
   - Generate a new app password for "Mail"
   - Use this password in the `EMAIL_PASS` variable

### Example Configuration

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_generated_app_password
```

## SendGrid Configuration

### Steps to Configure SendGrid

1. Create a SendGrid account at https://sendgrid.com/
2. Create an API key with full access to email sending
3. Verify your sender identity (email address or domain)

### Example Configuration

```env
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
```

And update the transporter configuration in `src/routes/otp.js`:

```javascript
if (process.env.EMAIL_SERVICE === 'sendgrid') {
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}
```

## Other Email Services

Nodemailer supports many other email services. Refer to the [Nodemailer documentation](https://nodemailer.com/smtp/well-known/) for specific configurations.

## Testing Email Configuration

To test your email configuration:

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Send a test request to generate an OTP:
   ```bash
   curl -X POST http://localhost:3000/api/otp/generate \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

3. Check your email inbox for the OTP message

## Security Best Practices

1. **Never commit credentials to version control**
   - Keep `.env` in `.gitignore`
   - Use environment variables in production

2. **Use App Passwords**
   - For Gmail, always use App Passwords instead of your regular password
   - This provides better security and access control

3. **Limit API Key Permissions**
   - Only grant necessary permissions to your email service API keys
   - Regularly rotate API keys

4. **Monitor Email Usage**
   - Set up alerts for unusual email sending patterns
   - Monitor email delivery rates and failures

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check that your credentials are correct
   - Verify that App Passwords are being used for Gmail
   - Ensure 2FA is enabled if required

2. **Email Not Received**
   - Check spam/junk folders
   - Verify sender email address is correct
   - Confirm email service configuration

3. **Rate Limiting**
   - Check your email service's sending limits
   - Implement proper rate limiting in the application

### Debugging Tips

1. Enable debug logging in Nodemailer by setting:
   ```javascript
   transporter = nodemailer.createTransport({
     // ... your config
     logger: true,
     debug: true
   });
   ```

2. Check the backend console for error messages
3. Verify network connectivity to the email service

## Production Deployment

For production deployment:

1. Set environment variables in your hosting platform:
   - Heroku: Config Vars
   - AWS: Environment Variables in Elastic Beanstalk
   - Docker: Environment file or runtime variables

2. Use a dedicated email service (SendGrid, Mailgun, etc.) for better deliverability
3. Implement proper error handling and retry mechanisms
4. Monitor email delivery metrics