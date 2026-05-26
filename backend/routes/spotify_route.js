const express = require('express');
const router = express.Router();
const axios = require('axios');
const querystring = require('querystring');
const session = require('express-session');


const REDIRECT_URI = 'http://127.0.0.1:8080/spotify';
const SCOPES = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private'
].join(' ');

// Helper function to refresh access token
async function refreshAccessToken(refreshToken) {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token',
            querystring.stringify({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
                }
            });

        return response.data;
    } catch (error) {
        console.error('Error refreshing token:', error.response?.data || error.message);
        throw error;
    }
}

// GET /callback?code=AUTHORIZATION_CODE
router.get('/', async (req, res) => {
    const { code } = req.query;

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token',
            querystring.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
                }
            });

        const { access_token, refresh_token, expires_in } = response.data;

        req.session.spotify = {
            access_token,
            refresh_token,
            expires_at: Date.now() + expires_in * 1000
        };

        res.redirect('/');
    } catch (err) {
        console.error('Error exchanging code for token:', err.response?.data || err.messages);
        res.status(500).send('Token exchange failed');
    }
});

router.get('/token', async (req, res) => {
    const spotify = req.session.spotify;

    console.log("from /token:", req.session);

    if (!spotify) {
        res.status(401).json({ error: 'Not authenticated with Spotify' });
        return;
    }

    // Check if token is expired or will expire soon (within 5 minutes)
    const isExpired = Date.now() > spotify.expires_at;
    const willExpireSoon = Date.now() > (spotify.expires_at - 5 * 60 * 1000); // 5 minutes buffer

    if (isExpired || willExpireSoon) {
        try {
            // Refresh the token
            const refreshData = await refreshAccessToken(spotify.refresh_token);

            // Update session with new tokens
            req.session.spotify = {
                access_token: refreshData.access_token,
                refresh_token: refreshData.refresh_token || spotify.refresh_token, // Keep old refresh token if new one not provided
                expires_at: Date.now() + (refreshData.expires_in * 1000)
            };

            res.json({ access_token: refreshData.access_token });
        } catch (error) {
            // If refresh fails, clear session and require re-authentication
            delete req.session.spotify;
            res.status(401).json({ error: 'Token refresh failed, please re-authenticate' });
        }
    } else {
        // Token is still valid
        res.json({ access_token: spotify.access_token });
    }
});

router.get('/login', (req, res) => {
    const scopes = SCOPES;

    const authUrl = `https://accounts.spotify.com/authorize?` +
        querystring.stringify({
            client_id: CLIENT_ID,
            response_type: 'code',
            redirect_uri: REDIRECT_URI,
            scope: scopes
        });

    res.redirect(authUrl);
});

module.exports = router;
