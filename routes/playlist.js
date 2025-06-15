const express = require('express');
const router = express.Router();
const { pool } = require('../db');


router.get('/', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    const { id: userId } = req.session.user;

    const [rows] = await pool.query(`
        SELECT playlists.id, playlists.spotify_id, playlists.playlist_name
        FROM playlists
        JOIN users_playlists ON playlists.id = users_playlists.playlist_id
        WHERE users_playlists.user_id = ?
      `, [userId]);


    res.json({ playlists: rows });
});

router.get('/curated', async (req, res) => {

    const [rows] = await pool.query(`
        SELECT playlists.id, playlists.spotify_id, playlists.playlist_name
        FROM playlists
        WHERE playlists.is_curated = true
    `);

    res.json({ playlists: rows });
});

router.post('/create', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'User not logged in' });
        }

        const { playlist_name, spotify_id } = req.body;

        if (!playlist_name || !spotify_id) {
            return res.status(400).json({ error: 'Playlist name and Spotify ID are required' });
        }

        const [rows] = await pool.query(`
            INSERT INTO playlists (playlist_name, spotify_id, is_curated) VALUES (?, ?, ?)
        `, [playlist_name, spotify_id, 0]);

        // additionally create link between user and playlist
        const [userPlaylistRows] = await pool.query(`
            INSERT INTO users_playlists (user_id, playlist_id) VALUES (?, ?)
        `, [req.session.user.id, rows.insertId]);

        res.json({ playlist: { id: rows.insertId, playlist_name, spotify_id }, userPlaylist: userPlaylistRows[0] });
    } catch (error) {
        console.error('Error creating playlist:', error);
        res.status(500).json({ error: 'Failed to create playlist' });
    }
});

module.exports = router;
