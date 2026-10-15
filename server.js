const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Get WhatsApp Phone Number and server config
app.get('/api/config', (req, res) => {
  // Always read freshest from .env in case it was edited externally
  const envConfig = dotenv.parse(fs.existsSync(path.join(__dirname, '.env')) ? fs.readFileSync(path.join(__dirname, '.env')) : '');
  const whatsappNumber = envConfig.WHATSAPP_PHONE_NUMBER || process.env.WHATSAPP_PHONE_NUMBER || '';
  res.json({
    whatsappNumber,
    port: PORT
  });
});

// Update WhatsApp Phone Number in .env
app.post('/api/config', (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    if (typeof whatsappNumber !== 'string') {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const sanitizedNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const envPath = path.join(__dirname, '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      if (/^WHATSAPP_PHONE_NUMBER=.*/m.test(envContent)) {
        envContent = envContent.replace(/^WHATSAPP_PHONE_NUMBER=.*/m, `WHATSAPP_PHONE_NUMBER=${sanitizedNumber}`);
      } else {
        envContent += `\nWHATSAPP_PHONE_NUMBER=${sanitizedNumber}\n`;
      }
    } else {
      envContent = `WHATSAPP_PHONE_NUMBER=${sanitizedNumber}\nPORT=${PORT}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    process.env.WHATSAPP_PHONE_NUMBER = sanitizedNumber;

    res.json({
      success: true,
      whatsappNumber: sanitizedNumber,
      message: 'WhatsApp number updated successfully in .env'
    });
  } catch (error) {
    console.error('Error updating .env:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`DairyPad server running on http://localhost:${PORT}`);
});
