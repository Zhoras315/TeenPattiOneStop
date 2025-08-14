
import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';

const PlayerSetup = () => {
  const [playerName, setPlayerName] = useState('');
  const { state, dispatch } = useGame();
  const { toast } = useToast();

  const handleAddPlayer = () => {
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Player name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    dispatch({ type: 'ADD_PLAYER', name: playerName });
    setPlayerName('');
  };

  const handleRemovePlayer = (id: string) => {
    dispatch({ type: 'REMOVE_PLAYER', id });
  };

  const handleNextStep = () => {
    if (state.players.length < 2) {
      toast({
        title: "Cannot proceed",
        description: "You need at least 2 players to continue",
        variant: "destructive"
      });
      return;
    }
    
    // This indicates we want to proceed to the settings page
    // We don't start the game yet - this is just to move to the settings screen
    dispatch({ type: 'PROCEED_TO_SETTINGS' });
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-poker-dark border-poker-blue">
      <CardHeader>
        <CardTitle className="text-center text-xl text-poker-light">Add Players</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Enter player name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="bg-secondary text-white border-poker-accent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddPlayer();
              }
            }}
          />
          <Button onClick={handleAddPlayer} variant="outline" className="bg-poker-blue text-white hover:bg-poker-accent">
            Add
          </Button>
        </div>

        <div className="space-y-2 mt-4">
          <h3 className="text-sm font-medium text-poker-light">Players ({state.players.length}):</h3>
          <ul className="space-y-2">
            {state.players.map((player) => (
              <li key={player.id} className="flex justify-between items-center bg-secondary p-3 rounded-md">
                <span className="text-white">{player.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemovePlayer(player.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-300 hover:bg-transparent"
                >
                  <X size={16} />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleNextStep} 
          className="w-full bg-poker-blue hover:bg-poker-accent"
          disabled={state.players.length < 2}
        >
          Continue to Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlayerSetup;
