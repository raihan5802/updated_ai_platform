const { registerUser, loginUser } = require('../services/userService');

async function signup(req, res) {
  try {
    const { name, email, password } = req.body;
    // Optionally accept a role_id in the request body if you'd like
    const user = await registerUser(name, email, password);
    return res.status(201).json({ message: 'User created', user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function signin(req, res) {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser(email, password);
    return res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

function dashboard(req, res) {
  return res.json({ message: `Welcome user ${req.user.id}`, user: req.user });
}

module.exports = {
  signup,
  signin,
  dashboard
};
