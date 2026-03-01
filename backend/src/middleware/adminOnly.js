import pool from '../db.js';

/**
 * Middleware qui verifie que l'utilisateur authentifie a le role admin.
 * Doit etre utilise APRES le middleware authenticate.
 */
export default async function adminOnly(req, res, next) {
  try {
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Acces reserve aux administrateurs' });
    }
    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
