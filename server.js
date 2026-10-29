import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Safe development-only helper to provision initial admin if absent
const ensureInitialAdmin = async () => {
  try {
    const User = (await import('./models/User.js')).default;
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@campusfind.edu').toLowerCase().trim();
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const password = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPass123!';
      const passwordHash = await User.hashPassword(password);
      await User.create({
        name: process.env.INITIAL_ADMIN_NAME || 'Campus Administrator',
        email: adminEmail,
        passwordHash,
        role: 'admin'
      });
      console.log(`[Auth] Initial administrator account created: ${adminEmail}`);
    }
  } catch (e) {
    console.warn('[Auth] Could not initialize default admin:', e.message);
  }
};

// Connect to MongoDB and start listening
const startServer = async () => {
  try {
    await connectDB();
    await ensureInitialAdmin();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 CampusFind Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`🌐 Portal Web Interface: http://localhost:${PORT}`);
      console.log(`📡 REST API Endpoint:    http://localhost:${PORT}/api`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

export default app;
