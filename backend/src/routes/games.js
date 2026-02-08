import { Router } from 'express';
import pool from '../db.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

// GET /api/games — load current game
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT state FROM games WHERE user_id = $1', [req.userId]);
    if (result.rows.length === 0) return res.json(null);
    res.json(result.rows[0].state);
  } catch (err) {
    console.error('Load game error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/games — save current game
router.put('/', async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) return res.status(400).json({ error: 'State requis' });
    await pool.query(
      `INSERT INTO games (user_id, state, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET state = $2, updated_at = NOW()`,
      [req.userId, JSON.stringify(state)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Save game error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/games — delete current game
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM games WHERE user_id = $1', [req.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete game error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
