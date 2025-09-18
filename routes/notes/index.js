import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import pkg from 'pg';
import pool from '../../db.js';


const router = express.Router();

// Create a new note
router.post('/create', async (req, res) => {
  try {
    const { memberName, teamName, memberEmail, heading, text } = req.body;
    // const user_id = req.user.id;

    if (!heading || !teamName) {
      return res.status(400).json({ error: 'Heading and team name are required' });
    }


    const result = await pool.query(
      'INSERT INTO notes (heading, text, team_name, member_name, member_email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [heading, text, teamName, memberName, memberEmail]
    );

    res.status(201).json({
      success: true,
      note: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});


//TODO: will have to change route

// Get all notes for a team
// router.get('/team/:teamId', async (req, res) => {
//   try {
//     const { teamId } = req.params;
//     const user_id = req.user.id;
    
//     // First check if user belongs to this team
//     const teamMemberCheck = await pool.query(
//       'SELECT * FROM users WHERE id = $1 AND tenant_id = $2',
//       [user_id, teamId]
//     );

//     if (teamMemberCheck.rows.length === 0) {
//       return res.status(403).json({ error: 'You do not have access to this team\'s notes' });
//     }

//     const result = await pool.query(
//       `SELECT n.*, u.email, u.role 
//        FROM notes n 
//        JOIN users u ON n.user_id = u.id 
//        WHERE n.tenant_id = $1 
//        ORDER BY n.created_at DESC`,
//       [teamId]
//     );

//     res.json({
//       success: true,
//       notes: result.rows
//     });
//   } catch (error) {
//     console.error('Error fetching notes:', error);
//     res.status(500).json({ error: 'Failed to fetch notes' });
//   }
// });

// Get a specific note by ID
// router.get('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user_id = req.user.id;

//     const result = await pool.query(
//       `SELECT n.*, u.email, u.role 
//        FROM notes n 
//        JOIN users u ON n.user_id = u.id 
//        WHERE n.id = $1`,
//       [id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Note not found' });
//     }

//     const note = result.rows[0];

//     // Check if user belongs to the team that owns this note
//     const teamMemberCheck = await pool.query(
//       'SELECT * FROM users WHERE id = $1 AND tenant_id = $2',
//       [user_id, note.tenant_id]
//     );

//     if (teamMemberCheck.rows.length === 0) {
//       return res.status(403).json({ error: 'You do not have access to this note' });
//     }

//     res.json({
//       success: true,
//       note
//     });
//   } catch (error) {
//     console.error('Error fetching note:', error);
//     res.status(500).json({ error: 'Failed to fetch note' });
//   }
// });

// Update a note
// router.put('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, content } = req.body;
//     const user_id = req.user.id;

//     // First check if note exists and user has permission
//     const noteCheck = await pool.query(
//       'SELECT * FROM notes WHERE id = $1',
//       [id]
//     );

//     if (noteCheck.rows.length === 0) {
//       return res.status(404).json({ error: 'Note not found' });
//     }

//     const note = noteCheck.rows[0];

//     // Check if user belongs to the team that owns this note
//     const teamMemberCheck = await pool.query(
//       'SELECT * FROM users WHERE id = $1 AND tenant_id = $2',
//       [user_id, note.tenant_id]
//     );

//     if (teamMemberCheck.rows.length === 0) {
//       return res.status(403).json({ error: 'You do not have access to modify this note' });
//     }

//     // Only allow the creator or admin to update the note
//     if (note.user_id !== user_id && teamMemberCheck.rows[0].role !== 'admin') {
//       return res.status(403).json({ error: 'You do not have permission to update this note' });
//     }

//     const result = await pool.query(
//       'UPDATE notes SET title = $1, content = $2 WHERE id = $3 RETURNING *',
//       [title, content, id]
//     );

//     res.json({
//       success: true,
//       note: result.rows[0]
//     });
//   } catch (error) {
//     console.error('Error updating note:', error);
//     res.status(500).json({ error: 'Failed to update note' });
//   }
// });

// Delete a note
// router.delete('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user_id = req.user.id;

//     // First check if note exists and user has permission
//     const noteCheck = await pool.query(
//       'SELECT * FROM notes WHERE id = $1',
//       [id]
//     );

//     if (noteCheck.rows.length === 0) {
//       return res.status(404).json({ error: 'Note not found' });
//     }

//     const note = noteCheck.rows[0];

//     // Check if user belongs to the team that owns this note
//     const teamMemberCheck = await pool.query(
//       'SELECT * FROM users WHERE id = $1 AND tenant_id = $2',
//       [user_id, note.tenant_id]
//     );

//     if (teamMemberCheck.rows.length === 0) {
//       return res.status(403).json({ error: 'You do not have access to delete this note' });
//     }

//     // Only allow the creator or admin to delete the note
//     if (note.user_id !== user_id && teamMemberCheck.rows[0].role !== 'admin') {
//       return res.status(403).json({ error: 'You do not have permission to delete this note' });
//     }

//     await pool.query('DELETE FROM notes WHERE id = $1', [id]);

//     res.json({
//       success: true,
//       message: 'Note deleted successfully'
//     });
//   } catch (error) {
//     console.error('Error deleting note:', error);
//     res.status(500).json({ error: 'Failed to delete note' });
//   }
// });

export const notesRoutes = router;