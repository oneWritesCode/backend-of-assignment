import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../db.js';

const router = express.Router();

// Helper function to generate unique team code (integer)
const generateTeamCode = () => {
    return Math.floor(Math.random() * 900000) + 100000; // 6-digit number
};

// Create Team API
router.post('/create', async (req, res) => {
    try {
        const { teamName, teamDescription, userName, email, password } = req.body;

        // Validate required fields
        if (!teamName || !userName || !email || !password) {
            return res.status(400).json({ 
                error: 'Team name, user name, email, and password are required' 
            });
        }

        // Check if user already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Generate unique team code
        let teamCode;
        let isUnique = false;
        while (!isUnique) {
            teamCode = generateTeamCode();
            const existingTeam = await pool.query('SELECT id FROM teams WHERE team_code = $1', [teamCode]);
            if (existingTeam.rows.length === 0) {
                isUnique = true;
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Start transaction
        await pool.query('BEGIN');

        try {
            // Create team
            const teamResult = await pool.query(
                'INSERT INTO teams (name, description, team_code, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
                [teamName, teamDescription || '', teamCode, userName]
            );
            const team = teamResult.rows[0];

            // Create user as team creator
            const userResult = await pool.query(
                'INSERT INTO users (name, email, password, team_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [userName, email, hashedPassword, team.id, 'admin']
            );
            const user = userResult.rows[0];

            // Add user to team_members table
            await pool.query(
                'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
                [team.id, user.id, 'admin']
            );

            await pool.query('COMMIT');

            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email, 
                    teamId: team.id,
                    role: 'admin' 
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // Return response without password
            const { password: _, ...userWithoutPassword } = user;

            res.status(201).json({
                message: 'Team created successfully',
                token,
                team: {
                    id: team.id,
                    name: team.name,
                    description: team.description,
                    team_code: team.team_code
                },
                user: userWithoutPassword
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Join Team API
router.post('/join', async (req, res) => {
    try {
        const { teamCode, userName, email, password } = req.body;

        // Validate required fields
        if (!teamCode || !userName || !email || !password) {
            return res.status(400).json({ 
                error: 'Team code, user name, email, and password are required' 
            });
        }

        // Check if user already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Find team by team code
        const teamResult = await pool.query('SELECT * FROM teams WHERE team_code = $1', [teamCode]);
        const team = teamResult.rows[0];

        if (!team) {
            return res.status(404).json({ error: 'Team not found with this code' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Start transaction
        await pool.query('BEGIN');

        try {
            // Create user
            const userResult = await pool.query(
                'INSERT INTO users (name, email, password, team_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [userName, email, hashedPassword, team.id, 'member']
            );
            const user = userResult.rows[0];

            // Add user to team_members table
            await pool.query(
                'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
                [team.id, user.id, 'member']
            );

            await pool.query('COMMIT');

            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email, 
                    teamId: team.id,
                    role: 'member' 
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // Return response without password
            const { password: _, ...userWithoutPassword } = user;

            res.status(201).json({
                message: 'Successfully joined team',
                token,
                team: {
                    id: team.id,
                    name: team.name,
                    description: team.description,
                    team_code: team.team_code
                },
                user: userWithoutPassword
            });

        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Join team error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get team members (protected route)
router.get('/members', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        if (!decoded.teamId) {
            return res.status(400).json({ error: 'User is not part of any team' });
        }

        const membersResult = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, tm.joined_at 
             FROM users u 
             JOIN team_members tm ON u.id = tm.user_id 
             WHERE tm.team_id = $1 
             ORDER BY tm.joined_at ASC`,
            [decoded.teamId]
        );

        res.json({ members: membersResult.rows });

    } catch (error) {
        console.error('Get members error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

export { router as teamRoutes };
