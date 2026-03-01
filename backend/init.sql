-- ============================================================
-- Game Master — Schema complet
-- ============================================================

-- Utilisateurs avec pseudo, role et verification
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  pseudo VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Codes de verification email (8 caracteres alphanumeriques)
CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(8) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens (JWT rotation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(512) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Definitions de jeux (gerees par l'admin)
CREATE TABLE IF NOT EXISTS game_definitions (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  icon VARCHAR(10) NOT NULL DEFAULT '🎲',
  description TEXT,
  min_players INTEGER NOT NULL DEFAULT 2,
  max_players INTEGER NOT NULL DEFAULT 12,
  default_rounds INTEGER NOT NULL DEFAULT 10,
  scoring_type VARCHAR(20) NOT NULL DEFAULT 'simple' CHECK (scoring_type IN ('simple', 'bid_tricks')),
  bonus_values JSONB NOT NULL DEFAULT '[]',
  allow_custom_bonus BOOLEAN NOT NULL DEFAULT FALSE,
  theme_config JSONB NOT NULL DEFAULT '{}',
  stepper_type VARCHAR(20) NOT NULL DEFAULT 'manche',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Amis
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, friend_id)
);

-- Scores de parties
CREATE TABLE IF NOT EXISTS game_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_slug VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  players_count INTEGER NOT NULL DEFAULT 1,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Etat de jeu en cours (legacy, garde pour compat)
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parametres utilisateur
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parties en cours (partageables via code)
CREATE TABLE IF NOT EXISTS live_games (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_code VARCHAR(8) UNIQUE NOT NULL,
  game_slug VARCHAR(100) NOT NULL,
  state JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_games_owner ON live_games(owner_id);
CREATE INDEX IF NOT EXISTS idx_live_games_code ON live_games(share_code);

-- ============================================================
-- Migrations — ajout colonnes manquantes sur bases existantes
-- ============================================================
DO $$
BEGIN
  -- users.pseudo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pseudo') THEN
    ALTER TABLE users ADD COLUMN pseudo VARCHAR(50);
    -- Remplir les pseudos vides avec le debut de l'email
    UPDATE users SET pseudo = split_part(email, '@', 1) WHERE pseudo IS NULL;
    ALTER TABLE users ALTER COLUMN pseudo SET NOT NULL;
    -- Ajouter l'index unique seulement s'il n'existe pas deja
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_pseudo_key') THEN
      ALTER TABLE users ADD CONSTRAINT users_pseudo_key UNIQUE (pseudo);
    END IF;
  END IF;

  -- users.role
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(10) NOT NULL DEFAULT 'user';
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  END IF;

  -- users.verified
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verified') THEN
    ALTER TABLE users ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE;
    -- Les utilisateurs existants sont consideres comme verifies
    UPDATE users SET verified = TRUE;
  END IF;
  -- game_definitions.stepper_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_definitions' AND column_name = 'stepper_type') THEN
    ALTER TABLE game_definitions ADD COLUMN stepper_type VARCHAR(20) NOT NULL DEFAULT 'manche';
  END IF;
END $$;

-- ============================================================
-- Tables Phase 2 : Password reset + Email logs
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(8) NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_codes(user_id);

CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at);

-- ============================================================
-- Tables Phase 3 : Messaging
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  nonce VARCHAR(64) NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, read);

CREATE TABLE IF NOT EXISTS user_keys (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  public_key VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Index
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_slug ON game_scores(game_slug);

-- ============================================================
-- Seed : Skull King (jeu de reference, toujours present)
-- ============================================================
INSERT INTO game_definitions (slug, name, icon, description, min_players, max_players, default_rounds, scoring_type, bonus_values, allow_custom_bonus, theme_config, stepper_type, enabled)
VALUES (
  'skull-king',
  'Skull King',
  '☠️',
  'Jeu de plis pirate — prédisez vos plis et emportez le trésor !',
  2, 8, 10,
  'bid_tricks',
  '[-10, -5, 5, 10]'::jsonb,
  false,
  '{"primary": "#d4af37", "secondary": "#c0392b", "background": "#1a1a2e", "paper": "#16213e", "navBg": "#0f3460", "titleFont": "\"Pirata One\", Georgia, serif"}'::jsonb,
  'round',
  true
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Seed : 30 jeux de société
-- ============================================================
INSERT INTO game_definitions (slug, name, icon, description, min_players, max_players, default_rounds, scoring_type, stepper_type) VALUES
  ('triominos',    'Triominos',       '🔺', 'Dominos triangulaires — posez vos pièces et marquez des points !', 2, 4, 10, 'simple', 'round'),
  ('uno',          'Uno',             '🟥', 'Le classique des jeux de cartes — soyez le premier à vider votre main !', 2, 10, 1, 'simple', 'manche'),
  ('phase-10',     'Phase 10',        '🔟', 'Complétez les 10 phases avant vos adversaires !', 2, 6, 10, 'simple', 'phase'),
  ('yams',         'Yam''s',          '🎲', 'Lancez les dés et réalisez les meilleures combinaisons !', 2, 8, 13, 'simple', 'tour'),
  ('qwixx',        'Qwixx',           '✖️', 'Cochez les bonnes cases et évitez les pénalités !', 2, 5, 1, 'simple', 'manche'),
  ('6-qui-prend',  '6 qui prend',     '🐂', 'Évitez de récupérer les cartes têtes de bœuf !', 2, 10, 1, 'simple', 'manche'),
  ('love-letter',  'Love Letter',     '💌', 'Faites parvenir votre lettre à la princesse !', 2, 4, 1, 'simple', 'manche'),
  ('the-mind',     'The Mind',        '🧠', 'Jouez vos cartes dans le bon ordre... sans communiquer !', 2, 4, 12, 'simple', 'niveau'),
  ('skyjo',        'Skyjo',           '🌤️', 'Remplacez vos cartes pour obtenir le score le plus bas !', 2, 8, 1, 'simple', 'manche'),
  ('rummikub',     'Rummikub',        '🧩', 'Créez des suites et des groupes avec vos tuiles !', 2, 4, 1, 'simple', 'manche'),
  ('carcassonne',  'Carcassonne',     '🏰', 'Construisez le paysage médiéval et placez vos partisans !', 2, 5, 1, 'simple', 'partie'),
  ('7-wonders',    '7 Wonders',       '🏛️', 'Bâtissez votre merveille à travers trois âges !', 2, 7, 3, 'simple', 'age'),
  ('kingdomino',   'Kingdomino',      '👑', 'Construisez le plus beau royaume avec des dominos !', 2, 4, 12, 'simple', 'tour'),
  ('azul',         'Azul',            '🎨', 'Décorez les murs du palais royal avec des azulejos !', 2, 4, 5, 'simple', 'manche'),
  ('splendor',     'Splendor',        '💎', 'Collectionnez des gemmes et attirez les nobles !', 2, 4, 1, 'simple', 'tour'),
  ('dominion',     'Dominion',        '🃏', 'Constituez le meilleur deck pour conquérir le royaume !', 2, 4, 1, 'simple', 'tour'),
  ('cluedo',       'Cluedo',          '🔍', 'Résolvez le mystère : qui, où, avec quoi ?', 2, 6, 1, 'simple', 'tour'),
  ('monopoly',     'Monopoly',        '🏠', 'Achetez, vendez et devenez le magnat de l''immobilier !', 2, 8, 1, 'simple', 'tour'),
  ('scrabble',     'Scrabble',        '📝', 'Formez des mots et marquez un maximum de points !', 2, 4, 1, 'simple', 'tour'),
  ('trivial-pursuit', 'Trivial Pursuit', '❓', 'Testez votre culture générale dans toutes les catégories !', 2, 6, 1, 'simple', 'tour'),
  ('bang',         'Bang !',          '💥', 'Shérif contre hors-la-loi — trouvez votre rôle et survivez !', 4, 7, 1, 'simple', 'manche'),
  ('belote',       'Belote',          '🂡', 'Le jeu de cartes français par excellence — annonces et plis !', 4, 4, 8, 'bid_tricks', 'manche'),
  ('tarot',        'Tarot',           '🎴', 'Prenez ou défendez — le classique des jeux de cartes français !', 3, 5, 1, 'bid_tricks', 'manche'),
  ('canasta',      'Canasta',         '🃏', 'Formez des combinaisons et posez vos canastas !', 2, 6, 1, 'simple', 'manche'),
  ('cribbage',     'Cribbage',        '🎯', 'Comptez vos points et avancez sur le plateau !', 2, 4, 1, 'simple', 'main'),
  ('tock',         'Tock',            '🐴', 'Faites le tour du plateau avec vos pions en équipe !', 2, 4, 1, 'simple', 'manche'),
  ('mille-bornes', 'Mille Bornes',    '🚗', 'Parcourez 1000 bornes avant vos adversaires !', 2, 6, 1, 'simple', 'manche'),
  ('colt-express', 'Colt Express',    '🤠', 'Pillez le train dans ce jeu de programmation western !', 2, 6, 5, 'simple', 'manche'),
  ('dice-forge',   'Dice Forge',      '🔥', 'Forgez vos dés et invoquez les dieux !', 2, 4, 9, 'simple', 'tour')
ON CONFLICT (slug) DO NOTHING;
