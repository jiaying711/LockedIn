var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var dotenv = require('dotenv');
const helmet = require('helmet');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var achievementsRouter = require('./routes/achievements');

dotenv.config();

var spotifyRouter = require('./routes/spotify_route');
var playlistRouter = require('./routes/playlist');
var app = express();

app.use(logger('dev'));
// json on non-upload routes
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'glockedinsecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true if using https
        httpOnly: true, // make cookie inaccessible via javascript (helps prevent XSS)
        // sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));
app.use(helmet());
// app.use(xss()); // use xss-clean after body parsing (outdated)


app.use('/avatars', express.static(path.join(__dirname, 'public/images/avatars')));
app.use(express.static(path.join(__dirname, 'public/static')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/achievements', achievementsRouter);
app.use('/spotify', spotifyRouter);
app.use('/playlist', playlistRouter);

app.use('/admin', require('./routes/admin'));

module.exports = app;

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
