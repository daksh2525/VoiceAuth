const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { verifyVoiceSample } = require('../utils/voiceMatcher');

// Helper to generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'voiceauth_super_secret_jwt_key_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Helper for sanitized user response
const formatUserResponse = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    voicePassphrase: user.voicePassphrase,
    voiceAuthEnabled: user.voiceAuthEnabled,
    voiceConfidenceThreshold: user.voiceConfidenceThreshold,
    ttsVoiceFeedback: user.ttsVoiceFeedback,
    lastLogin: user.lastLogin,
    lastVoiceLogin: user.lastVoiceLogin,
    loginCount: user.loginCount,
    hasVoiceBiometrics: Boolean(user.voiceBiometrics && user.voiceBiometrics.enrolledAt),
    createdAt: user.createdAt
  };
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with password and enrolled voice controller profile
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, voicePassphrase, voiceBiometrics } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (!voicePassphrase || voicePassphrase.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'A voice passphrase is required to calibrate your voice controller'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      voicePassphrase: voicePassphrase.trim(),
      voiceBiometrics: voiceBiometrics || { enrolledAt: new Date() },
      voiceAuthEnabled: true,
      lastLogin: new Date()
    });

    // Record enrollment audit log
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      eventType: 'VOICE_ENROLLMENT',
      transcript: voicePassphrase,
      confidence: 100,
      details: 'Initial voice profile and security passphrase enrolled',
      metadata: { initialBiometricsEnrolled: Boolean(voiceBiometrics) }
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created and voice controller profile enrolled successfully',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Traditional password login
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await AuditLog.create({
        userEmail: email,
        eventType: 'PASSWORD_LOGIN_FAILED',
        details: 'Incorrect password attempt',
        status: 'FAILED'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      eventType: 'PASSWORD_LOGIN_SUCCESS',
      details: 'Authenticated via standard credentials'
    });

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
});

/**
 * @route   POST /api/auth/voice-login
 * @desc    Authenticate user via spoken voice passphrase & biometric verification
 * @access  Public
 */
router.post('/voice-login', async (req, res) => {
  try {
    const { email, spokenTranscript, biometrics } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'User email is required to identify voice profile'
      });
    }

    if (!spokenTranscript || spokenTranscript.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No voice audio or speech transcript was captured'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with that email'
      });
    }

    if (!user.voiceAuthEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Voice controller authentication has been disabled for this account'
      });
    }

    // Run acoustic + passphrase matching
    const matchResult = verifyVoiceSample({
      spokenTranscript,
      enrolledPassphrase: user.voicePassphrase,
      incomingBiometrics: biometrics,
      enrolledBiometrics: user.voiceBiometrics,
      threshold: user.voiceConfidenceThreshold || 70
    });

    if (matchResult.isMatch) {
      user.lastLogin = new Date();
      user.lastVoiceLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();

      await AuditLog.create({
        userId: user._id,
        userEmail: user.email,
        eventType: 'VOICE_LOGIN_SUCCESS',
        transcript: spokenTranscript,
        confidence: matchResult.finalScore,
        details: `Voice controller unlocked with ${matchResult.finalScore}% match (Text: ${matchResult.textScore}%, Acoustic: ${matchResult.biometricScore}%)`,
        metadata: {
          textScore: matchResult.textScore,
          biometricScore: matchResult.biometricScore
        }
      });

      const token = generateToken(user._id);

      return res.json({
        success: true,
        message: 'Voice biometric verified! Access granted.',
        token,
        user: formatUserResponse(user),
        verification: matchResult
      });
    } else {
      await AuditLog.create({
        userId: user._id,
        userEmail: user.email,
        eventType: 'VOICE_LOGIN_FAILED',
        transcript: spokenTranscript,
        confidence: matchResult.finalScore,
        details: matchResult.feedback,
        metadata: {
          requiredThreshold: matchResult.threshold,
          textScore: matchResult.textScore,
          biometricScore: matchResult.biometricScore
        }
      });

      return res.status(401).json({
        success: false,
        message: matchResult.feedback,
        verification: matchResult
      });
    }
  } catch (error) {
    console.error('[Voice Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during voice authentication'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile and recent security logs
 * @access  Protected
 */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const recentLogs = await AuditLog.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(10);

    return res.json({
      success: true,
      user: formatUserResponse(user),
      recentLogs
    });
  } catch (error) {
    console.error('[Get Me Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
});

/**
 * @route   PUT /api/auth/update-voice-profile
 * @desc    Update enrolled voice passphrase, biometrics, or security settings
 * @access  Protected
 */
router.put('/update-voice-profile', protect, async (req, res) => {
  try {
    const {
      voicePassphrase,
      voiceBiometrics,
      voiceConfidenceThreshold,
      voiceAuthEnabled,
      ttsVoiceFeedback
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (voicePassphrase && voicePassphrase.trim().length >= 3) {
      user.voicePassphrase = voicePassphrase.trim();
    }

    if (voiceBiometrics) {
      user.voiceBiometrics = {
        ...voiceBiometrics,
        enrolledAt: new Date()
      };
    }

    if (typeof voiceConfidenceThreshold === 'number') {
      user.voiceConfidenceThreshold = Math.min(95, Math.max(40, voiceConfidenceThreshold));
    }

    if (typeof voiceAuthEnabled === 'boolean') {
      user.voiceAuthEnabled = voiceAuthEnabled;
    }

    if (typeof ttsVoiceFeedback === 'boolean') {
      user.ttsVoiceFeedback = ttsVoiceFeedback;
    }

    await user.save();

    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      eventType: 'VOICE_PROFILE_UPDATED',
      details: 'Voice controller profile and calibration parameters updated',
      confidence: 100
    });

    return res.json({
      success: true,
      message: 'Voice profile updated successfully',
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('[Update Profile Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update voice profile'
    });
  }
});

/**
 * @route   GET /api/auth/phrase-hint
 * @desc    Get enrolled passphrase hint for voice login screen
 * @access  Public
 */
router.get('/phrase-hint', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found with this email'
      });
    }

    return res.json({
      success: true,
      name: user.name,
      voicePassphrase: user.voicePassphrase,
      voiceAuthEnabled: user.voiceAuthEnabled,
      voiceConfidenceThreshold: user.voiceConfidenceThreshold
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching phrase hint' });
  }
});

module.exports = router;
