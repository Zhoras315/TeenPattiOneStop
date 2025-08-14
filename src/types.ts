
export interface Player {
  id: string;
  name: string;
  balance: number;
  isActive: boolean;
  isCurrent: boolean;
  isBlind?: boolean; // Flag to track if a player is playing blind
  hasWithdrawn?: boolean; // Flag to track if player has withdrawn from the game
}

export interface GameSettings {
  bootAmount: number;
  blindAmount: number;
  chaalType: "multiplier" | "fixed"; // Setting to choose between multiplier or fixed amount
  chaalMultiplier: number; 
  chaalFixedAmount: number; // Setting for fixed chaal amount
  potLimit: number;
}

export interface ActionInfo {
  type: string;
  playerName: string;
  description: string;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  pot: number;
  currentBet: number;
  isGameStarted: boolean;
  inSettingsScreen: boolean; // Flag to indicate if we're in the settings screen
  settings: GameSettings;
  round: number;
  previousBalances: Record<string, number>; // Store previous balances to enable round dismissal
  playerContributions?: Record<string, number>; // Track each player's contribution to the pot
  showInProgress?: boolean; // Flag to indicate if show is in progress
  showPlayers?: string[]; // Store player IDs involved in show 
  lastAction?: ActionInfo; // Track last action for toast notifications
  lastWinAmount?: number; // Track last win amount for winner dialog
}

export type GameAction = 
  | { type: 'ADD_PLAYER'; name: string }
  | { type: 'REMOVE_PLAYER'; id: string }
  | { type: 'WITHDRAW_PLAYER'; id: string } // New action to withdraw player
  | { type: 'FOLD'; id: string }
  | { type: 'CHAAL'; id: string }
  | { type: 'SHOW'; id: string }
  | { type: 'BLIND'; id: string }
  | { type: 'BACK_SHOW'; id: string; targetId: string; } // For back show feature
  | { type: 'RESOLVE_SHOW'; winnerId: string; loserId: string; } // New action to resolve show
  | { type: 'SET_SETTINGS'; settings: GameSettings }
  | { type: 'START_GAME' }
  | { type: 'PROCEED_TO_SETTINGS' } // New action to navigate to settings screen
  | { type: 'END_GAME'; winnerId: string }
  | { type: 'DISMISS_ROUND' } // Action to dismiss a round
  | { type: 'END_SESSION' } // End the entire session
  | { type: 'NEXT_PLAYER' }
  | { type: 'SET_FIRST_PLAYER'; playerId: string } // Action to set first player
  | { type: 'ADD_MONEY'; playerId: string; amount: number }
  | { type: 'CLEAR_TOAST' }; // Action to clear toast notification
