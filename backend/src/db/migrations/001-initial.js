/**
 * Migration initiale — crée toutes les tables si elles n'existent pas.
 * Compatible avec les bases existantes (IF NOT EXISTS partout).
 */
import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  // ── users ──────────────────────────────────────────────────
  await queryInterface.createTable(
    'users',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
      pseudo: { type: DataTypes.STRING(50), unique: true, allowNull: false },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      role: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'user' },
      verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── verification_codes ─────────────────────────────────────
  await queryInterface.createTable(
    'verification_codes',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: DataTypes.STRING(255), allowNull: false },
      code: { type: DataTypes.STRING(8), allowNull: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── refresh_tokens ─────────────────────────────────────────
  await queryInterface.createTable(
    'refresh_tokens',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      token: { type: DataTypes.STRING(512), unique: true, allowNull: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── game_definitions ───────────────────────────────────────
  await queryInterface.createTable(
    'game_definitions',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      slug: { type: DataTypes.STRING(100), unique: true, allowNull: false },
      name: { type: DataTypes.STRING(200), allowNull: false },
      icon: { type: DataTypes.STRING(10), defaultValue: '🎲' },
      description: { type: DataTypes.TEXT },
      min_players: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
      max_players: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12 },
      default_rounds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
      scoring_type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'simple' },
      bonus_values: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      allow_custom_bonus: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      theme_config: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      stepper_type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'manche' },
      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── friendships ────────────────────────────────────────────
  await queryInterface.createTable(
    'friendships',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      friend_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'pending' },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── game_scores ────────────────────────────────────────────
  await queryInterface.createTable(
    'game_scores',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      game_slug: { type: DataTypes.STRING(100), allowNull: false },
      score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      rank: { type: DataTypes.INTEGER },
      players_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      played_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── games (legacy) ─────────────────────────────────────────
  await queryInterface.createTable(
    'games',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      state: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── settings ───────────────────────────────────────────────
  await queryInterface.createTable(
    'settings',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      data: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── live_games ─────────────────────────────────────────────
  await queryInterface.createTable(
    'live_games',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      share_code: { type: DataTypes.STRING(8), unique: true, allowNull: false },
      game_slug: { type: DataTypes.STRING(100), allowNull: false },
      state: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── password_reset_codes ───────────────────────────────────
  await queryInterface.createTable(
    'password_reset_codes',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      code: { type: DataTypes.STRING(8), allowNull: false },
      used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── email_logs ─────────────────────────────────────────────
  await queryInterface.createTable(
    'email_logs',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      recipient: { type: DataTypes.STRING(255), allowNull: false },
      subject: { type: DataTypes.STRING(255) },
      type: { type: DataTypes.STRING(50), allowNull: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── messages ───────────────────────────────────────────────
  await queryInterface.createTable(
    'messages',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      encrypted_content: { type: DataTypes.TEXT, allowNull: false },
      nonce: { type: DataTypes.STRING(64), allowNull: false },
      read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── user_keys ──────────────────────────────────────────────
  await queryInterface.createTable(
    'user_keys',
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      public_key: { type: DataTypes.STRING(64), allowNull: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { ifNotExists: true },
  );

  // ── Index (IF NOT EXISTS) ──────────────────────────────────
  const addIndex = async (table, fields, opts = {}) => {
    try {
      await queryInterface.addIndex(table, fields, opts);
    } catch {
      // Index already exists — ignore
    }
  };

  await addIndex('refresh_tokens', ['user_id'], { name: 'idx_refresh_tokens_user' });
  await addIndex('refresh_tokens', ['token'], { name: 'idx_refresh_tokens_token' });
  await addIndex('verification_codes', ['email'], { name: 'idx_verification_codes_email' });
  await addIndex('verification_codes', ['code'], { name: 'idx_verification_codes_code' });
  await addIndex('friendships', ['user_id'], { name: 'idx_friendships_user' });
  await addIndex('friendships', ['friend_id'], { name: 'idx_friendships_friend' });
  await addIndex('friendships', ['user_id', 'friend_id'], { unique: true, name: 'idx_friendships_unique' });
  await addIndex('game_scores', ['user_id'], { name: 'idx_game_scores_user' });
  await addIndex('game_scores', ['game_slug'], { name: 'idx_game_scores_slug' });
  await addIndex('live_games', ['owner_id'], { name: 'idx_live_games_owner' });
  await addIndex('live_games', ['share_code'], { name: 'idx_live_games_code' });
  await addIndex('password_reset_codes', ['user_id'], { name: 'idx_password_reset_user' });
  await addIndex('email_logs', ['type'], { name: 'idx_email_logs_type' });
  await addIndex('email_logs', ['created_at'], { name: 'idx_email_logs_created' });
  await addIndex('messages', ['sender_id', 'receiver_id', 'created_at'], { name: 'idx_messages_conversation' });
  await addIndex('messages', ['receiver_id', 'read'], { name: 'idx_messages_receiver' });
}

export async function down({ context: queryInterface }) {
  // Ordre inverse (respecter les FK)
  await queryInterface.dropTable('user_keys', { ifExists: true });
  await queryInterface.dropTable('messages', { ifExists: true });
  await queryInterface.dropTable('email_logs', { ifExists: true });
  await queryInterface.dropTable('password_reset_codes', { ifExists: true });
  await queryInterface.dropTable('live_games', { ifExists: true });
  await queryInterface.dropTable('settings', { ifExists: true });
  await queryInterface.dropTable('games', { ifExists: true });
  await queryInterface.dropTable('game_scores', { ifExists: true });
  await queryInterface.dropTable('friendships', { ifExists: true });
  await queryInterface.dropTable('game_definitions', { ifExists: true });
  await queryInterface.dropTable('refresh_tokens', { ifExists: true });
  await queryInterface.dropTable('verification_codes', { ifExists: true });
  await queryInterface.dropTable('users', { ifExists: true });
}
