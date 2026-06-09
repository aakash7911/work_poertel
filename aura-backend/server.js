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
  users: [] // { email, passwordHash, isVerified, salt, name, uid, adhar, dob, bank, phone, uai, role, joinStatus, permanentCompany, adocHistory }
};
const OTP_STORE = {}; // { email: { otp: "123456", type: 'register' | 'forgot' } }

// Storage for jobs & applications
let ADMIN_JOBS = []; // { id, title, description, posterUrl, companyName, jobType: 'permanent' | 'adoc' }
const APPLICATIONS = []; // { id, userEmail, jobId, companyName, status: 'pending' | 'approved', userInfo }
const RESIGNATIONS = []; // { id, userEmail, companyName, reason, status: 'pending' }

// Auto-create default admin user for easy login testing
(async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  DB.users.push({
    email: 'admin@aura.com',
    passwordHash: hash,
    name: 'Admin Aura',
    isVerified: true,
    uid: 'ADMIN-001',
    adhar: '0000-0000-0000',
    dob: '01/01/2000',
    bank: 'BANK-000',
    phone: '9999999999',
    uai: 'UAI-ADMIN',
    role: 'admin',
    joinStatus: null,
    permanentCompany: null,
    adocHistory: []
  });
  console.log('✅ Default Admin created -> Email: admin@aura.com | Pass: admin123');
})();

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
      adhar: '', dob: '', bank: '', phone: '', uai: '',
      role: 'user',
      joinStatus: null,
      permanentCompany: null,
      adocHistory: []
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

  // Return role so frontend knows where to redirect
  res.json({ success: true, token: 'jwt-token-here', role: user.role || 'user', email: user.email, message: 'Logged in' });
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

// --- ADMIN ENDPOINTS ---

// Admin posts a job (Permanent or Adoc)
app.post('/v1/jobs/admin', (req, res) => {
  const { title, description, posterUrl, companyName, jobType } = req.body;
  if (!title || !companyName || !jobType) return res.json({ success: false, message: 'Title, Company Name, and Job Type are required' });
  
  const newJob = {
    id: Date.now().toString(),
    title,
    description: description || '',
    posterUrl: posterUrl || '',
    companyName,
    jobType
  };
  ADMIN_JOBS.push(newJob);
  
  res.json({ success: true, message: 'Job posted successfully', data: newJob });
});

// Admin views pending applications
app.get('/v1/admin/applications', (req, res) => {
  res.json({ success: true, data: APPLICATIONS });
});

// Admin approves an application
app.post('/v1/admin/applications/approve', (req, res) => {
  const { applicationId } = req.body;
  const appIndex = APPLICATIONS.findIndex(a => a.id === applicationId);
  if (appIndex === -1) return res.json({ success: false, message: 'Application not found' });

  const application = APPLICATIONS[appIndex];
  application.status = 'approved';

  const user = DB.users.find(u => u.email === application.userEmail);
  if (user) {
    user.joinStatus = 'approved';
    user.permanentCompany = application.companyName;
  }

  res.json({ success: true, message: 'Application approved successfully' });
});

// Admin views all jobs (for deletion)
app.get('/v1/admin/all-jobs', (req, res) => {
  res.json({ success: true, data: ADMIN_JOBS });
});

// Admin deletes a job
app.delete('/v1/admin/jobs/:id', (req, res) => {
  const { id } = req.params;
  ADMIN_JOBS = ADMIN_JOBS.filter(j => j.id !== id);
  res.json({ success: true, message: 'Job deleted successfully' });
});

// Admin views resignations
app.get('/v1/admin/resignations', (req, res) => {
  res.json({ success: true, data: RESIGNATIONS.filter(r => r.status === 'pending') });
});

// Admin approves resignation
app.post('/v1/admin/resignations/approve', (req, res) => {
  const { resignId } = req.body;
  const resign = RESIGNATIONS.find(r => r.id === resignId);
  if (!resign) return res.json({ success: false, message: 'Resignation not found' });

  resign.status = 'approved';
  
  const user = DB.users.find(u => u.email === resign.userEmail);
  if (user) {
    user.joinStatus = null;
    user.permanentCompany = null;
  }

  res.json({ success: true, message: 'Resignation approved. User removed from company.' });
});

// Admin views all users
app.get('/v1/admin/users', (req, res) => {
  const usersList = DB.users.map(u => ({
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    permanentCompany: u.permanentCompany || 'None',
    joinStatus: u.joinStatus || 'Not Joined'
  }));
  res.json({ success: true, data: usersList });
});


// --- USER ENDPOINTS ---

// Apply for a permanent job
app.post('/v1/jobs/apply', (req, res) => {
  const { userEmail, jobId, userInfo } = req.body;
  const user = DB.users.find(u => u.email === userEmail);
  const job = ADMIN_JOBS.find(j => j.id === jobId);

  if (!user) return res.json({ success: false, message: 'User not found' });
  if (!job) return res.json({ success: false, message: 'Job not found' });
  if (user.permanentCompany) return res.json({ success: false, message: 'You are already joined. Join now adoc are preference.' });
  if (user.joinStatus === 'pending') return res.json({ success: false, message: 'Your application is already pending.' });

  const newApp = {
    id: Date.now().toString(),
    userEmail,
    jobId,
    companyName: job.companyName,
    status: 'pending',
    userInfo
  };
  APPLICATIONS.push(newApp);
  user.joinStatus = 'pending';

  res.json({ success: true, message: 'Application submitted successfully. Joining on the way!' });
});

// User submits resignation
app.post('/v1/jobs/resign', (req, res) => {
  const { userEmail, reason } = req.body;
  const user = DB.users.find(u => u.email === userEmail);
  
  if (!user || !user.permanentCompany) {
    return res.json({ success: false, message: 'You are not joined to any company.' });
  }

  user.joinStatus = 'resigning';
  RESIGNATIONS.push({
    id: Date.now().toString(),
    userEmail,
    companyName: user.permanentCompany,
    reason,
    status: 'pending'
  });

  res.json({ success: true, message: 'Resignation submitted. Pending admin approval.' });
});

// Get Permanent jobs for home tab
app.get('/v1/jobs/permanent', (req, res) => {
  const permJobs = ADMIN_JOBS.filter(j => j.jobType === 'permanent');
  res.json({ success: true, data: permJobs });
});

// Get Adoc jobs for adoc tab (Filtered by user's company)
app.post('/v1/jobs/adoc/filtered', (req, res) => {
  const { userEmail } = req.body;
  const user = DB.users.find(u => u.email === userEmail);
  const adocJobs = ADMIN_JOBS.filter(j => j.jobType === 'adoc');
  
  if (!user || !user.permanentCompany) {
    // Not joined anywhere, show all adoc jobs
    return res.json({ success: true, data: adocJobs });
  }

  // Filter out adoc jobs from their own permanent company
  const filteredAdocs = adocJobs.filter(j => j.companyName !== user.permanentCompany);
  res.json({ success: true, data: filteredAdocs });
});

// Scan Adoc QR to join 1-day job
app.post('/v1/adoc/scan', (req, res) => {
  const { userEmail, jobId } = req.body;
  const user = DB.users.find(u => u.email === userEmail);
  const job = ADMIN_JOBS.find(j => j.id === jobId);

  if (!user) return res.json({ success: false, message: 'User not found' });
  if (!job || job.jobType !== 'adoc') return res.json({ success: false, message: 'Invalid Adoc Job ID' });

  // Record attendance
  const record = {
    jobId: job.id,
    company: job.companyName,
    title: job.title,
    date: new Date().toLocaleDateString(),
    paymentStatus: 'Pending',
    timing: '1 Day',
    help: 'Support active'
  };
  
  user.adocHistory = user.adocHistory || [];
  user.adocHistory.push(record);

  res.json({ success: true, message: 'Scan successful! Attendance and Payment record added.', data: record });
});

// Backwards compatibility for dashboard.html loading
app.get('/v1/jobs/admin', (req, res) => {
  // Return permanent jobs
  const permJobs = ADMIN_JOBS.filter(j => j.jobType === 'permanent');
  res.json({ success: true, data: permJobs });
});

app.post('/v1/profile/me', (req, res) => {
  const { email } = req.body;
  const user = DB.users.find(u => u.email === email) || DB.users[DB.users.length - 1]; // fallback for demo
  
  if(user) {
    res.json({ 
      success: true, 
      data: { 
        name: user.name, uid: user.uid, adhar: user.adhar, dob: user.dob, 
        bank: user.bank, phone: user.phone, email: user.email, uai: user.uai,
        joinStatus: user.joinStatus, permanentCompany: user.permanentCompany,
        adocHistory: user.adocHistory || []
      } 
    });
  } else {
    res.json({ success: false, message: 'User not found' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
