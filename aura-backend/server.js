require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../aura-web')));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// MONGODB CONNECTION
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.warn("WARNING: MONGODB_URI not set. DB will not connect.");
}

// MONGODB SCHEMAS & MODELS
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  isVerified: Boolean,
  salt: String,
  name: String,
  uid: String,
  adhar: String,
  dob: String,
  bankAcc: String,
  ifsc: String,
  bankName: String,
  bank: String,
  phone: String,
  uai: String,
  pan: String,
  profilePic: String,
  profileVerified: { type: Boolean, default: false },
  role: { type: String, default: 'user' },
  joinStatus: String,
  permanentCompany: String,
  adocHistory: [{
    jobId: String,
    company: String,
    title: String,
    date: String,
    checkInTime: Date,
    checkOutTime: Date,
    hours: Number,
    paymentStatus: String,
    timing: String,
    help: String,
    isValid: { type: Boolean, default: true },
    approvedAt: Date
  }],
  permanentHistory: [{
    jobId: String,
    company: String,
    title: String,
    date: String,
    status: String
  }]
});
const User = mongoose.model('User', userSchema);

const jobSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  posterUrl: String,
  companyName: String,
  jobType: String
});
const Job = mongoose.model('Job', jobSchema);

const applicationSchema = new mongoose.Schema({
  id: String,
  userEmail: String,
  jobId: String,
  companyName: String,
  status: String,
  userInfo: String
});
const Application = mongoose.model('Application', applicationSchema);

const resignationSchema = new mongoose.Schema({
  id: String,
  userEmail: String,
  companyName: String,
  reason: String,
  status: String
});
const Resignation = mongoose.model('Resignation', resignationSchema);

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  location: String,
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  salt: String,
  adocId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});
const Company = mongoose.model('Company', companySchema);

// CREATE ADMIN IF NOT EXISTS
async function seedAdmin() {
  if (!process.env.MONGODB_URI) return;
  try {
    const adminExists = await User.findOne({ email: 'admin@aura.com' });
    if (!adminExists) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync('admin123', salt);
      await new User({
        email: 'admin@aura.com', passwordHash, isVerified: true, salt,
        name: 'Aura Admin', uid: 'ADMIN-001', adhar: '000000000000',
        dob: '01/01/2000', bank: 'BANK-000', phone: '9999999999',
        uai: 'UAI-ADMIN', pan: 'PAN-ADMIN', profilePic: '', profileVerified: true,
        role: 'admin', joinStatus: null, permanentCompany: null, adocHistory: []
      }).save();
      console.log("Admin seeded.");
    }
  } catch (e) { console.error("Error seeding admin", e); }
}
seedAdmin();

// IN-MEMORY OTP STORE
let OTP_STORE = {};

// --- AUTH ENDPOINTS ---
app.post('/v1/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.json({ success: false, message: 'All fields are required' });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.json({ success: false, message: 'Email already registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    OTP_STORE[email] = { otp, name, email, password, type: 'register' };
    
    console.log(`[TESTING] OTP for ${email} is ${otp}`);
    res.json({ success: true, message: 'OTP sent to email (Check console for testing)' });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const store = OTP_STORE[email];

  if (!store || store.otp !== otp) return res.json({ success: false, message: 'Invalid or expired OTP' });

  if (store.type === 'register') {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(store.password, salt);
    
    try {
      await new User({
        email: store.email, passwordHash, salt, name: store.name, isVerified: true,
        uid: `UID-${Math.floor(Math.random()*10000)}`,
        adhar: '', dob: '', bank: '', phone: '', uai: '', pan: '', profilePic: '',
        profileVerified: false, role: 'user', joinStatus: null, permanentCompany: null, adocHistory: []
      }).save();
      delete OTP_STORE[email];
      res.json({ success: true, message: 'Account created successfully' });
    } catch (e) { res.json({ success: false, message: 'DB Error' }); }
  } 
  else if (store.type === 'forgot') {
    res.json({ success: true, message: 'OTP Verified. Proceed to reset password.' });
  }
});

app.post('/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Check Company
    const company = await Company.findOne({ email });
    if (company) {
      const isMatch = bcrypt.compareSync(password, company.passwordHash);
      if (!isMatch) return res.json({ success: false, message: 'Invalid credentials' });
      return res.json({ success: true, message: 'Login successful', role: 'company', email: company.email, companyName: company.companyName, adocId: company.adocId });
    }

    // 2. Check User/Admin
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: 'Invalid credentials' });

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) return res.json({ success: false, message: 'Invalid credentials' });

    res.json({ success: true, message: 'Login successful', role: user.role, email: user.email });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: 'Email not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    OTP_STORE[email] = { otp, email, type: 'forgot' };
    console.log(`[TESTING] Password Reset OTP for ${email} is ${otp}`);
    
    res.json({ success: true, message: 'OTP sent to email (Check console for testing)' });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const store = OTP_STORE[email];

  if (!store || store.otp !== otp || store.type !== 'forgot') return res.json({ success: false, message: 'Invalid session or OTP' });

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(newPassword, salt);
  
  try {
    await User.updateOne({ email }, { passwordHash, salt });
    delete OTP_STORE[email];
    res.json({ success: true, message: 'Password reset successful' });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

// --- IMAGE UPLOAD ENDPOINT ---
app.post('/v1/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.json({ success: false, message: 'No file uploaded' });
  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  cloudinary.uploader.upload(dataURI, { resource_type: "auto" }, (error, result) => {
    if (error) return res.json({ success: false, message: 'Cloudinary upload failed' });
    res.json({ success: true, url: result.secure_url });
  });
});

// --- ADMIN ENDPOINTS ---
app.post('/v1/admin/add-company', async (req, res) => {
  const { name, location, email, password } = req.body;
  if (!name || !email || !password) return res.json({ success: false, message: 'Name, Email and Password required' });
  try {
    const existing = await Company.findOne({ email });
    if (existing) return res.json({ success: false, message: 'Company email already exists' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.json({ success: false, message: 'Email already used by a user' });

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const adocId = "COMP-" + Math.floor(1000 + Math.random() * 9000);

    const newCompany = new Company({ companyName: name, location, email, passwordHash, salt, adocId });
    await newCompany.save();

    res.json({ success: true, message: `Company registered successfully! Adoc ID: ${adocId}`, adocId });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.get('/v1/admin/companies', async (req, res) => {
  try {
    const companies = await Company.find({}, '-passwordHash -salt');
    res.json({ success: true, data: companies });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.delete('/v1/admin/delete-company/:id', async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

// --- COMPANY PORTAL ENDPOINTS ---
app.post('/v1/company/permanent-employees', async (req, res) => {
  const { companyEmail } = req.body;
  try {
    const company = await Company.findOne({ email: companyEmail });
    if(!company) return res.json({ success: false, message: 'Company not found' });

    const employees = await User.find({ permanentCompany: company.companyName, joinStatus: 'approved' });
    res.json({ success: true, data: employees });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/company/mark-attendance', async (req, res) => {
  const { companyEmail, userEmail, status, date } = req.body;
  try {
    const company = await Company.findOne({ email: companyEmail });
    if(!company) return res.json({ success: false, message: 'Company not found' });

    const user = await User.findOne({ email: userEmail, permanentCompany: company.companyName });
    if(!user) return res.json({ success: false, message: 'User not found or not in your company' });

    user.permanentHistory.push({
      jobId: 'MANUAL',
      company: company.companyName,
      title: 'Permanent Role',
      date: date || new Date().toLocaleDateString('en-GB'),
      status: status // 'Present' or 'Absent'
    });

    await user.save();
    res.json({ success: true, message: `Marked as ${status}` });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});
app.post('/v1/jobs/admin', async (req, res) => {
  const { title, description, posterUrl, companyName, jobType } = req.body;
  if (!title || !companyName || !jobType) return res.json({ success: false, message: 'Title, Company Name, and Job Type are required' });
  
  try {
    const newJob = new Job({
      id: Date.now().toString(),
      title, description: description || '', posterUrl: posterUrl || '', companyName, jobType
    });
    await newJob.save();
    res.json({ success: true, message: 'Job posted successfully', data: newJob });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.get('/v1/admin/applications', async (req, res) => {
  try {
    const apps = await Application.find();
    res.json({ success: true, data: apps });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/admin/applications/approve', async (req, res) => {
  const { applicationId } = req.body;
  try {
    const app = await Application.findOne({ id: applicationId });
    if (!app) return res.json({ success: false, message: 'Application not found' });

    app.status = 'approved';
    await app.save();

    await User.updateOne({ email: app.userEmail }, { joinStatus: 'approved', permanentCompany: app.companyName });
    res.json({ success: true, message: 'Application approved successfully' });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.get('/v1/admin/all-jobs', async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json({ success: true, data: jobs });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.delete('/v1/admin/jobs/:id', async (req, res) => {
  try {
    await Job.deleteOne({ id: req.params.id });
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.get('/v1/admin/resignations', async (req, res) => {
  try {
    const resigns = await Resignation.find({ status: 'pending' });
    res.json({ success: true, data: resigns });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/admin/resignations/approve', async (req, res) => {
  const { resignId } = req.body;
  try {
    const resign = await Resignation.findOne({ id: resignId });
    if (!resign) return res.json({ success: false, message: 'Resignation not found' });

    resign.status = 'approved';
    await resign.save();
    
    await User.updateOne({ email: resign.userEmail }, { joinStatus: null, permanentCompany: null });
    res.json({ success: true, message: 'Resignation approved. User removed from company.' });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.get('/v1/admin/users', async (req, res) => {
  try {
    const users = await User.find();
    const usersList = users.map(u => ({
      name: u.name, email: u.email, phone: u.phone, adhar: u.adhar, pan: u.pan,
      uai: u.uai, dob: u.dob, profilePic: u.profilePic, role: u.role,
      permanentCompany: u.permanentCompany || 'None', joinStatus: u.joinStatus || 'Not Joined'
    }));
    res.json({ success: true, data: usersList });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

// --- USER ENDPOINTS ---
app.post('/v1/jobs/apply', async (req, res) => {
  const { userEmail, jobId } = req.body;
  try {
    const user = await User.findOne({ email: userEmail });
    const job = await Job.findOne({ id: jobId });

    if (!user) return res.json({ success: false, message: 'User not found' });
    if (!user.profileVerified) return res.json({ success: false, message: 'Your profile is not verified. Please verify your profile first.' });
    if (!job) return res.json({ success: false, message: 'Job not found' });
    if (user.permanentCompany) return res.json({ success: false, message: 'You are already joined. Join now adoc are preference.' });
    if (user.joinStatus === 'pending') return res.json({ success: false, message: 'Your application is already pending.' });

    await new Application({
      id: Date.now().toString(), userEmail, jobId, companyName: job.companyName, status: 'pending',
      userInfo: `Name: ${user.name}, Phone: ${user.phone}, Aadhar: ${user.adhar}, PAN: ${user.pan}, UAN/PF: ${user.uai}, DOB: ${user.dob}, Bank: ${user.bankName} (${user.bankAcc}, IFSC: ${user.ifsc})`
    }).save();

    user.joinStatus = 'pending';
    await user.save();
    res.json({ success: true, message: 'Application submitted successfully. Joining on the way!' });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/jobs/resign', async (req, res) => {
  const { userEmail, reason } = req.body;
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user || !user.permanentCompany) return res.json({ success: false, message: 'You are not joined to any company.' });

    user.joinStatus = 'resigning';
    await user.save();

    await new Resignation({
      id: Date.now().toString(), userEmail, companyName: user.permanentCompany, reason, status: 'pending'
    }).save();
    res.json({ success: true, message: 'Resignation submitted. Pending admin approval.' });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.get('/v1/jobs/permanent', async (req, res) => {
  try {
    const permJobs = await Job.find({ jobType: 'permanent' });
    res.json({ success: true, data: permJobs });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/jobs/adoc/filtered', async (req, res) => {
  const { userEmail } = req.body;
  try {
    const user = await User.findOne({ email: userEmail });
    const adocJobs = await Job.find({ jobType: 'adoc' });
    
    if (!user || !user.permanentCompany) return res.json({ success: true, data: adocJobs });
    const filteredAdocs = adocJobs.filter(j => j.companyName !== user.permanentCompany);
    res.json({ success: true, data: filteredAdocs });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/adoc/scan', async (req, res) => {
  const { userEmail, jobId: adocId } = req.body; // Client sends adocId as jobId
  try {
    const user = await User.findOne({ email: userEmail });
    const company = await Company.findOne({ adocId: adocId });

    if (!user) return res.json({ success: false, message: 'User not found' });
    if (!company) return res.json({ success: false, message: 'Invalid Company Adoc ID' });

    // Check if there is an ongoing 'In Progress' adoc session for this company
    const ongoingIdx = user.adocHistory.findIndex(a => a.company === company.companyName && a.paymentStatus === 'In Progress');
    const pendingIdx = user.adocHistory.findIndex(a => a.company === company.companyName && a.paymentStatus === 'Pending Approval');
    
    let record;
    let scanType = 'in';

    if (pendingIdx >= 0) {
      return res.json({ success: false, message: 'You already have a request pending approval for this company.' });
    } else if (ongoingIdx >= 0) {
      // Check Out
      scanType = 'out';
      user.adocHistory[ongoingIdx].checkOutTime = new Date();
      user.adocHistory[ongoingIdx].paymentStatus = 'Pending';
      
      // Calculate hours
      const diffMs = user.adocHistory[ongoingIdx].checkOutTime - user.adocHistory[ongoingIdx].checkInTime;
      const hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
      user.adocHistory[ongoingIdx].hours = parseFloat(hours);
      
      // Check validation rule
      if (user.adocHistory[ongoingIdx].hours >= 8) {
        user.adocHistory[ongoingIdx].isValid = true;
      } else {
        user.adocHistory[ongoingIdx].isValid = false;
      }
      
      const inTimeStr = user.adocHistory[ongoingIdx].checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const outTimeStr = user.adocHistory[ongoingIdx].checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      user.adocHistory[ongoingIdx].timing = `${inTimeStr} to ${outTimeStr} (${hours} hrs)`;

      record = user.adocHistory[ongoingIdx];
    } else {
      // Check In (Request Approval)
      record = {
        jobId: company.adocId, company: company.companyName, title: 'Adoc Shift', date: new Date().toLocaleDateString(),
        hours: 0,
        paymentStatus: 'Pending Approval', timing: 'Waiting for company approval...', help: 'Support active',
        isValid: true
      };
      user.adocHistory.push(record);
    }
    
    await user.save();
    
    if (scanType === 'out') {
      const msg = record.isValid ? 'Check-Out Successful! Shift completed.' : 'Check-Out Successful! Note: Shift was under 8 hours and is marked invalid for you.';
      res.json({ success: true, message: msg, data: record });
    } else {
      res.json({ success: true, message: 'Request Sent! Waiting for company approval to start shift.', data: record });
    }
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/company/approve-adoc', async (req, res) => {
  const { companyEmail, userEmail, recordId } = req.body;
  try {
    const company = await Company.findOne({ email: companyEmail });
    const user = await User.findOne({ email: userEmail });
    if (!company || !user) return res.json({ success: false, message: 'Invalid data' });

    const record = user.adocHistory.id(recordId);
    if (!record || record.paymentStatus !== 'Pending Approval') return res.json({ success: false, message: 'Record not found or already processed' });

    record.paymentStatus = 'In Progress';
    record.checkInTime = new Date();
    record.timing = 'In Progress...';
    await user.save();

    res.json({ success: true, message: 'Adoc shift started for the user!' });
  } catch(e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/company/reject-adoc', async (req, res) => {
  const { companyEmail, userEmail, recordId } = req.body;
  try {
    const company = await Company.findOne({ email: companyEmail });
    const user = await User.findOne({ email: userEmail });
    if (!company || !user) return res.json({ success: false, message: 'Invalid data' });

    const record = user.adocHistory.id(recordId);
    if (!record || record.paymentStatus !== 'Pending Approval') return res.json({ success: false, message: 'Record not found or already processed' });

    // Remove the pending record entirely so the user can try again if needed
    user.adocHistory.pull(recordId);
    await user.save();

    res.json({ success: true, message: 'Adoc request rejected.' });
  } catch(e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/company/adoc-history', async (req, res) => {
  const { companyEmail } = req.body;
  try {
    const company = await Company.findOne({ email: companyEmail });
    if (!company) return res.json({ success: false, message: 'Company not found' });
    
    const users = await User.find({ "adocHistory.company": company.companyName });
    let history = [];
    const now = Date.now();
    const fiveHoursInMs = 5 * 60 * 60 * 1000;

    users.forEach(u => {
      u.adocHistory.forEach(h => {
        if (h.company === company.companyName) {
          if (h.paymentStatus === 'Successful' && h.approvedAt) {
            const approvedTime = new Date(h.approvedAt).getTime();
            if (now - approvedTime > fiveHoursInMs) return; // Hide after 5 hours
          }
          history.push({
            userEmail: u.email,
            userName: u.name,
            phone: u.phone,
            date: h.date,
            hours: h.hours || 0,
            paymentStatus: h.paymentStatus,
            timing: h.timing,
            isValid: h.isValid,
            adhar: u.adhar,
            recordId: h._id
          });
        }
      });
    });
    res.json({ success: true, data: history });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.get('/v1/jobs/admin', async (req, res) => {
  try {
    const permJobs = await Job.find({ jobType: 'permanent' });
    res.json({ success: true, data: permJobs });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/profile/me', async (req, res) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    // Keep backward compatibility for testing if no email
    if (!user) {
       user = await User.findOne(); // grab any user
    }
    if(user) {
      const now = Date.now();
      const fiveHoursInMs = 5 * 60 * 60 * 1000;
      
      const userObj = user.toObject();
      userObj.adocHistory = userObj.adocHistory.filter(h => {
        if (h.paymentStatus === 'Successful' && h.approvedAt) {
          const approvedTime = new Date(h.approvedAt).getTime();
          if (now - approvedTime > fiveHoursInMs) return false;
        }
        return true;
      });

      res.json({ success: true, data: userObj });
    } else {
      res.json({ success: false, message: 'User not found' });
    }
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/profile/verify', async (req, res) => {
  const { email, phone, adhar, pan, uai, dob, bankAcc, ifsc, bankName, profilePic } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: 'User not found' });

    user.phone = phone; user.adhar = adhar; user.pan = pan; user.uai = uai; user.dob = dob; user.bankAcc = bankAcc; user.ifsc = ifsc; user.bankName = bankName; user.profilePic = profilePic; user.profileVerified = true;
    await user.save();
    res.json({ success: true, message: 'Profile verified successfully!' });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.get('/v1/admin/adoc/payments', async (req, res) => {
  try {
    const users = await User.find({ "adocHistory.paymentStatus": { $in: ['Pending', 'Successful'] } });
    let records = [];
    users.forEach(u => {
      u.adocHistory.forEach(a => {
        if (a.paymentStatus === 'Pending' || a.paymentStatus === 'Successful') {
          records.push({
            userEmail: u.email,
            userName: u.name,
            mobile: u.phone,
            adhar: u.adhar,
            bankName: u.bankName,
            bankAcc: u.bankAcc,
            ifsc: u.ifsc,
            company: a.company,
            title: a.title,
            date: a.date,
            timing: a.timing,
            hours: a.hours,
            paymentStatus: a.paymentStatus,
            jobId: a.jobId,
            historyId: a._id,
            isValid: a.isValid
          });
        }
      });
    });
    res.json({ success: true, data: records });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.post('/v1/admin/adoc/approve', async (req, res) => {
  const { userEmail, historyId } = req.body;
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.json({ success: false, message: 'User not found' });
    
    const record = user.adocHistory.id(historyId);
    if (!record) return res.json({ success: false, message: 'Record not found' });
    
    record.paymentStatus = 'Successful';
    record.approvedAt = new Date();
    await user.save();
    res.json({ success: true, message: 'Payment approved successfully!' });
  } catch (e) { res.json({ success: false, message: 'DB Error' }); }
});

app.get('/v1/admin/all-history', async (req, res) => {
  try {
    const users = await User.find({});
    const allHistory = [];
    
    users.forEach(u => {
      // Add Permanent History
      if (u.permanentHistory) {
        u.permanentHistory.forEach(h => {
          allHistory.push({
            type: 'Permanent',
            userEmail: u.email,
            userName: u.name || 'N/A',
            company: h.company,
            date: h.date,
            status: h.status,
            hours: 'N/A',
            sortDate: h.date // Might be DD/MM/YYYY, sorting could be complex but frontend can handle it
          });
        });
      }
      
      // Add Adoc History
      if (u.adocHistory) {
        u.adocHistory.forEach(h => {
          allHistory.push({
            type: 'Adoc',
            userEmail: u.email,
            userName: u.name || 'N/A',
            company: h.company,
            date: h.date,
            status: h.paymentStatus,
            hours: h.hours ? h.hours + ' hrs' : '0 hrs',
            sortDate: h.date
          });
        });
      }
    });

    res.json({ success: true, data: allHistory });
  } catch(e) {
    res.json({ success: false, message: 'DB Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
