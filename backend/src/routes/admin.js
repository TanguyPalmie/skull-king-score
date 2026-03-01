import { Router } from 'express';
import pool from '../db.js';
import authenticate from '../middleware/authenticate.js';
import adminOnly from '../middleware/adminOnly.js';

const router = Router();

// Tous les endpoints admin requierent auth + role admin
router.use(authenticate, adminOnly);

// ── GET /api/admin/users ─────────────────────────────────────────────
router.get('/users', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, pseudo, role, verified, created_at FROM users ORDER BY created_at DESC',
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── CRUD game_definitions ────────────────────────────────────────────

// GET /api/admin/games — liste toutes les definitions (y compris desactivees)
router.get('/games', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM game_definitions ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Admin games list error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/games — creer un jeu
router.post('/games', async (req, res) => {
  try {
    const {
      slug,
      name,
      icon,
      description,
      min_players,
      max_players,
      default_rounds,
      scoring_type,
      bonus_values,
      allow_custom_bonus,
      theme_config,
      enabled,
    } = req.body;

    if (!slug || !name) {
      return res.status(400).json({ error: 'slug et name requis' });
    }

    const result = await pool.query(
      `INSERT INTO game_definitions
         (slug, name, icon, description, min_players, max_players, default_rounds,
          scoring_type, bonus_values, allow_custom_bonus, theme_config, enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        slug,
        name,
        icon || '🎲',
        description || '',
        min_players || 2,
        max_players || 12,
        default_rounds || 10,
        scoring_type || 'simple',
        JSON.stringify(bonus_values || []),
        allow_custom_bonus ?? false,
        JSON.stringify(theme_config || {}),
        enabled ?? true,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ce slug existe deja' });
    }
    console.error('Admin game create error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/admin/games/:slug — modifier un jeu
router.put('/games/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      name,
      icon,
      description,
      min_players,
      max_players,
      default_rounds,
      scoring_type,
      bonus_values,
      allow_custom_bonus,
      theme_config,
      enabled,
    } = req.body;

    const result = await pool.query(
      `UPDATE game_definitions SET
         name = COALESCE($1, name),
         icon = COALESCE($2, icon),
         description = COALESCE($3, description),
         min_players = COALESCE($4, min_players),
         max_players = COALESCE($5, max_players),
         default_rounds = COALESCE($6, default_rounds),
         scoring_type = COALESCE($7, scoring_type),
         bonus_values = COALESCE($8, bonus_values),
         allow_custom_bonus = COALESCE($9, allow_custom_bonus),
         theme_config = COALESCE($10, theme_config),
         enabled = COALESCE($11, enabled),
         updated_at = NOW()
       WHERE slug = $12
       RETURNING *`,
      [
        name,
        icon,
        description,
        min_players,
        max_players,
        default_rounds,
        scoring_type,
        bonus_values != null ? JSON.stringify(bonus_values) : null,
        allow_custom_bonus,
        theme_config != null ? JSON.stringify(theme_config) : null,
        enabled,
        slug,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Jeu introuvable' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Admin game update error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/admin/games/:slug — supprimer un jeu (sauf skull-king)
router.delete('/games/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    if (slug === 'skull-king') {
      return res.status(403).json({ error: 'Impossible de supprimer Skull King' });
    }

    const result = await pool.query('DELETE FROM game_definitions WHERE slug = $1 RETURNING slug', [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Jeu introuvable' });
    }

    res.json({ deleted: true });
  } catch (err) {
    console.error('Admin game delete error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
