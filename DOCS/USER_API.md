# GeekSuite User Authentication API

## Overview
The GeekSuite User Authentication API provides a centralized authentication system for all GeekSuite applications. It supports single sign-on (SSO) across multiple apps, secure token management, and user profile management.

## Base URL
```
/api/auth
```

## Authentication
All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Rate Limiting
- Login attempts are limited to 5 attempts per 15 minutes
- Rate limit exceeded response includes a `AUTH_RATE_LIMIT` error code

## API Endpoints

### Login
Authenticate a user and receive a JWT token.

```http
POST /api/auth/login
```

#### Request Body
```json
{
    "identifier": "string",  // username or email
    "password": "string",
    "app": "string"         // 'basegeek', 'notegeek', or 'bujogeek'
}
```

#### Response
```json
{
    "token": "string",
    "user": {
        "id": "string",
        "username": "string",
        "email": "string",
        "profile": {
            // User profile data
        }
    }
}
```

#### Error Responses
```json
{
    "message": "Invalid credentials",
    "code": "LOGIN_ERROR"
}
```
```json
{
    "message": "Too many login attempts, please try again later",
    "code": "AUTH_RATE_LIMIT"
}
```

### Validate Token
Validate a JWT token and get user information.

```http
POST /api/auth/validate
```

#### Request Body
```json
{
    "token": "string",
    "app": "string"  // 'basegeek', 'notegeek', or 'bujogeek'
}
```

#### Response
```json
{
    "valid": true,
    "user": {
        "id": "string",
        "username": "string",
        "email": "string",
        "profile": {
            // User profile data
        }
    }
}
```

#### Error Response
```json
{
    "message": "Invalid or expired token",
    "code": "TOKEN_VALIDATION_ERROR"
}
```

### Refresh Token
Get a new JWT token using an existing valid token.

```http
POST /api/auth/refresh
```

#### Request Body
```json
{
    "token": "string"
}
```

#### Response
```json
{
    "token": "string",
    "user": {
        "id": "string",
        "username": "string",
        "email": "string",
        "profile": {
            // User profile data
        }
    }
}
```

#### Error Response
```json
{
    "message": "Invalid or expired token",
    "code": "TOKEN_REFRESH_ERROR"
}
```

### Get User Profile
Get the current user's profile information.

```http
GET /api/auth/profile
```

#### Headers
```
Authorization: Bearer <token>
```

#### Response
```json
{
    "id": "string",
    "username": "string",
    "email": "string",
    "profile": {
        // User profile data
    }
}
```

#### Error Response
```json
{
    "message": "User not found",
    "code": "PROFILE_ERROR"
}
```

## Token Structure
JWT tokens contain the following claims:
```json
{
    "id": "string",      // User ID
    "email": "string",   // User email
    "username": "string",// Username
    "app": "string",     // App identifier
    "exp": number        // Expiration timestamp
}
```

## Error Codes
| Code | Description |
|------|-------------|
| `AUTH_RATE_LIMIT` | Too many login attempts |
| `LOGIN_ERROR` | Invalid credentials or login failure |
| `TOKEN_VALIDATION_ERROR` | Invalid or expired token |
| `TOKEN_REFRESH_ERROR` | Token refresh failed |
| `PROFILE_ERROR` | User profile not found |

## Security Considerations

### Token Security
- Tokens expire after 7 days
- Tokens are app-specific
- Tokens are validated against the user database
- Tokens are signed with a secure secret

### Password Security
- Passwords are hashed using bcrypt
- Password comparison is done securely
- Login attempts are rate-limited

### Cross-App Security
- Tokens are validated for specific apps
- App context is maintained in tokens
- Cross-app communication is secured

## Cross-App Communication
The system uses a message-based system for cross-app communication:

```javascript
// Auth state change event
{
    type: 'GEEK_AUTH_STATE_CHANGE',
    payload: {
        token: string,
        user: object,
        app: string
    }
}
```

## Usage Examples

### Login
```javascript
const response = await axios.post('/api/auth/login', {
    identifier: 'user@example.com',
    password: 'password123',
    app: 'basegeek'
});
```

### Validate Token
```javascript
const validation = await axios.post('/api/auth/validate', {
    token: 'jwt-token',
    app: 'basegeek'
});
```

### Refresh Token
```javascript
const refresh = await axios.post('/api/auth/refresh', {
    token: 'jwt-token'
});
```

### Get Profile
```javascript
const profile = await axios.get('/api/auth/profile', {
    headers: { Authorization: `Bearer ${token}` }
});
```

## Best Practices

1. **Token Management**
   - Store tokens securely
   - Refresh tokens before expiration
   - Clear tokens on logout

2. **Error Handling**
   - Handle all error responses
   - Implement proper error messages
   - Log authentication failures

3. **Security**
   - Use HTTPS for all requests
   - Implement proper CORS policies
   - Validate all input data

4. **Cross-App Integration**
   - Listen for auth state changes
   - Handle token synchronization
   - Implement proper error recovery

## Support
For issues or questions about the API, please contact the GeekSuite development team.