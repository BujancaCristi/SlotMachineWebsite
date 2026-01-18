import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getGameSettings, saveGameSpin, canSpend, addTodaySpending, getRemainingAllowance, checkAchievements, ACHIEVEMENTS } from '@/lib/adminConfig';
import { toast as sonnerToast } from 'sonner';
import robuImg from '@/assets/robu.png';

type Symbol = { type: 'emoji'; value: string } | { type: 'image'; src: string; alt: string };

const SYMBOLS: Symbol[] = [
  { type: 'emoji', value: '🍎' },
  { type: 'emoji', value: '🍊' },
  { type: 'emoji', value: '🍋' },
  { type: 'emoji', value: '🔔' },
  { type: 'emoji', value: '⭐' },
  { type: 'emoji', value: '💎' },
  { type: 'emoji', value: '7' },
];
const COLS = 3;
const ROWS = 1;

const getSymbolKey = (s: Symbol): string => s.type === 'emoji' ? s.value : s.src;

const generateGrid = (randomFn: () => Symbol): Symbol[][] => 
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, randomFn));

export const SlotMachine = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(100);
  const [grid, setGrid] = useState<Symbol[][]>(generateGrid(() => SYMBOLS[0]));
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("Click SPIN to play!");
  const [loading, setLoading] = useState(true);
  const [gameSettings, setGameSettings] = useState(getGameSettings());

  useEffect(() => {
    // Update game settings on mount
    setGameSettings(getGameSettings());
  }, []);

  const randomSymbol = (): Symbol => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching balance:', error);
      // Try to create balance record if not exists
      const { error: insertError } = await supabase
        .from('user_balances')
        .insert({ user_id: user.id, balance: 100 });
      
      if (!insertError) {
        setBalance(100);
      }
    } else if (data) {
      setBalance(data.balance);
    } else {
      // Create balance record
      await supabase
        .from('user_balances')
        .insert({ user_id: user.id, balance: 100 });
      setBalance(100);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const updateBalance = async (newBalance: number) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('user_balances')
      .update({ balance: newBalance })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating balance:', error);
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive"
      });
    }
  };

  const isRobu = (s: Symbol): boolean => s.type === 'emoji' && s.value === '7';
  
  const evaluateWin = (finalGrid: Symbol[][]): { prize: number; message: string } => {
    // Flatten grid
    const allSymbols = finalGrid.flat();
    
    // Check for jackpot (three 7s)
    if (allSymbols.every(s => isRobu(s))) {
      const prize = gameSettings.spinCost * gameSettings.payouts.jackpot;
      return { prize, message: `🎰 JACKPOT! Three 7s! You won $${prize}!` };
    }
    
    // Count symbols
    const symbolCounts: Record<string, number> = {};
    for (const symbol of allSymbols) {
      const key = getSymbolKey(symbol);
      symbolCounts[key] = (symbolCounts[key] || 0) + 1;
    }
    
    // Check for three of a kind
    for (const [key, count] of Object.entries(symbolCounts)) {
      if (count === 3) {
        const prize = gameSettings.spinCost * gameSettings.payouts.threeMatch;
        return { prize, message: `✨ Three of a kind! You won $${prize}!` };
      }
    }
    
    // Check for two of a kind
    for (const [key, count] of Object.entries(symbolCounts)) {
      if (count === 2) {
        const prize = gameSettings.spinCost * gameSettings.payouts.twoMatch;
        return { prize, message: `✨ Two of a kind! You won $${prize}!` };
      }
    }
    
    return { prize: 0, message: "No match. Try again!" };
  };

  const spin = async () => {
    if (!user) return;

    if (balance < gameSettings.spinCost) {
      setMessage("Not enough money! Game Over!");
      return;
    }

    // Check daily spending limit
    if (!canSpend(user.id, gameSettings.spinCost)) {
      const remaining = getRemainingAllowance(user.id);
      setMessage(`Daily spending limit reached! Remaining: $${remaining.toFixed(2)}`);
      toast({
        title: "Daily Limit Reached",
        description: `You've reached your daily spending limit. Remaining allowance: $${remaining.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    setSpinning(true);
    const newBalance = balance - gameSettings.spinCost;
    setBalance(newBalance);
    setMessage("Spinning...");

    // Add to today's spending
    addTodaySpending(user.id, gameSettings.spinCost);

    let ticks = 0;
    const interval = setInterval(() => {
      setGrid(generateGrid(randomSymbol));
      ticks++;

      if (ticks > 15) {
        clearInterval(interval);
        const finalGrid = generateGrid(randomSymbol);
        setGrid(finalGrid);
        
        const { prize, message } = evaluateWin(finalGrid);
        const finalBalance = newBalance + prize;
        setBalance(finalBalance);
        setMessage(message);
        updateBalance(finalBalance);
        
        // Log spin to localStorage for analytics
        if (user) {
          const result = finalGrid[0].map(s => getSymbolKey(s));
          saveGameSpin({
            user_id: user.id,
            spin_cost: gameSettings.spinCost,
            win_amount: prize,
            result,
          });
          
          // Check for newly unlocked achievements
          const newAchievements = checkAchievements(user.id);
          if (newAchievements.length > 0) {
            newAchievements.forEach(achievementId => {
              const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
              if (achievement) {
                toast.success(`Achievement Unlocked! ${achievement.icon}`, {
                  description: `${achievement.name}: ${achievement.description}`,
                  duration: 5000,
                });
              }
            });
          }
        }
        
        setSpinning(false);
      }
    }, 100);
  };

  if (loading) {
    return (
      <Card className="bg-background/40 backdrop-blur-lg border-border/50">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background/40 backdrop-blur-lg border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          🎰 Slot Machine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Display */}
        <div className="text-center">
          <span className="text-lg font-semibold text-muted-foreground">Balance: </span>
          <span className="text-2xl font-bold text-primary">${balance}</span>
        </div>

        {/* Grid */}
        <div className="flex flex-col items-center gap-2">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((symbol, colIndex) => (
                <div
                  key={colIndex}
                  className={`w-14 h-14 flex items-center justify-center text-3xl bg-background/60 rounded-lg border-2 border-primary/30 shadow-lg ${
                    spinning ? 'animate-pulse' : ''
                  }`}
                >
                  {symbol.type === 'emoji' ? (
                    symbol.value
                  ) : (
                    <img src={symbol.src} alt={symbol.alt} className="w-10 h-10 object-cover rounded" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Message */}
        <p className="text-center text-lg font-medium min-h-[28px]">
          {message}
        </p>

        {/* Spin Button */}
        <div className="flex justify-center">
          <Button
            onClick={spin}
            disabled={spinning || balance < gameSettings.spinCost}
            size="lg"
            className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg"
          >
            {spinning ? "SPINNING..." : `SPIN ($${gameSettings.spinCost})`}
          </Button>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>7️⃣ 7️⃣ 7️⃣ = ${(gameSettings.spinCost * gameSettings.payouts.jackpot).toFixed(2)} Jackpot!</p>
          <p>Three match = ${(gameSettings.spinCost * gameSettings.payouts.threeMatch).toFixed(2)}</p>
          <p>Two match = ${(gameSettings.spinCost * gameSettings.payouts.twoMatch).toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
};
