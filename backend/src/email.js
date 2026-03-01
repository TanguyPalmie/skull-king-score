import nodemailer from 'nodemailer';

const SMTP_ENABLED = process.env.SMTP_ENABLED === 'true';
const FROM = process.env.SMTP_FROM || 'postmaster@palmie.net';

let transporter = null;
if (SMTP_ENABLED) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mailpit',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    secure: process.env.SMTP_SECURE === 'true',
    ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } } : {}),
  });
}

/**
 * Genere un code de verification aleatoire de 8 caracteres alphanumeriques.
 */
export function generateVerificationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans O/0/1/I pour eviter la confusion
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Envoie le code de verification par email.
 * En dev (SMTP_ENABLED=false), le code est simplement affiche dans les logs.
 */
export async function sendVerificationCode(email, code) {
  if (!SMTP_ENABLED) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  📧  VERIFICATION CODE (SMTP disabled)          ║');
    console.log(`║  Email : ${email.padEnd(39)}║`);
    console.log(`║  Code  : ${code.padEnd(39)}║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    return;
  }

  await transporter.sendMail({
    from: `"Game Master 🎲" <${FROM}>`,
    to: email,
    subject: 'Ton code de verification — Game Master',
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; background: #1a1a2e; color: #eaeaea; padding: 32px; border-radius: 12px; border: 2px solid #d4af37;">
        <h1 style="color: #d4af37; font-family: 'Pirata One', Georgia, serif; text-align: center; margin-bottom: 8px;">
          🎲 Game Master
        </h1>
        <p style="text-align: center; color: #8899aa; margin-top: 0;">Bienvenue a bord !</p>
        <div style="background: #16213e; border: 1px solid #d4af37; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #8899aa; font-size: 14px;">Ton code de verification :</p>
          <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #d4af37; margin: 0; font-family: monospace;">
            ${code}
          </p>
        </div>
        <p style="text-align: center; color: #8899aa; font-size: 13px;">
          Ce code expire dans 15 minutes.<br/>
          Si tu n'as pas demande ce code, ignore cet email.
        </p>
      </div>
    `,
  });
}
