var express = require('express');
var router = express.Router();
const { pool } = require('../db'); // MySQL connection

// ACHIEVEMENT 2: TIMER OF 2+ MINS COMPLETED
router.post('/timer-complete', async function (req, res) {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const { duration } = req.body; // Duration in minutes

  try {
    // Only count timers of 2+ minutes for the achievement
    if (duration >= 2) {
      await pool.query(
        'UPDATE users SET timer_sessions_completed = timer_sessions_completed + 1 WHERE id = ?',
        [req.session.user.id]
      );

      console.log(`User ${req.session.user.username} completed a ${duration}-minute timer session`);
    }

    res.json({ message: 'Timer completion recorded' });
  } catch (err) {
    console.error('Timer completion error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ACHIEVEMENT 4: SPOTIFY CONNECTION COUNTER
router.post('/spotify-connect', async function (req, res) {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    // Increment Spotify connection counter
    await pool.query(
      'UPDATE users SET spotify_connections_count = spotify_connections_count + 1 WHERE id = ?',
      [req.session.user.id]
    );

    console.log(`User ${req.session.user.username} connected to Spotify`);
    res.json({ message: 'Spotify connection recorded' });
  } catch (err) {
    console.error('Spotify connection tracking error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET user achievements
router.get('/', async function (req, res) {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    // Get user data from database
    const [users] = await pool.query(
      'SELECT total_login_time, timer_sessions_completed, profile_updates_count, spotify_connections_count FROM users WHERE id = ?',
      [req.session.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const totalMinutes = Math.floor(user.total_login_time / 60);

    // Define achievements
    const achievements = [
      {
        id: 1,
        name: "Damn, they're Locked In",
        description: "Spend 15 minutes total using LockedIn",
        icon: "🔒",
        completed: totalMinutes >= 15,
        progress: Math.min(totalMinutes, 15),
        target: 15
      },
      {
        id: 2,
        name: "Complete dedication",
        description: "Complete a 2+ minute timer session",
        icon: "⏲️",
        completed: user.timer_sessions_completed >= 1,
        progress: Math.min(user.timer_sessions_completed, 1),
        target: 1
      },
      {
        id: 3,
        name: "Checking yourself out",
        description: "Update your profile at least once",
        icon: "✨",
        completed: user.profile_updates_count >= 1,
        progress: Math.min(user.profile_updates_count, 1),
        target: 1
      },
      {
      id: 4,
      name: "Passed the vibe check",
      description: "Connect to Spotify",
      icon: "🎵",
      completed: user.spotify_connections_count >= 1,
      progress: Math.min(user.spotify_connections_count, 1),
      target: 1
      },
      {
        id: 5,
        name: "Procrastination",
        description: "Procrastination is unachievable with this app",
        icon: "🦍",
        completed: false,
        progress: 0,
        target: 1
      }
    ];

    res.json({
      achievements,
      totalMinutes,
      totalSeconds: user.total_login_time
    });
  } catch (err) {
    console.error('Achievements fetch error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;