import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../db.js';

const router = express.Router();

router.post('/create-team', async (req, res) => {
    try {
        const { teamName, description, userName, email, teamCode } = req.body;
        console.log("teamName", teamName)
        console.log("description", description)
        console.log("userName", userName)
        console.log("email", email)
        console.log("teamCode", teamCode)

        if (!teamName || !userName || !email || !teamCode) {
            return res.status(400).json({
                error: 'Team name, user name, email, and teamCode are required'
            });
        }

        await pool.query('BEGIN');

        try {
            const teamResult = await pool.query(
                'INSERT INTO teams (team_name, description, team_code, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
                [teamName, description || '', teamCode, userName]
            );
            const team = teamResult.rows[0];

            const userResult = await pool.query(
                `UPDATE users 
                 SET team_code = $1, team = $2, role = $3, updated_at = NOW()
                 WHERE email = $4
                 RETURNING *`,
                [team.team_code, team.team_name, 'admin', email]
            );
            const user = userResult.rows[0];

            await pool.query(
                'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [team.id, user.id, 'admin']
            );

            await pool.query('COMMIT');

            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    teamId: team.id,
                    role: 'admin'
                },
                process.env.JWT_SECRET,
                { expiresIn: '240h' }
            );

            const { password: _, ...userWithoutPassword } = user;

            res.status(201).json({
                message: 'Team created successfully',
                token,
                team: {
                    id: team.id,
                    name: team.team_name,
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

router.post('/join-team', async (req, res) => {
    try {
        const { teamCode, userName, email } = req.body;

        if (!teamCode || !userName || !email) {
            return res.status(400).json({
                error: 'Team code, user name, and email are required'
            });
        }

        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        const teamResult = await pool.query('SELECT * FROM teams WHERE team_code = $1', [teamCode]);
        const team = teamResult.rows[0];

        if (!team) {
            return res.status(404).json({ error: 'Team not found with this code' });
        }

        await pool.query('BEGIN');

        try {
            let user;
            if (existingUser.rows.length > 0) {
                const updated = await pool.query(
                    `UPDATE users 
                     SET team_code = $1, team = $2, role = $3, updated_at = NOW()
                     WHERE id = $4
                     RETURNING *`,
                    [team.team_code, team.team_name, 'member', existingUser.rows[0].id]
                );
                user = updated.rows[0];
            } else {
                const created = await pool.query(
                    `INSERT INTO users (fullname, email, password, team_code, team, role)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING *`,
                    [userName, email, '', team.team_code, team.team_name, 'member']
                );
                user = created.rows[0];
            }

            await pool.query(
                'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [team.id, user.id, 'member']
            );

            await pool.query('COMMIT');

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

            const { password: _, ...userWithoutPassword } = user;

            res.status(201).json({
                message: 'Successfully joined team',
                token,
                team: {
                    id: team.id,
                    name: team.team_name,
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
            `SELECT u.id, u.fullname as name, u.email, u.role, tm.joined_at 
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

router.get('/:teamName', async (req, res) => {
    try {
        const { teamName } = req.params;
        console.log('somehthing comming from frontend', teamName)

        const teamResult = await pool.query(
            'SELECT * FROM teams WHERE team_name = $1',
            [teamName]
        );
        if (!teamResult) {
            return res.status(404).json({ error: 'teamResult not found' });
        }
        const team = teamResult.rows[0];
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const membersResult = await pool.query(
            `SELECT u.id, u.fullname as name, u.email, tm.role, tm.joined_at
             FROM team_members tm
             JOIN users u ON u.id = tm.user_id
             WHERE tm.team_id = $1
             ORDER BY tm.joined_at ASC`,
            [team.id]
        );

        res.json({
            team: {
                id: team.id,
                name: team.team_name,
                description: team.description,
                team_code: team.team_code,
                created_by: team.created_by,
                created_at: team.created_at,
            },
            members: membersResult.rows,
        });
    } catch (error) {
        console.error('Get team by name error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export { router as teamRoutes };