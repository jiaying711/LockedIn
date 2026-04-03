-- Set up database and user
-- DROP DATABASE IF EXISTS lockedin; -- (to reset the database)
CREATE DATABASE IF NOT EXISTS lockedin;
CREATE USER IF NOT EXISTS 'lockedinuser'@'localhost' IDENTIFIED BY 'glockedin';
GRANT ALL PRIVILEGES ON lockedin.* TO 'lockedinuser'@'localhost';
GRANT PROCESS ON *.* TO 'lockedinuser'@'localhost';
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON lockedin.* TO 'lockedinuser'@'localhost';
FLUSH PRIVILEGES;
USE lockedin;

-- Users table                                                                -- NOTE: Everything is connected via users.id
--      store Spotify user information                                                  (VIA FOREIGN KEY)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,                                          -- user id
  username VARCHAR(50) UNIQUE NOT NULL,                                       -- username
  email VARCHAR(100) UNIQUE NOT NULL,                                         -- email
  password_hash VARCHAR(255) NOT NULL,                                        -- password
  avatar_path VARCHAR(255),                                                   -- user avatar image path
  is_admin BOOLEAN DEFAULT FALSE,
  total_login_time INT DEFAULT 0,                                             -- total login time in seconds
  timer_sessions_completed INT DEFAULT 0,                                     -- number of timer sessions completed (of 2 mins or longer)
  profile_updates_count INT DEFAULT 0,                                        -- number of profile updates completed
  spotify_connections_count INT DEFAULT 0,                                    -- number of times user connected to Spotify
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                             -- when was the account created
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- when was the user's last login
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- when the user update the profile
);

-- Playlists table                                                            -- NOTE: Stores playlist information
--      store playlist data for curated and user playlists                            (LINKED VIA users_playlists)
CREATE TABLE playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,                                          -- playlist id
  playlist_name VARCHAR(255),                                                 -- name of the playlist
  spotify_id VARCHAR(100),                                                    -- spotify playlist id (if linked to Spotify)
  is_curated BOOLEAN DEFAULT FALSE,                                           -- true if it's a curated/featured playlist
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                             -- when the playlist was created
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- when the playlist was last updated
);

-- Users-Playlists junction table                                             -- NOTE: Links users to their playlists
--      many-to-many relationship between users and playlists                         (VIA FOREIGN KEYS)
CREATE TABLE users_playlists (
  user_id INT NOT NULL,                                                       -- (VIA FOREIGN KEY)  links to users.id
  playlist_id INT NOT NULL,                                                   -- (VIA FOREIGN KEY)  links to playlists.id
  PRIMARY KEY (user_id, playlist_id),                                         -- composite primary key (prevents duplicate user-playlist pairs)
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,               -- if user is deleted, remove their playlist associations
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE        -- if playlist is deleted, remove all user associations
);