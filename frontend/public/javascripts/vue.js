/* global Vue */ // apparently adding this line is required for eslint to work


const vueinst = Vue.createApp({
    data() {
        return {
            show_menu: true,
            spotifyConnected: false,
            spotifyError: null,
            timerRunning: false,
            loggedIn: false,
            username: null,
            isAdmin: false,
            avatar: '/images/avatars/default-avatar.png',
            song_info: 'No song playing',
            showProfileDropdown: false,
            playlistModalVisible: false,
            playlist_name: '',
            spotify_id: '',
            selectedTheme: 0,
            themes: [
                {
                    id: 0,
                    name: 'Sunset',
                    background: '/images/backgrounds/sunset1.png'
                },
                {
                    id: 1,
                    name: 'Japanese Dark',
                    background: '/images/backgrounds/japanese-dark.jpg'
                },
                {
                    id: 2,
                    name: 'Japanese Light',
                    background: '/images/backgrounds/japanese-light.png'
                }
            ],
            currentPlaylist: null,
            userPlaylists: [],
            curatedPlaylists: [],
            spotifyUserPlaylists: [],
            showSpotifyPlaylists: false
        };
    },
    methods: {
        toggleMenu() {
            this.show_menu = !this.show_menu;
        },

        toggleProfileDropdown() {
            this.showProfileDropdown = !this.showProfileDropdown;
        },

        profile() {
            window.location.href = '/profile.html';
        },

        startTimer() {
            this.timerRunning = true;
            this.playSelectedPlaylist();
        },

        pauseTimer() {
            this.timerRunning = true;
        },

        resumeTimer() {
            this.timerRunning = true;
        },

        resetTimer() {
            this.timerRunning = false;
        },

        login() {
            window.location.href = '/login.html';
        },

        connectToSpotify() {
            // ACHIEVEMENT 4: Tracks the connection attempt
            if (this.loggedIn) {
                fetch('/achievements/spotify-connect', {
                    method: 'POST',
                    credentials: 'include'
                })
                    .then((res) => res.json())
                    .then((data) => {
                        console.log('Spotify connection tracked:', data.message);
                    })
                    .catch((err) => {
                        console.error('Error tracking Spotify connection:', err);
                    });
            }

            // Logs into Spotify
            loginToSpotify();
        },

        getCuratedPlaylists() {
            fetch('/playlist/curated', {
                method: 'GET',
                credentials: 'include'
            })
                .then((res) => res.json())
                .then((data) => {
                    this.curatedPlaylists = data.playlists;
                    this.getUserPlaylists();
                })
                .catch((err) => {
                    console.error('Error getting curated playlists', err);
                });
        },

        getUserPlaylists() {
            fetch('/playlist', {
                method: 'GET',
                credentials: 'include'
            })
                .then((res) => {
                    if (!res.ok) {
                        if (res.status === 401) {
                            this.userPlaylists = [];
                            return;
                        }
                        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    }
                    return res.json();
                })
                .then((data) => {
                    if (data) {
                        this.userPlaylists = data.playlists;
                    }
                })
                .catch((err) => {
                    console.error('Error getting user playlists', err);
                });
        },

        checkSpotifyConnection() {
            fetch('/spotify/token', {
                method: 'GET',
                credentials: 'include'
            })
                .then((res) => {
                    if (!res.ok) {
                        this.spotifyConnected = false;

                        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    }
                    return res.json();
                })
                .then((data) => {
                    this.spotifyConnected = true;
                    this.spotifyError = null;

                    console.log(data.error);

                    // Now that we know Spotify is connected, fetch the playlists
                    this.getCuratedPlaylists();
                    console.log('user playlists:', this.userPlaylists);
                    console.log('curated playlists:', this.curatedPlaylists);
                })
                .catch((err) => {
                    console.error('Error checking Spotify connection', err);
                    this.spotifyConnected = false;
                });
        },

        logout() {
            if (this.loggedIn) {
                // call backend logout API
                fetch('/users/logout', {
                    method: 'POST',
                    credentials: 'include' // important for session cookies
                })
                    .then((res) => {
                        if (res.ok) {
                            this.loggedIn = false;
                            alert("Logged out!");
                            window.location.href = '/';
                        } else {
                            alert('Failed to log out');
                        }
                    })
                    .catch((err) => {
                        console.error("Logout failed", err);
                        alert('Error logging out');
                    });
            } else {
                // redirect to login
                window.location.href = '/login.html';
            }
        },

        admin() {
            if (this.isAdmin === true) {
                window.location.href = '/admin_profile.html';
            }
        },

        setTheme(themeId) {
            this.selectedTheme = themeId;
            document.body.style.backgroundImage = `url(${this.themes[themeId].background})`;
            saveBackgroundToSession(themeId);
        },

        setPlaylist(playlist) {
            this.currentPlaylist = playlist;
            console.log('Selected playlist:', playlist);
        },

        async playSelectedPlaylist() {
            if (this.currentPlaylist && this.spotifyConnected) {
                try {
                    await playPlaylist(this.currentPlaylist.spotify_id);
                    console.log('Playing playlist:', this.currentPlaylist.playlist_name);
                } catch (error) {
                    console.error('Failed to play playlist:', error);
                    alert('Failed to play playlist. ' + error.message + ' Make sure Spotify is open and you have an active device.');
                }
            }
        },

        addPlaylist() {
            fetch('/playlist/create', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ playlist_name: this.playlist_name, spotify_id: this.spotify_id })
            })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                    }
                    return res.json();
                })
                .then((data) => {
                    this.userPlaylists.push(data.playlist);
                    this.playlistModalVisible = false;
                    this.playlist_name = '';
                    this.spotify_id = '';
                })
                .catch((err) => {
                    console.error('Error adding playlist:', err);
                    alert('Failed to add playlist. Please try again.');
                });
        },

        async getSpotifyUserPlaylists() {
            try {
                const playlists = await getUserPlaylists();
                this.spotifyUserPlaylists = playlists.map((playlist) => ({
                    id: playlist.id,
                    playlist_name: playlist.name,
                    spotify_id: playlist.id,
                    is_spotify_playlist: true
                }));
                this.showSpotifyPlaylists = true;
            } catch (error) {
                console.error('Error fetching Spotify playlists:', error);
                alert('Failed to fetch Spotify playlists. Please try again.');
            }
        },

        toggleSpotifyPlaylists() {
            this.showSpotifyPlaylists = !this.showSpotifyPlaylists;
            if (this.showSpotifyPlaylists && this.spotifyUserPlaylists.length === 0) {
                this.getSpotifyUserPlaylists();
            }
        }

    },
    mounted() {
        fetch('/users/status', {
            method: 'GET',
            credentials: 'include'
        })
            .then((res) => res.json())
            .then((data) => {
                // console.log('login status response:', data);
                this.loggedIn = data.loggedIn;
                if (this.loggedIn === true) {
                    this.username = data.user.username;
                    this.isAdmin = data.user.is_admin;
                    if (data.user.avatar) {
                        if (data.user.avatar.startsWith('/images')) {
                            this.avatar = data.user.avatar;
                        } else {
                            this.avatar = `/images${data.user.avatar}`;
                        }
                    }
                }
                // this.checkSpotifyConnection();
            })
            .catch((err) => {
                console.error('Error getting login status', err);
            });

        // fetch('/background', {
        //     method: 'GET',
        //     credentials: 'include'
        // })
        //     .then((res) => res.json())
        //     .then((data) => {
        //         if (data.background !== undefined) {
        //             this.selectedTheme = data.background;
        //             document.body.style.backgroundImage = `url(${this.themes[data.background].background})`;
        //         }
        //     })
        //     .catch((err) => {
        //         console.error('Error loading background from session', err);
        //     });
    }
}).mount('body');

// Export for potential future use
window.vueinst = vueinst;
