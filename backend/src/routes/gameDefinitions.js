import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/game-definitions — jeux actifs (endpoint public)
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, name, icon, description, min_players, max_players, default_rounds,
              scoring_type, bonus_values, allow_custom_bonus, theme_config
       FROM game_definitions
       WHERE enabled = TRUE
       ORDER BY created_at ASC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Game definitions error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/game-definitions/:slug — detail d'un jeu
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, name, icon, description, min_players, max_players, default_rounds,
              scoring_type, bonus_values, allow_custom_bonus, theme_config
       FROM game_definitions
       WHERE slug = $1 AND enabled = TRUE`,
      [req.params.slug],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Jeu introuvable' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Game definition detail error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
