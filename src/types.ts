export interface Player {
  id: string;
  name: string;
  photo?: string; // base64 data URL
}

export interface RoundPlayerData {
  playerId: string;
  bid: number;
  tricks: number;
  piratesCaptured: number; // number of pirates captured by Skull King
  mermaidDefeatsSkullKing: boolean;
  whiteWhalePlayed: boolean;
  lootPoints: number; // sum of loot card values
}

export interface RoundData {
  roundNumber: number; // 1-based
  playerData: RoundPlayerData[];
  completed: boolean;
}

export interface RoundScore {
  playerId: string;
  baseScore: number;
  bonusScore: number;
  lootScore: number;
  totalRoundScore: number;
}

export interface GameState {
  id: string;
  players: Player[];
  rounds: RoundData[];
  currentRound: number; // 1-based
  phase: GamePhase;
  startedAt: string;
  updatedAt: string;
}

export type GamePhase =
  | 'setup'       // registering players
  | 'bidding'     // entering bids for current round
  | 'playing'     // round in progress
  | 'scoring'     // entering tricks + bonuses
  | 'review'      // viewing round results
  | 'finished';   // game over

export interface Settings {
  lootEnabled: boolean;
  lootValues: number[];
  maxRounds: number; // default 10
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: number;
}
