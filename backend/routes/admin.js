var express = require('express');
const argon2 = require('argon2');
var router = express.Router();
const multer = require('multer'); // avatar
const path = require('path'); // avatar
const fs = require('fs').promises; // avatar deletion
const { pool } = require('../db'); // MySQL connection
const { validateFields } = require('../utils/validators');

// configure multer for avatar upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images/avatars/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = req.body.username.replace(/\W/g, '_');
    cb(null, `${safeName}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// middleware for admin authentication
function isAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next(); // is admin
}

router.get('/isAdmin', isAdmin, (req, res) => {
  res.json({ isAdmin: true });
})

router.post('/getUser', isAdmin, async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await pool.query('SELECT username, email FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/addUser', isAdmin, upload.single('newUserAvatar'), validateFields([
  { field: 'username', name: 'Username', min: 3, max: 50 },
  { field: 'email', name: 'Email', min: 3, max: 50 },
  { field: 'password', name: 'Password', min: 6 }
]), async function (req, res) {
  const { username, email, password } = req.body;
  const avatar = req.file ? `/avatars/${req.file.filename}` : null;

  try {
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await argon2.hash(password);
    await pool.query('INSERT INTO users (username, email, password_hash, avatar_path) VALUES (?, ?, ?,?)', [username.trim(), email.trim(), hashedPassword, avatar]);
    res.json({ message: 'New user added!' });

  } catch (err) {
    console.error('Add user error:', err);
    res.status(500).json({ error: 'Database error during signup' });
  }
});

// List all users
router.get('/users', isAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT id, username, email FROM users');
  res.json(rows);
});

// UPDATE user profile
router.put('/editUser', isAdmin,
  validateFields([
    { field: 'username', name: 'Username', min: 3, max: 50 },
    { field: 'email', name: 'Email', min: 3, max: 50 }
  ]),
  async (req, res) => {

    const { username, email, originalEmail } = req.body;

    try {
      const [result] = await pool.query(
        'UPDATE users SET username = ?, email = ? WHERE email = ?',
        [username, email, originalEmail]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'User updated' });
    } catch {
      res.status(500).json({ error: 'Database error' });
    }
  });

// Delete user
router.post('/deleteUser', isAdmin, async (req, res) => {
  const { email } = req.body;

  const [users] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = users[0];

  if (user.avatar_path) {
    // old avatar still exists
    const oldAvatar = path.join(__dirname, '..', 'public', user.avatar_path);

    try {
      await fs.unlink(oldAvatar);
      console.log('Deleted old avatar:', oldAvatar);
    } catch (err) {
      console.error('Error deleting old avatar:', err);
    }
  }

  const [result] = await pool.query('DELETE FROM users WHERE email = ?', [email]);

  if (result.affectedRows > 0) {
    res.json({ message: 'User deleted' });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

module.exports = router;