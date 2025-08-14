const db = require('../config/db');
const jwt = require('jsonwebtoken');

module.exports = async function (req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user with role
    const [users] = await db.query(
      `SELECT u.*, r.name AS role
       FROM users u
       LEFT JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\\\Models\\\\User'
       LEFT JOIN roles r ON r.id = mhr.role_id
       WHERE u.id = ?`,
      [decoded.id]
    );
    if (!users.length) return res.status(401).json({ error: 'User not found' });

    // Normalize code field if needed
    const user = users[0];
    user.code = user.user_code; // for compatibility with your code

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
