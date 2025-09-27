import express from 'express';
import pool from '../../db.js';

const router = express.Router();

// Create a new note
router.post('/create', async (req, res) => {
    try {
        const { headline, userName, email, noteText, teamName } = req.body;

        // Validate required fields
        if (!headline || !userName || !email || !noteText || !teamName) {
            return res.status(400).json({ 
                error: 'Missing required fields: headline, userName, email, noteText, teamName' 
            });
        }

        // Insert note into database
        const result = await pool.query(
            `INSERT INTO notes (heading, text, member_name, member_email, team_name) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [headline, noteText, userName, email, teamName]
        );

        const newNote = result.rows[0];
        
        res.status(201).json({
            message: 'Note created successfully',
            note: newNote
        });

    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ 
            error: 'Failed to create note',
            details: error.message 
        });
    }
});

// Get all notes for a specific team
router.get('/team/:teamName', async (req, res) => {
    try {
        const { teamName } = req.params;

        if (!teamName) {
            return res.status(400).json({ 
                error: 'Team name is required' 
            });
        }

        // Fetch notes for the team
        const result = await pool.query(
            `SELECT * FROM notes 
             WHERE team_name = $1 
             ORDER BY created_at DESC`,
            [teamName]
        );

        res.json({
            notes: result.rows
        });

    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ 
            error: 'Failed to fetch notes',
            details: error.message 
        });
    }
});

// Get all notes (for admin purposes)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM notes 
             ORDER BY created_at DESC`
        );

        res.json({
            notes: result.rows
        });

    } catch (error) {
        console.error('Error fetching all notes:', error);
        res.status(500).json({ 
            error: 'Failed to fetch notes',
            details: error.message 
        });
    }
});

// Get a specific note by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM notes WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Note not found' 
            });
        }

        res.json({
            note: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ 
            error: 'Failed to fetch note',
            details: error.message 
        });
    }
});

// Update a note
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { headline, noteText } = req.body;

        // Validate required fields
        if (!headline || !noteText) {
            return res.status(400).json({ 
                error: 'Missing required fields: headline, noteText' 
            });
        }

        const result = await pool.query(
            `UPDATE notes 
             SET heading = $1, text = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3 
             RETURNING *`,
            [headline, noteText, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Note not found' 
            });
        }

        res.json({
            message: 'Note updated successfully',
            note: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ 
            error: 'Failed to update note',
            details: error.message 
        });
    }
});

// Delete a note
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM notes WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Note not found' 
            });
        }

        res.json({
            message: 'Note deleted successfully',
            note: result.rows[0]
        });

    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ 
            error: 'Failed to delete note',
            details: error.message 
        });
    }
});

export { router as notesRoutes };
