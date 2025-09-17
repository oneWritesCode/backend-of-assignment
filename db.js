dotenv.config();

import dotenv from 'dotenv';
import { createClient } from "@supabase/supabase-js";
import pkg from 'pg';


const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // lets c if it works
});

// const pool = createClient(
//   process.env.PROJECT_URL,
//   process.env.API_KEY
// );

export default pool;