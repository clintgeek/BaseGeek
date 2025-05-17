# GeekSuite Authentication Migration Guide

## Overview
This guide provides step-by-step instructions for migrating GeekSuite applications to use BaseGeek's centralized authentication system. The migration process ensures secure, maintainable, and consistent authentication across all GeekSuite applications.

## Prerequisites

1. **BaseGeek Packages**
   ```bash
   # Install required packages
   npm install @basegeek/ui @basegeek/api
   ```

2. **Environment Setup**
   ```env
   # Required environment variables
   JWT_SECRET=your-secure-secret-key
   JWT_REFRESH_SECRET=your-secure-refresh-secret-key
   JWT_EXPIRES_IN=1h
   REFRESH_TOKEN_EXPIRES_IN=7d
   AUTH_RATE_LIMIT=5
   AUTH_RATE_WINDOW=900000
   ```

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

#### B. Replace Auth Store
1. Remove existing auth store
2. Import BaseGeek's shared auth store:
```javascript
import useSharedAuthStore from '@basegeek/ui/store/sharedAuthStore';
```

#### C. Update Components
1. **Login Component**
```javascript
import { useSharedAuthStore } from '@basegeek/ui/store/sharedAuthStore';

const LoginPage = () => {
  const { login, error, isLoading } = useSharedAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(identifier, password, 'your-app-name');
  };
  // ... rest of the component
};
```

2. **Protected Routes**
```javascript
import { ProtectedRoute } from '@basegeek/ui/components';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
```

3. **Auth Callback**
```javascript
import { AuthCallback } from '@basegeek/ui/components';

const App = () => {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
};
```

### 2. Backend Migration

#### A. Update Dependencies
```json
{
  "dependencies": {
    "@basegeek/api": "latest",
    "express": "^4.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3"
  }
}
```

#### B. Configure Auth Middleware
```javascript
import { authenticateToken } from '@basegeek/api/middleware/auth';

// Apply to protected routes
router.use('/api/protected', authenticateToken);
```

#### C. Update API Client
```javascript
import { createApiClient } from '@basegeek/api/client';

const api = createApiClient({
  baseURL: process.env.API_URL,
  app: 'your-app-name'
});
```

### 3. Security Updates

#### A. CORS Configuration
```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
```

#### B. CSRF Protection
```javascript
import { csrfProtection } from '@basegeek/api/middleware/security';

app.use(csrfProtection);
```

#### C. Rate Limiting
```javascript
import { rateLimiter } from '@basegeek/api/middleware/security';

app.use('/api/auth', rateLimiter);
```

### 4. Testing

#### A. Unit Tests
```javascript
import { useSharedAuthStore } from '@basegeek/ui/store/sharedAuthStore';

describe('Auth Store', () => {
  it('should handle login', async () => {
    const { login } = useSharedAuthStore();
    const result = await login('test@example.com', 'password', 'your-app');
    expect(result.token).toBeDefined();
  });
});
```

#### B. Integration Tests
```javascript
describe('Auth Flow', () => {
  it('should complete login flow', async () => {
    // Test login
    const loginResponse = await api.post('/auth/login', {
      identifier: 'test@example.com',
      password: 'password',
      app: 'your-app'
    });
    expect(loginResponse.status).toBe(200);

    // Test token refresh
    const refreshResponse = await api.post('/auth/refresh', {
      refreshToken: loginResponse.data.refreshToken,
      app: 'your-app'
    });
    expect(refreshResponse.status).toBe(200);
  });
});
```

## Post-Migration Checklist

1. **Security**
   - [ ] Verify JWT secrets are properly set
   - [ ] Confirm CORS is correctly configured
   - [ ] Test CSRF protection
   - [ ] Verify rate limiting

2. **Functionality**
   - [ ] Test login flow
   - [ ] Verify token refresh
   - [ ] Check protected routes
   - [ ] Test error handling

3. **Integration**
   - [ ] Verify cross-app authentication
   - [ ] Test shared user sessions
   - [ ] Check token validation
   - [ ] Verify user profile access

4. **Performance**
   - [ ] Monitor token validation speed
   - [ ] Check refresh token performance
   - [ ] Verify state management
   - [ ] Test concurrent requests

## Troubleshooting

### Common Issues

1. **Token Validation Fails**
   - Check JWT secrets match
   - Verify token format
   - Confirm expiration times

2. **CORS Errors**
   - Verify allowed origins
   - Check credentials setting
   - Confirm preflight requests

3. **State Management Issues**
   - Check store initialization
   - Verify persistence
   - Test cross-tab communication

### Support

For issues and support:
1. Check the BaseGeek documentation
2. Open an issue in the BaseGeek repository
3. Contact the GeekSuite team

## Best Practices

1. **Security**
   - Use HTTPS in production
   - Implement proper error handling
   - Follow OWASP guidelines
   - Regular security audits

2. **Performance**
   - Implement caching
   - Optimize token validation
   - Monitor resource usage
   - Regular performance testing

3. **Maintenance**
   - Keep dependencies updated
   - Regular security patches
   - Monitor error logs
   - Regular backups

## Example Implementations

### NoteGeek
- Uses shared auth store
- Implements refresh tokens
- Handles cross-app auth
- Secure token storage

### BuJoGeek
- Custom UI components
- Shared auth logic
- Secure API integration
- Error handling

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