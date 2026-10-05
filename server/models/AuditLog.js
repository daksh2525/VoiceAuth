const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userEmail: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: [
      'VOICE_LOGIN_SUCCESS',
      'VOICE_LOGIN_FAILED',
      'PASSWORD_LOGIN_SUCCESS',
      'PASSWORD_LOGIN_FAILED',
      'VOICE_ENROLLMENT',
      'VOICE_PROFILE_UPDATED',
      'VOICE_COMMAND_EXECUTED',
      'VOICE_COMMAND_REJECTED'
    ],
    required: true
  },
  transcript: {
    type: String,
    default: ''
  },
  confidence: {
    type: Number,
    default: 0
  },
  details: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
