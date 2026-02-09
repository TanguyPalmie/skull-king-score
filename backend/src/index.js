import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { readFileSync } from 'fs';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import gamesRoutes from './routes/games.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// DB init + start
async function start() {
  // Wait for DB to be ready
  let retries = 15;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connection established');
      break;
    } catch (err) {
      retries--;
      console.log(`Waiting for database... (${retries} retries left) — ${err.message}`);
      if (retries === 0) {
        console.error('Could not connect to database after all retries:', err.message);
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Run init SQL
  try {
    const sql = readFileSync(new URL('../init.sql', import.meta.url), 'utf-8');
    await pool.query(sql);
    console.log('Database initialized');
  } catch (err) {
    console.error('DB init error:', err);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

start();
