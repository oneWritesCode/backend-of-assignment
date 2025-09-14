import pool from './db.js';

const initializeDatabase = async () => {
    try {
        console.log('🔄 Initializing database...');
        
        // Test connection first
        const testResult = await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful:', testResult.rows[0].now);
        
        // Create teams table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teams (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                team_code INTEGER NOT NULL,
                created_by VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
                role VARCHAR(50) DEFAULT 'member',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create team_members table for many-to-many relationship
        await pool.query(`
            CREATE TABLE IF NOT EXISTS team_members (
                id SERIAL PRIMARY KEY,
                team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(50) DEFAULT 'member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(team_id, user_id)
            )
        `);

        console.log('✅ Database tables created successfully!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.log('⚠️  Server will continue running, but database operations may fail');
        // Don't throw error to prevent server crash
        // throw error;
    }
};

export default initializeDatabase;
