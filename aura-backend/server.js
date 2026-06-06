require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static HTML files from aura-web folder
app.use(express.static(path.join(__dirname, '../aura-web')));

// Redirect root to login.html
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// MOCK DATABASE (To be replaced with MongoDB later)
const DB = {
  users: [] // { email, passwordHash, isVerified, salt, name, uid, adhar, dob, bank, phone, uai }
};
const OTP_STORE = {}; // { email: { otp: "123456", type: 'register' | 'forgot' } }

// Helper to simulate Email sending or send via Brevo
const sendEmailOTP = async (email, otp) => {
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'your_brevo_api_key_here') {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Aura App', email: 'no-reply@aura-app.com' },
          to: [{ email: email }],
          subject: 'Your Aura OTP Code',
          htmlContent: `<html><body><h2>Your OTP Code is: <strong>${otp}</strong></h2><p>Please use this code to verify your account or reset your password.</p></body></html>`
        })
      });
      const result = await response.json();
      console.log('✅ [BREVO EMAIL SENT] Message ID:', result.messageId);
    } catch (error) {
      console.error('❌ [BREVO EMAIL ERROR]', error);
    }
  } else {
    // Mock Fallback
    console.log(`\n\n=========================================`);
    console.log(`📧 [MOCK EMAIL SENT TO]: ${email}`);
    console.log(`🔑 [YOUR OTP IS]: ${otp}`);
    console.log(`=========================================\n\n`);
  }
};

// 1. REGISTER -> SEND OTP
app.post('/v1/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if(!email || !password || !name) return res.json({ success: false, message: 'All fields required' });
  
  const existingUser = DB.users.find(u => u.email === email);
  if(existingUser) return res.json({ success: false, message: 'User already exists' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store temp user data with OTP
  OTP_STORE[email] = { otp, type: 'register', password, name };
  
  sendEmailOTP(email, otp);
  res.json({ success: true, message: 'OTP sent to email' });
});

// 2. VERIFY OTP -> CREATE ACCOUNT WITH SALTED HASH
app.post('/v1/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const store = OTP_STORE[email];

  if(!store || store.otp !== otp) return res.json({ success: false, message: 'Invalid or Expired OTP' });

  if(store.type === 'register') {
    // Generate salt & hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(store.password, salt);

    // Save to Mock DB (Simulating MongoDB Insert)
    const newUser = {
      email,
      passwordHash,
      name: store.name,
      isVerified: true,
      uid: `UID-${Math.floor(Math.random()*10000)}`,
      adhar: '', dob: '', bank: '', phone: '', uai: ''
    };
    DB.users.push(newUser);
    delete OTP_STORE[email];
    
    res.json({ success: true, message: 'Account created successfully' });
  } 
  else if (store.type === 'forgot') {
    // Just verify OTP to allow reset step
    res.json({ success: true, message: 'OTP Verified. Proceed to reset password.' });
  }
});

// 3. LOGIN
app.post('/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = DB.users.find(u => u.email === email);
  
  if(!user) return res.json({ success: false, message: 'Invalid credentials' });

  // Compare incoming password with saved salted hash
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if(!isMatch) return res.json({ success: false, message: 'Invalid credentials' });

  res.json({ success: true, token: 'jwt-token-here', message: 'Logged in' });
});

// 4. FORGOT PASSWORD -> SEND OTP
app.post('/v1/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = DB.users.find(u => u.email === email);
  if(!user) return res.json({ success: false, message: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  OTP_STORE[email] = { otp, type: 'forgot' };
  
  sendEmailOTP(email, otp);
  res.json({ success: true, message: 'OTP sent to email' });
});

// 5. RESET PASSWORD
app.post('/v1/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const store = OTP_STORE[email];

  if(!store || store.otp !== otp || store.type !== 'forgot') {
    return res.json({ success: false, message: 'Invalid OTP' });
  }

  const user = DB.users.find(u => u.email === email);
  if(user) {
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    delete OTP_STORE[email];
    res.json({ success: true, message: 'Password reset successfully' });
  } else {
    res.json({ success: false, message: 'User not found' });
  }
});

// --- OTHER EXISTING ENDPOINTS ---
app.get('/v1/jobs/admin', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/v1/adoc/me', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/v1/jobs/me', (req, res) => {
  res.json({ success: true, companyName: null, data: [] });
});

app.get('/v1/profile/me', (req, res) => {
  // In a real app, you'd get the user from JWT
  const user = DB.users[DB.users.length - 1]; // get latest user for demo
  if(user) {
    res.json({ success: true, data: { name: user.name, uid: user.uid, adhar: user.adhar, dob: user.dob, bank: user.bank, phone: user.phone, email: user.email, uai: user.uai } });
  } else {
    res.json({ success: true, data: { name: '', uid: '', adhar: '', dob: '', bank: '', phone: '', email: '', uai: '' } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
