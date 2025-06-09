// Load environment variables first
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./config/Database');
const User = require('./models/User');
const { Op } = require('sequelize');

const app = express();

// HTTPS redirection for production
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://fingerprintnew.onrender.com',
  process.env.FRONTEND_URL // Add your production frontend URL here
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(bodyParser.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Database sync
sequelize.sync()
  .then(() => console.log('Database connected'))
  .catch(err => {
    console.error('DB connection failed:', err);
    process.exit(1); // Exit if database connection fails
  });

// Registration endpoint
app.post('/register', async (req, res) => {
  const { phone, visitorId } = req.body;
  
  if (!phone || !visitorId) {
    return res.status(400).json({ error: "Phone and visitorId are required" });
  }
  
  if (!/^\d{10,}$/.test(phone)) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ phone }, { visitorId }]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({
        error: existingUser.phone === phone
          ? "Phone already registered"
          : "Device already registered"
      });
    }
    
    await User.create({ phone, visitorId });
    res.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { phone, visitorId } = req.body;
  
  if (!phone || !visitorId) {
    return res.status(400).json({ error: "Phone and visitorId are required" });
  }

  try {
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ error: "Phone not registered" });
    }
    if (user.visitorId !== visitorId) {
      return res.status(401).json({ error: "Fingerprint mismatch" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Dynamic port for deployment platforms like Render
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});