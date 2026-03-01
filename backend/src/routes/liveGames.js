import { Router } from 'express';
import pool from '../db.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

function generateShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── POST /api/live-games ─────────────────────────────────────────────
// Creer ou mettre a jour une partie live.
router.post('/', authenticate, async (req, res) => {
  try {
    const { game_slug, state, share_code } = req.body;
    if (!game_slug || !state) {
      return res.status(400).json({ error: 'game_slug et state requis' });
    }

    // Si share_code fourni, mettre a jour la partie existante
    if (share_code) {
      const result = await pool.query(
        `UPDATE live_games SET state = $1, updated_at = NOW()
         WHERE share_code = $2 AND owner_id = $3 AND active = TRUE
         RETURNING id, share_code, game_slug, active`,
        [JSON.stringify(state), share_code, req.userId],
      );
      if (result.rows.length > 0) {
        return res.json(result.rows[0]);
      }
    }

    // Sinon, creer une nouvelle partie
    let code = generateShareCode();
    // S'assurer que le code est unique
    for (let i = 0; i < 5; i++) {
      const exists = await pool.query('SELECT 1 FROM live_games WHERE share_code = $1', [code]);
      if (exists.rows.length === 0) break;
      code = generateShareCode();
    }

    const result = await pool.query(
      `INSERT INTO live_games (owner_id, share_code, game_slug, state)
       VALUES ($1, $2, $3, $4) RETURNING id, share_code, game_slug, active`,
      [req.userId, code, game_slug, JSON.stringify(state)],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Live game save error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/live-games/mine ─────────────────────────────────────────
// Mes parties actives.
router.get('/mine', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, share_code, game_slug, state, active, created_at, updated_at
       FROM live_games WHERE owner_id = $1 AND active = TRUE
       ORDER BY updated_at DESC`,
      [req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('My live games error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/live-games/:code ────────────────────────────────────────
// Voir une partie en cours par code de partage (public pour les amis).
router.get('/:code', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lg.id, lg.share_code, lg.game_slug, lg.state, lg.active,
              lg.created_at, lg.updated_at, u.pseudo AS owner_pseudo
       FROM live_games lg
       JOIN users u ON u.id = lg.owner_id
       WHERE lg.share_code = $1`,
      [req.params.code.toUpperCase()],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partie introuvable' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Live game view error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PATCH /api/live-games/:code/end ──────────────────────────────────
// Terminer une partie live.
router.patch('/:code/end', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE live_games SET active = FALSE, updated_at = NOW()
       WHERE share_code = $1 AND owner_id = $2
       RETURNING id, share_code, active`,
      [req.params.code.toUpperCase(), req.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partie introuvable' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Live game end error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
