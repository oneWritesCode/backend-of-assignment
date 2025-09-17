import pool from './db.js';

const initializeDatabase = async () => {
    try {
        console.log('Initializing database...');

        const testResult = await pool.query('SELECT NOW()');
        console.log("test Result: ", testResult)
        console.log('Database connection successful:', testResult.rows[0].now);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS teams (
                id SERIAL PRIMARY KEY,
                team_name VARCHAR(255) NOT NULL,
                description TEXT,
                team_code VARCHAR(255) NOT NULL,
                created_by VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_team_code ON teams(team_code)`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                fullname VARCHAR(255) NOT NULL, 
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                team_code VARCHAR(255),
                team VARCHAR(255),
                role VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS team_code INTEGER`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS team VARCHAR(255)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50)`);

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

        console.log(' Database tables created successfully!');

    } catch (error) {
        console.error('Database initialization failed:', error);
        console.log('Server will continue running, but database operations may fail');
    }
};

export default initializeDatabase;