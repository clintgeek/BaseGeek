import jwt from 'jsonwebtoken';

const VALID_APPS = ['basegeek', 'notegeek', 'bujogeek', 'fitnessgeek', 'storygeek'];

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth middleware - Path:', req.path);
  console.log('Auth middleware - Token present:', !!token);
  console.log('Auth middleware - JWT_SECRET present:', !!process.env.JWT_SECRET);

  if (!token) {
    console.log('Auth middleware - No token provided');
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    // Debug: Print the JWT secret and its length
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded successfully:', { id: decoded.id, app: decoded.app });

    // Validate app claim if present (for backward compatibility)
    if (decoded.app && !VALID_APPS.includes(decoded.app)) {
      console.log('Auth middleware - Invalid app token:', decoded.app);
      return res.status(403).json({ message: 'Invalid app token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.log('Auth middleware - Token verification failed:', error.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};