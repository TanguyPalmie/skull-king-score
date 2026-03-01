import { Router } from 'express';
import pool from '../db.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

// ── GET /api/friends ─────────────────────────────────────────────────
// Liste les amis acceptes de l'utilisateur connecte.
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.pseudo, u.email, f.created_at AS friends_since
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
       ORDER BY u.pseudo ASC`,
      [req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Friends list error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/friends/pending ─────────────────────────────────────────
// Demandes d'amis recues en attente.
router.get('/pending', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.id AS request_id, u.id, u.pseudo, u.email, f.created_at
       FROM friendships f
       JOIN users u ON u.id = f.user_id
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Friends pending error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/friends/sent ────────────────────────────────────────────
// Demandes d'amis envoyees en attente.
router.get('/sent', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.id AS request_id, u.id, u.pseudo, u.email, f.created_at
       FROM friendships f
       JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Friends sent error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/friends/request ────────────────────────────────────────
// Envoyer une demande d'ami par pseudo.
router.post('/request', async (req, res) => {
  try {
    const { pseudo } = req.body;
    if (!pseudo) return res.status(400).json({ error: 'Pseudo requis' });

    // Trouver l'utilisateur cible
    const target = await pool.query('SELECT id FROM users WHERE LOWER(pseudo) = LOWER($1) AND verified = TRUE', [
      pseudo.trim(),
    ]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const friendId = target.rows[0].id;
    if (friendId === req.userId) {
      return res.status(400).json({ error: 'Tu ne peux pas t\'ajouter toi-meme' });
    }

    // Verifier si une relation existe deja (dans les 2 sens)
    const existing = await pool.query(
      `SELECT id, status FROM friendships
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [req.userId, friendId],
    );

    if (existing.rows.length > 0) {
      const { status } = existing.rows[0];
      if (status === 'accepted') return res.status(400).json({ error: 'Vous etes deja amis' });
      return res.status(400).json({ error: 'Demande deja envoyee' });
    }

    await pool.query('INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, $3)', [
      req.userId,
      friendId,
      'pending',
    ]);

    res.status(201).json({ message: 'Demande envoyee' });
  } catch (err) {
    console.error('Friend request error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/friends/accept/:requestId ──────────────────────────────
router.post('/accept/:requestId', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE friendships SET status = 'accepted'
       WHERE id = $1 AND friend_id = $2 AND status = 'pending'
       RETURNING id`,
      [req.params.requestId, req.userId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }
    res.json({ message: 'Ami accepte' });
  } catch (err) {
    console.error('Friend accept error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/friends/reject/:requestId ──────────────────────────────
router.post('/reject/:requestId', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM friendships WHERE id = $1 AND friend_id = $2 AND status = $3 RETURNING id',
      [req.params.requestId, req.userId, 'pending'],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }
    res.json({ message: 'Demande refusee' });
  } catch (err) {
    console.error('Friend reject error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── DELETE /api/friends/:friendId ────────────────────────────────────
// Supprimer un ami.
router.delete('/:friendId', async (req, res) => {
  try {
    const friendId = parseInt(req.params.friendId, 10);
    const result = await pool.query(
      `DELETE FROM friendships
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
         AND status = 'accepted'
       RETURNING id`,
      [req.userId, friendId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ami introuvable' });
    }
    res.json({ message: 'Ami supprime' });
  } catch (err) {
    console.error('Friend delete error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/friends/search?q=... ────────────────────────────────────
// Recherche de pseudo pour ajouter des amis.
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const result = await pool.query(
      `SELECT id, pseudo FROM users
       WHERE LOWER(pseudo) LIKE LOWER($1) AND id != $2 AND verified = TRUE
       ORDER BY pseudo ASC LIMIT 10`,
      [`%${q}%`, req.userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Friend search error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
