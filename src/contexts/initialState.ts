
import { GameState, GameSettings } from '../types';

export const initialGameSettings: GameSettings = {
  bootAmount: 10,
  blindAmount: 20,
  chaalType: "multiplier",
  chaalMultiplier: 2,
  chaalFixedAmount: 20,
  potLimit: 1000,
};

export const initialGameState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  pot: 0,
  currentBet: 0,
  isGameStarted: false,
  inSettingsScreen: false,
  settings: initialGameSettings,
  round: 0,
  previousBalances: {},
  showInProgress: false,
  showPlayers: [],
  lastAction: undefined,
  lastWinAmount: undefined,
};
