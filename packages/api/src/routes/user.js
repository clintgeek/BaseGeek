import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import rateLimit from 'express-rate-limit';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-super-secret';
const JWT_EXPIRES_IN = '7d';

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { message: 'Too many attempts, please try again later' }
});

function generateToken(user) {
  return jwt.sign(
    {
      sub: user._id, // Use 'sub' (subject) as per JWT standard
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Auth middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Missing token',
      code: 'AUTH_MISSING_TOKEN'
    });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token',
      code: 'AUTH_INVALID_TOKEN'
    });
  }
}

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
router.post('/', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'All fields required',
        code: 'REGISTER_MISSING_FIELDS'
      });
    }

    // Check existing user
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({
        message: 'Username or email already exists',
        code: 'REGISTER_USER_EXISTS'
      });
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email,
      passwordHash,
      profile: {}
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      message: err.message,
      code: 'REGISTER_ERROR'
    });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
  try {
    // Handle both formats: { identifier, password } or { email/username, password }
    const { identifier, email, username, password } = req.body;
    const loginIdentifier = identifier || email || username;

    // Validation
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        message: 'Identifier (username or email) and password are required',
        code: 'LOGIN_MISSING_FIELDS'
      });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: loginIdentifier },
        { email: loginIdentifier.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
        code: 'LOGIN_INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({
        message: 'Invalid credentials',
        code: 'LOGIN_INVALID_CREDENTIALS'
      });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      message: err.message,
      code: 'LOGIN_ERROR'
    });
  }
});

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      message: err.message,
      code: 'GET_USER_ERROR'
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/me
// @access  Private
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { username, email, profile } = req.body;
    const user = await User.findById(req.user.sub);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (profile) user.profile = { ...user.profile, ...profile };

    await user.save();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      message: err.message,
      code: 'UPDATE_USER_ERROR'
    });
  }
});

// @desc    Change password
// @route   PUT /api/users/me/password
// @access  Private
router.put('/me/password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: 'All fields required',
        code: 'CHANGE_PASSWORD_MISSING_FIELDS'
      });
    }

    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify old password
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({
        message: 'Invalid password',
        code: 'CHANGE_PASSWORD_INVALID'
      });
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      message: err.message,
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
});

// @desc    List all users (admin)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', requireAuth, async (req, res) => {
  try {
    const users = await User.find({}, 'username email _id profile');
    res.json({ users });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({
      message: err.message,
      code: 'LIST_USERS_ERROR'
    });
  }
});

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({
      message: err.message,
      code: 'DELETE_USER_ERROR'
    });
  }
});

export default router;