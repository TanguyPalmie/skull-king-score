/**
 * Charge tous les modèles Sequelize et configure les associations.
 */
import sequelize from '../index.js';

import defineUser from './User.js';
import defineVerificationCode from './VerificationCode.js';
import defineRefreshToken from './RefreshToken.js';
import defineGameDefinition from './GameDefinition.js';
import defineFriendship from './Friendship.js';
import defineGameScore from './GameScore.js';
import defineGame from './Game.js';
import defineSetting from './Setting.js';
import defineLiveGame from './LiveGame.js';
import definePasswordResetCode from './PasswordResetCode.js';
import defineEmailLog from './EmailLog.js';
import defineMessage from './Message.js';
import defineUserKey from './UserKey.js';

// ── Initialisation des modèles ──────────────────────────────
const User = defineUser(sequelize);
const VerificationCode = defineVerificationCode(sequelize);
const RefreshToken = defineRefreshToken(sequelize);
const GameDefinition = defineGameDefinition(sequelize);
const Friendship = defineFriendship(sequelize);
const GameScore = defineGameScore(sequelize);
const Game = defineGame(sequelize);
const Setting = defineSetting(sequelize);
const LiveGame = defineLiveGame(sequelize);
const PasswordResetCode = definePasswordResetCode(sequelize);
const EmailLog = defineEmailLog(sequelize);
const Message = defineMessage(sequelize);
const UserKey = defineUserKey(sequelize);

// ── Associations ─────────────────────────────────────────────

// User ↔ RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ Friendship (bidirectionnel)
User.hasMany(Friendship, { foreignKey: 'user_id', as: 'sentFriendships' });
User.hasMany(Friendship, { foreignKey: 'friend_id', as: 'receivedFriendships' });
Friendship.belongsTo(User, { foreignKey: 'user_id', as: 'requester' });
Friendship.belongsTo(User, { foreignKey: 'friend_id', as: 'recipient' });

// User ↔ GameScore
User.hasMany(GameScore, { foreignKey: 'user_id', as: 'scores' });
GameScore.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ Game (legacy, 1-to-1)
User.hasOne(Game, { foreignKey: 'user_id', as: 'currentGame' });
Game.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ Setting (1-to-1)
User.hasOne(Setting, { foreignKey: 'user_id', as: 'settings' });
Setting.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ LiveGame
User.hasMany(LiveGame, { foreignKey: 'owner_id', as: 'liveGames' });
LiveGame.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// User ↔ PasswordResetCode
User.hasMany(PasswordResetCode, { foreignKey: 'user_id', as: 'resetCodes' });
PasswordResetCode.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ Message (sender + receiver)
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiver_id', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

// User ↔ UserKey (1-to-1)
User.hasOne(UserKey, { foreignKey: 'user_id', as: 'publicKey' });
UserKey.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// GameScore ↔ GameDefinition (via game_slug, pas une vraie FK mais utile pour include)
// Note : pas de FK en base, mais on peut quand même faire des includes manuels

export {
  sequelize,
  User,
  VerificationCode,
  RefreshToken,
  GameDefinition,
  Friendship,
  GameScore,
  Game,
  Setting,
  LiveGame,
  PasswordResetCode,
  EmailLog,
  Message,
  UserKey,
};
