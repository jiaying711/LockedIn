// Centralises the database connection management with db.js
const { pool } = require('../db');

/**
 * Save a Spotify device
 * @param {number} userId - User ID
 * @param {Object} device - Spotify device object
 * @returns {string} Device ID
 */
async function saveDevice(userId, device) {
  try {
    // Check if device exists
    const [devices] = await pool.query(
      'SELECT id FROM devices WHERE id = ?',
      [device.id]
    );

    if (devices.length > 0) {
      // Update existing device
      await pool.query(
        `UPDATE devices SET
          device_name = ?,
          device_type = ?,
          is_active = ?
        WHERE id = ?`,
        [
          device.name,
          device.type,
          device.is_active ? 1 : 0,
          device.id
        ]
      );
    } else {
      // Create new device
      await pool.query(
        `INSERT INTO devices (id, user_id, device_name, device_type, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [
          device.id,
          userId,
          device.name,
          device.type,
          device.is_active ? 1 : 0
        ]
      );
    }

    return device.id;
  } catch (error) {
    console.error('Error saving device:', error);
    throw error;
  }
}

/**
 * Get device by ID
 * @param {string} deviceId - Device ID
 * @returns {Object|null} Device record or null
 */
async function getDeviceById(deviceId) {
  try {
    const [devices] = await pool.query(
      'SELECT * FROM devices WHERE id = ?',
      [deviceId]
    );
    return devices.length > 0 ? devices[0] : null;
  } catch (error) {
    console.error('Error getting device:', error);
    throw error;
  }
}

/**
 * Get all devices for a user
 * @param {number} userId - User ID
 * @returns {Array} Array of device records
 */
async function getUserDevices(userId) {
  try {
    const [devices] = await pool.query(
      'SELECT * FROM devices WHERE user_id = ?',
      [userId]
    );
    return devices;
  } catch (error) {
    console.error('Error getting user devices:', error);
    throw error;
  }
}

module.exports = {
  saveDevice,
  getDeviceById,
  getUserDevices
};