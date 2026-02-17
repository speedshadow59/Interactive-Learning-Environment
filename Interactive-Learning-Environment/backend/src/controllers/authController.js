const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('student', 'teacher').default('student'),
  grade: Joi.when('role', {
    is: 'student',
    then: Joi.number().min(1).max(13).optional(),
    otherwise: Joi.forbidden()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register user
const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { username, email, password, firstName, lastName, role, grade } = value;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    const newUser = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      grade,
      privacyConsent: {
        marketingEmails: false,
        analyticsTracking: false,
        thirdPartySharing: false
      }
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser.toJSON(),
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = value;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const now = new Date();
    const hasPendingDeletion =
      user.deletionScheduled &&
      user.deletionScheduled.deleteAt &&
      new Date(user.deletionScheduled.deleteAt) > now;

    // Block only fully deactivated accounts with no active deletion grace period.
    if (!user.isActive && !hasPendingDeletion) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated'
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      token,
      accountStatus: hasPendingDeletion
        ? {
            pendingDeletion: true,
            deleteAt: user.deletionScheduled.deleteAt,
            warning: 'Your account is scheduled for deletion. Cancel deletion in Privacy settings to keep your account.',
            cancelUrl: '/api/privacy/cancel-deletion'
          }
        : {
            pendingDeletion: false
          }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Logout (client-side primarily handles token removal)
const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

module.exports = { register, login, logout };
