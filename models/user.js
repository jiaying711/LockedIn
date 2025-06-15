// Centralises the database connection management with db.js
const { pool } = uire('../db');

/**
 * Get user by Spotify ID or create if not exists
 * @param {Object} profile - Spotify user profile
 * @returns {Object} User record
 */
async function getOrCreateUser(profile) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if user exists
    const [users] = await connection.query(
      'SELECT * FROM users WHERE spotify_id = ?',
      [profile.id]
    );

    if (users.length > 0) {
      // Update existing user
      await connection.query(
        `UPDATE users SET
          display_name = ?,
          email = ?,
          last_login = CURRENT_TIMESTAMP
        WHERE spotify_id = ?`,
        [profile.display_name, profile.email, profile.id]
      );

      await connection.commit();
      return users[0];
    }

    // Create new user (no else needed)
    const [result] = await connection.query(
      'INSERT INTO users (spotify_id, display_name, email) VALUES (?, ?, ?)',
      [profile.id, profile.display_name, profile.email]
    );

    await connection.commit();
    return { id: result.insertId, spotify_id: profile.id };

  } catch (error) {
    await connection.rollback();
    console.error('Error in user model:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get user by database ID
 * @param {number} id - User ID
 * @returns {Object|null} User record or null
 */
async function getUserById(id) {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

/**
 * Get user by Spotify ID
 * @param {string} spotifyId - Spotify user ID
 * @returns {Object|null} User record or null
 */
async function getUserBySpotifyId(spotifyId) {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE spotify_id = ?', [spotifyId]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error getting user by Spotify ID:', error);
    throw error;
  }
}

module.exports = {
  getOrCreateUser,
  getUserById,
  getUserBySpotifyId
};