import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { JWT_SECRET } from '../config';

const VALID_APPS = ['basegeek', 'notegeek', 'bujogeek'];

// Token generation with app context
const generateToken = (user, app) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
      app: app || 'basegeek'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Validate token for specific app
const validateTokenForApp = async (token, app) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      valid: true,
      app: decoded.app,
      user: decoded
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

// Central auth service
const authService = {
  // Login user across all apps
  login: async (identifier, password, app) => {
    try {
      // Find user
      const user = await User.findOne({
        $or: [
          { username: identifier },
          { email: identifier.toLowerCase() }
        ]
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const valid = await user.comparePassword(password);
      if (!valid) {
        throw new Error('Invalid credentials');
      }

      // Generate token for the specific app
      const token = generateToken(user, app);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Validate token across all apps
  validateToken: async (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if token is for a valid app
      if (!VALID_APPS.includes(decoded.app)) {
        throw new Error('Invalid app token');
      }

      // Verify user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        valid: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  },

  // Get user profile
  getUserProfile: async (userId) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      };
    } catch (error) {
      throw error;
    }
  },

  // Refresh token
  refreshToken: async (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new token with same app context
      const newToken = generateToken(user, decoded.app);

      return {
        token: newToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile
        }
      };
    } catch (error) {
      throw error;
    }
  }
};

export default authService;