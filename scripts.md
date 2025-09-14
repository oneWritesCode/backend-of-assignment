-- Tenants
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free'
);

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'member')),
  tenant_id INT REFERENCES tenants(id)
);

-- Notes
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  tenant_id INT REFERENCES tenants(id),
  user_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
