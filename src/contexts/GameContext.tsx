
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GameState, GameAction } from '../types';
import { initialGameState } from './initialState';
import { gameReducer } from './gameReducer';
import { useToast } from '@/hooks/use-toast';

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const { toast } = useToast();
  
  // Show toast notification when lastAction is updated
  useEffect(() => {
    if (state.lastAction) {
      toast({
        title: state.lastAction.playerName 
          ? `${state.lastAction.playerName} ${state.lastAction.description}`
          : state.lastAction.description,
        duration: 1000, // Reduced to 1 second (1000ms)
      });
    }
  }, [state.lastAction, toast]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
