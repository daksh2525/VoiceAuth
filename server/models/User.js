const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const VoiceBiometricsSchema = new mongoose.Schema({
  spectralCentroid: { type: Number, default: 0 },
  zeroCrossingRate: { type: Number, default: 0 },
  energyRms: { type: Number, default: 0 },
  durationMs: { type: Number, default: 0 },
  variance: { type: Number, default: 0 },
  sampleCount: { type: Number, default: 1 },
  enrolledAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: 60
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: true
  },
  voicePassphrase: {
    type: String,
    required: [true, 'Voice passphrase is required for voice authentication controller'],
    trim: true,
    default: 'My voice is my password authenticate me'
  },
  voiceBiometrics: {
    type: VoiceBiometricsSchema,
    default: () => ({})
  },
  voiceAuthEnabled: {
    type: Boolean,
    default: true
  },
  voiceConfidenceThreshold: {
    type: Number,
    default: 70, // Required match percentage (0-100)
    min: 40,
    max: 95
  },
  ttsVoiceFeedback: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  lastVoiceLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password prior to saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
