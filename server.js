const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const twilio = require('twilio');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Add root route to test Render health
app.get('/', (req, res) => {
  res.send('✅ Phone Auth Server Running');
});

// ✅ Twilio setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;

if (!accountSid || !authToken || !verifySid) {
  console.error('❌ Missing required Twilio credentials in .env');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

// ✅ Send OTP
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    const result = await client.verify
      .services(verifySid)
      .verifications.create({ to: `+91${phone}`, channel: 'sms' });

    res.json({ success: true, message: 'OTP sent', result });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Verify OTP
app.post('/verify-otp', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ success: false, message: 'Phone and code are required' });
  }

  try {
    const verification_check = await client.verify
      .services(verifySid)
      .verificationChecks.create({ to: `+91${phone}`, code });

    if (verification_check.status === 'approved') {
      res.json({ success: true, message: 'OTP verified' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Use proper IP binding for Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
