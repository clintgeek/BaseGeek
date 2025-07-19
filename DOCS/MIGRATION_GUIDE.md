# GeekSuite SSO Migration Guide (2024, Proven Edition)

## Overview
This guide is the **definitive, real-world checklist** for migrating any GeekSuite app to use BaseGeek SSO. It is based on the working NoteGeek integration and eliminates all unnecessary steps. **Follow this for a smooth, secure SSO experience.**

---

## 1. Prerequisites

### A. Dependencies (Frontend)
```bash
# Core dependencies
npm install zustand axios react-router-dom

# Optional: If using shared UI package
npm install @basegeek/ui
```

### B. Dependencies (Backend)
```bash
# Core dependencies
npm install jsonwebtoken cors dotenv

# Optional: For enhanced security
npm install express-rate-limit helmet
```

### C. Environment Variables (Backend)
Set these in your backend API environment (BaseGeek):
```env
# Required
JWT_SECRET=your-very-strong-access-secret
JWT_REFRESH_SECRET=your-very-strong-refresh-secret
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Optional: For enhanced security
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### D. Environment Variables (Frontend)
```env
# Required
VITE_API_URL=http://localhost:5001/api
VITE_BASEGEEK_URL=https://basegeek.clintgeek.com
VITE_APP_NAME=yourappname  # Used in JWT app verification
```

---

## 2. Frontend Migration (Client App)

### A. Remove Local User DB
- **Do NOT** create or sync a user database in the client app
- All user info comes from the SSO token
- Remove any existing user registration/login forms
- Remove any user-related database models

### B. Auth Store Setup
Create `src/store/authStore.js`:
```js
import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,

  setAuth: ({ token, refreshToken }) => {
    set({
      token,
      refreshToken,
      isAuthenticated: !!token,
      user: decodeJwt(token)
    });
  },

  logout: () => {
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false
    });
    // Optional: Call BaseGeek logout
    window.location.href = `${import.meta.env.VITE_BASEGEEK_URL}/logout`;
  }
}));

function decodeJwt(token) {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default useAuthStore;
```

### C. SSO Login Flow
1. **Create Login Component** (`src/components/Login.jsx`):
```jsx
import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

export default function Login() {
  const setAuth = useAuthStore(state => state.setAuth);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const state = params.get('state');

    // Verify state parameter (CSRF protection)
    if (state !== localStorage.getItem('sso_state')) {
      console.error('Invalid state parameter');
      return;
    }

    if (token && refreshToken) {
      setAuth({ token, refreshToken });
      // Redirect to app home
      window.location.href = '/';
    } else {
      // Redirect to BaseGeek login
      const state = Math.random().toString(36).substring(7);
      localStorage.setItem('sso_state', state);
      window.location.href = `${import.meta.env.VITE_BASEGEEK_URL}/login?redirectTo=${encodeURIComponent(window.location.href)}&state=${state}`;
    }
  }, [setAuth]);

  return <div>Logging in...</div>;
}
```

2. **Add Protected Route Component** (`src/components/ProtectedRoute.jsx`):
```jsx
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
}
```

### D. API Client Setup
Create `src/services/api.js`:
```js
import axios from 'axios';
import useAuthStore from '../store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(
          `${import.meta.env.VITE_BASEGEEK_URL}/api/auth/refresh`,
          { refreshToken }
        );

        useAuthStore.getState().setAuth({
          token: data.token,
          refreshToken: data.refreshToken
        });

        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 3. Backend Migration (API)

### A. Remove User DB (Client App)
- **Do NOT** require a user DB in the client app
- All user info is in the JWT
- Remove any user-related database models
- Remove any user registration/login endpoints

### B. Auth Middleware
Create `src/middleware/auth.js`:
```js
import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify app name matches
    if (decoded.app !== process.env.APP_NAME) {
      return res.status(401).json({ message: 'Invalid app' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

### C. Resource Ownership
Example of using `req.user.id` for resource queries:
```js
// Example: Get user's notes
router.get('/notes', protect, async (req, res) => {
  const notes = await Note.find({ userId: req.user.id });
  res.json(notes);
});

// Example: Create note
router.post('/notes', protect, async (req, res) => {
  const note = await Note.create({
    ...req.body,
    userId: req.user.id
  });
  res.json(note);
});
```

### D. Token Refresh Endpoint
Create `src/routes/auth.js`:
```js
import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Create new tokens
    const token = jwt.sign(
      { id: decoded.id, email: decoded.email, app: process.env.APP_NAME },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const newRefreshToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    );

    res.json({ token, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

export default router;
```

---

## 4. What NOT To Do
- **Do NOT** create or sync a user DB in the client app
- **Do NOT** try to "register" users in the client app
- **Do NOT** store user passwords in the client app
- **Do NOT** use the refresh token as an access token
- **Do NOT** skip CSRF/state validation in the SSO callback
- **Do NOT** store sensitive user data in the client app
- **Do NOT** implement your own token refresh logic
- **Do NOT** modify the JWT payload structure

---

## 5. Testing Checklist
- [ ] Set all required environment variables
- [ ] Restart backend after env changes
- [ ] Test SSO login flow:
  - [ ] Redirect to BaseGeek
  - [ ] Successful callback
  - [ ] Token storage
  - [ ] User info decoding
- [ ] Test token refresh:
  - [ ] Automatic refresh on 401
  - [ ] New token storage
  - [ ] Request retry
- [ ] Test protected routes:
  - [ ] Access with valid token
  - [ ] Block with invalid token
  - [ ] Block with expired token
- [ ] Test logout:
  - [ ] Clear tokens
  - [ ] Redirect to login
- [ ] Verify CSRF protection:
  - [ ] State parameter validation
  - [ ] Invalid state rejection
- [ ] Check error handling:
  - [ ] Invalid token
  - [ ] Expired token
  - [ ] Missing token
  - [ ] Invalid app name

---

## 6. Common Issues & Solutions

### A. CORS Issues
```js
// Backend CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://yourapp.clintgeek.com'
  ],
  credentials: true
}));
```

### B. Token Refresh Loop
- Check refresh token expiration
- Verify JWT secrets are different
- Ensure proper error handling

### C. State Parameter Issues
- Use localStorage for state persistence
- Clear state after validation
- Handle missing state parameter

### D. Environment Variables
- Double-check all required variables
- Verify values are properly set
- Check for typos in variable names

---

## 7. Support
- For issues, check the BaseGeek documentation
- Open an issue in the GeekSuite repository
- Contact the GeekSuite team
- Check the troubleshooting guide in `DOCS/TROUBLESHOOTING.md`