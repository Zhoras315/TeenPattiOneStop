import { GameState, GameAction, Player } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { initialGameSettings } from './initialState';

// Helper function to find next active player
export function findNextActivePlayerIndex(players: Player[], currentIndex: number): number {
  const activePlayers = players.filter(player => player.isActive && !player.hasWithdrawn);
  if (activePlayers.length <= 1) return currentIndex;
  
  let nextIndex = (currentIndex + 1) % players.length;
  
  // Find next active player
  while (!players[nextIndex].isActive || players[nextIndex].hasWithdrawn) {
    nextIndex = (nextIndex + 1) % players.length;
    // Safety check to prevent infinite loop
    if (nextIndex === currentIndex) break;
  }
  
  return nextIndex;
}

// Helper function to find player behind current player
export function findPlayerBehindCurrent(players: Player[], currentPlayerId: string): Player | null {
  const activePlayers = players.filter(p => p.isActive && !p.hasWithdrawn);
  if (activePlayers.length <= 1) return null;
  
  const currentPlayerIndex = activePlayers.findIndex(p => p.id === currentPlayerId);
  if (currentPlayerIndex === -1) return null;
  
  // Get previous player in active players array (circular)
  const previousIndex = (currentPlayerIndex - 1 + activePlayers.length) % activePlayers.length;
  return activePlayers[previousIndex];
}

// Helper to check if player is on blind
export function isPlayerOnBlind(state: GameState, playerId: string): boolean {
  const player = state.players.find(p => p.id === playerId);
  return player ? player.isBlind === true : false;
}

// Helper to check if there's only one active player left
export function checkForSinglePlayerWin(state: GameState): GameState {
  const activePlayers = state.players.filter(player => player.isActive && !player.hasWithdrawn);
  
  // If only one player remains active, they win
  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    // Store the current pot amount before resetting it
    const currentPot = state.pot;
    
    return {
      ...state,
      players: state.players.map(player => 
        player.id === winner.id 
          ? { ...player, balance: player.balance + currentPot, isCurrent: false } 
          : { ...player, isCurrent: false }
      ),
      pot: 0,
      currentBet: 0,
      round: state.round + 1,  // Increment round instead of resetting
      previousBalances: {},     // Reset previous balances
      playerContributions: {},  // Reset player contributions
      showInProgress: false,    // Reset show state
      showPlayers: [],
      lastAction: {
        type: 'WIN',
        playerName: winner.name,
        description: `won ₹${currentPot}`  // Include the actual pot amount in the description
      },
      lastWinAmount: currentPot  // Store the win amount for the popup
    };
  }
  
  return state;
}

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'ADD_PLAYER': {
      const newPlayer: Player = {
        id: uuidv4(),
        name: action.name,
        balance: 1000, // Default starting balance
        isActive: true,
        isCurrent: false,
        hasWithdrawn: false,
      };

      return {
        ...state,
        players: [...state.players, newPlayer],
      };
    }

    case 'REMOVE_PLAYER': {
      return {
        ...state,
        players: state.players.filter((player) => player.id !== action.id),
      };
    }
    
    case 'WITHDRAW_PLAYER': {
      // Mark player as withdrawn instead of removing them
      const updatedPlayers = state.players.map(player => {
        if (player.id === action.id) {
          return {
            ...player,
            hasWithdrawn: true,
            isActive: false, // Also mark them as inactive for current round
            isCurrent: false, // Reset current flag
          };
        }
        return player;
      });
      
      // If the current player withdrew, move to next player
      let newState = {
        ...state,
        players: updatedPlayers,
      };
      
      // Find the withdrawn player
      const withdrawnPlayer = state.players.find(p => p.id === action.id);
      
      // If the current player withdrew, find the next player
      if (withdrawnPlayer && withdrawnPlayer.isCurrent) {
        const currentIndex = state.players.findIndex(p => p.id === action.id);
        const nextPlayerIndex = findNextActivePlayerIndex(updatedPlayers, currentIndex);
        
        newState = {
          ...newState,
          players: updatedPlayers.map((player, index) => ({
            ...player,
            isCurrent: index === nextPlayerIndex,
          })),
          currentPlayerIndex: nextPlayerIndex,
        };
      }
      
      // Add last action info
      newState = {
        ...newState,
        lastAction: {
          type: 'WITHDRAW',
          playerName: withdrawnPlayer?.name || 'Player',
          description: 'withdrew from the game'
        }
      };
      
      return checkForSinglePlayerWin(newState);
    }

    case 'PROCEED_TO_SETTINGS': {
      return {
        ...state,
        inSettingsScreen: true
      };
    }

    case 'START_GAME': {
      if (state.players.length < 2) {
        return state;
      }

      // Filter out withdrawn players when starting game
      const activePlayers = state.players.filter(player => !player.hasWithdrawn);
      
      if (activePlayers.length < 2) {
        return state; // Need at least 2 active players to start
      }

      // Store current balances before modifying them
      const previousBalances: Record<string, number> = {};
      const playerContributions: Record<string, number> = {};
      
      state.players.forEach(player => {
        previousBalances[player.id] = player.balance;
        if (!player.hasWithdrawn) {
          playerContributions[player.id] = state.settings.bootAmount;
        } else {
          playerContributions[player.id] = 0;
        }
      });

      // Collect boot amount from active players
      const playersWithBoot = state.players.map(player => {
        if (player.hasWithdrawn) {
          return player; // Don't modify withdrawn players
        }
        return {
          ...player,
          balance: player.balance - state.settings.bootAmount,
          isBlind: undefined, // Reset blind status for new game
          isActive: true, // Make sure active status is set for non-withdrawn players
        };
      });

      // Set first active player as current
      const firstActiveIndex = playersWithBoot.findIndex(p => !p.hasWithdrawn);
      
      const updatedPlayers = playersWithBoot.map((player, index) => ({
        ...player,
        isCurrent: index === firstActiveIndex && !player.hasWithdrawn,
      }));

      return {
        ...state,
        players: updatedPlayers,
        isGameStarted: true,
        inSettingsScreen: false,
        pot: activePlayers.length * state.settings.bootAmount,
        currentBet: state.settings.bootAmount,
        round: 1,  // Always start with round 1
        previousBalances,
        playerContributions,
        showInProgress: false,
        showPlayers: [],
        lastWinAmount: undefined, // Reset last win amount
      };
    }

    case 'FOLD': {
      const updatedPlayers = state.players.map(player => 
        player.id === action.id 
          ? { ...player, isActive: false, isCurrent: false } 
          : player
      );

      // Move to next player
      const currentIndex = state.players.findIndex(p => p.id === action.id);
      const nextPlayerIndex = findNextActivePlayerIndex(updatedPlayers, currentIndex);
      
      const playersWithNextCurrent = updatedPlayers.map((player, index) => ({
        ...player,
        isCurrent: index === nextPlayerIndex,
      }));

      const foldingPlayer = state.players.find(p => p.id === action.id);
      
      // Check if there's only one player left after this fold
      const newState = {
        ...state,
        players: playersWithNextCurrent,
        currentPlayerIndex: nextPlayerIndex,
        lastAction: {
          type: 'FOLD',
          playerName: foldingPlayer?.name || 'Player',
          description: 'folded'
        }
      };
      
      return checkForSinglePlayerWin(newState);
    }

    case 'CHAAL': {
      const playerIndex = state.players.findIndex(p => p.id === action.id);
      const player = state.players[playerIndex];
      
      // Calculate chaal amount based on settings
      let chaalAmount;
      if (state.settings.chaalType === "fixed") {
        chaalAmount = state.settings.chaalFixedAmount;
      } else {
        chaalAmount = state.currentBet * state.settings.chaalMultiplier;
      }
      
      // Check if player has enough balance
      if (player.balance < chaalAmount) {
        return state;
      }

      // Update player contributions
      const updatedContributions = {
        ...state.playerContributions,
        [player.id]: (state.playerContributions?.[player.id] || 0) + chaalAmount
      };

      // Update player balance and pot
      const updatedPlayers = state.players.map((p, index) => {
        if (p.id === action.id) {
          return {
            ...p,
            balance: p.balance - chaalAmount,
            isCurrent: false,
            isBlind: false, // Player is no longer blind after a chaal
          };
        }
        return p;
      });

      // Find next active player
      const nextPlayerIndex = findNextActivePlayerIndex(updatedPlayers, playerIndex);
      
      // Update current player
      const playersWithNextCurrent = updatedPlayers.map((p, index) => ({
        ...p,
        isCurrent: index === nextPlayerIndex,
      }));

      return {
        ...state,
        players: playersWithNextCurrent,
        pot: state.pot + chaalAmount,
        currentBet: chaalAmount,
        currentPlayerIndex: nextPlayerIndex,
        playerContributions: updatedContributions,
        lastAction: {
          type: 'CHAAL',
          playerName: player.name,
          description: `played chaal (₹${chaalAmount})`
        }
      };
    }

    case 'BLIND': {
      const playerIndex = state.players.findIndex(p => p.id === action.id);
      const player = state.players[playerIndex];
      
      // Calculate blind amount
      const blindAmount = state.settings.blindAmount;
      
      // Check if player has enough balance
      if (player.balance < blindAmount) {
        return state;
      }

      // Update player contributions
      const updatedContributions = {
        ...state.playerContributions,
        [player.id]: (state.playerContributions?.[player.id] || 0) + blindAmount
      };

      // Update player balance and pot
      const updatedPlayers = state.players.map((p, index) => {
        if (p.id === action.id) {
          return {
            ...p,
            balance: p.balance - blindAmount,
            isCurrent: false,
            isBlind: true, // Mark this player as playing blind
          };
        }
        return p;
      });

      // Find next active player
      const nextPlayerIndex = findNextActivePlayerIndex(updatedPlayers, playerIndex);
      
      // Update current player
      const playersWithNextCurrent = updatedPlayers.map((p, index) => ({
        ...p,
        isCurrent: index === nextPlayerIndex,
      }));

      return {
        ...state,
        players: playersWithNextCurrent,
        pot: state.pot + blindAmount,
        currentPlayerIndex: nextPlayerIndex,
        playerContributions: updatedContributions,
        lastAction: {
          type: 'BLIND',
          playerName: player.name,
          description: `played blind (₹${blindAmount})`
        }
      };
    }

    case 'SHOW': {
      const playerIndex = state.players.findIndex(p => p.id === action.id);
      const player = state.players[playerIndex];
      
      // Calculate show amount - same as chaal amount
      let showAmount;
      if (state.settings.chaalType === "fixed") {
        showAmount = state.settings.chaalFixedAmount;
      } else {
        showAmount = state.currentBet * state.settings.chaalMultiplier;
      }
      
      // Check if player has enough balance
      if (player.balance < showAmount) {
        return state;
      }

      // Find the other active player
      const activePlayers = state.players.filter(p => p.isActive);
      const otherPlayerId = activePlayers.find(p => p.id !== player.id)?.id;
      
      if (!otherPlayerId) {
        return state;
      }

      // Update player contributions
      const updatedContributions = {
        ...state.playerContributions,
        [player.id]: (state.playerContributions?.[player.id] || 0) + showAmount
      };

      // Update player balance and pot
      const updatedPlayers = state.players.map((p) => {
        if (p.id === action.id) {
          return {
            ...p,
            balance: p.balance - showAmount,
            isCurrent: false,
          };
        }
        return p;
      });

      return {
        ...state,
        players: updatedPlayers,
        pot: state.pot + showAmount,
        playerContributions: updatedContributions,
        showInProgress: true,
        showPlayers: [action.id, otherPlayerId],
        lastAction: {
          type: 'SHOW',
          playerName: player.name,
          description: 'requested show'
        }
      };
    }

    case 'BACK_SHOW': {
      const playerIndex = state.players.findIndex(p => p.id === action.id);
      const player = state.players[playerIndex];
      
      // Calculate show amount - same as chaal amount
      let showAmount;
      if (state.settings.chaalType === "fixed") {
        showAmount = state.settings.chaalFixedAmount;
      } else {
        showAmount = state.currentBet * state.settings.chaalMultiplier;
      }
      
      // Check if player has enough balance
      if (player.balance < showAmount) {
        return state;
      }

      // Update player contributions
      const updatedContributions = {
        ...state.playerContributions,
        [player.id]: (state.playerContributions?.[player.id] || 0) + showAmount
      };

      // Update player balance and pot
      const updatedPlayers = state.players.map((p) => {
        if (p.id === action.id) {
          return {
            ...p,
            balance: p.balance - showAmount,
            isCurrent: false,
          };
        }
        return p;
      });

      return {
        ...state,
        players: updatedPlayers,
        pot: state.pot + showAmount,
        playerContributions: updatedContributions,
        showInProgress: true,
        showPlayers: [action.id, action.targetId],
        lastAction: {
          type: 'BACK_SHOW',
          playerName: player.name,
          description: 'requested back show'
        }
      };
    }
    
    case 'RESOLVE_SHOW': {
      // This is for resolving back show or show
      // Winner continues, loser folds
      const updatedPlayers = state.players.map(player => {
        if (player.id === action.loserId) {
          // Loser folds
          return { ...player, isActive: false };
        }
        return player;
      });
      
      // Find the winner and loser players
      const winnerPlayer = state.players.find(p => p.id === action.winnerId);
      const loserPlayer = state.players.find(p => p.id === action.loserId);
      
      // Find next player after the winner
      const winnerIndex = state.players.findIndex(p => p.id === action.winnerId);
      const nextPlayerIndex = findNextActivePlayerIndex(updatedPlayers, winnerIndex);
      
      // Set the next player as current
      const playersWithNextCurrent = updatedPlayers.map((player, index) => ({
        ...player,
        isCurrent: index === nextPlayerIndex,
      }));
      
      // Store the current pot amount before any changes
      const currentPot = state.pot;
      
      // Check if there's only one player left after this result
      const newState = {
        ...state,
        players: playersWithNextCurrent,
        currentPlayerIndex: nextPlayerIndex,
        showInProgress: false,
        showPlayers: [],
        lastAction: {
          type: 'SHOW_RESULT',
          playerName: winnerPlayer?.name || 'Player',
          description: `won against ${loserPlayer?.name || 'opponent'}`
        },
        lastWinAmount: currentPot // Store the win amount for winner dialog if this was the final player
      };
      
      return checkForSinglePlayerWin(newState);
    }

    case 'END_GAME': {
      // Award pot to winner and reset game state for next round
      const currentPot = state.pot; // Get current pot amount before reset
      
      const updatedPlayers = state.players.map(player => ({
        ...player,
        balance: player.id === action.winnerId ? player.balance + currentPot : player.balance,
        isActive: true,
        isCurrent: false,
        isBlind: undefined, // Reset blind status
      }));
      
      const winnerPlayer = state.players.find(p => p.id === action.winnerId);

      // Reset for next round but don't increment round number here
      return {
        ...state,
        players: updatedPlayers,
        pot: 0,
        currentBet: 0,
        previousBalances: {}, // Clear previous balances
        playerContributions: {}, // Clear player contributions
        showInProgress: false, // Reset show state
        showPlayers: [],
        lastWinAmount: currentPot, // Store the win amount for winner dialog
        lastAction: {
          type: 'WIN_ROUND',
          playerName: winnerPlayer?.name || 'Player',
          description: `won the round (₹${currentPot})`
        }
      };
    }

    case 'SET_FIRST_PLAYER': {
      // Store current balances before modifying them for the new round
      const previousBalances: Record<string, number> = {};
      const playerContributions: Record<string, number> = {};
      
      state.players.forEach(player => {
        previousBalances[player.id] = player.balance;
        if (!player.hasWithdrawn) {
          playerContributions[player.id] = state.settings.bootAmount;
        } else {
          playerContributions[player.id] = 0;
        }
      });
      
      // Only collect boot amount from non-withdrawn players
      const updatedPlayers = state.players.map(player => {
        if (player.hasWithdrawn) {
          return player; // Don't modify withdrawn players
        }
        
        return {
          ...player,
          balance: player.balance - state.settings.bootAmount,
          isActive: true,
          isCurrent: player.id === action.playerId,
          isBlind: undefined, // Reset blind status for new round
        };
      });
      
      const firstPlayer = state.players.find(p => p.id === action.playerId);
      const activePlayers = state.players.filter(p => !p.hasWithdrawn);

      return {
        ...state,
        players: updatedPlayers,
        pot: activePlayers.length * state.settings.bootAmount,
        currentBet: state.settings.bootAmount,
        isGameStarted: true,
        // Important fix: Don't increment round number here as it was already set in END_GAME
        // Instead, keep the same round number
        round: state.round,  // Keep the same round number
        previousBalances,  // Store new previous balances for this round
        playerContributions, // Track contributions
        lastWinAmount: undefined, // Reset last win amount
        lastAction: {
          type: 'NEW_ROUND',
          playerName: firstPlayer?.name || 'Player',
          description: 'starts the round'
        }
      };
    }

    case 'END_SESSION': {
      // End the entire session and go back to player setup
      // Reset all state to initial values
      return {
        ...state,
        players: [], // Clear all players
        isGameStarted: false,
        inSettingsScreen: false,
        pot: 0,
        currentBet: 0,
        round: 0,
        previousBalances: {},
        playerContributions: {},
        showInProgress: false,
        showPlayers: [],
        settings: initialGameSettings,  // Reset to initial settings
        lastAction: undefined,
        lastWinAmount: undefined, // Reset last win amount
      };
    }

    case 'SET_SETTINGS': {
      return {
        ...state,
        settings: action.settings,
      };
    }

    case 'NEXT_PLAYER': {
      const nextPlayerIndex = findNextActivePlayerIndex(
        state.players, 
        state.currentPlayerIndex
      );
      
      const updatedPlayers = state.players.map((player, index) => ({
        ...player,
        isCurrent: index === nextPlayerIndex,
      }));

      return {
        ...state,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
      };
    }

    case 'ADD_MONEY': {
      const updatedPlayers = state.players.map(player => 
        player.id === action.playerId 
          ? { ...player, balance: player.balance + action.amount } 
          : player
      );
      
      const player = state.players.find(p => p.id === action.playerId);

      return {
        ...state,
        players: updatedPlayers,
        lastAction: {
          type: 'ADD_MONEY',
          playerName: player?.name || 'Player',
          description: `added ₹${action.amount}`
        }
      };
    }
    
    case 'CLEAR_TOAST': {
      return {
        ...state,
        lastAction: undefined
      };
    }

    case 'DISMISS_ROUND': {
      // Return money in the pot based on player contributions
      const updatedPlayers = state.players.map(player => {
        // Get player's contribution to this round
        const contribution = state.playerContributions?.[player.id] || 0;
        
        return {
          ...player,
          // Add their contribution back to their balance
          balance: player.balance + contribution,
          isActive: true, // Reset active status
          isCurrent: false, // Reset current status
          isBlind: undefined,  // Reset blind status
        };
      });
      
      // Reset game state for a new round but keep players
      return {
        ...state,
        players: updatedPlayers,
        pot: 0,
        currentBet: 0,
        showInProgress: false,
        showPlayers: [],
        playerContributions: {}, // Reset contributions
        lastWinAmount: undefined, // Reset last win amount
        lastAction: {
          type: 'DISMISS',
          playerName: '',
          description: 'Round dismissed, balances restored'
        }
      };
    }
    
    default:
      return state;
  }
};
