import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'skullking',
  user: process.env.DB_USER || 'skullking',
  password: process.env.DB_PASSWORD || 'skullking',
});

export default pool;
