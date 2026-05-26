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
    try {
        const [todos] = await pool.query(
            'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC', // latest to oldest
            [req.session.user.id]
        );
        res.json({ todos });
    } catch (err) {
        console.error('Error fetching todos:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST create a new todo
router.post('/', requireLogin, async (req, res) => {
    // create task and save to database (when to show? => HOMEPAGE -> SHOW TASKS) - yet to implement the UI for showing tasks
    const { task } = req.body;
    if (!task || task.trim().length === 0) {
        return res.status(400).json({ error: 'Task cannot be empty' });
    }
    if (task.trim().length > 255) {
        return res.status(400).json({ error: 'Task too long' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO todos (user_id, task) VALUES (?, ?)',
            [req.session.user.id, task.trim()]
        );
        // insertId is from mysql insert query above, not from select query - not id, but insertId = id
        const [rows] = await pool.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
        res.json({ todo: rows[0] });
    } catch (err) {
        console.error('Error creating todo:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT (update) toggle todo complete/incomplete (REFER BACK HERE HOW TO USE :id)
router.put('/:id', requireLogin, async (req, res) => {
    // select user and complete todo (how to know which todo?)
    try {
        const [todos] = await pool.query(
            'SELECT * FROM todos WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.user.id]
        );
        if (todos.length === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        const newCompleted = !todos[0].completed;
        await pool.query(
            'UPDATE todos SET completed = ? WHERE id = ?',
            [newCompleted, req.params.id]
        );
        res.json({ id: parseInt(req.params.id), completed: newCompleted }); // parseInt because params.id is a string
    } catch (err) {
        console.error('Error updating todo:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE a todo
router.delete('/:id', requireLogin, async (req, res) => {
    // get todo id and user id then delete todo
    try {
        const [result] = await pool.query(
            'DELETE FROM todos WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting todo:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;