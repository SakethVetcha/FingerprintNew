const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./config/Database');
const User = require('./models/User');
const { Op } = require('sequelize');

const app = express();
app.use(bodyParser.json());
app.use(cors());

sequelize.sync();

// Registration endpoint
app.post('/register', async (req, res) => {
  const { phone, visitorId } = req.body;
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
        error: existingUser.phone === phone ?
          "Phone already registered" : "Device already registered"
      });
    }
    await User.create({ phone, visitorId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { phone, visitorId } = req.body;
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
    res.status(500).json({ error: "Login failed" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
