import React, { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import GameSettings from './GameSettings';
import PlayerActions from './PlayerActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowUp, PlusCircle, PartyPopper, IndianRupee, LogOut, UserPlus, UserMinus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const GameTable = () => {
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [winner, setWinner] = useState<{ id: string, name: string, amount: number } | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState(100);
  const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false);
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);
  const [showSelectFirstPlayerDialog, setShowSelectFirstPlayerDialog] = useState(false);
  const [showFinalBalances, setShowFinalBalances] = useState(false);
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Find the player who started the last round (for the first player dialog)
  const lastStartingPlayer = state.players.find(p => p.isCurrent);
  
  // Clear toast after 1 second (reduced from 2 seconds)
  useEffect(() => {
    const toastTimeout = setTimeout(() => {
      dispatch({ type: 'CLEAR_TOAST' });
    }, 1000);
    
    return () => clearTimeout(toastTimeout);
  }, [state.lastAction]);

  // Check for only one active player remaining
  useEffect(() => {
    const activePlayers = state.players.filter(p => p.isActive);
    if (activePlayers.length === 1 && state.isGameStarted && !state.showInProgress && !showWinnerDialog) {
      const lastPlayer = activePlayers[0];
      // Determine the winning amount from state
      const winAmount = state.lastWinAmount !== undefined ? state.lastWinAmount : state.pot;
      handleFinalWin(lastPlayer.id, winAmount);
    }
  }, [state.players, state.lastWinAmount]);

  const handleEndGame = (winnerId: string) => {
    // If it's a back show, we don't end the game, just the show
    if (state.showInProgress) {
      const losingPlayerId = state.showPlayers?.find(id => id !== winnerId) || '';
      dispatch({ type: 'RESOLVE_SHOW', winnerId, loserId: losingPlayerId });
      
      // Check if we need to end the game due to only one player remaining
      const activePlayers = state.players.filter(p => p.isActive && p.id !== losingPlayerId);
      if (activePlayers.length <= 1) {
        // If only one active player remains, award them the pot
        const finalWinnerId = activePlayers[0]?.id || winnerId;
        // Get the winning amount from state if available
        const winAmount = state.lastWinAmount !== undefined ? state.lastWinAmount : state.pot;
        handleFinalWin(finalWinnerId, winAmount);
      }
      return;
    }
    
    // Regular game end handling
    // Get the winning amount from state if available
    const winAmount = state.lastWinAmount !== undefined ? state.lastWinAmount : state.pot;
    handleFinalWin(winnerId, winAmount);
  };
  
  const handleFinalWin = (winnerId: string, potAmount: number) => {
    const winningPlayer = state.players.find(p => p.id === winnerId);
    if (winningPlayer) {
      setWinner({
        id: winnerId,
        name: winningPlayer.name,
        amount: potAmount
      });
      setShowWinnerDialog(true);
      
      // Dispatch the end game action but don't close the dialog yet
      dispatch({ type: 'END_GAME', winnerId });
    }
  };

  const handleAddMoney = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setShowAddMoneyDialog(true);
  };

  const confirmAddMoney = () => {
    if (selectedPlayerId && addMoneyAmount > 0) {
      dispatch({ 
        type: 'ADD_MONEY', 
        playerId: selectedPlayerId, 
        amount: addMoneyAmount 
      });
      toast({
        title: "Money Added",
        description: `₹${addMoneyAmount} added to player's balance`,
        duration: 1000
      });
      setShowAddMoneyDialog(false);
    }
  };

  const handlePlayerClick = (playerId: string) => {
    // Only handle clicks during show/back show
    if (state.showInProgress && state.showPlayers?.includes(playerId)) {
      handleEndGame(playerId);
    }
  };

  const handleContinueAfterWin = () => {
    setShowWinnerDialog(false);
    setShowSelectFirstPlayerDialog(true);
  };

  const handleSelectFirstPlayer = (playerId: string) => {
    dispatch({ type: 'SET_FIRST_PLAYER', playerId: playerId });
    setShowSelectFirstPlayerDialog(false);
  };

  const handleDismissRound = () => {
    dispatch({ type: 'DISMISS_ROUND' });
    setShowSelectFirstPlayerDialog(true); // Show first player dialog after dismissing
    toast({
      title: "Round Dismissed",
      description: "Money returned to players based on contributions",
      duration: 1000
    });
  };

  const handleEndSession = () => {
    setShowEndGameDialog(true);
  };

  const confirmEndSession = () => {
    setShowEndGameDialog(false);
    setShowFinalBalances(true);
  };

  const handleBackToHome = () => {
    // Reset the game to player setup state
    dispatch({ type: 'END_SESSION' });
    setShowFinalBalances(false);
  };

  // New function to handle adding player during game
  const handleAddNewPlayer = () => {
    setShowAddPlayerDialog(true);
  };

  // New function to confirm adding new player
  const confirmAddPlayer = () => {
    if (newPlayerName.trim()) {
      dispatch({ type: 'ADD_PLAYER', name: newPlayerName.trim() });
      setNewPlayerName('');
      setShowAddPlayerDialog(false);
      toast({
        title: "Player Added",
        description: `${newPlayerName} has been added to the game`,
        duration: 1000
      });
    }
  };

  // New function to handle player withdrawal
  const handlePlayerWithdraw = (playerId: string) => {
    dispatch({ type: 'WITHDRAW_PLAYER', id: playerId });
    toast({
      title: "Player Withdrawn",
      description: "Player has withdrawn from the game",
      duration: 1000
    });
  };

  const activePlayers = state.players.filter(p => p.isActive);
  const currentPlayer = state.players.find(p => p.isCurrent);
  const activeNonWithdrawnPlayers = state.players.filter(p => p.isActive && !p.hasWithdrawn);
  const withdrawnPlayers = state.players.filter(p => p.hasWithdrawn);
  
  // Get only non-withdrawn players for the select first player dialog
  const availablePlayersForNextRound = state.players.filter(p => !p.hasWithdrawn);
  
  // Sort the available players to show the last starting player first
  const sortedPlayersForNextRound = [...availablePlayersForNextRound].sort((a, b) => {
    // If a is the last starting player, put it first
    if (a.id === lastStartingPlayer?.id) return -1;
    // If b is the last starting player, put it first
    if (b.id === lastStartingPlayer?.id) return 1;
    // Otherwise, keep original order
    return 0;
  });

  // If we're showing final balances, render that view instead
  if (showFinalBalances) {
    return (
      <div className="w-full max-w-md mx-auto h-full max-h-screen overflow-hidden flex flex-col">
        <Card className="game-table p-4 mb-4 bg-poker-dark border-poker-blue flex-shrink-0">
          <h2 className="text-xl font-semibold text-center text-poker-light mb-4">Final Balances</h2>
          
          <div className="space-y-3 mb-6">
            {state.players.map((player) => (
              <div 
                key={player.id}
                className="flex justify-between items-center p-3 rounded-lg bg-secondary"
              >
                <div className="font-medium text-white">{player.name}</div>
                <div className="text-lg font-semibold text-green-400 flex items-center">
                  <IndianRupee className="h-4 w-4 mr-1" />{player.balance}
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={handleBackToHome}
            className="w-full bg-poker-blue hover:bg-poker-accent"
          >
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto h-full max-h-screen overflow-hidden flex flex-col">
      {/* Modified this section for simpler UI and more spacing */}
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-poker-light">Round {state.round}</h2>
      </div>
      
      {/* Added more spacing between round indicator and buttons */}
      <div className="flex justify-center items-center mb-6 mt-4">
        <div className="flex space-x-4">
          <GameSettings />
          
          <Button 
            variant="outline" 
            onClick={handleDismissRound}
            className="bg-yellow-600 text-white hover:bg-yellow-700"
            title="Dismiss Round"
          >
            Dismiss
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleEndSession}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            <LogOut size={18} className="mr-1" />
            End Session
          </Button>
        </div>
      </div>

      <Card className="game-table p-4 mb-4 relative bg-poker-dark border-poker-blue flex-shrink-0">
        <div className="text-center mb-2">
          <p className="text-sm text-muted-foreground mb-1">Current Pot</p>
          <h3 className="text-3xl font-bold text-white flex items-center justify-center">
            <IndianRupee className="h-6 w-6" />{state.pot}
          </h3>
        </div>
      </Card>

      <div className="overflow-y-auto flex-grow mb-2 bg-poker-dark border border-poker-blue rounded-lg p-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-poker-light">Players</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleAddNewPlayer}
            className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-transparent"
            title="Add Player"
          >
            <UserPlus size={18} />
          </Button>
        </div>
        
        <div className="space-y-2">
          {/* Active non-withdrawn players */}
          {activeNonWithdrawnPlayers.map((player) => {
            // Determine if this player is involved in a show
            const isInShow = state.showInProgress && state.showPlayers?.includes(player.id);
            
            return (
              <div 
                key={player.id}
                className={`flex justify-between items-center p-2 rounded-lg cursor-pointer ${
                  isInShow 
                    ? 'bg-poker-blue ring-2 ring-yellow-500' // Highlight players involved in show
                    : player.isCurrent 
                      ? 'bg-poker-blue' 
                      : 'bg-secondary'
                } ${!player.isActive ? 'opacity-60' : ''} ${
                  state.showInProgress && !isInShow ? 'opacity-30' : ''
                }`}
                onClick={() => handlePlayerClick(player.id)}
              >
                <div className="flex-1">
                  <div className="font-medium text-white">
                    {player.name} 
                    {!player.isActive && ' (Folded)'}
                    {player.isBlind && ' (Blind)'}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <IndianRupee className="h-3 w-3 mr-1" />{player.balance}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent's onClick
                      handleAddMoney(player.id);
                    }}
                    className="h-7 w-7 text-green-500 hover:text-green-400"
                    title="Add money"
                  >
                    <PlusCircle size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent's onClick
                      handlePlayerWithdraw(player.id);
                    }}
                    className="h-7 w-7 text-red-500 hover:text-red-400"
                    title="Withdraw player"
                  >
                    <UserMinus size={16} />
                  </Button>
                  {player.isCurrent && player.isActive && (
                    <div className="flex items-center">
                      <ArrowUp size={16} className="text-white animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Withdrawn players (shown at the bottom with reduced opacity) */}
          {withdrawnPlayers.length > 0 && (
            <div className="mt-4 pt-2 border-t border-poker-blue">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Withdrawn Players</h4>
              {withdrawnPlayers.map((player) => (
                <div 
                  key={player.id}
                  className="flex justify-between items-center p-2 rounded-lg bg-secondary opacity-50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-white">{player.name} (Withdrawn)</div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <IndianRupee className="h-3 w-3 mr-1" />{player.balance}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Player actions only available during an active game and not during show */}
      {state.isGameStarted && !state.showInProgress && (
        <div className="mb-2 flex-shrink-0">
          <PlayerActions />
        </div>
      )}

      {/* Winner celebration dialog */}
      <AlertDialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <AlertDialogContent className="bg-poker-dark border-poker-blue">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl text-poker-light flex justify-center items-center gap-2">
              <PartyPopper className="text-yellow-500" />
              Winner! 
              <PartyPopper className="text-yellow-500" />
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <div className="py-4">
                <h3 className="text-2xl font-bold text-white mb-2">{winner?.name}</h3>
                <p className="text-green-500 text-xl font-bold flex items-center justify-center">
                  Won <IndianRupee className="h-4 w-4 mx-1" />{winner?.amount}
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="animate-bounce text-3xl">🎉</div>
                  <div className="animate-bounce text-3xl delay-100">💰</div>
                  <div className="animate-bounce text-3xl delay-200">🎉</div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleContinueAfterWin}
              className="bg-poker-blue hover:bg-poker-accent w-full"
            >
              Continue Playing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add money dialog */}
      <AlertDialog open={showAddMoneyDialog} onOpenChange={setShowAddMoneyDialog}>
        <AlertDialogContent className="bg-poker-dark border-poker-blue">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-poker-light">Add Money</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the amount to add to player's balance
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Input
              type="number"
              value={addMoneyAmount}
              onChange={(e) => setAddMoneyAmount(parseInt(e.target.value) || 0)}
              className="bg-secondary text-white border-poker-accent"
              min={1}
            />
          </div>
          
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowAddMoneyDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmAddMoney}
              className="bg-poker-blue hover:bg-poker-accent"
            >
              Add Money
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add new player dialog */}
      <AlertDialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
        <AlertDialogContent className="bg-poker-dark border-poker-blue">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-poker-light">Add New Player</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the name of the new player to add to the game
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="bg-secondary text-white border-poker-accent"
              placeholder="Player name"
            />
          </div>
          
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowAddPlayerDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmAddPlayer}
              className="bg-poker-blue hover:bg-poker-accent"
            >
              Add Player
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Session confirmation dialog */}
      <AlertDialog open={showEndGameDialog} onOpenChange={setShowEndGameDialog}>
        <AlertDialogContent className="bg-poker-dark border-poker-blue">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-poker-light">End Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the current game session and show the final balances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowEndGameDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmEndSession}
              variant="destructive"
            >
              End Session
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Select First Player dialog - reorganized to show last starting player first */}
      <AlertDialog 
        open={showSelectFirstPlayerDialog} 
        onOpenChange={setShowSelectFirstPlayerDialog}
      >
        <AlertDialogContent className="bg-poker-dark border-poker-blue">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-poker-light">Select First Player</AlertDialogTitle>
            {lastStartingPlayer && (
              <AlertDialogDescription className="mb-4 p-3 bg-poker-blue bg-opacity-30 rounded-md">
                Last round started by: <span className="font-bold">{lastStartingPlayer.name}</span>
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          
          <div className="py-4 space-y-2">
            {/* If last starting player exists and is not withdrawn, show it first */}
            {lastStartingPlayer && !lastStartingPlayer.hasWithdrawn && (
              <Button 
                key={lastStartingPlayer.id}
                onClick={() => handleSelectFirstPlayer(lastStartingPlayer.id)}
                className="w-full bg-poker-accent hover:bg-poker-blue text-white mb-4"
              >
                {lastStartingPlayer.name}
              </Button>
            )}
            
            {/* Show a separator if we have both last starting player and other players */}
            {lastStartingPlayer && !lastStartingPlayer.hasWithdrawn && 
             availablePlayersForNextRound.filter(p => p.id !== lastStartingPlayer.id).length > 0 && (
              <div className="border-t border-poker-blue my-2"></div>
            )}
            
            {/* Show all other non-withdrawn players */}
            {availablePlayersForNextRound
              .filter(player => player.id !== lastStartingPlayer?.id) // Filter out the last starting player
              .map(player => (
                <Button 
                  key={player.id}
                  onClick={() => handleSelectFirstPlayer(player.id)}
                  className="w-full bg-poker-blue hover:bg-poker-accent text-white mb-2"
                >
                  {player.name}
                </Button>
              ))}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GameTable;