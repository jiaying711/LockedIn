const express = require('express');
const path = require('path');
require('dotenv').config();

// routes var
var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
// var achievementsRouter = require('./routes/achievements');
// var spotifyRouter = require('./routes/spotify_route');
// var playlistRouter = require('./routes/playlist');
// var adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(cookieParser());
// app.use(session({
//     secret: process.env.SESSION_SECRET || 'glockedinsecret',
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         secure: false, // true if using https
//         httpOnly: true, // make cookie inaccessible via javascript (helps prevent XSS)
//         // sameSite: 'lax',
//         maxAge: 24 * 60 * 60 * 1000 // 1 day
//     }
// }));
// app.use(helmet());

// server frontend
app.use(express.static(path.join(__dirname, '../frontend/public')));

// routes
app.use('/', indexRouter);
// app.use('/users', usersRouter);
// app.use('/achievements', achievementsRouter);
// app.use('/spotify', spotifyRouter);
// app.use('/playlist', playlistRouter);
// app.use('/admin', adminRouter);

// home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/static/index.html'));
});

// start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
