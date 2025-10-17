const argon2 = require('argon2');
const config = require('../config');

const users = new Map();
let userIdCounter = 1;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function findUserByEmail(email) {
  if (!email) {
    return null;
  }

  return users.get(normalizeEmail(email)) || null;
}

async function createUser({ email, password, roles = [] }) {
  const normalizedEmail = normalizeEmail(email);

  if (users.has(normalizedEmail)) {
    throw new Error('User already exists');
  }

  const passwordHash = await argon2.hash(password);
  const user = {
    id: String(userIdCounter++),
    email,
    passwordHash,
    roles
  };

  users.set(normalizedEmail, user);
  return user;
}

async function seedAdminUser() {
  const email = config.adminEmail;
  const password = config.adminPassword;

  if (!email || !password) {
    throw new Error('Admin credentials must be provided');
  }

  const existing = findUserByEmail(email);
  if (existing) {
    return existing;
  }

  return createUser({
    email,
    password,
    roles: ['admin']
  });
}

async function verifyUserCredentials(email, password) {
  const user = findUserByEmail(email);

  if (!user) {
    return null;
  }

  const passwordMatches = await argon2.verify(user.passwordHash, password);
  if (!passwordMatches) {
    return null;
  }

  return user;
}

module.exports = {
  createUser,
  seedAdminUser,
  findUserByEmail,
  verifyUserCredentials
};
