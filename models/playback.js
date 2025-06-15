// Centralises the database connection management with db.js
const { pool } = require('../db');

/**
 * Record track play
 * @param {number} userId - User ID
 * @param {Object} track - Spotify track object
 * @param {string} deviceId - Spotify device ID
 * @returns {number} Play history record ID
 */
async function recordPlay(userId, track, deviceId = null) {
  try {
    // Extract artist name safely without optional chaining
    let artistName = 'Unknown Artist';
    if (track.artists && track.artists.length > 0 && track.artists[0].name) {
      artistName = track.artists[0].name;
    }

    const [result] = await pool.query(
      `INSERT INTO play_history (
        user_id, track_id, track_name, artist_name, device_id
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        track.id,
        track.name,
        artistName,
        deviceId
      ]
    );

    return result.insertId;
  } catch (error) {
    console.error('Error recording play:', error);
    throw error;
  }
}

/**
 * Get play history for a user
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of records to return
 * @returns {Array} Array of play history records
 */
async function getPlayHistory(userId, limit = 10) {
  try {
    const [history] = await pool.query(
      `SELECT ph.*, d.device_name, d.device_type
       FROM play_history ph
       LEFT JOIN devices d ON ph.device_id = d.id
       WHERE ph.user_id = ?
       ORDER BY ph.played_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return history;
  } catch (error) {
    console.error('Error getting play history:', error);
    throw error;
  }
}

module.exports = {
  recordPlay,
  getPlayHistory
};