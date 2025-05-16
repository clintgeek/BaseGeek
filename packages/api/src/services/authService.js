import jwt from 'jsonwebtoken';
import { User, userGeekConn } from '../models/user.js';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const VALID_APPS = ['basegeek', 'notegeek', 'bujogeek'];

// Token generation with app context
export const generateToken = (user, app = null) => {
  if (!user || !user._id) {
    throw new Error('Invalid user object provided for token generation');
  }

  const payload = {
    userId: user._id,
    username: user.username,
    email: user.email,
    app
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Login user
export const login = async (identifier, password, app) => {
  try {
    console.log('Login attempt:', { identifier, app });

    // Check connection status
    if (userGeekConn.readyState !== 1) {
      console.error('Database not connected. State:', userGeekConn.readyState);
      throw new Error('Database connection error');
    }

    // Validate inputs
    if (!identifier) {
      throw new Error('Identifier (username or email) is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    if (!app || !VALID_APPS.includes(app.toLowerCase())) {
      throw new Error(`Invalid app. Must be one of: ${VALID_APPS.join(', ')}`);
    }

    // Find user by username or email with passwordHash field explicitly selected
    console.log('Searching for user with identifier:', identifier);
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier.toLowerCase() }
      ]
    }).select('+passwordHash'); // Explicitly select passwordHash field

    if (!user) {
      console.log('User not found:', identifier);
      throw new Error('Invalid credentials');
    }

    // Debug log user object (excluding sensitive data)
    console.log('Found user:', {
      id: user._id,
      username: user.username,
      email: user.email,
      hasPasswordHash: !!user.passwordHash,
      passwordHashLength: user.passwordHash ? user.passwordHash.length : 0,
      lastLogin: user.lastLogin,
      collection: user.collection.name
    });

    // Try direct database query to verify user exists
    const directUser = await userGeekConn.db.collection('users').findOne({
      $or: [
        { username: identifier },
        { email: identifier.toLowerCase() }
      ]
    }, { projection: { passwordHash: 1, username: 1, email: 1 } });

    console.log('Direct database query result:', directUser ? {
      id: directUser._id,
      username: directUser.username,
      email: directUser.email,
      hasPasswordHash: !!directUser.passwordHash,
      passwordHashLength: directUser.passwordHash ? directUser.passwordHash.length : 0
    } : 'No user found');

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', identifier);
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token with app context
    const token = generateToken(user, app.toLowerCase());

    console.log('Login successful for user:', identifier);

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
    console.error('Login error:', error);
    throw error;
  }
};

// Validate token
export const validateToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      userId: user._id,
      username: user.username,
      email: user.email,
      app: decoded.app
    };
  } catch (error) {
    throw error;
  }
};

// Refresh token
export const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return generateToken(user, decoded.app);
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
  getUserProfile
};