const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

/**
 * Middleware to authenticate users via JWT
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found' 
      });
    }

    // Add user data to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token is invalid or expired' 
    });
  }
};

module.exports = auth; 