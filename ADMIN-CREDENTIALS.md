# Donaro Admin Panel Access

This document contains the credentials and instructions for accessing the Donaro admin panel.

## Admin Credentials

**Email**: `admin@donaro.com`
**Password**: `Admin@123`

## Access Instructions

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/admin
   ```

3. Use the credentials above to log in to the admin panel.

## Admin Panel Features

Once logged in, you'll have access to:

- **Dashboard**: Overview of system statistics
- **Donation Management**: Review and approve/reject pending donations
- **Withdrawal Processing**: Handle user withdrawal requests
- **User Management**: View and manage all registered users
- **Reports**: Access system analytics and reports
- **Settings**: Configure system parameters

## Security Notes

- These credentials are for development purposes only
- In a production environment, you should:
  - Change the default password immediately
  - Use a strong, unique password
  - Enable two-factor authentication if available
  - Restrict access to authorized personnel only

## Troubleshooting

If you're unable to log in:

1. Ensure the backend server is running
2. Verify the database contains the admin user
3. Check that the email and password match exactly
4. If issues persist, you can recreate the admin user using the `configure-admin.js` script in the backend directory

## Support

For additional help with admin access, contact the development team.