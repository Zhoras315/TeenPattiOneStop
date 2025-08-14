
import React, { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Filter } from 'lucide-react';
import { GameSettings as GameSettingsType } from '@/types';

interface GameSettingsProps {
  fullScreen?: boolean;
}

const GameSettings: React.FC<GameSettingsProps> = ({ fullScreen = false }) => {
  const { state, dispatch } = useGame();
  const [settings, setSettings] = useState<GameSettingsType>({
    ...state.settings,
    chaalType: state.settings.chaalType || "multiplier", // Default to multiplier if not set
    chaalFixedAmount: state.settings.chaalFixedAmount || 20, // Default value
  });

  // Auto-save settings whenever they change
  useEffect(() => {
    dispatch({ type: 'SET_SETTINGS', settings });
  }, [settings, dispatch]);

  const updateSetting = (key: keyof GameSettingsType, value: any) => {
    // Remove showAmount from settings as it will be calculated based on chaal
    if (key === 'chaalFixedAmount' || key === 'chaalMultiplier' || key === 'chaalType') {
      // Calculate the new showAmount based on the updated chaal settings
      let newShowAmount;
      if (key === 'chaalType') {
        if (value === 'fixed') {
          newShowAmount = settings.chaalFixedAmount;
        } else {
          newShowAmount = state.currentBet * settings.chaalMultiplier;
        }
      } else if (key === 'chaalFixedAmount' && settings.chaalType === 'fixed') {
        newShowAmount = value;
      } else if (key === 'chaalMultiplier' && settings.chaalType === 'multiplier') {
        newShowAmount = state.currentBet * value;
      }
      
      if (newShowAmount !== undefined) {
        setSettings(prev => ({
          ...prev,
          [key]: value,
          showAmount: newShowAmount
        }));
      } else {
        setSettings(prev => ({
          ...prev,
          [key]: value
        }));
      }
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  // Content to render in both sheet and fullscreen mode
  const renderSettingsContent = () => (
    <div className="py-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bootAmount" className="text-poker-light">Boot Amount</Label>
        <Input
          id="bootAmount"
          type="number"
          value={settings.bootAmount}
          onChange={(e) => updateSetting('bootAmount', parseInt(e.target.value) || 0)}
          className="bg-secondary text-white border-poker-accent"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="blindAmount" className="text-poker-light">Blind Amount</Label>
        <Input
          id="blindAmount"
          type="number"
          value={settings.blindAmount}
          onChange={(e) => updateSetting('blindAmount', parseInt(e.target.value) || 0)}
          className="bg-secondary text-white border-poker-accent"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-poker-light">Chaal Type</Label>
        <RadioGroup 
          value={settings.chaalType} 
          onValueChange={(value) => updateSetting('chaalType', value as "multiplier" | "fixed")}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="multiplier" id="multiplier" className="text-poker-blue" />
            <Label htmlFor="multiplier" className="text-poker-light">Multiplier</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fixed" id="fixed" className="text-poker-blue" />
            <Label htmlFor="fixed" className="text-poker-light">Fixed Amount</Label>
          </div>
        </RadioGroup>
      </div>
      
      {settings.chaalType === "multiplier" ? (
        <div className="space-y-2">
          <Label htmlFor="chaalMultiplier" className="text-poker-light">Chaal Multiplier</Label>
          <Input
            id="chaalMultiplier"
            type="number"
            value={settings.chaalMultiplier}
            onChange={(e) => updateSetting('chaalMultiplier', parseInt(e.target.value) || 1)}
            className="bg-secondary text-white border-poker-accent"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="chaalFixedAmount" className="text-poker-light">Chaal Fixed Amount</Label>
          <Input
            id="chaalFixedAmount"
            type="number"
            value={settings.chaalFixedAmount}
            onChange={(e) => updateSetting('chaalFixedAmount', parseInt(e.target.value) || 0)}
            className="bg-secondary text-white border-poker-accent"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="potLimit" className="text-poker-light">Pot Limit (0 for no limit)</Label>
        <Input
          id="potLimit"
          type="number"
          value={settings.potLimit}
          onChange={(e) => updateSetting('potLimit', parseInt(e.target.value) || 0)}
          className="bg-secondary text-white border-poker-accent"
        />
      </div>
    </div>
  );

  // For fullscreen mode, render directly without save button
  if (fullScreen) {
    return <div>{renderSettingsContent()}</div>;
  }

  // For sheet/modal mode
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full bg-poker-blue hover:bg-poker-accent">
          <Filter size={20} className="text-white" />
          <span className="sr-only">Game Rules</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-poker-dark border-poker-blue">
        <SheetHeader>
          <SheetTitle className="text-poker-light">Game Rules</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Configure the game parameters
          </SheetDescription>
        </SheetHeader>
        
        {renderSettingsContent()}
      </SheetContent>
    </Sheet>
  );
};

export default GameSettings;
