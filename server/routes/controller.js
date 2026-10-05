const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { isDbConnected } = require('../config/db');

// State store for controller operations
let systemState = {
  firewallShield: true,
  stealthMode: false,
  highSecurityLockdown: false,
  activeConnections: 3,
  lastTelemetryPurge: new Date()
};

/**
 * Parse Voice Command Intent
 */
function interpretVoiceCommand(commandRaw) {
  const cmd = (commandRaw || '').toLowerCase().trim();

  if (cmd.includes('system status') || cmd.includes('status') || cmd.includes('diagnostics') || cmd.includes('health')) {
    return {
      action: 'SYSTEM_STATUS',
      success: true,
      spokenFeedback: 'Voice controller diagnostics nominal. All security modules are operational.',
      data: {
        uptime: process.uptime(),
        database: isDbConnected() ? 'Online' : 'Degraded',
        firewall: systemState.firewallShield ? 'Active' : 'Disabled',
        stealthMode: systemState.stealthMode,
        lockdown: systemState.highSecurityLockdown
      }
    };
  }

  if (cmd.includes('activate shield') || cmd.includes('enable firewall') || cmd.includes('activate firewall')) {
    systemState.firewallShield = true;
    return {
      action: 'FIREWALL_ENABLED',
      success: true,
      spokenFeedback: 'Quantum firewall shield activated. Incoming perimeter locked.',
      data: { firewallShield: true }
    };
  }

  if (cmd.includes('deactivate shield') || cmd.includes('disable firewall')) {
    systemState.firewallShield = false;
    return {
      action: 'FIREWALL_DISABLED',
      success: true,
      spokenFeedback: 'Warning: Quantum firewall shield deactivated.',
      data: { firewallShield: false }
    };
  }

  if (cmd.includes('lock') || cmd.includes('lock system') || cmd.includes('lock workstation')) {
    return {
      action: 'LOCK_SESSION',
      success: true,
      spokenFeedback: 'Voice controller session locked. Biometric re-authentication required.',
      data: { shouldLock: true }
    };
  }

  if (cmd.includes('stealth mode') || cmd.includes('stealth')) {
    systemState.stealthMode = !systemState.stealthMode;
    return {
      action: 'TOGGLE_STEALTH',
      success: true,
      spokenFeedback: `Stealth mode ${systemState.stealthMode ? 'engaged' : 'disengaged'}.`,
      data: { stealthMode: systemState.stealthMode }
    };
  }

  if (cmd.includes('emergency lockdown') || cmd.includes('lockdown')) {
    systemState.highSecurityLockdown = !systemState.highSecurityLockdown;
    return {
      action: 'EMERGENCY_LOCKDOWN',
      success: true,
      spokenFeedback: systemState.highSecurityLockdown
        ? 'Attention: Emergency lockdown initiated. Biometric security heightened.'
        : 'Emergency lockdown lifted. Standard clearance restored.',
      data: { highSecurityLockdown: systemState.highSecurityLockdown }
    };
  }

  if (cmd.includes('purge') || cmd.includes('clear telemetry') || cmd.includes('clear cache')) {
    systemState.lastTelemetryPurge = new Date();
    return {
      action: 'PURGE_TELEMETRY',
      success: true,
      spokenFeedback: 'Temporary telemetry and biometric cache purged successfully.',
      data: { lastTelemetryPurge: systemState.lastTelemetryPurge }
    };
  }

  return {
    action: 'UNKNOWN_COMMAND',
    success: false,
    spokenFeedback: `Unrecognized command "${cmd}". Try saying "System status", "Activate firewall", or "Lock system".`,
    data: { unrecognized: cmd }
  };
}

/**
 * @route   POST /api/controller/execute-command
 * @desc    Execute a voice controller command
 * @access  Protected
 */
router.post('/execute-command', protect, async (req, res) => {
  try {
    const { commandText, spokenConfidence = 90 } = req.body;

    if (!commandText || commandText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Voice command text was not provided'
      });
    }

    const interpretation = interpretVoiceCommand(commandText);

    // Record in Audit Log
    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      eventType: interpretation.success ? 'VOICE_COMMAND_EXECUTED' : 'VOICE_COMMAND_REJECTED',
      transcript: commandText,
      confidence: spokenConfidence,
      details: interpretation.spokenFeedback,
      metadata: interpretation.data
    });

    return res.json({
      success: interpretation.success,
      action: interpretation.action,
      feedback: interpretation.spokenFeedback,
      systemState,
      data: interpretation.data
    });
  } catch (error) {
    console.error('[Voice Command Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process voice command'
    });
  }
});

/**
 * @route   GET /api/controller/status
 * @desc    Get system and controller status
 * @access  Protected
 */
router.get('/status', protect, async (req, res) => {
  try {
    const totalLogs = await AuditLog.countDocuments({ userId: req.user._id });
    const voiceLogs = await AuditLog.countDocuments({
      userId: req.user._id,
      eventType: { $in: ['VOICE_LOGIN_SUCCESS', 'VOICE_COMMAND_EXECUTED'] }
    });

    return res.json({
      success: true,
      status: {
        serverUptime: Math.floor(process.uptime()),
        databaseOnline: isDbConnected(),
        systemState,
        stats: {
          totalAuditEvents: totalLogs,
          successfulVoiceEvents: voiceLogs
        },
        userVoiceProfile: {
          voicePassphrase: req.user.voicePassphrase,
          threshold: req.user.voiceConfidenceThreshold,
          voiceAuthEnabled: req.user.voiceAuthEnabled
        }
      }
    });
  } catch (error) {
    console.error('[Controller Status Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve controller status'
    });
  }
});

/**
 * @route   GET /api/controller/logs
 * @desc    Get user's recent audit and voice events
 * @access  Protected
 */
router.get('/logs', protect, async (req, res) => {
  try {
    const logs = await AuditLog.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(25);

    return res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('[Audit Logs Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  }
});

module.exports = router;
