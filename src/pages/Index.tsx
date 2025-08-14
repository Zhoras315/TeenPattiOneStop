
import React from 'react';
import { GameProvider } from '@/contexts/GameContext';
import PlayerSetup from '@/components/PlayerSetup';
import GameTable from '@/components/GameTable';
import GameSettings from '@/components/GameSettings';
import { useGame } from '@/contexts/GameContext';

const GameContainer = () => {
  const { state, dispatch } = useGame();

  // Player setup -> Game settings -> Game table flow
  const renderCurrentView = () => {
    if (!state.players.length) {
      return <PlayerSetup />;
    } else if (state.inSettingsScreen) {
      return <SettingsScreen />;
    } else if (state.isGameStarted) {
      return <GameTable />;
    } else {
      return <PlayerSetup />;
    }
  };

  return (
    <div className="p-4 min-h-screen flex flex-col items-center">
      {renderCurrentView()}
    </div>
  );
};

// Settings screen component
const SettingsScreen = () => {
  const { dispatch } = useGame();
  
  const startGame = () => {
    dispatch({ type: 'START_GAME' });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-center mb-6 text-poker-light">
        Game Settings
      </h1>
      
      <div className="bg-poker-dark border border-poker-blue rounded-lg p-6 mb-6">
        <GameSettings fullScreen />
      </div>
      
      <button 
        onClick={startGame}
        className="w-full bg-poker-blue hover:bg-poker-accent text-white p-3 rounded-lg font-semibold"
      >
        Start Game
      </button>
    </div>
  );
};

const Index = () => {
  return (
    <div className="teen-patti-bg min-h-screen">
      <GameProvider>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-poker-light">
            Teen Patti Money Manager
          </h1>
          <GameContainer />
        </div>
      </GameProvider>
    </div>
  );
};

export default Index;
