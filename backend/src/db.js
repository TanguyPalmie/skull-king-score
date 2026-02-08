import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://skullking:skullking_secret@db:5432/skullking',
});

export default pool;
