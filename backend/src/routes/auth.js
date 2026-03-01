import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshExpiresAt,
  COOKIE_OPTIONS,
  verifyAccessToken,
} from '../auth.js';
import { generateVerificationCode, sendVerificationCode } from '../email.js';

const router = Router();
const SALT_ROUNDS = 12;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'tanguy@palmie.net').toLowerCase();
const CODE_EXPIRY_MINUTES = 15;

// ── POST /api/auth/register ──────────────────────────────────────────
// Cree un utilisateur non verifie et envoie un code par email.
router.post('/register', async (req, res) => {
  try {
    const { email, pseudo, password } = req.body;
    if (!email || !pseudo || !password) {
      return res.status(400).json({ error: 'Email, pseudo et mot de passe requis' });
    }
    if (pseudo.length < 2 || pseudo.length > 50) {
      return res.status(400).json({ error: 'Le pseudo doit contenir entre 2 et 50 caracteres' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caracteres' });
    }

    const emailLower = email.toLowerCase().trim();

    // Unicite email
    const existingEmail = await pool.query('SELECT id, verified FROM users WHERE email = $1', [emailLower]);
    if (existingEmail.rows.length > 0) {
      if (existingEmail.rows[0].verified) {
        return res.status(409).json({ error: 'Cet email est deja utilise' });
      }
      // Non verifie : on supprime l'ancien compte pour re-creer
      await pool.query('DELETE FROM users WHERE id = $1', [existingEmail.rows[0].id]);
    }

    // Unicite pseudo
    const existingPseudo = await pool.query('SELECT id FROM users WHERE LOWER(pseudo) = LOWER($1)', [pseudo.trim()]);
    if (existingPseudo.rows.length > 0) {
      return res.status(409).json({ error: 'Ce pseudo est deja pris' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const role = emailLower === ADMIN_EMAIL ? 'admin' : 'user';

    const result = await pool.query(
      'INSERT INTO users (email, pseudo, password_hash, role, verified) VALUES ($1, $2, $3, $4, FALSE) RETURNING id, email, pseudo, role',
      [emailLower, pseudo.trim(), hash, role],
    );
    const user = result.rows[0];

    // Generer et envoyer le code de verification
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
    await pool.query('INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, $3)', [
      emailLower,
      code,
      expiresAt,
    ]);

    await sendVerificationCode(emailLower, code);

    res.status(201).json({
      message: 'Compte cree. Verifie ton email pour activer ton compte.',
      user: { id: user.id, email: user.email, pseudo: user.pseudo },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/auth/verify ────────────────────────────────────────────
// Verifie le code email, active le compte, et connecte l'utilisateur.
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email et code requis' });
    }

    const emailLower = email.toLowerCase().trim();

    // Trouver un code valide non utilise
    const codeResult = await pool.query(
      `SELECT id FROM verification_codes
       WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [emailLower, code.toUpperCase().trim()],
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Code invalide ou expire' });
    }

    // Marquer le code comme utilise
    await pool.query('UPDATE verification_codes SET used = TRUE WHERE id = $1', [codeResult.rows[0].id]);

    // Activer le compte
    const userResult = await pool.query(
      'UPDATE users SET verified = TRUE WHERE email = $1 RETURNING id, email, pseudo, role',
      [emailLower],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const user = userResult.rows[0];

    // Generer les tokens et connecter
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    await pool.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [
      user.id,
      refreshToken,
      getRefreshExpiresAt(),
    ]);

    res.cookie('access_token', accessToken, { ...COOKIE_OPTIONS, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      user: { id: user.id, email: user.email, pseudo: user.pseudo, role: user.role },
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/auth/resend ────────────────────────────────────────────
// Renvoie un nouveau code de verification.
router.post('/resend', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const emailLower = email.toLowerCase().trim();

    const userResult = await pool.query('SELECT id, verified FROM users WHERE email = $1', [emailLower]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    if (userResult.rows[0].verified) {
      return res.status(400).json({ error: 'Compte deja verifie' });
    }

    // Invalider les anciens codes
    await pool.query('UPDATE verification_codes SET used = TRUE WHERE email = $1 AND used = FALSE', [emailLower]);

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
    await pool.query('INSERT INTO verification_codes (email, code, expires_at) VALUES ($1, $2, $3)', [
      emailLower,
      code,
      expiresAt,
    ]);

    await sendVerificationCode(emailLower, code);

    res.json({ message: 'Nouveau code envoye' });
  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────
// Connexion classique — refuse si non verifie.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const result = await pool.query(
      'SELECT id, email, pseudo, password_hash, role, verified FROM users WHERE email = $1',
      [email.toLowerCase().trim()],
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    if (!user.verified) {
      return res.status(403).json({ error: 'Compte non verifie. Verifie ton email.', needsVerification: true });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    await pool.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [
      user.id,
      refreshToken,
      getRefreshExpiresAt(),
    ]);

    res.cookie('access_token', accessToken, { ...COOKIE_OPTIONS, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: { id: user.id, email: user.email, pseudo: user.pseudo, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/auth/refresh ───────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ error: 'Pas de refresh token' });

    const result = await pool.query(
      'DELETE FROM refresh_tokens WHERE token = $1 AND expires_at > NOW() RETURNING user_id',
      [token],
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Refresh token invalide ou expire' });

    const userId = result.rows[0].user_id;
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken();
    await pool.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [
      userId,
      newRefreshToken,
      getRefreshExpiresAt(),
    ]);

    res.cookie('access_token', newAccessToken, { ...COOKIE_OPTIONS, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('refresh_token', newRefreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (token) {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]).catch(() => {});
  }
  res.clearCookie('access_token', COOKIE_OPTIONS);
  res.clearCookie('refresh_token', COOKIE_OPTIONS);
  res.json({ success: true });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: 'Non authentifie' });
  try {
    const payload = verifyAccessToken(token);
    const result = await pool.query('SELECT id, email, pseudo, role, verified FROM users WHERE id = $1', [
      payload.userId,
    ]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Utilisateur introuvable' });
    const user = result.rows[0];
    res.json({ id: user.id, email: user.email, pseudo: user.pseudo, role: user.role, verified: user.verified });
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
});

export default router;
