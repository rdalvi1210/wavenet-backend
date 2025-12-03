const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { TOKEN_COOKIE_NAME } = require('../middleware/auth');

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1d',
    }
  );
}

function sendTokenResponse(user, res) {
  const token = signToken(user);

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  // We send basic user info back
  res.status(200).json({
    message: 'Login successful',
    user: {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

async function login(req, res) {
  try {
    const { email, password, timezoneOffsetMinutes } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Basic time zone validation
    if (typeof timezoneOffsetMinutes !== 'number') {
      return res
        .status(400)
        .json({ message: 'timezoneOffsetMinutes (number) is required for login.' });
    }

    if (timezoneOffsetMinutes !== -330 && timezoneOffsetMinutes !== 330) {
      // Some browsers send negative offset (UTC - localTime)
      // IST is typically -330 in that representation.
      return res.status(400).json({
        message:
          'Invalid time zone. Please ensure your system time zone is set to India Standard Time (UTC+5:30).',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    sendTokenResponse(user, res);
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Something went wrong during login.' });
  }
}

function getMe(req, res) {
  const user = req.user;

  res.status(200).json({
    user: {
      id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

module.exports = {
  login,
  getMe,
};
