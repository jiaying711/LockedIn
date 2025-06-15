function loginToSpotify() {
    window.location.href = '/spotify/login';
}

async function getAccessToken() {
    const response = await fetch('/spotify/token', {
        credentials: 'include'
    });

    if (!response.ok) {
        if (response.status === 401) {
            // Token refresh failed, redirect to login
            window.location.href = '/spotify/login';
            throw new Error('Authentication required');
        }
        throw new Error('Failed to get token');
    }

    const data = await response.json();
    return data.access_token;
}

async function getAvailableDevices() {
    try {
        const accessToken = await getAccessToken();

        const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get devices: ${response.status}`);
        }

        const data = await response.json();
        return data.devices;
    } catch (error) {
        console.error('Error getting devices:', error);
        throw error;
    }
}

async function playPlaylist(playlistId) {
    try {
        const accessToken = await getAccessToken();

        // First, get available devices
        const devices = await getAvailableDevices();

        if (!devices || devices.length === 0) {
            throw new Error('No Spotify devices available. Please open Spotify on your computer or phone.');
        }

        // Find an active device or use the first available one
        const activeDevice = devices.find(device => device.is_active) || devices[0];

        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice.id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                context_uri: `spotify:playlist:${playlistId}`
            })
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('No active Spotify device found. Please open Spotify and try again.');
            }
            throw new Error(`Failed to play playlist: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error playing playlist:', error);
        throw error;
    }
}

async function getUserPlaylists() {
    try {
        const accessToken = await getAccessToken();

        const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get playlists: ${response.status}`);
        }

        const data = await response.json();
        return data.items;
    } catch (error) {
        console.error('Error getting user playlists:', error);
        throw error;
    }
}









