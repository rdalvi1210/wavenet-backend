const jwt = require('jsonwebtoken');
const User = require('../models/User');

const TOKEN_COOKIE_NAME = 'token';

async function protect(req, res, next) {
  try {
    const token = req.cookies[TOKEN_COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. Token missing.' });
    }


    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found for this token.' });
    }


    req.user = user;

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = {
  protect,
  TOKEN_COOKIE_NAME,
};
