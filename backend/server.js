// // ============================================================
// // server.js — Complete Backend for Millet Supply Chain Platform
// // ============================================================

// const express = require('express');
// const mysql = require('mysql2');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const multer = require('multer');
// const cors = require('cors');
// const path = require('path');
// const fs = require('fs');
// require('dotenv').config();

// const app = express();

// // ─────────────────────────────────────────────
// // MIDDLEWARE (tools that run on every request)
// // ─────────────────────────────────────────────
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Makes the uploads folder publicly accessible
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Serves your frontend HTML files
// // app.use(express.static(path.join(__dirname, '../frontend')));
// app.use(express.static(path.join(__dirname, '../shree-anna-react/build')));

// // ─────────────────────────────────────────────
// // DATABASE CONNECTION
// // ─────────────────────────────────────────────
// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
// }).promise();

// // Test the database connection when server starts
// db.query('SELECT 1')
//   .then(() => console.log('✅ Database connected successfully'))
//   .catch(err => console.error('❌ Database connection failed:', err.message));

// // ─────────────────────────────────────────────
// // FILE UPLOAD SETUP (for Aadhaar, photos, QR)
// // ─────────────────────────────────────────────
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, 'uploads'));
//   },
//   filename: (req, file, cb) => {
//     // Creates a unique filename like: 1234567890-photo.jpg
//     const uniqueName = Date.now() + '-' + file.originalname.replace(/\s/g, '-');
//     cb(null, uniqueName);
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB per file
//   fileFilter: (req, file, cb) => {
//     const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
//     if (allowed.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only JPG, PNG, and PDF files are allowed'));
//     }
//   }
// });

// // This handles 3 file fields at once for registration forms
// const registrationUpload = upload.fields([
//   { name: 'aadhaar', maxCount: 1 },
//   { name: 'photo', maxCount: 1 },
//   { name: 'upi_qr', maxCount: 1 }
// ]);

// // ─────────────────────────────────────────────
// // HELPER: Verify JWT Token (protects routes)
// // ─────────────────────────────────────────────
// function verifyToken(req, res, next) {
//   const authHeader = req.headers['authorization'];
//   // Token comes as "Bearer eyJhbGci..." so we split and take second part
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ message: 'Access denied. Please login first.' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // Now req.user has id, role, name
//     next();
//   } catch (err) {
//     return res.status(403).json({ message: 'Session expired. Please login again.' });
//   }
// }

// // ─────────────────────────────────────────────
// // HELPER: Check user role
// // ─────────────────────────────────────────────
// function requireRole(...roles) {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: `Access denied. This is for ${roles.join('/')} only.` });
//     }
//     next();
//   };
// }

// // ════════════════════════════════════════════════════════════
// //  AUTH ROUTES — Registration & Login
// // ════════════════════════════════════════════════════════════

// // ═══════════════════════════════════════════════════════════════
// // AUTH ROUTES
// // ═══════════════════════════════════════════════════════════════

// // ── Shared helper: generate + store OTP ───────────────────────
// async function createOtp(identifier, expiryMins = 10) {
//   const code      = Math.floor(100000 + Math.random() * 900000).toString();
//   const expiresAt = new Date(Date.now() + expiryMins * 60 * 1000);
//   await db.execute(
//     `INSERT INTO otps (phone, otp_code, expires_at) VALUES (?, ?, ?)`,
//     [identifier, code, expiresAt]
//   );
//   return code;
// }

// async function verifyOtp(identifier, code) {
//   const [rows] = await db.execute(
//     `SELECT * FROM otps
//      WHERE phone = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW()
//      ORDER BY created_at DESC LIMIT 1`,
//     [identifier, code]
//   );
//   if (rows.length === 0) return false;
//   await db.execute(`UPDATE otps SET is_used = TRUE WHERE id = ?`, [rows[0].id]);
//   return true;
// }

// // ── POST: Email + Password login (farmer, startup, admin) ─────
// app.post('/api/auth/login', async (req, res) => {
//   const { identifier, password } = req.body;
//   if (!identifier || !password)
//     return res.status(400).json({ message: 'Email and password are required.' });

//   try {
//     const [rows] = await db.execute(
//       `SELECT * FROM users
//        WHERE email = ? AND role IN ('farmer','startup','admin')`,
//       [identifier]
//     );
//     if (rows.length === 0)
//       return res.status(404).json({ message: 'No account found with this email.' });

//     const user = rows[0];
//     if (user.status === 'pending')
//       return res.status(403).json({ message: 'Your account is pending admin approval.' });
//     if (user.status === 'rejected')
//       return res.status(403).json({ message: 'Your account was rejected. Contact support.' });

//     const valid = await bcrypt.compare(password, user.password_hash);
//     if (!valid)
//       return res.status(401).json({ message: 'Incorrect password.' });

//     const token = jwt.sign(
//       { id: user.id, role: user.role, name: user.full_name },
//       process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }
//     );
//     res.json({ message: 'Login successful!', token, role: user.role, name: user.full_name, id: user.id });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ message: 'Something went wrong.' });
//   }
// });

// // ── POST: Farmer — Send OTP to phone for login ────────────────
// app.post('/api/auth/farmer/send-otp', async (req, res) => {
//   const { phone } = req.body;
//   if (!phone || phone.length !== 10)
//     return res.status(400).json({ message: 'Enter a valid 10-digit phone number.' });

//   try {
//     const [rows] = await db.execute(
//       `SELECT id, status FROM users WHERE phone = ? AND role = 'farmer'`, [phone]
//     );
//     if (rows.length === 0)
//       return res.status(404).json({ message: 'No farmer account with this phone number.' });
//     if (rows[0].status === 'pending')
//       return res.status(403).json({ message: 'Your account is pending admin approval.' });
//     if (rows[0].status === 'rejected')
//       return res.status(403).json({ message: 'Your account was rejected.' });

//     const code = await createOtp(phone, 5);
//     console.log(`📱 Farmer login OTP for ${phone}: ${code}`);
//     res.json({ message: 'OTP sent to your phone!', dev_otp: code });
//   } catch (err) {
//     console.error('Farmer send OTP error:', err);
//     res.status(500).json({ message: 'Something went wrong.' });
//   }
// });

// // ── POST: Farmer — Verify OTP and login ──────────────────────
// app.post('/api/auth/farmer/verify-otp', async (req, res) => {
//   const { phone, otp } = req.body;
//   try {
//     const valid = await verifyOtp(phone, otp);
//     if (!valid)
//       return res.status(400).json({ message: 'Invalid or expired OTP.' });

//     const [user] = await db.execute(
//       `SELECT * FROM users WHERE phone = ? AND role = 'farmer'`, [phone]
//     );
//     const token = jwt.sign(
//       { id: user[0].id, role: user[0].role, name: user[0].full_name },
//       process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }
//     );
//     res.json({ message: 'Login successful!', token, role: user[0].role, name: user[0].full_name, id: user[0].id });
//   } catch (err) {
//     console.error('Farmer verify OTP error:', err);
//     res.status(500).json({ message: 'Something went wrong.' });
//   }
// });

// // ── POST: Farmer — Send forgot password OTP to email ─────────
// app.post('/api/auth/farmer/forgot-password', async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: 'Email is required.' });

//   try {
//     const [rows] = await db.execute(
//       `SELECT id FROM users WHERE email = ? AND role = 'farmer'`, [email]
//     );
//     if (rows.length === 0)
//       return res.status(404).json({ message: 'No farmer account found with this email.' });

//     const code = await createOtp(email, 10);
//     console.log(`🔑 Farmer reset OTP for ${email}: ${code}`);
//     res.json({ message: 'OTP sent to your email.', dev_otp: code });
//   } catch (err) {
//     console.error('Farmer forgot password error:', err);
//     res.status(500).json({ message: 'Something went wrong.' });
//   }
// });

// // ── POST: Farmer — Reset password ────────────────────────────
// app.post('/api/auth/farmer/reset-password', async (req, res) => {
//   const { email, otp, new_password } = req.body;
//   if (!email || !otp || !new_password)
//     return res.status(400).json({ message: 'Email, OTP and new password are required.' });
//   if (new_password.length < 8)
//     return res.status(400).json({ message: 'Password must be at least 8 characters.' });

//   try {
//     const valid = await verifyOtp(email, otp);
//     if (!valid)
//       return res.status(400).json({ message: 'Invalid or expired OTP.' });

//     const hash = await bcrypt.hash(new_password, 10);
//     await db.execute(
//       `UPDATE users SET password_hash = ? WHERE email = ? AND role = 'farmer'`,
//       [hash, email]
//     );
//     res.json({ message: 'Password reset successfully! You can now log in.' });
//   } catch (err) {
//     console.error('Farmer reset password error:', err);
//     res.status(500).json({ message: 'Something went wrong.' });
//   }
// });

// // ── POST: Startup — Forgot password (OTP to email) ───────────
// app.post('/api/auth/startup/forgot-password', async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: 'Email is required.' });

//   try {
//     const [rows] = await db.execute(
//       `SELECT id FROM users WHERE email = ? AND role = 'startup'`, [email]
//     );
//     if (rows.length === 0)
//       return res.status(404).json({ message: 'No startup account found with this email.' });

//     const code = await createOtp(email, 10);
//     console.log(`📧 Startup reset OTP for ${email}: ${code}`);
//     res.json({ message: 'OTP sent to your email.', dev_otp: code });
//   } catch (err) {
//     console.error('Startup forgot password error:', err);
//     res.status(500).json({ message: 'Something went wrong.' });
//   }
// });

// // ── POST: Startup — Reset password ───────────────────────────
// app.post('/api/auth/startup/reset-password', async (req, res) => {
//   const { email, otp, new_password } = req.body;
//   if (!email || !otp || !new_password)
//     return res.status(400).json({ message: 'Email, OTP and new password are required.' });
//   if (new_password.length < 8)
//     return res.status(400).json({ message: 'Password must be at least 8 characters.' });

//   try {
//     const valid = await verifyOtp(email, otp);
//     if (!valid)
//       return res.status(400).json({ message: 'Invalid or expired OTP.' });

//     const hash = await bcrypt.hash(new_password, 10);
//     await db.execute(
//       `UPDATE users SET password_hash = ? WHERE email = ? AND role = 'startup'`,
//       [hash, email]
//     );
//     res.json({ message: 'Password reset successfully! You can now log in.' });
//   } catch (err) {
//     console.error('Startup reset password error:', err);
//     res.status(500).json({ message: 'Something went wrong.' });
//   }
// });

// // ── POST: Customer — Send OTP ─────────────────────────────────
// app.post('/api/auth/customer/send-otp', async (req, res) => {
//   const { phone } = req.body;
//   if (!phone || phone.length !== 10)
//     return res.status(400).json({ message: 'Enter a valid 10-digit phone number.' });

//   try {
//     const [existing] = await db.execute(
//       `SELECT id, status, has_password FROM users WHERE phone = ? AND role = 'customer'`,
//       [phone]
//     );
//     if (existing.length > 0 && existing[0].status === 'banned')
//       return res.status(403).json({ message: 'This account has been banned.' });

//     let isNew = false;
//     if (existing.length === 0) {
//       await db.execute(
//         `INSERT INTO users (full_name, phone, role, status, has_password)
//          VALUES (?, ?, 'customer', 'approved', FALSE)`,
//         [`Customer_${phone.slice(-4)}`, phone]
//       );
//       isNew = true;
//     }

//     const code = await createOtp(phone, 5);
//     console.log(`📱 Customer OTP for ${phone}: ${code}`);
//     res.json({
//       message: isNew ? 'Account created! OTP sent.' : 'OTP sent!',
//       dev_otp: code,
//       is_new: isNew,
//       has_password: existing[0]?.has_password || false,
//     });
//   } catch (err) {
//     console.error('Customer send OTP error:', err);
//     res.status(500).json({ message: 'Something went wrong.' });
//   }
// });

// // ── POST: Customer — Verify OTP and login ────────────────────
// app.post('/api/auth/customer/verify-otp', async (req, res) => {
//   const { phone, otp } = req.body;
//   try {
//     const valid = await verifyOtp(phone, otp);
//     if (!valid)
//       return res.status(400).json({ message: 'Invalid or expired OTP.' });

//     const [user] = await db.execute(
//       `SELECT * FROM users WHERE phone = ? AND role = 'customer'`, [phone]
//     );
//     const token = jwt.sign(
//       { id: user[0].id, role: user[0].role, name: user[0].full_name },
//       process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }
//     );
//     res.json({
//       message: 'Login successful!', token,
//       role: user[0].role, name: user[0].full_name, id: user[0].id,
//       has_password: user[0].has_password,
//     });
//   } catch (err) {
//     console.error('Customer verify OTP error:', err);
//     res.status(500).json({ message: 'Something went wrong.' });
//   }
// });

// // ── POST: Customer — Set password (first time or change) ──────
// app.post('/api/auth/customer/set-password', verifyToken, async (req, res) => {
//   const { new_password } = req.body;
//   if (!new_password || new_password.length < 8)
//     return res.status(400).json({ message: 'Password must be at least 8 characters.' });

//   try {
//     const hash = await bcrypt.hash(new_password, 10);
//     await db.execute(
//       `UPDATE users SET password_hash = ?, has_password = TRUE WHERE id = ? AND role = 'customer'`,
//       [hash, req.user.id]
//     );
//     res.json({ message: 'Password set successfully!' });
//   } catch (err) {
//     console.error('Customer set password error:', err);
//     res.status(500).json({ message: 'Something went wrong.' });
//   }
// });

// // ── POST: Customer — Password login (after password is set) ───
// app.post('/api/auth/customer/login-password', async (req, res) => {
//   const { phone, password } = req.body;
//   if (!phone || !password)
//     return res.status(400).json({ message: 'Phone and password are required.' });

//   try {
//     const [rows] = await db.execute(
//       `SELECT * FROM users WHERE phone = ? AND role = 'customer' AND has_password = TRUE`,
//       [phone]
//     );
//     if (rows.length === 0)
//       return res.status(404).json({ message: 'No account found or password not set yet.' });

//     const valid = await bcrypt.compare(password, rows[0].password_hash);
//     if (!valid)
//       return res.status(401).json({ message: 'Incorrect password.' });

//     const token = jwt.sign(
//       { id: rows[0].id, role: rows[0].role, name: rows[0].full_name },
//       process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }
//     );
//     res.json({ message: 'Login successful!', token, role: rows[0].role, name: rows[0].full_name, id: rows[0].id });
//   } catch (err) {
//     console.error('Customer password login error:', err);
//     res.status(500).json({ message: 'Something went wrong.' });
//   }
// });


// // ── FARMER REGISTRATION ──────────────────────────────────────
// app.post('/api/auth/register/farmer', registrationUpload, async (req, res) => {
//   const { full_name, email, phone, age, gender, license_number, farming_category, password } = req.body;

//   // Basic validation
//   if (!full_name || !email || !phone || !age || !gender || !license_number || !farming_category || !password) {
//     return res.status(400).json({ message: 'All fields are required.' });
//   }
//   if (password.length < 8) {
//     return res.status(400).json({ message: 'Password must be at least 8 characters.' });
//   }

//   try {
//     // Hash the password so it's not stored as plain text
//     const passwordHash = await bcrypt.hash(password, 10);

//     // Get uploaded file names (or null if not uploaded)
//     const aadhaarFile = req.files?.aadhaar?.[0]?.filename || null;
//     const photoFile = req.files?.photo?.[0]?.filename || null;
//     const upiFile = req.files?.upi_qr?.[0]?.filename || null;

//     // Step 1: Insert into users table
//     const [userResult] = await db.execute(
//       `INSERT INTO users (full_name, email, phone, password_hash, role, status, aadhaar_doc, profile_photo, upi_qr)
//        VALUES (?, ?, ?, ?, 'farmer', 'pending', ?, ?, ?)`,
//       [full_name, email, phone, passwordHash, aadhaarFile, photoFile, upiFile]
//     );
//     const newUserId = userResult.insertId; // The ID of the newly created user

//     // Step 2: Insert into farmers table
//     await db.execute(
//       `INSERT INTO farmers (user_id, age, gender, license_number, farming_category)
//        VALUES (?, ?, ?, ?, ?)`,
//       [newUserId, age, gender, license_number, farming_category]
//     );

//     res.status(201).json({
//       message: 'Registration submitted successfully! Please wait for admin approval before logging in.'
//     });

//   } catch (err) {
//     // ER_DUP_ENTRY means email/phone/license already exists in DB
//     if (err.code === 'ER_DUP_ENTRY') {
//       return res.status(400).json({ message: 'Email, phone number, or license is already registered.' });
//     }
//     console.error('Farmer registration error:', err);
//     res.status(500).json({ message: 'Something went wrong. Please try again.' });
//   }
// });

// // ── STARTUP REGISTRATION ─────────────────────────────────────
// app.post('/api/auth/register/startup', registrationUpload, async (req, res) => {
//   const { full_name, email, phone, age, gender, license_number, business_category, password } = req.body;

//   if (!full_name || !email || !phone || !age || !gender || !license_number || !business_category || !password) {
//     return res.status(400).json({ message: 'All fields are required.' });
//   }
//   if (password.length < 8) {
//     return res.status(400).json({ message: 'Password must be at least 8 characters.' });
//   }

//   try {
//     const passwordHash = await bcrypt.hash(password, 10);
//     const aadhaarFile = req.files?.aadhaar?.[0]?.filename || null;
//     const photoFile = req.files?.photo?.[0]?.filename || null;
//     const upiFile = req.files?.upi_qr?.[0]?.filename || null;

//     const [userResult] = await db.execute(
//       `INSERT INTO users (full_name, email, phone, password_hash, role, status, aadhaar_doc, profile_photo, upi_qr)
//        VALUES (?, ?, ?, ?, 'startup', 'pending', ?, ?, ?)`,
//       [full_name, email, phone, passwordHash, aadhaarFile, photoFile, upiFile]
//     );
//     const newUserId = userResult.insertId;

//     await db.execute(
//       `INSERT INTO startups (user_id, age, gender, license_number, business_category)
//        VALUES (?, ?, ?, ?, ?)`,
//       [newUserId, age, gender, license_number, business_category]
//     );

//     res.status(201).json({
//       message: 'Registration submitted! Please wait for admin approval.'
//     });

//   } catch (err) {
//     if (err.code === 'ER_DUP_ENTRY') {
//       return res.status(400).json({ message: 'Email, phone number, or license is already registered.' });
//     }
//     console.error('Startup registration error:', err);
//     res.status(500).json({ message: 'Something went wrong. Please try again.' });
//   }
// });

// // // ── FARMER / STARTUP / ADMIN LOGIN ───────────────────────────
// // app.post('/api/auth/login', async (req, res) => {
// //   const { email, password } = req.body;

// //   if (!email || !password) {
// //     return res.status(400).json({ message: 'Email and password are required.' });
// //   }

// //   try {
// //     // Find user by email
// //     const [rows] = await db.execute(
// //       `SELECT * FROM users WHERE email = ? AND role IN ('farmer', 'startup', 'admin')`,
// //       [email]
// //     );

// //     if (rows.length === 0) {
// //       return res.status(404).json({ message: 'No account found with this email.' });
// //     }

// //     const user = rows[0];

// //     // Check account status
// //     if (user.status === 'pending') {
// //       return res.status(403).json({ message: 'Your account is pending admin approval. Please wait.' });
// //     }
// //     if (user.status === 'rejected') {
// //       return res.status(403).json({ message: 'Your account was rejected. Please contact support.' });
// //     }

// //     // Compare entered password with hashed password in DB
// //     const isPasswordValid = await bcrypt.compare(password, user.password_hash);
// //     if (!isPasswordValid) {
// //       return res.status(401).json({ message: 'Incorrect password.' });
// //     }

// //     // Create a JWT token that lasts 7 days
// //     const token = jwt.sign(
// //       { id: user.id, role: user.role, name: user.full_name },
// //       process.env.JWT_SECRET,
// //       { expiresIn: process.env.JWT_EXPIRES_IN }
// //     );

// //     res.json({
// //       message: 'Login successful!',
// //       token: token,
// //       role: user.role,
// //       name: user.full_name,
// //       id: user.id
// //     });

// //   } catch (err) {
// //     console.error('Login error:', err);
// //     res.status(500).json({ message: 'Something went wrong. Please try again.' });
// //   }
// // });

// // // ── CUSTOMER — SEND OTP ───────────────────────────────────────
// // app.post('/api/auth/customer/send-otp', async (req, res) => {
// //   const { phone, name } = req.body;

// //   if (!phone || phone.length !== 10) {
// //     return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
// //   }

// //   try {
// //     // If customer doesn't exist, create them automatically
// //     const [existing] = await db.execute(
// //       `SELECT id FROM users WHERE phone = ? AND role = 'customer'`, [phone]
// //     );

// //     if (existing.length === 0) {
// //       await db.execute(
// //         `INSERT INTO users (full_name, phone, role, status) VALUES (?, ?, 'customer', 'active')`,
// //         [name || 'Customer', phone]
// //       );
// //     }

// //     // Generate a random 6-digit OTP
// //     const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
// //     const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes

// //     // Save OTP to database
// //     await db.execute(
// //       `INSERT INTO otps (phone, otp_code, expires_at) VALUES (?, ?, ?)`,
// //       [phone, otpCode, expiresAt]
// //     );

// //     // In production you would send SMS here via Twilio or MSG91
// //     // For now, we return it in the response so you can test
// //     console.log(`📱 OTP for ${phone}: ${otpCode}`);

// //     res.json({
// //       message: 'OTP sent to your phone.',
// //       // REMOVE the line below before going live — only for testing!
// //       dev_otp: otpCode
// //     });

// //   } catch (err) {
// //     console.error('Send OTP error:', err);
// //     res.status(500).json({ message: 'Something went wrong.' });
// //   }
// // });

// // ── CUSTOMER — VERIFY OTP & LOGIN ────────────────────────────
// // app.post('/api/auth/customer/verify-otp', async (req, res) => {
// //   const { phone, otp } = req.body;

// //   try {
// //     // Find a valid, unused OTP for this phone
// //     const [rows] = await db.execute(
// //       `SELECT * FROM otps 
// //        WHERE phone = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW()
// //        ORDER BY created_at DESC LIMIT 1`,
// //       [phone, otp]
// //     );

// //     if (rows.length === 0) {
// //       return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
// //     }

// //     // Mark OTP as used so it can't be reused
// //     await db.execute(`UPDATE otps SET is_used = TRUE WHERE id = ?`, [rows[0].id]);

// //     // Get customer details
// //     const [user] = await db.execute(
// //       `SELECT * FROM users WHERE phone = ? AND role = 'customer'`, [phone]
// //     );

// //     // Create token
// //     const token = jwt.sign(
// //       { id: user[0].id, role: 'customer', name: user[0].full_name },
// //       process.env.JWT_SECRET,
// //       { expiresIn: process.env.JWT_EXPIRES_IN }
// //     );

// //     res.json({
// //       message: 'Login successful!',
// //       token: token,
// //       role: 'customer',
// //       name: user[0].full_name,
// //       id: user[0].id
// //     });

// //   } catch (err) {
// //     console.error('Verify OTP error:', err);
// //     res.status(500).json({ message: 'Something went wrong.' });
// //   }
// // });

// // ════════════════════════════════════════════════════════════
// //  FARMER ROUTES
// // ════════════════════════════════════════════════════════════

// // ── GET: Farmer Dashboard Stats ──────────────────────────────
// app.get('/api/farmer/dashboard', verifyToken, requireRole('farmer'), async (req, res) => {
//   const farmerId = req.user.id;
//   try {
//     const [[products]] = await db.execute(
//       `SELECT COUNT(*) as total FROM products WHERE seller_id = ? AND is_active = TRUE`, [farmerId]
//     );
//     const [[pendingOrders]] = await db.execute(
//       `SELECT COUNT(*) as total FROM orders WHERE seller_id = ? AND status = 'pending'`, [farmerId]
//     );
//     const [[revenue]] = await db.execute(
//       `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
//        WHERE seller_id = ? AND status = 'delivered' AND MONTH(created_at) = MONTH(NOW())`,
//       [farmerId]
//     );
//     const [[rating]] = await db.execute(
//       `SELECT COALESCE(AVG(rating), 0) as avg FROM reviews WHERE seller_id = ?`, [farmerId]
//     );

//     res.json({
//       total_products: products.total,
//       pending_orders: pendingOrders.total,
//       monthly_revenue: revenue.total,
//       avg_rating: parseFloat(rating.avg).toFixed(1)
//     });
//   } catch (err) {
//     console.error('Farmer dashboard error:', err);
//     res.status(500).json({ message: 'Could not load dashboard.' });
//   }
// });

// // ── POST: Farmer Adds a Product ───────────────────────────────
// app.post('/api/farmer/products', verifyToken, requireRole('farmer'), async (req, res) => {
//   const { name, category, quantity, price_per_unit, description, unit } = req.body;
//   const farmerId = req.user.id;

//   if (!name || !category || !quantity || !price_per_unit) {
//     return res.status(400).json({ message: 'Product name, category, quantity, and price are required.' });
//   }

//   try {
//     await db.execute(
//   `INSERT INTO products (seller_id, seller_type, name, category, quantity, price_per_unit, stock_available, unit, description)
//    VALUES (?, 'farmer', ?, ?, ?, ?, ?, ?, ?)`,
//   [farmerId, name, category, quantity, price_per_unit, quantity, unit || 'kg', description || '']
// );
//     res.status(201).json({ message: 'Product listed successfully!' });
//   } catch (err) {
//     console.error('Add product error:', err);
//     res.status(500).json({ message: 'Could not add product.' });
//   }
// });

// // ── GET: Farmer's Products ─────────────────────────────────────
// app.get('/api/farmer/products', verifyToken, requireRole('farmer'), async (req, res) => {
//   try {
//     const [products] = await db.execute(
//       `SELECT * FROM products WHERE seller_id = ? AND is_active = TRUE ORDER BY created_at DESC`,
//       [req.user.id]
//     );
//     res.json(products);
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load products.' });
//   }
// });

// // ── GET: Farmer's Orders ──────────────────────────────────────
// app.get('/api/farmer/orders', verifyToken, requireRole('farmer'), async (req, res) => {
//   try {
//     const [orders] = await db.execute(
//       `SELECT o.*, p.name AS product_name, u.full_name AS buyer_name, u.role AS buyer_role
//        FROM orders o
//        JOIN products p ON o.product_id = p.id
//        JOIN users u ON o.buyer_id = u.id
//        WHERE o.seller_id = ?
//        ORDER BY o.created_at DESC`,
//       [req.user.id]
//     );
//     res.json(orders);
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load orders.' });
//   }
// });

// // ── PATCH: Update Order Status (e.g., mark as shipped) ────────
// app.patch('/api/farmer/orders/:id/status', verifyToken, requireRole('farmer'), async (req, res) => {
//   const { status } = req.body;
//   const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];

//   if (!validStatuses.includes(status)) {
//     return res.status(400).json({ message: 'Invalid status value.' });
//   }

//   try {
//     await db.execute(
//       `UPDATE orders SET status = ? WHERE id = ? AND seller_id = ?`,
//       [status, req.params.id, req.user.id]
//     );
//     res.json({ message: 'Order status updated.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not update order.' });
//   }
// });

// // ── GET: Reviews received by Farmer ───────────────────────────
// app.get('/api/farmer/reviews', verifyToken, requireRole('farmer'), async (req, res) => {
//   try {
//     const [reviews] = await db.execute(
//       `SELECT r.*, u.full_name AS reviewer_name, p.name AS product_name
//        FROM reviews r
//        JOIN users u ON r.reviewer_id = u.id
//        JOIN products p ON r.product_id = p.id
//        WHERE r.seller_id = ?
//        ORDER BY r.created_at DESC`,
//       [req.user.id]
//     );
//     res.json(reviews);
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load reviews.' });
//   }
// });

// // ════════════════════════════════════════════════════════════
// //  STARTUP ROUTES
// // ════════════════════════════════════════════════════════════

// // ── GET: Startup Dashboard Stats ──────────────────────────────
// app.get('/api/startup/dashboard', verifyToken, requireRole('startup'), async (req, res) => {
//   const startupId = req.user.id;
//   try {
//     const [[products]] = await db.execute(
//       `SELECT COUNT(*) as total FROM products WHERE seller_id = ? AND is_active = TRUE`, [startupId]
//     );
//     const [[customerOrders]] = await db.execute(
//       `SELECT COUNT(*) as total FROM orders WHERE seller_id = ?`, [startupId]
//     );
//     const [[rawOrders]] = await db.execute(
//       `SELECT COUNT(*) as total FROM orders WHERE buyer_id = ?`, [startupId]
//     );
//     const [[revenue]] = await db.execute(
//       `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE seller_id = ? AND status = 'delivered'`,
//       [startupId]
//     );

//     res.json({
//       total_products: products.total,
//       customer_orders: customerOrders.total,
//       raw_material_orders: rawOrders.total,
//       total_revenue: revenue.total
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load dashboard.' });
//   }
// });

// // ── POST: Startup Buys Raw Materials from Farmer ──────────────
// app.post('/api/startup/buy-raw-material', verifyToken, requireRole('startup'), async (req, res) => {
//   const { product_id, quantity, delivery_address } = req.body;
//   const buyerId = req.user.id;

//   if (!product_id || !quantity) {
//     return res.status(400).json({ message: 'Product and quantity are required.' });
//   }

//   try {
//     // Check product exists and has enough stock
//     const [[product]] = await db.execute(
//       `SELECT * FROM products WHERE id = ? AND seller_type = 'farmer' AND is_active = TRUE AND stock_available >= ?`,
//       [product_id, quantity]
//     );

//     if (!product) {
//       return res.status(400).json({ message: 'Product not available or not enough stock.' });
//     }

//     const totalAmount = product.price_per_unit * quantity;
//     const orderNumber = 'ORD-' + Date.now();

//     // Create the order
//     await db.execute(
//       `INSERT INTO orders (order_number, buyer_id, seller_id, product_id, quantity, total_amount, delivery_address)
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [orderNumber, buyerId, product.seller_id, product_id, quantity, totalAmount, delivery_address || '']
//     );

//     // Reduce available stock
//     await db.execute(
//       `UPDATE products SET stock_available = stock_available - ? WHERE id = ?`,
//       [quantity, product_id]
//     );

//     res.status(201).json({
//       message: 'Order placed successfully!',
//       order_number: orderNumber,
//       total_amount: totalAmount
//     });
//   } catch (err) {
//     console.error('Buy raw material error:', err);
//     res.status(500).json({ message: 'Could not place order.' });
//   }
// });

// // ── POST: Startup Lists a Finished Product ────────────────────
// app.post('/api/startup/products', verifyToken, requireRole('startup'), async (req, res) => {
//   const { name, category, quantity, price_per_unit, description, unit } = req.body;
//   const startupId = req.user.id;

//   if (!name || !category || !quantity || !price_per_unit) {
//     return res.status(400).json({ message: 'All product fields are required.' });
//   }

//   try {
//     await db.execute(
//   `INSERT INTO products (seller_id, seller_type, name, category, quantity, price_per_unit, stock_available, unit, description)
//    VALUES (?, 'startup', ?, ?, ?, ?, ?, ?, ?)`,
//   [startupId, name, category, quantity, price_per_unit, quantity, unit || 'kg', description || '']
// );
//     res.status(201).json({ message: 'Product listed successfully!' });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not list product.' });
//   }
// });

// // ── GET: Startup Orders (sales + purchases) ───────────────────
// app.get('/api/startup/orders', verifyToken, requireRole('startup'), async (req, res) => {
//   const startupId = req.user.id;
//   try {
//     const [sales] = await db.execute(
//       `SELECT o.*, p.name AS product_name, u.full_name AS buyer_name, 'sale' AS order_type
//        FROM orders o
//        JOIN products p ON o.product_id = p.id
//        JOIN users u ON o.buyer_id = u.id
//        WHERE o.seller_id = ? ORDER BY o.created_at DESC`,
//       [startupId]
//     );
//     const [purchases] = await db.execute(
//       `SELECT o.*, p.name AS product_name, u.full_name AS seller_name, 'purchase' AS order_type
//        FROM orders o
//        JOIN products p ON o.product_id = p.id
//        JOIN users u ON o.seller_id = u.id
//        WHERE o.buyer_id = ? ORDER BY o.created_at DESC`,
//       [startupId]
//     );
//     res.json({ sales, purchases });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load orders.' });
//   }
// });

// // ════════════════════════════════════════════════════════════
// //  CUSTOMER ROUTES
// // ════════════════════════════════════════════════════════════

// // ── GET: Browse All Products ──────────────────────────────────
// app.get('/api/customer/products', verifyToken, async (req, res) => {
//   const { seller_type, category } = req.query;

//   let query = `
//     SELECT p.*, u.full_name AS seller_name, u.role AS seller_role,
//            COALESCE(AVG(r.rating), 0) AS avg_rating,
//            COUNT(r.id) AS review_count
//     FROM products p
//     JOIN users u ON p.seller_id = u.id
//     LEFT JOIN reviews r ON r.product_id = p.id
//     WHERE p.is_active = TRUE AND p.stock_available > 0 AND u.status = 'approved'
//   `;
//   const params = [];

//   if (seller_type) { query += ` AND p.seller_type = ?`; params.push(seller_type); }
//   if (category) { query += ` AND p.category = ?`; params.push(category); }

//   query += ` GROUP BY p.id ORDER BY avg_rating DESC`;

//   try {
//     const [products] = await db.execute(query, params);
//     res.json(products);
//   } catch (err) {
//     console.error('Browse products error:', err);
//     res.status(500).json({ message: 'Could not load products.' });
//   }
// });

// // ── POST: Customer Places an Order ────────────────────────────
// app.post('/api/customer/orders', verifyToken, requireRole('customer'), async (req, res) => {
//   const { product_id, quantity, delivery_address } = req.body;
//   const customerId = req.user.id;

//   if (!product_id || !quantity || !delivery_address) {
//     return res.status(400).json({ message: 'Product, quantity, and delivery address are required.' });
//   }

//   try {
//     const [[product]] = await db.execute(
//       `SELECT * FROM products WHERE id = ? AND is_active = TRUE AND stock_available >= ?`,
//       [product_id, quantity]
//     );

//     if (!product) {
//       return res.status(400).json({ message: 'Product not available or not enough stock.' });
//     }

//     const totalAmount = product.price_per_unit * quantity;
//     const orderNumber = 'ORD-' + Date.now();

//     await db.execute(
//       `INSERT INTO orders (order_number, buyer_id, seller_id, product_id, quantity, total_amount, delivery_address)
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [orderNumber, customerId, product.seller_id, product_id, quantity, totalAmount, delivery_address]
//     );

//     await db.execute(
//       `UPDATE products SET stock_available = stock_available - ? WHERE id = ?`,
//       [quantity, product_id]
//     );

//     res.status(201).json({
//       message: 'Order placed successfully!',
//       order_number: orderNumber,
//       total_amount: totalAmount
//     });
//   } catch (err) {
//     console.error('Place order error:', err);
//     res.status(500).json({ message: 'Could not place order.' });
//   }
// });

// // ── GET: Customer's Order History ─────────────────────────────
// app.get('/api/customer/orders', verifyToken, requireRole('customer'), async (req, res) => {
//   try {
//     const [orders] = await db.execute(
//       `SELECT o.*, p.name AS product_name, u.full_name AS seller_name
//        FROM orders o
//        JOIN products p ON o.product_id = p.id
//        JOIN users u ON o.seller_id = u.id
//        WHERE o.buyer_id = ?
//        ORDER BY o.created_at DESC`,
//       [req.user.id]
//     );
//     res.json(orders);
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load orders.' });
//   }
// });

// // ── POST: Customer Submits a Review ───────────────────────────
// app.post('/api/customer/reviews', verifyToken, requireRole('customer'), async (req, res) => {
//   const { order_id, product_id, seller_id, rating, comment } = req.body;

//   if (!order_id || !product_id || !seller_id || !rating) {
//     return res.status(400).json({ message: 'Order, product, seller, and rating are required.' });
//   }

//   try {
//     await db.execute(
//       `INSERT INTO reviews (reviewer_id, seller_id, product_id, order_id, rating, comment)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [req.user.id, seller_id, product_id, order_id, rating, comment || '']
//     );
//     res.status(201).json({ message: 'Review submitted. Thank you!' });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not submit review.' });
//   }
// });

// // ── GET: All Recipes ───────────────────────────────────────────
// app.get('/api/recipes', verifyToken, async (req, res) => {
//   try {
//     const [recipes] = await db.execute(
//       `SELECT r.*, u.full_name AS author_name,
//        (SELECT COUNT(*) FROM recipe_comments WHERE recipe_id = r.id) AS comments_count
//        FROM recipes r
//        JOIN users u ON r.author_id = u.id
//        WHERE r.is_flagged = FALSE
//        ORDER BY r.created_at DESC`
//     );
//     res.json(recipes);
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load recipes.' });
//   }
// });

// // ── POST: Share a Recipe ──────────────────────────────────────
// app.post('/api/recipes', verifyToken, async (req, res) => {
//   const { title, short_description, content, youtube_link } = req.body;

//   if (!title || !short_description || !content) {
//     return res.status(400).json({ message: 'Title, short description, and recipe description are required.' });
//   }

//   // Basic YouTube URL validation (optional but recommended)
//   if (youtube_link && !youtube_link.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/)) {
//     return res.status(400).json({ message: 'Please enter a valid YouTube link.' });
//   }

//   try {
//     await db.execute(
//       `INSERT INTO recipes (author_id, title, short_description, content, youtube_link) VALUES (?, ?, ?, ?, ?)`,
//       [req.user.id, title, short_description, content, youtube_link || null]
//     );
//     res.status(201).json({ message: 'Recipe shared with the community!' });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not share recipe.' });
//   }
// });

// // ── POST: Like a Recipe ───────────────────────────────────────
// app.post('/api/recipes/:id/like', verifyToken, async (req, res) => {
//   try {
//     await db.execute(
//       `INSERT INTO recipe_likes (recipe_id, user_id) VALUES (?, ?)`,
//       [req.params.id, req.user.id]
//     );
//     await db.execute(
//       `UPDATE recipes SET likes_count = likes_count + 1 WHERE id = ?`,
//       [req.params.id]
//     );
//     res.json({ message: 'Recipe liked!' });
//   } catch (err) {
//     if (err.code === 'ER_DUP_ENTRY') {
//       return res.status(400).json({ message: 'You already liked this recipe.' });
//     }
//     res.status(500).json({ message: 'Could not like recipe.' });
//   }
// });

// // ── POST: Comment on a Recipe ─────────────────────────────────
// app.post('/api/recipes/:id/comment', verifyToken, async (req, res) => {
//   const { comment } = req.body;
//   if (!comment) return res.status(400).json({ message: 'Comment cannot be empty.' });

//   try {
//     await db.execute(
//       `INSERT INTO recipe_comments (recipe_id, user_id, comment) VALUES (?, ?, ?)`,
//       [req.params.id, req.user.id, comment]
//     );
//     res.status(201).json({ message: 'Comment added!' });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not add comment.' });
//   }
// });

// // ════════════════════════════════════════════════════════════
// //  ADMIN ROUTES
// // ════════════════════════════════════════════════════════════

// // ── GET: Platform Analytics ───────────────────────────────────
// app.get('/api/admin/analytics', verifyToken, requireRole('admin'), async (req, res) => {
//   try {
//     const [[farmers]] = await db.execute(
//       `SELECT COUNT(*) as total FROM users WHERE role = 'farmer' AND status = 'approved'`
//     );
//     const [[startups]] = await db.execute(
//       `SELECT COUNT(*) as total FROM users WHERE role = 'startup' AND status = 'approved'`
//     );
//     const [[customers]] = await db.execute(
//       `SELECT COUNT(*) as total FROM users WHERE role = 'customer'`
//     );
//     const [[pending]] = await db.execute(
//       `SELECT COUNT(*) as total FROM users WHERE status = 'pending'`
//     );
//     const [[orders]] = await db.execute(
//       `SELECT COUNT(*) as total FROM orders`
//     );
//     const [[revenue]] = await db.execute(
//       `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'delivered'`
//     );

//     res.json({
//       total_farmers: farmers.total,
//       active_startups: startups.total,
//       total_customers: customers.total,
//       pending_approvals: pending.total,
//       total_orders: orders.total,
//       total_revenue: revenue.total
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load analytics.' });
//   }
// });

// // ── GET: Pending Approval Requests ────────────────────────────
// app.get('/api/admin/pending', verifyToken, requireRole('admin'), async (req, res) => {
//   try {
//     const [users] = await db.execute(
//       `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.created_at,
//               u.aadhaar_doc, u.profile_photo, u.upi_qr,
//               COALESCE(f.license_number, s.license_number) AS license,
//               COALESCE(f.farming_category, s.business_category) AS category
//        FROM users u
//        LEFT JOIN farmers f ON f.user_id = u.id
//        LEFT JOIN startups s ON s.user_id = u.id
//        WHERE u.status = 'pending'
//        ORDER BY u.created_at ASC`
//     );
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load pending users.' });
//   }
// });

// // ── PATCH: Approve or Reject a User ───────────────────────────
// app.patch('/api/admin/users/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
//   const { status } = req.body;

//   if (!['approved', 'rejected'].includes(status)) {
//     return res.status(400).json({ message: 'Status must be approved or rejected.' });
//   }

//   try {
//     await db.execute(
//       `UPDATE users SET status = ? WHERE id = ?`,
//       [status, req.params.id]
//     );
//     res.json({ message: `User has been ${status}.` });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not update user status.' });
//   }
// });

// // ── GET: All Users (for admin management) ─────────────────────
// app.get('/api/admin/users', verifyToken, requireRole('admin'), async (req, res) => {
//   try {
//     const [users] = await db.execute(
//       `SELECT id, full_name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC`
//     );
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load users.' });
//   }
// });

// // ── GET: Flagged Content ───────────────────────────────────────
// app.get('/api/admin/flagged', verifyToken, requireRole('admin'), async (req, res) => {
//   try {
//     const [recipes] = await db.execute(
//       `SELECT r.*, u.full_name AS author_name FROM recipes r
//        JOIN users u ON r.author_id = u.id WHERE r.is_flagged = TRUE`
//     );
//     const [reviews] = await db.execute(
//       `SELECT rv.*, u.full_name AS reviewer_name FROM reviews rv
//        JOIN users u ON rv.reviewer_id = u.id WHERE rv.is_flagged = TRUE`
//     );
//     res.json({ flagged_recipes: recipes, flagged_reviews: reviews });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load flagged content.' });
//   }
// });

// // ── DELETE: Remove a Recipe ────────────────────────────────────
// app.delete('/api/admin/recipes/:id', verifyToken, requireRole('admin'), async (req, res) => {
//   try {
//     await db.execute(`DELETE FROM recipes WHERE id = ?`, [req.params.id]);
//     res.json({ message: 'Recipe removed successfully.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not remove recipe.' });
//   }
// });

// // ── POST: Flag a Recipe (any logged-in user can report) ───────
// app.post('/api/recipes/:id/flag', verifyToken, async (req, res) => {
//   try {
//     await db.execute(`UPDATE recipes SET is_flagged = TRUE WHERE id = ?`, [req.params.id]);
//     res.json({ message: 'Recipe reported. Admin will review it.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not flag recipe.' });
//   }
// });

// // ── GET: All Farmer Products (for startup to browse) ──────────
// app.get('/api/farmer-products', verifyToken, async (req, res) => {
//   try {
//     const [products] = await db.execute(
//       `SELECT p.*, u.full_name AS farmer_name
//        FROM products p
//        JOIN users u ON p.seller_id = u.id
//        WHERE p.seller_type = 'farmer' AND p.is_active = TRUE 
//        AND p.stock_available > 0 AND u.status = 'approved'
//        ORDER BY p.created_at DESC`
//     );
//     res.json(products);
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load farmer products.' });
//   }
// });

// // ════════════════════════════════════════════════════════════
// //  MILLET HEALTH LIBRARY ROUTES
// // ════════════════════════════════════════════════════════════

// const milletImageUpload = upload.single('image');

// // ── GET: All published millets (PUBLIC — no auth needed) ─────
// app.get('/api/millets', async (req, res) => {
//   try {
//     const [millets] = await db.execute(
//       `SELECT * FROM millet_health WHERE is_published = TRUE ORDER BY name ASC`
//     );

//     // For each millet, fetch its nutrition separately
//     const result = await Promise.all(millets.map(async (m) => {
//       const [nutrition] = await db.execute(
//         `SELECT nutrient_name, value_per_100g FROM millet_nutrition WHERE millet_id = ?`,
//         [m.id]
//       );
//       return { ...m, nutrition };
//     }));

//     res.json(result);
//   } catch (err) {
//     console.error('Get millets error:', err);
//     res.status(500).json({ message: 'Could not load millet data.' });
//   }
// });

// // ── GET: Single millet by ID (PUBLIC) ────────────────────────
// app.get('/api/millets/:id', async (req, res) => {
//   try {
//     const [[millet]] = await db.execute(
//       `SELECT m.*,
//         (SELECT COUNT(*) FROM millet_likes WHERE millet_id = m.id) AS likes_count
//        FROM millet_health m
//        WHERE m.id = ? AND m.is_published = TRUE`,
//       [req.params.id]
//     );
//     if (!millet) return res.status(404).json({ message: 'Not found.' });

//     const [nutrition] = await db.execute(
//       `SELECT nutrient_name, value_per_100g FROM millet_nutrition WHERE millet_id = ?`,
//       [req.params.id]
//     );
//     res.json({ ...millet, nutrition });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load millet.' });
//   }
// });

// // ── POST: Like or unlike a millet (logged-in users) ──────────
// app.post('/api/millets/:id/like', verifyToken, async (req, res) => {
//   try {
//     // Check if already liked
//     const [[existing]] = await db.execute(
//       `SELECT id FROM millet_likes WHERE millet_id = ? AND user_id = ?`,
//       [req.params.id, req.user.id]
//     );

//     if (existing) {
//       // Unlike
//       await db.execute(
//         `DELETE FROM millet_likes WHERE millet_id = ? AND user_id = ?`,
//         [req.params.id, req.user.id]
//       );
//       return res.json({ message: 'Removed from bookmarks.', liked: false });
//     }

//     // Like
//     await db.execute(
//       `INSERT INTO millet_likes (millet_id, user_id) VALUES (?, ?)`,
//       [req.params.id, req.user.id]
//     );
//     res.json({ message: 'Bookmarked!', liked: true });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not update bookmark.' });
//   }
// });

// // ── GET: Check which millets a user has liked ─────────────────
// app.get('/api/millets/user/likes', verifyToken, async (req, res) => {
//   try {
//     const [rows] = await db.execute(
//       `SELECT millet_id FROM millet_likes WHERE user_id = ?`,
//       [req.user.id]
//     );
//     res.json(rows.map(r => r.millet_id));
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load bookmarks.' });
//   }
// });

// // ── GET: Admin — all millets including unpublished ────────────
// app.get('/api/admin/millets', verifyToken, requireRole('admin'), async (req, res) => {
//   try {
//     const [millets] = await db.execute(
//       `SELECT m.*,
//         (SELECT COUNT(*) FROM millet_nutrition WHERE millet_id = m.id) AS nutrition_count,
//         (SELECT COUNT(*) FROM millet_likes    WHERE millet_id = m.id) AS likes_count
//        FROM millet_health m
//        ORDER BY m.created_at DESC`
//     );
//     res.json(millets);
//   } catch (err) {
//     res.status(500).json({ message: 'Could not load millets.' });
//   }
// });

// // ── POST: Admin adds a millet ─────────────────────────────────
// app.post('/api/admin/millets', verifyToken, requireRole('admin'), milletImageUpload, async (req, res) => {
//   const { name, scientific_name, description, benefits, source_url, nutrition } = req.body;

//   if (!name || !description || !benefits) {
//     return res.status(400).json({ message: 'Name, description, and benefits are required.' });
//   }

//   try {
//     const imageFile = req.file?.filename || null;

//     const [result] = await db.execute(
//       `INSERT INTO millet_health
//          (name, scientific_name, description, benefits, source_url, image_filename, created_by)
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [name, scientific_name || null, description, benefits,
//        source_url || null, imageFile, req.user.id]
//     );
//     const milletId = result.insertId;

//     if (nutrition) {
//       const rows = JSON.parse(nutrition);
//       for (const row of rows) {
//         if (row.nutrient && row.value) {
//           await db.execute(
//             `INSERT INTO millet_nutrition (millet_id, nutrient_name, value_per_100g)
//              VALUES (?, ?, ?)`,
//             [milletId, row.nutrient, row.value]
//           );
//         }
//       }
//     }

//     res.status(201).json({ message: 'Millet entry added!', id: milletId });
//   } catch (err) {
//     console.error('Add millet error:', err);
//     res.status(500).json({ message: 'Could not add millet.' });
//   }
// });

// // ── PUT: Admin updates a millet ───────────────────────────────
// app.put('/api/admin/millets/:id', verifyToken, requireRole('admin'), milletImageUpload, async (req, res) => {
//   const { name, scientific_name, description, benefits, source_url, nutrition, is_published } = req.body;

//   try {
//     const imageFile = req.file?.filename || null;
//     const fields = [name, scientific_name || null, description, benefits,
//                     source_url || null, is_published ?? 1];
//     let query = `UPDATE millet_health
//                  SET name=?, scientific_name=?, description=?, benefits=?,
//                      source_url=?, is_published=?`;
//     if (imageFile) { query += ', image_filename=?'; fields.push(imageFile); }
//     query += ', updated_at=NOW() WHERE id=?';
//     fields.push(req.params.id);

//     await db.execute(query, fields);

//     if (nutrition) {
//       await db.execute(`DELETE FROM millet_nutrition WHERE millet_id = ?`, [req.params.id]);
//       const rows = JSON.parse(nutrition);
//       for (const row of rows) {
//         if (row.nutrient && row.value) {
//           await db.execute(
//             `INSERT INTO millet_nutrition (millet_id, nutrient_name, value_per_100g)
//              VALUES (?, ?, ?)`,
//             [req.params.id, row.nutrient, row.value]
//           );
//         }
//       }
//     }

//     res.json({ message: 'Millet entry updated.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not update millet.' });
//   }
// });

// // ── DELETE: Admin removes a millet ───────────────────────────
// app.delete('/api/admin/millets/:id', verifyToken, requireRole('admin'), async (req, res) => {
//   try {
//     await db.execute(`DELETE FROM millet_health WHERE id = ?`, [req.params.id]);
//     res.json({ message: 'Millet entry deleted.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Could not delete millet.' });
//   }
// });

// // ── POST: Toggle like/bookmark a millet ───────────────────────
// // app.post('/api/millets/:id/like', verifyToken, async (req, res) => {
// //   const milletId = req.params.id;
// //   const userId   = req.user.id;
// //   try {
// //     // Check if already liked
// //     const [existing] = await db.execute(
// //       `SELECT id FROM millet_likes WHERE millet_id = ? AND user_id = ?`,
// //       [milletId, userId]
// //     );

// //     if (existing.length > 0) {
// //       // Unlike — remove row and decrement
// //       await db.execute(
// //         `DELETE FROM millet_likes WHERE millet_id = ? AND user_id = ?`,
// //         [milletId, userId]
// //       );
// //       await db.execute(
// //         `UPDATE millet_health SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?`,
// //         [milletId]
// //       );
// //       res.json({ message: 'Bookmark removed.', liked: false });
// //     } else {
// //       // Like — insert row and increment
// //       await db.execute(
// //         `INSERT INTO millet_likes (millet_id, user_id) VALUES (?, ?)`,
// //         [milletId, userId]
// //       );
// //       await db.execute(
// //         `UPDATE millet_health SET likes_count = likes_count + 1 WHERE id = ?`,
// //         [milletId]
// //       );
// //       res.json({ message: 'Bookmarked!', liked: true });
// //     }
// //   } catch (err) {
// //     console.error('Millet like error:', err);
// //     res.status(500).json({ message: 'Could not update bookmark.' });
// //   }
// // });

// // // ── GET: Get all millet IDs liked by current user ─────────────
// // app.get('/api/millets/user/likes', verifyToken, async (req, res) => {
// //   try {
// //     const [rows] = await db.execute(
// //       `SELECT millet_id FROM millet_likes WHERE user_id = ?`,
// //       [req.user.id]
// //     );
// //     res.json(rows.map(r => r.millet_id));
// //   } catch (err) {
// //     res.status(500).json({ message: 'Could not load liked millets.' });
// //   }
// // });
// // ════════════════════════════════════════════════════════════
// //  START THE SERVER
// // ════════════════════════════════════════════════════════════
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`\n🌾 Millet Platform Server is running!`);
//   console.log(`👉 Open your browser and go to: http://localhost:${PORT}`);
//   console.log(`📡 API is available at: http://localhost:${PORT}/api`);
// });

// ============================================================
// server.js — Complete Backend for Millet Supply Chain Platform
// ============================================================

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../shree-anna-react/build')));

// ─────────────────────────────────────────────
// DATABASE CONNECTION
// ─────────────────────────────────────────────
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
}).promise();

db.query('SELECT 1')
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err.message));

// ─────────────────────────────────────────────
// FILE UPLOAD SETUP
// ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s/g, '-');
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed'));
    }
  }
});

const registrationUpload = upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'upi_qr', maxCount: 1 }
]);

const milletImageUpload = upload.single('image');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. Please login first.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Session expired. Please login again.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. This is for ${roles.join('/')} only.` });
    }
    next();
  };
}

async function createOtp(identifier, expiryMins = 10) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + expiryMins * 60 * 1000);
  await db.execute(
    `INSERT INTO otps (phone, otp_code, expires_at) VALUES (?, ?, ?)`,
    [identifier, code, expiresAt]
  );
  return code;
}

async function verifyOtp(identifier, code) {
  const [rows] = await db.execute(
    `SELECT * FROM otps
     WHERE phone = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [identifier, code]
  );
  if (rows.length === 0) return false;
  await db.execute(`UPDATE otps SET is_used = TRUE WHERE id = ?`, [rows[0].id]);
  return true;
}

// ════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════════

// ── POST: Email + Password login (farmer, startup, admin) ────
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE email = ? AND role IN ('farmer','startup','admin')`,
      [identifier]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'No account found with this email.' });

    const user = rows[0];
    if (user.status === 'pending')
      return res.status(403).json({ message: 'Your account is pending admin approval.' });
    if (user.status === 'rejected')
      return res.status(403).json({ message: 'Your account was rejected. Contact support.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: 'Incorrect password.' });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ message: 'Login successful!', token, role: user.role, name: user.full_name, id: user.id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ── POST: Farmer — Send OTP to phone for login ───────────────
app.post('/api/auth/farmer/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10)
    return res.status(400).json({ message: 'Enter a valid 10-digit phone number.' });

  try {
    const [rows] = await db.execute(
      `SELECT id, status FROM users WHERE phone = ? AND role = 'farmer'`, [phone]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'No farmer account with this phone number.' });
    if (rows[0].status === 'pending')
      return res.status(403).json({ message: 'Your account is pending admin approval.' });
    if (rows[0].status === 'rejected')
      return res.status(403).json({ message: 'Your account was rejected.' });

    const code = await createOtp(phone, 5);
    console.log(`📱 Farmer login OTP for ${phone}: ${code}`);
    res.json({ message: 'OTP sent to your phone!', dev_otp: code });
  } catch (err) {
    console.error('Farmer send OTP error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ── POST: Farmer — Verify OTP and login ──────────────────────
app.post('/api/auth/farmer/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  try {
    const valid = await verifyOtp(phone, otp);
    if (!valid)
      return res.status(400).json({ message: 'Invalid or expired OTP.' });

    const [user] = await db.execute(
      `SELECT * FROM users WHERE phone = ? AND role = 'farmer'`, [phone]
    );
    const token = jwt.sign(
      { id: user[0].id, role: user[0].role, name: user[0].full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ message: 'Login successful!', token, role: user[0].role, name: user[0].full_name, id: user[0].id });
  } catch (err) {
    console.error('Farmer verify OTP error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ── POST: Farmer — Send forgot password OTP to email ─────────
app.post('/api/auth/farmer/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const [rows] = await db.execute(
      `SELECT id FROM users WHERE email = ? AND role = 'farmer'`, [email]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'No farmer account found with this email.' });

    const code = await createOtp(email, 10);
    console.log(`🔑 Farmer reset OTP for ${email}: ${code}`);
    res.json({ message: 'OTP sent to your email.', dev_otp: code });
  } catch (err) {
    console.error('Farmer forgot password error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ── POST: Farmer — Reset password ────────────────────────────
app.post('/api/auth/farmer/reset-password', async (req, res) => {
  const { email, otp, new_password } = req.body;
  if (!email || !otp || !new_password)
    return res.status(400).json({ message: 'Email, OTP and new password are required.' });
  if (new_password.length < 8)
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  try {
    const valid = await verifyOtp(email, otp);
    if (!valid)
      return res.status(400).json({ message: 'Invalid or expired OTP.' });

    const hash = await bcrypt.hash(new_password, 10);
    await db.execute(
      `UPDATE users SET password_hash = ? WHERE email = ? AND role = 'farmer'`,
      [hash, email]
    );
    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    console.error('Farmer reset password error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ── POST: Startup — Forgot password (OTP to email) ───────────
app.post('/api/auth/startup/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const [rows] = await db.execute(
      `SELECT id FROM users WHERE email = ? AND role = 'startup'`, [email]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'No startup account found with this email.' });

    const code = await createOtp(email, 10);
    console.log(`📧 Startup reset OTP for ${email}: ${code}`);
    res.json({ message: 'OTP sent to your email.', dev_otp: code });
  } catch (err) {
    console.error('Startup forgot password error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ── POST: Startup — Reset password ───────────────────────────
app.post('/api/auth/startup/reset-password', async (req, res) => {
  const { email, otp, new_password } = req.body;
  if (!email || !otp || !new_password)
    return res.status(400).json({ message: 'Email, OTP and new password are required.' });
  if (new_password.length < 8)
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  try {
    const valid = await verifyOtp(email, otp);
    if (!valid)
      return res.status(400).json({ message: 'Invalid or expired OTP.' });

    const hash = await bcrypt.hash(new_password, 10);
    await db.execute(
      `UPDATE users SET password_hash = ? WHERE email = ? AND role = 'startup'`,
      [hash, email]
    );
    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    console.error('Startup reset password error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ── POST: Customer — Send OTP (auto-creates account if new) ──
app.post('/api/auth/customer/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10)
    return res.status(400).json({ message: 'Enter a valid 10-digit phone number.' });

  try {
    const [existing] = await db.execute(
      `SELECT id, status, has_password FROM users WHERE phone = ? AND role = 'customer'`,
      [phone]
    );
    if (existing.length > 0 && existing[0].status === 'banned')
      return res.status(403).json({ message: 'This account has been banned.' });

    let isNew = false;
    if (existing.length === 0) {
  const customerName = req.body.name?.trim() || `Customer_${phone.slice(-4)}`;
  await db.execute(
    `INSERT INTO users (full_name, phone, role, status, has_password)
     VALUES (?, ?, 'customer', 'approved', FALSE)`,
    [customerName, phone]
  );
  isNew = true;
}

    const code = await createOtp(phone, 5);
    console.log(`📱 Customer OTP for ${phone}: ${code}`);
    res.json({
      message: isNew ? 'Account created! OTP sent.' : 'OTP sent!',
      dev_otp: code,
      is_new: isNew,
      has_password: existing[0]?.has_password || false,
    });
  } catch (err) {
    console.error('Customer send OTP error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ── POST: Customer — Verify OTP and login ────────────────────
app.post('/api/auth/customer/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  try {
    const valid = await verifyOtp(phone, otp);
    if (!valid)
      return res.status(400).json({ message: 'Invalid or expired OTP.' });

    const [user] = await db.execute(
      `SELECT * FROM users WHERE phone = ? AND role = 'customer'`, [phone]
    );
    const token = jwt.sign(
      { id: user[0].id, role: user[0].role, name: user[0].full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({
      message: 'Login successful!', token,
      role: user[0].role, name: user[0].full_name, id: user[0].id,
      has_password: user[0].has_password,
    });
  } catch (err) {
    console.error('Customer verify OTP error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ── POST: Customer — Set password ────────────────────────────
app.post('/api/auth/customer/set-password', verifyToken, async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 8)
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  try {
    const hash = await bcrypt.hash(new_password, 10);
    await db.execute(
      `UPDATE users SET password_hash = ?, has_password = TRUE WHERE id = ? AND role = 'customer'`,
      [hash, req.user.id]
    );
    res.json({ message: 'Password set successfully!' });
  } catch (err) {
    console.error('Customer set password error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ── POST: Customer — Password login ──────────────────────────
app.post('/api/auth/customer/login-password', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password)
    return res.status(400).json({ message: 'Phone and password are required.' });

  try {
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE phone = ? AND role = 'customer' AND has_password = TRUE`,
      [phone]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'No account found or password not set yet.' });

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid)
      return res.status(401).json({ message: 'Incorrect password.' });

    const token = jwt.sign(
      { id: rows[0].id, role: rows[0].role, name: rows[0].full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ message: 'Login successful!', token, role: rows[0].role, name: rows[0].full_name, id: rows[0].id });
  } catch (err) {
    console.error('Customer password login error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ── POST: Farmer Registration ─────────────────────────────────
app.post('/api/auth/register/farmer', registrationUpload, async (req, res) => {
  const { full_name, email, phone, age, gender, license_number, farming_category, password } = req.body;

  if (!full_name || !phone || !age || !gender || !license_number || !farming_category || !password) {
    return res.status(400).json({ message: 'All required fields must be filled.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const aadhaarFile = req.files?.aadhaar?.[0]?.filename || null;
    const photoFile = req.files?.photo?.[0]?.filename || null;
    const upiFile = req.files?.upi_qr?.[0]?.filename || null;
    const emailValue = email?.trim() || null;

    const [userResult] = await db.execute(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status, aadhaar_doc, profile_photo, upi_qr)
       VALUES (?, ?, ?, ?, 'farmer', 'pending', ?, ?, ?)`,
      [full_name, emailValue, phone, passwordHash, aadhaarFile, photoFile, upiFile]
    );
    const newUserId = userResult.insertId;

    await db.execute(
      `INSERT INTO farmers (user_id, age, gender, license_number, farming_category)
       VALUES (?, ?, ?, ?, ?)`,
      [newUserId, age, gender, license_number, farming_category]
    );

    res.status(201).json({
      message: 'Registration submitted successfully! Please wait for admin approval before logging in.'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email, phone number, or license is already registered.' });
    }
    console.error('Farmer registration error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ── POST: Startup Registration ────────────────────────────────
app.post('/api/auth/register/startup', registrationUpload, async (req, res) => {
  const { full_name, email, phone, age, gender, license_number, business_category, password } = req.body;

  if (!full_name || !email || !phone || !age || !gender || !license_number || !business_category || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const aadhaarFile = req.files?.aadhaar?.[0]?.filename || null;
    const photoFile = req.files?.photo?.[0]?.filename || null;
    const upiFile = req.files?.upi_qr?.[0]?.filename || null;

    const [userResult] = await db.execute(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status, aadhaar_doc, profile_photo, upi_qr)
       VALUES (?, ?, ?, ?, 'startup', 'pending', ?, ?, ?)`,
      [full_name, email, phone, passwordHash, aadhaarFile, photoFile, upiFile]
    );
    const newUserId = userResult.insertId;

    await db.execute(
      `INSERT INTO startups (user_id, age, gender, license_number, business_category)
       VALUES (?, ?, ?, ?, ?)`,
      [newUserId, age, gender, license_number, business_category]
    );

    res.status(201).json({ message: 'Registration submitted! Please wait for admin approval.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email, phone number, or license is already registered.' });
    }
    console.error('Startup registration error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
//  FARMER ROUTES
// ════════════════════════════════════════════════════════════

app.get('/api/farmer/dashboard', verifyToken, requireRole('farmer'), async (req, res) => {
  const farmerId = req.user.id;
  try {
    const [[products]] = await db.execute(
      `SELECT COUNT(*) as total FROM products WHERE seller_id = ? AND is_active = TRUE`, [farmerId]
    );
    const [[pendingOrders]] = await db.execute(
      `SELECT COUNT(*) as total FROM orders WHERE seller_id = ? AND status = 'pending'`, [farmerId]
    );
    const [[revenue]] = await db.execute(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders
       WHERE seller_id = ? AND status = 'delivered' AND MONTH(created_at) = MONTH(NOW())`,
      [farmerId]
    );
    const [[rating]] = await db.execute(
      `SELECT COALESCE(AVG(rating), 0) as avg FROM reviews WHERE seller_id = ?`, [farmerId]
    );
    res.json({
      total_products: products.total,
      pending_orders: pendingOrders.total,
      monthly_revenue: revenue.total,
      avg_rating: parseFloat(rating.avg).toFixed(1)
    });
  } catch (err) {
    console.error('Farmer dashboard error:', err);
    res.status(500).json({ message: 'Could not load dashboard.' });
  }
});

app.post('/api/farmer/products', verifyToken, requireRole('farmer'), async (req, res) => {
  const { name, category, quantity, price_per_unit, description, unit } = req.body;
  const farmerId = req.user.id;
  if (!name || !category || !quantity || !price_per_unit)
    return res.status(400).json({ message: 'Product name, category, quantity, and price are required.' });

  try {
    await db.execute(
      `INSERT INTO products (seller_id, seller_type, name, category, quantity, price_per_unit, stock_available, unit, description)
       VALUES (?, 'farmer', ?, ?, ?, ?, ?, ?, ?)`,
      [farmerId, name, category, quantity, price_per_unit, quantity, unit || 'kg', description || '']
    );
    res.status(201).json({ message: 'Product listed successfully!' });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ message: 'Could not add product.' });
  }
});

app.get('/api/farmer/products', verifyToken, requireRole('farmer'), async (req, res) => {
  try {
    const [products] = await db.execute(
      `SELECT * FROM products WHERE seller_id = ? AND is_active = TRUE ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Could not load products.' });
  }
});

app.get('/api/farmer/orders', verifyToken, requireRole('farmer'), async (req, res) => {
  try {
    const [orders] = await db.execute(
      `SELECT o.*, p.name AS product_name,
        u.full_name AS buyer_name, u.role AS buyer_role,
        u.phone AS buyer_phone, u.email AS buyer_email
 FROM orders o
 JOIN products p ON o.product_id = p.id
 JOIN users u ON o.buyer_id = u.id
 WHERE o.seller_id = ?
 ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Could not load orders.' });
  }
});

app.patch('/api/farmer/orders/:id/status', verifyToken, requireRole('farmer'), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: 'Invalid status value.' });

  try {
    await db.execute(
      `UPDATE orders SET status = ? WHERE id = ? AND seller_id = ?`,
      [status, req.params.id, req.user.id]
    );
    res.json({ message: 'Order status updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update order.' });
  }
});

app.get('/api/farmer/reviews', verifyToken, requireRole('farmer'), async (req, res) => {
  try {
    const [reviews] = await db.execute(
      `SELECT r.*, u.full_name AS reviewer_name, p.name AS product_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       JOIN products p ON r.product_id = p.id
       WHERE r.seller_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Could not load reviews.' });
  }
});

// ════════════════════════════════════════════════════════════
//  STARTUP ROUTES
// ════════════════════════════════════════════════════════════

app.get('/api/startup/dashboard', verifyToken, requireRole('startup'), async (req, res) => {
  const startupId = req.user.id;
  try {
    const [[products]] = await db.execute(
      `SELECT COUNT(*) as total FROM products WHERE seller_id = ? AND is_active = TRUE`, [startupId]
    );
    const [[customerOrders]] = await db.execute(
      `SELECT COUNT(*) as total FROM orders WHERE seller_id = ?`, [startupId]
    );
    const [[rawOrders]] = await db.execute(
      `SELECT COUNT(*) as total FROM orders WHERE buyer_id = ?`, [startupId]
    );
    const [[revenue]] = await db.execute(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE seller_id = ? AND status = 'delivered'`,
      [startupId]
    );
    res.json({
      total_products: products.total,
      customer_orders: customerOrders.total,
      raw_material_orders: rawOrders.total,
      total_revenue: revenue.total
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load dashboard.' });
  }
});

app.post('/api/startup/buy-raw-material', verifyToken, requireRole('startup'), async (req, res) => {
  const { product_id, quantity, delivery_address } = req.body;
  const buyerId = req.user.id;
  if (!product_id || !quantity)
    return res.status(400).json({ message: 'Product and quantity are required.' });

  try {
    const [[product]] = await db.execute(
      `SELECT * FROM products WHERE id = ? AND seller_type = 'farmer' AND is_active = TRUE AND stock_available >= ?`,
      [product_id, quantity]
    );
    if (!product)
      return res.status(400).json({ message: 'Product not available or not enough stock.' });

    const totalAmount = product.price_per_unit * quantity;
    const orderNumber = 'ORD-' + Date.now();

    await db.execute(
      `INSERT INTO orders (order_number, buyer_id, seller_id, product_id, quantity, total_amount, delivery_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, buyerId, product.seller_id, product_id, quantity, totalAmount, delivery_address || '']
    );
    await db.execute(
      `UPDATE products SET stock_available = stock_available - ? WHERE id = ?`,
      [quantity, product_id]
    );
    const [newOrder] = await db.execute(`SELECT id FROM orders WHERE order_number = ?`, [orderNumber]);
    res.status(201).json({ message: 'Order placed successfully!', order_number: orderNumber, total_amount: totalAmount, order_id: newOrder[0].id });
  } catch (err) {
    console.error('Buy raw material error:', err);
    res.status(500).json({ message: 'Could not place order.' });
  }
});

app.post('/api/startup/products', verifyToken, requireRole('startup'), async (req, res) => {
  const { name, category, quantity, price_per_unit, description, unit } = req.body;
  const startupId = req.user.id;
  if (!name || !category || !quantity || !price_per_unit)
    return res.status(400).json({ message: 'All product fields are required.' });

  try {
    await db.execute(
      `INSERT INTO products (seller_id, seller_type, name, category, quantity, price_per_unit, stock_available, unit, description)
       VALUES (?, 'startup', ?, ?, ?, ?, ?, ?, ?)`,
      [startupId, name, category, quantity, price_per_unit, quantity, unit || 'kg', description || '']
    );
    res.status(201).json({ message: 'Product listed successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Could not list product.' });
  }
});

app.get('/api/startup/orders', verifyToken, requireRole('startup'), async (req, res) => {
  const startupId = req.user.id;
  try {
    const [sales] = await db.execute(
      `SELECT o.*, p.name AS product_name,
        u.full_name AS buyer_name, u.role AS buyer_role,
        u.phone AS buyer_phone, u.email AS buyer_email,
        'sale' AS order_type
 FROM orders o
 JOIN products p ON o.product_id = p.id
 JOIN users u ON o.buyer_id = u.id
 WHERE o.seller_id = ? ORDER BY o.created_at DESC`,
      [startupId]
    );
    const [purchases] = await db.execute(
      `SELECT o.*, p.name AS product_name, p.id AS product_id,
        u.full_name AS seller_name, u.id AS seller_id
 FROM orders o
 JOIN products p ON o.product_id = p.id
 JOIN users u ON o.seller_id = u.id
 WHERE o.buyer_id = ?
 ORDER BY o.created_at DESC`,
      [startupId]
    );
    res.json({ sales, purchases });
  } catch (err) {
    res.status(500).json({ message: 'Could not load orders.' });
  }
});

// ── GET: Startup — Sales orders with full customer details ────
app.get('/api/startup/orders/customers', verifyToken, requireRole('startup'), async (req, res) => {
  try {
    const [orders] = await db.execute(
      `SELECT o.*, p.name AS product_name,
              u.full_name AS buyer_name, u.phone AS buyer_phone,
              u.email AS buyer_email, o.delivery_address
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users u ON o.buyer_id = u.id
       WHERE o.seller_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Could not load customer orders.' });
  }
});

// ── PATCH: Startup order status update ────────────────────────
app.patch('/api/startup/orders/:id/status', verifyToken, requireRole('startup'), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['confirmed', 'shipped', 'cancelled'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: 'Invalid status.' });
  try {
    const [result] = await db.execute(
      `UPDATE orders SET status = ? WHERE id = ? AND seller_id = ?`,
      [status, req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res.status(400).json({ message: 'Order not found.' });
    res.json({ message: 'Order status updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update order.' });
  }
});

// ════════════════════════════════════════════════════════════
//  CUSTOMER ROUTES
// ════════════════════════════════════════════════════════════

app.get('/api/customer/products', verifyToken, async (req, res) => {
  const { seller_type, category } = req.query;
  let query = `
    SELECT p.*, u.full_name AS seller_name, u.role AS seller_role,
           COALESCE(AVG(r.rating), 0) AS avg_rating,
           COUNT(r.id) AS review_count
    FROM products p
    JOIN users u ON p.seller_id = u.id
    LEFT JOIN reviews r ON r.product_id = p.id
    WHERE p.is_active = TRUE AND p.stock_available > 0 AND u.status = 'approved'
  `;
  const params = [];
  if (seller_type) { query += ` AND p.seller_type = ?`; params.push(seller_type); }
  if (category) { query += ` AND p.category = ?`; params.push(category); }
  query += ` GROUP BY p.id ORDER BY avg_rating DESC`;

  try {
    const [products] = await db.execute(query, params);
    res.json(products);
  } catch (err) {
    console.error('Browse products error:', err);
    res.status(500).json({ message: 'Could not load products.' });
  }
});

app.post('/api/customer/orders', verifyToken, requireRole('customer'), async (req, res) => {
  const { product_id, quantity, delivery_address, payment_method, delivery_method } = req.body;
  const customerId = req.user.id;
  if (!product_id || !quantity || !delivery_address)
    return res.status(400).json({ message: 'Product, quantity, and delivery address are required.' });

  try {
    const [[product]] = await db.execute(
      `SELECT * FROM products WHERE id = ? AND is_active = TRUE AND stock_available >= ?`,
      [product_id, quantity]
    );
    if (!product)
      return res.status(400).json({ message: 'Product not available or not enough stock.' });

    const totalAmount = product.price_per_unit * quantity;
    const orderNumber = 'ORD-' + Date.now();

    await db.execute(
  `INSERT INTO orders (order_number, buyer_id, seller_id, product_id, quantity, total_amount,
                       delivery_address, payment_method, delivery_method)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [orderNumber, customerId, product.seller_id, product_id, quantity, totalAmount,
   delivery_address, payment_method || 'cod', delivery_method || 'self']
);
    await db.execute(
      `UPDATE products SET stock_available = stock_available - ? WHERE id = ?`,
      [quantity, product_id]
    );
    const [newOrder] = await db.execute(`SELECT id FROM orders WHERE order_number = ?`, [orderNumber]);
res.status(201).json({ message: 'Order placed successfully!', order_number: orderNumber, total_amount: totalAmount, order_id: newOrder[0].id });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ message: 'Could not place order.' });
  }
});

app.get('/api/customer/orders', verifyToken, requireRole('customer'), async (req, res) => {
  try {
    const [orders] = await db.execute(
  `SELECT o.*, p.name AS product_name, p.id AS product_id,
    u.full_name AS seller_name, u.id AS seller_id,
    o.payment_method, o.payment_status, o.delivery_method
 FROM orders o
   JOIN products p ON o.product_id = p.id
   JOIN users u ON o.seller_id = u.id
   WHERE o.buyer_id = ?
   ORDER BY o.created_at DESC`,   // ← comma added here
  [req.user.id]
);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Could not load orders.' });
  }
});

app.post('/api/customer/reviews', verifyToken, requireRole('customer'), async (req, res) => {
  const { order_id, product_id, seller_id, rating, comment } = req.body;
  if (!order_id || !product_id || !seller_id || !rating)
    return res.status(400).json({ message: 'Order, product, seller, and rating are required.' });
  if (rating < 1 || rating > 5)
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });

  try {
    // Must be a delivered order belonging to this customer
    const [[order]] = await db.execute(
      `SELECT id FROM orders WHERE id = ? AND buyer_id = ? AND status = 'delivered'`,
      [order_id, req.user.id]
    );
    if (!order)
      return res.status(403).json({ message: 'You can only review delivered orders.' });

    // One review per order
    const [[existing]] = await db.execute(
      `SELECT id FROM reviews WHERE order_id = ? AND reviewer_id = ?`,
      [order_id, req.user.id]
    );
    if (existing)
      return res.status(400).json({ message: 'You have already reviewed this order.' });

    await db.execute(
      `INSERT INTO reviews (reviewer_id, seller_id, product_id, order_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, seller_id, product_id, order_id, rating, comment || '']
    );
    res.status(201).json({ message: 'Review submitted. Thank you!' });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ message: 'Could not submit review.' });
  }
});

// ── GET: Reviews for a specific product (public) ──────────────
app.get('/api/reviews/product/:id', verifyToken, async (req, res) => {
  try {
    const [reviews] = await db.execute(
      `SELECT r.*, u.full_name AS reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.product_id = ? AND r.is_flagged = FALSE
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Could not load reviews.' });
  }
});

// ── GET: Check which orders the customer has already reviewed ──
app.get('/api/customer/reviewed-orders', verifyToken, requireRole('customer'), async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT order_id FROM reviews WHERE reviewer_id = ?`,
      [req.user.id]
    );
    res.json(rows.map(r => r.order_id));
  } catch (err) {
    res.status(500).json({ message: 'Could not load reviewed orders.' });
  }
});

// ── POST: Flag a review ───────────────────────────────────────
app.post('/api/reviews/:id/flag', verifyToken, async (req, res) => {
  try {
    await db.execute(`UPDATE reviews SET is_flagged = TRUE WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Review reported. Admin will review it.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not flag review.' });
  }
});

// ── GET: Startup reviews received ────────────────────────────
app.get('/api/startup/reviews', verifyToken, requireRole('startup'), async (req, res) => {
  try {
    const [reviews] = await db.execute(
      `SELECT r.*, u.full_name AS reviewer_name, p.name AS product_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       JOIN products p ON r.product_id = p.id
       WHERE r.seller_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Could not load reviews.' });
  }
});

// ── PATCH: Customer confirms delivery ─────────────────────────
app.patch('/api/customer/orders/:id/confirm-delivery', verifyToken, requireRole('customer'), async (req, res) => {
  try {
    const [result] = await db.execute(
      `UPDATE orders SET status = 'delivered'
       WHERE id = ? AND buyer_id = ? AND status = 'shipped'`,
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res.status(400).json({ message: 'Order not found or not yet shipped.' });
    res.json({ message: 'Delivery confirmed! Thank you.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not confirm delivery.' });
  }
});

// ── PATCH: Seller marks payment as received ───────────────────
app.patch('/api/orders/:id/mark-paid', verifyToken, requireRole('farmer','startup'), async (req, res) => {
  try {
    const [result] = await db.execute(
      `UPDATE orders SET payment_status = 'paid'
       WHERE id = ? AND seller_id = ? AND payment_status = 'pending'`,
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res.status(400).json({ message: 'Order not found or already marked paid.' });
    res.json({ message: 'Payment marked as received.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update payment.' });
  }
});

// ── GET: Seller UPI QR for a given order ─────────────────────
app.get('/api/orders/:id/seller-upi', verifyToken, async (req, res) => {
  try {
    const [[order]] = await db.execute(
      `SELECT o.id, o.total_amount, o.payment_method, o.payment_status,
              u.full_name AS seller_name, u.upi_qr, u.phone AS seller_phone
       FROM orders o
       JOIN users u ON o.seller_id = u.id
       WHERE o.id = ? AND o.buyer_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Could not load payment info.' });
  }
});

// ════════════════════════════════════════════════════════════
//  RECIPE ROUTES
// ════════════════════════════════════════════════════════════

app.get('/api/recipes', verifyToken, async (req, res) => {
  try {
    const [recipes] = await db.execute(
      `SELECT r.*, u.full_name AS author_name,
       (SELECT COUNT(*) FROM recipe_comments WHERE recipe_id = r.id) AS comments_count
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       WHERE r.is_flagged = FALSE
       ORDER BY r.created_at DESC`
    );
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: 'Could not load recipes.' });
  }
});

app.post('/api/recipes', verifyToken, async (req, res) => {
  const { title, short_description, content, youtube_link } = req.body;
  if (!title || !short_description || !content)
    return res.status(400).json({ message: 'Title, short description, and recipe description are required.' });
  if (youtube_link && !youtube_link.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/))
    return res.status(400).json({ message: 'Please enter a valid YouTube link.' });

  try {
    await db.execute(
      `INSERT INTO recipes (author_id, title, short_description, content, youtube_link) VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, title, short_description, content, youtube_link || null]
    );
    res.status(201).json({ message: 'Recipe shared with the community!' });
  } catch (err) {
    res.status(500).json({ message: 'Could not share recipe.' });
  }
});

app.post('/api/recipes/:id/like', verifyToken, async (req, res) => {
  try {
    await db.execute(
      `INSERT INTO recipe_likes (recipe_id, user_id) VALUES (?, ?)`,
      [req.params.id, req.user.id]
    );
    await db.execute(
      `UPDATE recipes SET likes_count = likes_count + 1 WHERE id = ?`,
      [req.params.id]
    );
    res.json({ message: 'Recipe liked!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'You already liked this recipe.' });
    res.status(500).json({ message: 'Could not like recipe.' });
  }
});

app.post('/api/recipes/:id/comment', verifyToken, async (req, res) => {
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ message: 'Comment cannot be empty.' });
  try {
    await db.execute(
      `INSERT INTO recipe_comments (recipe_id, user_id, comment) VALUES (?, ?, ?)`,
      [req.params.id, req.user.id, comment]
    );
    res.status(201).json({ message: 'Comment added!' });
  } catch (err) {
    res.status(500).json({ message: 'Could not add comment.' });
  }
});

app.post('/api/recipes/:id/flag', verifyToken, async (req, res) => {
  try {
    await db.execute(`UPDATE recipes SET is_flagged = TRUE WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Recipe reported. Admin will review it.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not flag recipe.' });
  }
});

// ════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ════════════════════════════════════════════════════════════

app.get('/api/admin/analytics', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [[farmers]]   = await db.execute(`SELECT COUNT(*) as total FROM users WHERE role = 'farmer' AND status = 'approved'`);
    const [[startups]]  = await db.execute(`SELECT COUNT(*) as total FROM users WHERE role = 'startup' AND status = 'approved'`);
    const [[customers]] = await db.execute(`SELECT COUNT(*) as total FROM users WHERE role = 'customer'`);
    const [[pending]]   = await db.execute(`SELECT COUNT(*) as total FROM users WHERE status = 'pending'`);
    const [[orders]]    = await db.execute(`SELECT COUNT(*) as total FROM orders`);
    const [[revenue]]   = await db.execute(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'delivered'`);
    res.json({
      total_farmers: farmers.total,
      active_startups: startups.total,
      total_customers: customers.total,
      pending_approvals: pending.total,
      total_orders: orders.total,
      total_revenue: revenue.total
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load analytics.' });
  }
});

app.get('/api/admin/pending', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.created_at,
              u.aadhaar_doc, u.profile_photo, u.upi_qr,
              COALESCE(f.license_number, s.license_number) AS license,
              COALESCE(f.farming_category, s.business_category) AS category
       FROM users u
       LEFT JOIN farmers f ON f.user_id = u.id
       LEFT JOIN startups s ON s.user_id = u.id
       WHERE u.status = 'pending'
       ORDER BY u.created_at ASC`
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Could not load pending users.' });
  }
});

app.patch('/api/admin/users/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status))
    return res.status(400).json({ message: 'Status must be approved or rejected.' });
  try {
    await db.execute(`UPDATE users SET status = ? WHERE id = ?`, [status, req.params.id]);
    res.json({ message: `User has been ${status}.` });
  } catch (err) {
    res.status(500).json({ message: 'Could not update user status.' });
  }
});

app.get('/api/admin/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT id, full_name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Could not load users.' });
  }
});

app.get('/api/admin/flagged', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [recipes] = await db.execute(
      `SELECT r.*, u.full_name AS author_name FROM recipes r
       JOIN users u ON r.author_id = u.id WHERE r.is_flagged = TRUE`
    );
    const [reviews] = await db.execute(
      `SELECT rv.*, u.full_name AS reviewer_name FROM reviews rv
       JOIN users u ON rv.reviewer_id = u.id WHERE rv.is_flagged = TRUE`
    );
    res.json({ flagged_recipes: recipes, flagged_reviews: reviews });
  } catch (err) {
    res.status(500).json({ message: 'Could not load flagged content.' });
  }
});

app.delete('/api/admin/recipes/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await db.execute(`DELETE FROM recipes WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Recipe removed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not remove recipe.' });
  }
});

// ── GET: All Users WITH docs (for admin — add this after /api/admin/users) ──
app.get('/api/admin/users-with-docs', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.status, u.created_at,
              u.aadhaar_doc, u.profile_photo, u.upi_qr,
              COALESCE(f.license_number, s.license_number) AS license,
              COALESCE(f.farming_category, s.business_category) AS category
       FROM users u
       LEFT JOIN farmers f ON f.user_id = u.id
       LEFT JOIN startups s ON s.user_id = u.id
       ORDER BY u.created_at DESC`
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Could not load users.' });
  }
});

// ════════════════════════════════════════════════════════════
//  GENERAL PRODUCT ROUTES
// ════════════════════════════════════════════════════════════

app.get('/api/farmer-products', verifyToken, async (req, res) => {
  try {
    const [products] = await db.execute(
      `SELECT p.*, u.full_name AS farmer_name
       FROM products p
       JOIN users u ON p.seller_id = u.id
       WHERE p.seller_type = 'farmer' AND p.is_active = TRUE
       AND p.stock_available > 0 AND u.status = 'approved'
       ORDER BY p.created_at DESC`
    );
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Could not load farmer products.' });
  }
});

// ════════════════════════════════════════════════════════════
//  SCHEMES ROUTES
// ════════════════════════════════════════════════════════════

// ── GET: All active schemes (PUBLIC) ─────────────────────────
app.get('/api/schemes', async (req, res) => {
  try {
    const [schemes] = await db.execute(
      `SELECT * FROM schemes WHERE is_active = TRUE ORDER BY created_at DESC`
    );
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ message: 'Could not load schemes.' });
  }
});

// ── GET: Admin — all schemes including inactive ───────────────
app.get('/api/admin/schemes', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [schemes] = await db.execute(
      `SELECT * FROM schemes ORDER BY created_at DESC`
    );
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ message: 'Could not load schemes.' });
  }
});

// ── POST: Admin adds a scheme ─────────────────────────────────
app.post('/api/admin/schemes', verifyToken, requireRole('admin'), async (req, res) => {
  const { name, target_role, description, eligibility, official_url, deadline, icon } = req.body;
  if (!name || !description)
    return res.status(400).json({ message: 'Name and description are required.' });
  try {
    await db.execute(
      `INSERT INTO schemes (name, target_role, description, eligibility, official_url, deadline, icon)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, target_role || 'both', description, eligibility || null,
       official_url || null, deadline || null, icon || '📋']
    );
    res.status(201).json({ message: 'Scheme added successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Could not add scheme.' });
  }
});

// ── PUT: Admin updates a scheme ───────────────────────────────
app.put('/api/admin/schemes/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const { name, target_role, description, eligibility, official_url, deadline, icon, is_active } = req.body;
  try {
    await db.execute(
      `UPDATE schemes SET name=?, target_role=?, description=?, eligibility=?,
       official_url=?, deadline=?, icon=?, is_active=? WHERE id=?`,
      [name, target_role, description, eligibility || null,
       official_url || null, deadline || null, icon || '📋',
       is_active ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Scheme updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update scheme.' });
  }
});

// ── DELETE: Admin removes a scheme ────────────────────────────
app.delete('/api/admin/schemes/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await db.execute(`DELETE FROM schemes WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Scheme deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete scheme.' });
  }
});

// ════════════════════════════════════════════════════════════
//  MILLET HEALTH LIBRARY ROUTES
//  ⚠️  ORDER MATTERS: /user/likes MUST come before /:id
// ════════════════════════════════════════════════════════════

// ── GET: All published millets (PUBLIC) ──────────────────────
app.get('/api/millets', async (req, res) => {
  try {
    const [millets] = await db.execute(
      `SELECT * FROM millet_health WHERE is_published = TRUE ORDER BY name ASC`
    );
    const result = await Promise.all(millets.map(async (m) => {
      const [nutrition] = await db.execute(
        `SELECT nutrient_name, value_per_100g FROM millet_nutrition WHERE millet_id = ?`,
        [m.id]
      );
      return { ...m, nutrition };
    }));
    res.json(result);
  } catch (err) {
    console.error('Get millets error:', err);
    res.status(500).json({ message: 'Could not load millet data.' });
  }
});

// ── GET: User's liked millets — MUST BE BEFORE /api/millets/:id ──
app.get('/api/millets/user/likes', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT millet_id FROM millet_likes WHERE user_id = ?`,
      [req.user.id]
    );
    res.json(rows.map(r => r.millet_id));
  } catch (err) {
    res.status(500).json({ message: 'Could not load bookmarks.' });
  }
});

// ── GET: Single millet by ID (PUBLIC) ────────────────────────
app.get('/api/millets/:id', async (req, res) => {
  try {
    const [[millet]] = await db.execute(
      `SELECT m.*,
        (SELECT COUNT(*) FROM millet_likes WHERE millet_id = m.id) AS likes_count
       FROM millet_health m
       WHERE m.id = ? AND m.is_published = TRUE`,
      [req.params.id]
    );
    if (!millet) return res.status(404).json({ message: 'Not found.' });
    const [nutrition] = await db.execute(
      `SELECT nutrient_name, value_per_100g FROM millet_nutrition WHERE millet_id = ?`,
      [req.params.id]
    );
    res.json({ ...millet, nutrition });
  } catch (err) {
    res.status(500).json({ message: 'Could not load millet.' });
  }
});

// ── POST: Toggle like/bookmark a millet ──────────────────────
app.post('/api/millets/:id/like', verifyToken, async (req, res) => {
  try {
    const [[existing]] = await db.execute(
      `SELECT id FROM millet_likes WHERE millet_id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (existing) {
      await db.execute(
        `DELETE FROM millet_likes WHERE millet_id = ? AND user_id = ?`,
        [req.params.id, req.user.id]
      );
      return res.json({ message: 'Removed from bookmarks.', liked: false });
    }
    await db.execute(
      `INSERT INTO millet_likes (millet_id, user_id) VALUES (?, ?)`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Bookmarked!', liked: true });
  } catch (err) {
    res.status(500).json({ message: 'Could not update bookmark.' });
  }
});

// ── GET: Admin — all millets ──────────────────────────────────
app.get('/api/admin/millets', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [millets] = await db.execute(
      `SELECT m.*,
        (SELECT COUNT(*) FROM millet_nutrition WHERE millet_id = m.id) AS nutrition_count,
        (SELECT COUNT(*) FROM millet_likes    WHERE millet_id = m.id) AS likes_count
       FROM millet_health m
       ORDER BY m.created_at DESC`
    );
    res.json(millets);
  } catch (err) {
    res.status(500).json({ message: 'Could not load millets.' });
  }
});

// ── POST: Admin adds a millet ─────────────────────────────────
app.post('/api/admin/millets', verifyToken, requireRole('admin'), milletImageUpload, async (req, res) => {
  const { name, scientific_name, description, benefits, source_url, nutrition } = req.body;
  if (!name || !description || !benefits)
    return res.status(400).json({ message: 'Name, description, and benefits are required.' });

  try {
    const imageFile = req.file?.filename || null;
    const [result] = await db.execute(
      `INSERT INTO millet_health (name, scientific_name, description, benefits, source_url, image_filename, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, scientific_name || null, description, benefits, source_url || null, imageFile, req.user.id]
    );
    const milletId = result.insertId;

    if (nutrition) {
      const rows = JSON.parse(nutrition);
      for (const row of rows) {
        if (row.nutrient && row.value) {
          await db.execute(
            `INSERT INTO millet_nutrition (millet_id, nutrient_name, value_per_100g) VALUES (?, ?, ?)`,
            [milletId, row.nutrient, row.value]
          );
        }
      }
    }
    res.status(201).json({ message: 'Millet entry added!', id: milletId });
  } catch (err) {
    console.error('Add millet error:', err);
    res.status(500).json({ message: 'Could not add millet.' });
  }
});

// ── PUT: Admin updates a millet ───────────────────────────────
app.put('/api/admin/millets/:id', verifyToken, requireRole('admin'), milletImageUpload, async (req, res) => {
  const { name, scientific_name, description, benefits, source_url, nutrition, is_published } = req.body;
  try {
    const imageFile = req.file?.filename || null;
    const fields = [name, scientific_name || null, description, benefits, source_url || null, is_published ?? 1];
    let query = `UPDATE millet_health SET name=?, scientific_name=?, description=?, benefits=?, source_url=?, is_published=?`;
    if (imageFile) { query += ', image_filename=?'; fields.push(imageFile); }
    query += ', updated_at=NOW() WHERE id=?';
    fields.push(req.params.id);

    await db.execute(query, fields);

    if (nutrition) {
      await db.execute(`DELETE FROM millet_nutrition WHERE millet_id = ?`, [req.params.id]);
      const rows = JSON.parse(nutrition);
      for (const row of rows) {
        if (row.nutrient && row.value) {
          await db.execute(
            `INSERT INTO millet_nutrition (millet_id, nutrient_name, value_per_100g) VALUES (?, ?, ?)`,
            [req.params.id, row.nutrient, row.value]
          );
        }
      }
    }
    res.json({ message: 'Millet entry updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update millet.' });
  }
});

// ── DELETE: Admin removes a millet ───────────────────────────
app.delete('/api/admin/millets/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await db.execute(`DELETE FROM millet_health WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Millet entry deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete millet.' });
  }
});

// ── DELETE: Admin removes a review ────────────────────────────
app.delete('/api/reviews/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await db.execute(`DELETE FROM reviews WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete review.' });
  }
});

// ════════════════════════════════════════════════════════════
//  START THE SERVER
// ════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🌾 Millet Platform Server is running!`);
  console.log(`👉 Open your browser and go to: http://localhost:${PORT}`);
  console.log(`📡 API is available at: http://localhost:${PORT}/api`);
});