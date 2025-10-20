# Railway Route Configuration Fix

This document explains the fix for the "Route not found" JSON response issue that was occurring when accessing the deployed application on Railway.

## Problem

After deployment to Railway, accessing the root URL or other routes would return a JSON response:
```json
{
  "error": "Route not found"
}
```

Instead of serving the admin panel or other static files.

## Root Cause

The issue was caused by the 404 handler in the Express application catching all requests, including those that should be handled by Railway's static file serving system. In Railway's environment, unmatched routes should be handled by the platform, not by the Express application.

## Solution

### 1. Conditional 404 Handler

Modified the server.js file to only use the 404 handler in non-Railway environments:

```javascript
// Only use the 404 handler for non-Railway environments
// In Railway, unmatched routes should be handled by the platform
if (!isRailway) {
  // 404 handler (must be last)
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}
```

### 2. Railway Configuration

Ensured the railway.toml file has the correct routing configuration:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node src/server.js"
```

The static files are properly served from the `public` directory in Railway deployments.

## How It Works

1. **API Routes**: Requests to `/api/*` are handled by the Express application
2. **Static Files**: Requests for static files are handled by Railway's filesystem
3. **Admin Panel**: Requests to `/admin` and `/admin/*` are redirected to static files
4. **Other Routes**: All other requests are handled by the Express application

## Verification

After deployment, the following should work correctly:
- `/` (root) - Should show the admin panel
- `/admin` - Should show the admin panel
- `/admin/donation-details.html` - Should show the donation details page
- `/api/health` - Should return the health check JSON
- Other API routes should work as expected

## Additional Notes

- The fix maintains backward compatibility with local development
- Socket.IO is still disabled in Railway environments as expected
- Static files are properly served from the `public` directory