import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const VALID_APPS = ['basegeek', 'notegeek', 'bujogeek'];

// Token generation with app context
export const generateToken = (user, app = null) => {
  const payload = {
    userId: user._id,
    username: user.username,
    email: user.email,
    app
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Login user
export const login = async (usernameOrEmail, password) => {
  try {
    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

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