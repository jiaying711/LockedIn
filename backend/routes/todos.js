const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// authentication middleware
function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    next();
}

// GET all todos for logged-in user
router.get('/', requireLogin, async (req, res) => {
    // get todos from database
});

// POST create a new todo
router.post('/', requireLogin, async (req, res) => {
    // create task and save to database (when to show? => HOMEPAGE -> SHOW TASKS)
});

// PUT (update) toggle todo complete/incomplete
router.put('/:id', requireLogin, async (req, res) => {
    // select user and complete todo (how to know which todo?)
});

// DELETE a todo
router.delete('/:id', requireLogin, async (req, res) => {
    // get todo id and user id then delete todo
});

module.exports = router;