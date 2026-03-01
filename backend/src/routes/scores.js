import { Router } from 'express';
import pool from '../db.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

// ── POST /api/scores ─────────────────────────────────────────────────
// Sauvegarder un score apres une partie.
router.post('/', async (req, res) => {
  try {
    const { game_slug, score, rank, players_count } = req.body;
    if (!game_slug || score == null) {
      return res.status(400).json({ error: 'game_slug et score requis' });
    }

    const result = await pool.query(
      `INSERT INTO game_scores (user_id, game_slug, score, rank, players_count)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, game_slug, score, rank || null, players_count || 1],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Score save error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/scores/me ───────────────────────────────────────────────
// Mes scores, optionnellement filtre par jeu.
router.get('/me', async (req, res) => {
  try {
    const { game_slug } = req.query;
    let query = `SELECT gs.*, gd.name AS game_name, gd.icon AS game_icon
                 FROM game_scores gs
                 LEFT JOIN game_definitions gd ON gd.slug = gs.game_slug
                 WHERE gs.user_id = $1`;
    const params = [req.userId];

    if (game_slug) {
      query += ' AND gs.game_slug = $2';
      params.push(game_slug);
    }

    query += ' ORDER BY gs.played_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('My scores error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/scores/friends ──────────────────────────────────────────
// Scores de mes amis, optionnellement filtre par jeu.
router.get('/friends', async (req, res) => {
  try {
    const { game_slug } = req.query;

    // IDs des amis acceptes
    const friendsResult = await pool.query(
      `SELECT CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END AS friend_id
       FROM friendships f
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'`,
      [req.userId],
    );

    const friendIds = friendsResult.rows.map((r) => r.friend_id);
    if (friendIds.length === 0) return res.json([]);

    // Inclure aussi ses propres scores pour comparaison
    const allIds = [req.userId, ...friendIds];

    let query = `SELECT gs.*, u.pseudo, gd.name AS game_name, gd.icon AS game_icon
                 FROM game_scores gs
                 JOIN users u ON u.id = gs.user_id
                 LEFT JOIN game_definitions gd ON gd.slug = gs.game_slug
                 WHERE gs.user_id = ANY($1)`;
    const params = [allIds];

    if (game_slug) {
      query += ' AND gs.game_slug = $2';
      params.push(game_slug);
    }

    query += ' ORDER BY gs.played_at DESC LIMIT 200';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Friends scores error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
