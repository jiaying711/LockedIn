// var express = require('express');
// var router = express.Router();

// /* GET home page. */
// router.get('/', function (req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// /* GET background theme from session */
// router.get('/background', function (req, res) {
//   const background = req.session.background || 0;
//   res.json({ background: background });
// });

// /* POST background theme to session */
// router.post('/background', function (req, res) {
//   const { background } = req.body;
//   if (typeof background === 'number' && background >= 0) {
//     req.session.background = background;
//     res.json({ success: true, background: background });
//   } else {
//     res.status(400).json({ error: 'Invalid background value' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/public/static/index.html'));
});

module.exports = router;