const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: Number.parseInt(process.env.PORT, 10) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'change-me-please',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe123!'
};

module.exports = config;
