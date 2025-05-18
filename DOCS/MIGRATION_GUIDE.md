# GeekSuite Authentication Migration Guide (2024 Edition)

## Overview
This guide provides a **battle-tested, step-by-step process** for migrating any GeekSuite app to use BaseGeek's centralized authentication (SSO) system. It includes explicit instructions for Docker, environment variables, SSO callback handling, token management, and troubleshooting. **Follow this to avoid common pitfalls!**

## Prerequisites

### 1. BaseGeek Packages
```bash
npm install @basegeek/ui @basegeek/api zustand axios
```

### 2. Environment Variables (Critical!)

#### A. Required Variables
Set these in your backend API environment (BaseGeek):
```env
JWT_SECRET=your-very-strong-access-secret
JWT_REFRESH_SECRET=your-very-strong-refresh-secret
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
AUTH_RATE_LIMIT=5
AUTH_RATE_WINDOW=900000
```
- **JWT_SECRET**: For access tokens (short-lived)
- **JWT_REFRESH_SECRET**: For refresh tokens (long-lived, must be different from JWT_SECRET)

#### B. Docker Compose Setup
In your `docker-compose.yml` (for the API service):
```yaml
services:
  basegeek_app:
    build: .
    container_name: basegeek_app
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
      - PORT=8987
      - JWT_SECRET=your-very-strong-access-secret
      - JWT_REFRESH_SECRET=your-very-strong-refresh-secret
    # ...
```
- **Tip:** Setting secrets directly in `environment:` ensures they are always available, regardless of `.env` file issues.
- **Verify:** After starting, run:
  ```sh
  docker compose exec basegeek_app printenv | grep JWT_REFRESH_SECRET
  ```
  You should see your secret printed.

#### C. .env File Location
- Place `.env.production` in the same directory as `docker-compose.yml` if you use `env_file:`.
- **Restart containers** after any change: `docker compose down -v && docker compose up -d`

## Migration Steps

### 1. Frontend Migration

#### A. Update Dependencies
```json
{
  "dependencies": {
    "@basegeek/ui": "latest",
    "@basegeek/api": "latest",
    "zustand": "^4.0.0",
    "axios": "^1.0.0"
  }
}
```

#### B. Shared Auth Store
- Use BaseGeek's shared auth store for all token management.
- **Store both `token` and `refreshToken`** after login/callback.

#### C. SSO Redirect & Callback Handling
- When redirecting from the SSO provider (BaseGeek) to your app, **always include both `token` and `refreshToken` in the callback URL**:
  ```js
  url.searchParams.set('token', result.token);
  url.searchParams.set('refreshToken', result.refreshToken);
  if (state) url.searchParams.set('state', state);
  ```
- In your callback handler, **store both tokens in the auth store**:
  ```js
  useSharedAuthStore.setState({
    token,
    refreshToken,
    lastActivity: Date.now()
  });
  ```
- **Validate the `state` parameter** to prevent CSRF.

#### D. API Interceptor for Token Refresh
- On 401, send `{ refreshToken }` to `/api/auth/refresh`:
  ```js
  const response = await axios.post(
    `${BASE_GEEK_URL}/api/auth/refresh`,
    { refreshToken },
    { withCredentials: true }
  );
  ```
- Update both tokens in the store on success.

### 2. Backend Migration

#### A. Environment Variables
- See above. **Do not skip!**

#### B. Refresh Endpoint
- The refresh endpoint must accept `{ refreshToken }` in the body and verify it using `process.env.JWT_REFRESH_SECRET`.
- If you see `JsonWebTokenError: secret or public key must be provided`, your secret is not set in the container.

#### C. Token Generation
- Use different secrets for access and refresh tokens.
- Always return both tokens on login/refresh.

### 3. Debugging & Troubleshooting

#### A. Docker Environment Issues
- Use `printenv` inside the container to verify secrets are loaded.
- If a secret is missing, check your `docker-compose.yml` and `.env` file locations.
- Always restart containers after changes.

#### B. SSO Callback Issues
- If you get a CSRF/state error, check that the `state` is set before redirect and validated on callback.
- If the callback URL is missing `refreshToken`, update the SSO provider's redirect logic.

#### C. Token Refresh Issues
- If refresh fails with 400/401, check:
  - Is `refreshToken` present in the request payload?
  - Is the backend secret set and correct?
  - Is the refresh token expired or malformed?
- Use browser console logs to debug what is being sent.

#### D. Common Error Messages
- `JsonWebTokenError: secret or public key must be provided`: Secret missing in backend container.
- `401 Unauthorized` on refresh: Usually a bad or expired refresh token, or missing secret.

### 4. Migration & Testing Checklist

- [ ] Set `JWT_SECRET` and `JWT_REFRESH_SECRET` in backend environment and verify with `printenv`.
- [ ] Restart backend containers after any env change.
- [ ] Ensure SSO callback URL includes both `token` and `refreshToken`.
- [ ] Store both tokens in the frontend auth store.
- [ ] On 401, send `{ refreshToken }` to `/api/auth/refresh`.
- [ ] Update both tokens in the store after refresh.
- [ ] Validate `state` parameter for CSRF protection.
- [ ] Test login, token refresh, and protected routes.
- [ ] Check browser and backend logs for errors.

## Best Practices

- Use different secrets for access and refresh tokens.
- Never commit secrets to version control.
- Always validate the `state` parameter in SSO flows.
- Use HTTPS in production.
- Regularly rotate secrets and monitor logs.

## Example Implementations

- See `NoteGeek` and `BaseGeek` for reference SSO integration.
- Use this guide as a checklist for every new GeekSuite app.

## Support
- For issues, check the BaseGeek documentation, open an issue, or contact the GeekSuite team.

## Additional Resources

1. **Documentation**
   - BaseGeek Auth System
   - API Reference
   - Security Guidelines

2. **Tools**
   - JWT Debugger
   - API Testing Tools
   - Security Scanners

3. **Support**
   - GeekSuite Team
   - BaseGeek Repository
   - Community Forums