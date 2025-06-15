// Centralises the database connection management with db.js
const { pool } = require('../db');

/**
 * Save authentication tokens for a user
 * @param {number} userId - User ID
 * @param {string} accessToken - Spotify access token
 * @param {string} refreshToken - Spotify refresh token
 * @param {number} expiresIn - Token expiration in seconds
 * @returns {number} Token record ID
 */
async function saveTokens(userId, accessToken, refreshToken, expiresIn) {
  try {
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Check if tokens exist for user
    const [tokens] = await pool.query(
      'SELECT id FROM auth_tokens WHERE user_id = ?',
      [userId]
    );

    if (tokens.length > 0) {
      // Update existing tokens
      await pool.query(
        `UPDATE auth_tokens SET
          access_token = ?,
          refresh_token = ?,
          expires_at = ?
        WHERE user_id = ?`,
        [accessToken, refreshToken, expiresAt, userId]
      );
      return tokens[0].id;
    }

    // Insert new tokens (no else needed)
    const [result] = await pool.query(
      `INSERT INTO auth_tokens (user_id, access_token, refresh_token, expires_at)
       VALUES (?, ?, ?, ?)`,
      [userId, accessToken, refreshToken, expiresAt]
    );
    return result.insertId;

  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
}

/**
 * Get tokens for a user
 * @param {number} userId - User ID
 * @returns {Object|null} Token record or null
 */
async function getTokens(userId) {
  try {
    const [tokens] = await pool.query(
      'SELECT * FROM auth_tokens WHERE user_id = ?',
      [userId]
    );
    return tokens.length > 0 ? tokens[0] : null;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
}

/**
 * Get tokens by refresh token
 * @param {string} refreshToken     - Spotify refresh token
 * @returns {Object|null}           Token record or null
 */
async function getTokenByRefreshToken(refreshToken) {
  try {
    const [tokens] = await pool.query(
      'SELECT * FROM auth_tokens WHERE refresh_token = ?',
      [refreshToken]
    );
    return tokens.length > 0 ? tokens[0] : null;
  } catch (error) {
    console.error('Error getting token by refresh token:', error);
    throw error;
  }
}

module.exports = {
  saveTokens,
  getTokens,
  getTokenByRefreshToken
};