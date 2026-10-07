const bcrypt = require('bcryptjs');
const validator = require('validator');
const { createUser, findUserByEmail, findUserById } = require('../models/userModel');
const { signToken } = require('../utils/jwt');

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are all required' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'That does not look like a valid email address' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password needs to be at least 8 characters' });
  }

  const existing = await findUserByEmail(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ name, email: email.toLowerCase(), passwordHash });

  const token = signToken({ id: user.id, email: user.email });

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email },
    token,
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await findUserByEmail(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({ id: user.id, email: user.email });

  res.json({
    user: { id: user.id, name: user.name, email: user.email },
    token,
  });
}

async function me(req, res) {
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
}

module.exports = { register, login, me };
