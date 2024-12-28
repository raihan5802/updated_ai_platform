const bcrypt = require('bcryptjs');
const { findUserByEmail, createUser } = require('../models/userModel');
const { signToken } = require('../utils/jwt');

async function registerUser(name, email, password, role_id = 2) {
  // role_id=2 -> 'Client' by default
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('Email already in use');
  }
  const hash = await bcrypt.hash(password, 10);
  return await createUser(name, email, hash, role_id);
}

async function loginUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error('Invalid email or password.');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error('Invalid email or password.');

  const token = signToken({
    id: user.id,
    email: user.email,
    role_id: user.role_id
  });
  return { user, token };
}

module.exports = {
  registerUser,
  loginUser
};
