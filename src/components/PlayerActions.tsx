import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee } from 'lucide-react';

const PlayerActions = () => {
  const { state, dispatch } = useGame();
  const { toast } = useToast();

  const currentPlayer = state.players.find(p => p.isCurrent);
  const activePlayers = state.players.filter(p => p.isActive);

  // Find the player behind the current player for back show
  const findPlayerBehindCurrent = () => {
    if (!currentPlayer) return null;
    
    const activePlayerIds = activePlayers.map(p => p.id);
    const currentIdx = activePlayerIds.indexOf(currentPlayer.id);
    
    if (currentIdx <= 0) {
      // If current player is the first, get the last active player
      return activePlayers[activePlayers.length - 1];
    } else {
      // Otherwise, get the previous player
      return activePlayers[currentIdx - 1];
    }
  };

  const playerBehind = findPlayerBehindCurrent();
  
  // Check if player behind has played chaal (not on blind) for back show
  const isBackShowAllowed = playerBehind && playerBehind.isBlind === false;

  const handleFold = () => {
    if (!currentPlayer) return;
    
    dispatch({ type: 'FOLD', id: currentPlayer.id });
  };

  const handleChaal = () => {
    if (!currentPlayer) return;
    
    let chaalAmount;
    if (state.settings.chaalType === "fixed") {
      chaalAmount = state.settings.chaalFixedAmount;
    } else {
      chaalAmount = state.currentBet * state.settings.chaalMultiplier;
    }
    
    if (currentPlayer.balance < chaalAmount) {
      toast({
        title: "Not enough balance",
        description: `${currentPlayer.name} doesn't have enough balance for chaal`,
        variant: "destructive"
      });
      return;
    }
    
    dispatch({ type: 'CHAAL', id: currentPlayer.id });
  };

  const handleBlind = () => {
    if (!currentPlayer) return;
    
    if (currentPlayer.balance < state.settings.blindAmount) {
      toast({
        title: "Not enough balance",
        description: `${currentPlayer.name} doesn't have enough balance for blind`,
        variant: "destructive"
      });
      return;
    }
    
    dispatch({ type: 'BLIND', id: currentPlayer.id });
  };

  const handleShow = () => {
    if (!currentPlayer) return;
    
    // Use the same amount as chaal for show
    let showAmount;
    if (state.settings.chaalType === "fixed") {
      showAmount = state.settings.chaalFixedAmount;
    } else {
      showAmount = state.currentBet * state.settings.chaalMultiplier;
    }
    
    if (currentPlayer.balance < showAmount) {
      toast({
        title: "Not enough balance",
        description: `${currentPlayer.name} doesn't have enough balance for show`,
        variant: "destructive"
      });
      return;
    }
    
    dispatch({ type: 'SHOW', id: currentPlayer.id });
    toast({
      title: `${currentPlayer.name} requested show`,
      description: "Select the winner to continue"
    });
  };

  const handleBackShow = () => {
    if (!currentPlayer || !playerBehind) return;
    
    // Use the same amount as chaal for back show
    let showAmount;
    if (state.settings.chaalType === "fixed") {
      showAmount = state.settings.chaalFixedAmount;
    } else {
      showAmount = state.currentBet * state.settings.chaalMultiplier;
    }
    
    if (currentPlayer.balance < showAmount) {
      toast({
        title: "Not enough balance",
        description: `${currentPlayer.name} doesn't have enough balance for back show`,
        variant: "destructive"
      });
      return;
    }
    
    dispatch({ type: 'BACK_SHOW', id: currentPlayer.id, targetId: playerBehind.id });
    toast({
      title: `${currentPlayer.name} requested back show`,
      description: "Select the winner between the two players"
    });
  };

  if (!currentPlayer) {
    return null;
  }

  // Calculate chaal amount based on settings
  const chaalAmount = state.settings.chaalType === "fixed" 
    ? state.settings.chaalFixedAmount 
    : state.currentBet * state.settings.chaalMultiplier;

  // Only show the Show option when exactly 2 players are active and the other player is not on blind
  const otherPlayer = activePlayers.find(p => p.id !== currentPlayer.id);
  const showShowOption = activePlayers.length === 2 && otherPlayer && otherPlayer.isBlind === false;
  
  // Show Back Show when player behind has played chaal (not on blind)
  // First check if there are more than 2 players active
  const showBackShowOption = activePlayers.length > 2 && isBackShowAllowed;

  // Show blind option if player hasn't played chaal yet (isBlind can be true or undefined)
  const showBlindOption = currentPlayer.isBlind !== false;

  return (
    <Card className="bg-poker-dark border-poker-blue">
      <CardHeader>
        <CardTitle className="text-center text-lg text-poker-light">
          {currentPlayer.name}'s Turn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleChaal} 
            className="bg-poker-blue hover:bg-poker-accent text-white"
          >
            Chaal <IndianRupee className="h-3 w-3 inline" />{chaalAmount}
          </Button>
          
          {/* Show blind option if player has never played chaal or continues to play blind */}
          {showBlindOption && (
            <Button 
              onClick={handleBlind} 
              className="bg-secondary hover:bg-poker-accent text-white"
            >
              Blind <IndianRupee className="h-3 w-3 inline" />{state.settings.blindAmount}
            </Button>
          )}
          
          {showShowOption && (
            <Button 
              onClick={handleShow} 
              className="bg-secondary hover:bg-poker-accent text-white"
            >
              Show <IndianRupee className="h-3 w-3 inline" />{chaalAmount}
            </Button>
          )}
          
          {showBackShowOption && (
            <Button 
              onClick={handleBackShow} 
              className="bg-secondary hover:bg-poker-accent text-white"
            >
              Back Show <IndianRupee className="h-3 w-3 inline" />{chaalAmount}
            </Button>
          )}
          
          <Button 
            onClick={handleFold} 
            variant="destructive"
            className={showShowOption || showBackShowOption ? "col-span-1" : "col-span-2"}
          >
            Fold
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerActions;
