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

// Helper: Update Vercel Environment Variable via Vercel REST API
async function updateVercelEnvironmentVariable(key, value) {
  const token = process.env.VERCEL_TOKEN || process.env.VERCEL_AUTH_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_NAME || 'DairyPad';
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token) {
    return {
      success: false,
      skipped: true,
      reason: 'VERCEL_TOKEN not configured. Add VERCEL_TOKEN and VERCEL_PROJECT_ID in Vercel Settings to enable automatic Vercel env updates.'
    };
  }

  try {
    let url = `https://api.vercel.com/v10/projects/${projectId}/env?upsert=true`;
    if (teamId) {
      url += `&teamId=${teamId}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: key,
        value: value,
        type: 'plain',
        target: ['production', 'preview', 'development']
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Vercel API error:', data);
      return { success: false, error: data.error ? data.error.message : 'Vercel API request failed' };
    }

    // Optional: trigger deploy hook if user provided VERCEL_DEPLOY_HOOK URL
    const deployHook = process.env.VERCEL_DEPLOY_HOOK;
    if (deployHook) {
      try {
        await fetch(deployHook, { method: 'POST' });
        console.log('Triggered Vercel redeployment via deploy hook');
      } catch (hookErr) {
        console.warn('Deploy hook failed:', hookErr);
      }
    }

    return { success: true, data };
  } catch (err) {
    console.error('Failed to call Vercel API:', err);
    return { success: false, error: err.message };
  }
}

// Get WhatsApp Phone Number and server config
app.get('/api/config', (req, res) => {
  let envNumber = '';
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      envNumber = envConfig.WHATSAPP_PHONE_NUMBER || '';
    }
  } catch (e) {
    // Read-only or missing .env on serverless is normal
  }

  const whatsappNumber = envNumber || process.env.WHATSAPP_PHONE_NUMBER || '';
  res.json({
    whatsappNumber,
    port: PORT,
    isVercel: !!process.env.VERCEL
  });
});

// Update WhatsApp Phone Number (in .env locally & in Vercel Environment Variables when deployed)
app.post('/api/config', async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    if (typeof whatsappNumber !== 'string') {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const sanitizedNumber = whatsappNumber.replace(/[^0-9]/g, '');

    // 1. Try local .env update (runs when on local machine)
    const envPath = path.join(__dirname, '.env');
    try {
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
    } catch (fsErr) {
      // Ignored on read-only environments like Vercel serverless
    }

    // 2. Update current process runtime memory
    process.env.WHATSAPP_PHONE_NUMBER = sanitizedNumber;

    // 3. Update Vercel Environment Variable via Vercel REST API
    const vercelResult = await updateVercelEnvironmentVariable('WHATSAPP_PHONE_NUMBER', sanitizedNumber);

    res.json({
      success: true,
      whatsappNumber: sanitizedNumber,
      vercel: vercelResult,
      message: vercelResult.success
        ? 'Updated in Vercel Environment Variables successfully!'
        : 'WhatsApp number updated successfully!'
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Start Server locally
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`DairyPad server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
