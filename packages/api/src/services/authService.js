import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const VALID_APPS = ['basegeek', 'notegeek', 'bujogeek', 'fitnessgeek', 'storygeek', 'startgeek'];

// Token generation with app context
export const generateToken = (user, app = null) => {
  if (!user || !user._id) {
    throw new Error('Invalid user object provided for token generation');
  }

  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
    app
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Generate refresh token
export const generateRefreshToken = (user) => {
  if (!user || !user._id) {
    throw new Error('Invalid user object provided for refresh token generation');
  }

  return jwt.sign(
    { userId: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

// Login user
export const login = async (identifier, password, app) => {
  try {
    console.log('Login attempt:', { identifier, app, VALID_APPS }); // Debug log
    // Validate app
    if (!app || !VALID_APPS.includes(app.toLowerCase())) {
      console.log('App validation failed:', { app, VALID_APPS, includes: VALID_APPS.includes(app.toLowerCase()) }); // Debug log
      throw new Error('Invalid app');
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    }).select('+passwordHash');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check for missing passwordHash
    if (!user.passwordHash) {
      throw new Error('User does not have a password set');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const token = generateToken(user, app);
    const refreshToken = generateRefreshToken(user);

    return {
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        app
      }
    };
  } catch (error) {
    throw error;
  }
};

// Validate token
export const validateToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded JWT payload:', decoded); // Debug log
    const user = await User.findById(decoded.id);
    console.log('User found by decoded.id:', user); // Debug log

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      app: decoded.app
    };
  } catch (error) {
    throw error;
  }
};

// Refresh token
export const refreshToken = async (refreshToken, app) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens
    const newToken = generateToken(user, app);
    const newRefreshToken = generateRefreshToken(user);

    return {
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        app
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      lastLogin: user.lastLogin
    };
  } catch (error) {
    throw error;
  }
};

export default {
  login,
  validateToken,
  refreshToken,
  generateToken,
  generateRefreshToken,
  getUserProfile
};