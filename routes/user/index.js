import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../db.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        console.log("email: ", email)
        console.log("pwd: ", password)
        console.log("fullname: ", fullName)

        if (!email || !password || !fullName) {
            return res.status(400).json({
                error: 'Email, password, and fullname are required'
            });
        }

        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await pool.query(
            'INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3) RETURNING *',
            [fullName, email, hashedPassword]
        );
        const user = userResult.rows[0];

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            'your-secret-key',
            { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const userResult = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: '240h' }
        );

        const { password: _, ...userWithoutPassword } = user;

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 240 * 60 * 60 * 1000 
        });

        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/profile', async (req, res) => {
    try {
        console.log('🔍 Profile route accessed');
        
        const token = req.headers.authorization?.split(' ')[1];
        console.log('📝 Token received:', token ? 'Token present' : 'No token');

        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({ error: 'No token provided' });
        }

        console.log('🔐 Verifying JWT token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token verified successfully. User ID:', decoded.userId, 'Email:', decoded.email);

        console.log('🔍 Fetching user data from database...');
        const userResult = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [decoded.userId]
        );

        const user = userResult.rows[0];
        if (!user) {
            console.log('❌ User not found in database for ID:', decoded.userId);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('✅ User found in database:', {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at
        });

        const { password, ...userWithoutPassword } = user;
        
        console.log('📤 Sending user data to frontend:', userWithoutPassword);
        res.json({ 
            message: 'User profile retrieved successfully',
            user: userWithoutPassword,
            tokenValid: true,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Profile error:', error.message);
        if (error.name === 'JsonWebTokenError') {
            console.log('🔒 Invalid JWT token');
            res.status(401).json({ error: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            console.log('⏰ JWT token expired');
            res.status(401).json({ error: 'Token expired' });
        } else {
            console.log('💥 Unexpected error:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export { router as userRoutes };