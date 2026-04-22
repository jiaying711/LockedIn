var express = require('express');
const argon2 = require('argon2');
var router = express.Router();
// const multer = require('multer'); // avatar
// const path = require('path'); // avatar
// const fs = require('fs').promises; // avatar deletion
const { pool } = require('../db'); // MySQL connection
const { validateFields } = require('../utils/validators');

// configure multer for avatar upload
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'public/images/avatars/'),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const safeName = req.session.user ? req.session.user.username.replace(/\W/g, '_') : 'user';
//     cb(null, `${safeName}_${Date.now()}${ext}`);
//   }
// });
// const upload = multer({ storage });

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

// Signup route
router.post('/signup', validateFields([
  { field: 'username', name: 'Username', min: 3, max: 50 },
  { field: 'email', name: 'Email', min: 3, max: 50 },
  { field: 'password', name: 'Password', min: 6 }
]), async function (req, res) {
  const { username, email, password } = req.body;
  // const avatar = req.file ? `/avatars/${req.file.filename}` : null;

  try {
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await argon2.hash(password);

    // avatar is still here
    // await pool.query('INSERT INTO users (username, email, password_hash, avatar_path) VALUES (?, ?, ?,?)', [username.trim(), email.trim(), hashedPassword, avatar]);
    await pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username.trim(), email.trim(), hashedPassword]);
    res.json({ message: 'Signup successful!' });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Database error during signup' });
  }
});

// Login route
router.post('/login', validateFields([
  { field: 'username', name: 'Username', min: 3, max: 50 },
  { field: 'password', name: 'Password', min: 6 }
]), async function (req, res) {
  const { username, password } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = users[0];
    if (!user.password_hash) {
      console.error('Missing password hash in database for user:', username);
      return res.status(500).json({ error: 'User data corrupted' });
    } // optional?

    const isMatch = await argon2.verify(user.password_hash, password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // update timestamp
    const now = new Date();
    await pool.query('UPDATE users SET last_login = ? WHERE id = ?', [now, user.id]);

    // // admin authentication
    // if (username === 'admin' && password === 'glockedin') {
    //   user.is_admin = true;
    // } else {
    //   user.is_admin = false;
    // }
    // await pool.query('UPDATE users SET is_admin = ? WHERE id = ?', [user.is_admin, user.id]);

    // save to session
    req.session.user = {
      id: user.id,
      username: user.username,
      avatar: user.avatar_path,
      login_start_time: Date.now(),
      is_admin: user.is_admin
    };

    // Explicitly save session and wait for callback before sending response
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session save error' });
      }
      res.json({ message: `Welcome, ${user.username}!` });
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error during login' });
  }
});

// Logout route with session time tracking
router.post('/logout', async function (req, res) {
  // Calculate and save session time before destroying session
  if (req.session && req.session.user && req.session.user.login_start_time) {
    try {
      // Calculate session duration in seconds
      const sessionDuration = Math.floor((Date.now() - req.session.user.login_start_time) / 1000);

      // Add to user's total login time
      await pool.query(
        'UPDATE users SET total_login_time = total_login_time + ? WHERE id = ?',
        [sessionDuration, req.session.user.id]
      );

      console.log(`User ${req.session.user.username} logged out after ${sessionDuration} seconds`);
    } catch (err) {
      console.error('Error updating login time:', err);
    }
  }

  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    return res.json({ message: 'Logged out successfully' });
  });
});

// check login status
router.get('/status', function (req, res) {
  // console.log('full session for status:', req.session);
  if (req.session && req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
    // console.log('login status true');
  } else {
    res.json({ loggedIn: false });
    // console.log('login status false');
  }
});

// GET user profile data
router.get('/profile', async function (req, res) {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    // Get user data from database using the session username
    const [users] = await pool.query(
      'SELECT id, username, email, avatar_path FROM users WHERE username = ?',
      [req.session.user.username]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// UPDATE user profile
// router.put('/profile', upload.single('avatar'),
//   validateFields([
//     { field: 'username', name: 'Username', min: 3, max: 50 },
//     { field: 'email', name: 'Email', min: 3, max: 50 }
//   ]),
//   async function (req, res) {
//     // Check if user is logged in
//     if (!req.session.user) {
//       return res.status(401).json({ error: 'Not logged in' });
//     }

//     const { username, email, currentPassword, newPassword } = req.body;
//     const newAvatar = req.file ? `/images/avatars/${req.file.filename}` : null;

//     // input validation for password
//     if (newPassword && newPassword.trim().length < 6) {
//       return res.status(400).json({ error: 'New Password must be at least 6 characters' });
//     }


//     try {
//       // First, get current user data and verify password
//       const [users] = await pool.query(
//         'SELECT * FROM users WHERE username = ?',
//         [req.session.user.username]
//       );

//       if (users.length === 0) {
//         return res.status(404).json({ error: 'User not found' });
//       }

//       const user = users[0];

//       // check if current password is correct
//       const valid = await argon2.verify(user.password_hash, currentPassword);
//       if (!valid) {
//         return res.status(400).json({ error: 'Current password is incorrect' });
//       }

//       // Check if new username already exists (if username is being changed)
//       if (username !== user.username) {
//         const [existingUsers] = await pool.query(
//           'SELECT id FROM users WHERE username = ? AND id != ?',
//           [username, user.id]
//         );

//         if (existingUsers.length > 0) {
//           return res.status(400).json({ error: 'Username already taken' });
//         }
//       }

//       // Update user data
//       let updateQuery = 'UPDATE users SET username = ?, email = ?, updated_at = ?';
//       let params = [username.trim(), email.trim(), new Date()];

//       // If new password provided, include it
//       if (newPassword && newPassword.trim() !== '') {
//         const hashedNewPassword = await argon2.hash(newPassword);
//         updateQuery += ', password_hash = ?';
//         params.push(hashedNewPassword);
//       }

//       // if new avatar provided, delete old one and include it
//       if (newAvatar) {
//         if (user.avatar_path) {
//           // old avatar still exists
//           const oldAvatar = path.join(__dirname, '..', 'public', user.avatar_path);

//           try {
//             await fs.unlink(oldAvatar);
//             console.log('Deleted old avatar:', oldAvatar);
//           } catch (err) {
//             console.error('Error deleting old avatar:', err);
//           }
//         }
//         updateQuery += ', avatar_path = ?';
//         params.push(newAvatar);
//       }

//       updateQuery += ' WHERE id = ?';
//       params.push(user.id);

//       await pool.query(updateQuery, params);

//       // Increment profile updates counter for achievement tracking
//       await pool.query(
//         'UPDATE users SET profile_updates_count = profile_updates_count + 1 WHERE id = ?',
//         [user.id]
//       );

//       // Update session with new username if it changed
//       req.session.user.username = username.trim();

//       if (newAvatar) {
//         const sessionAvatarPath = newAvatar.replace('/images/avatars/', '/avatars/');
//         req.session.user.avatar = sessionAvatarPath;
//       }

//       res.json({ message: 'Profile updated successfully.    Looking clean!' });
//     } catch (err) {
//       console.error('Profile update error:', err);
//       res.status(500).json({ error: 'Database error during update' });
//     }
//   });

module.exports = router;
