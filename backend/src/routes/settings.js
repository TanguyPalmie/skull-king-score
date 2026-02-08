import { Router } from 'express';
import pool from '../db.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

const DEFAULT_SETTINGS = { lootEnabled: false, lootValues: [20, 30, -10], maxRounds: 10 };

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM settings WHERE user_id = $1', [req.userId]);
    if (result.rows.length === 0) return res.json(DEFAULT_SETTINGS);
    res.json({ ...DEFAULT_SETTINGS, ...result.rows[0].data });
  } catch (err) {
    console.error('Load settings error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  try {
    const data = { ...DEFAULT_SETTINGS, ...req.body };
    await pool.query(
      `INSERT INTO settings (user_id, data, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET data = $2, updated_at = NOW()`,
      [req.userId, JSON.stringify(data)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Save settings error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
