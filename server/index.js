const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, isDbConnected } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger for API calls
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'VoiceAuth Controller Backend',
    database: isDbConnected() ? 'connected' : 'connecting_or_offline',
    uptime: Math.floor(process.uptime())
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/controller', require('./routes/controller'));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred'
  });
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🎙️  VoiceAuth Controller Backend Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔒 JWT Auth: Active`);
  console.log(`📊 DB Status: ${isDbConnected() ? 'Connected' : 'Connecting...'}`);
  console.log(`===============================================`);
});

module.exports = { app, server };
