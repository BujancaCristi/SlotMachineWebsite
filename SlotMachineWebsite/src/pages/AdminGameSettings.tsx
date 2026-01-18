import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { getGameSettings, saveGameSettings, DEFAULT_GAME_SETTINGS } from '@/lib/adminConfig';
import { toast } from 'sonner';

const AdminGameSettings = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(DEFAULT_GAME_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/admin/auth');
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      const currentSettings = getGameSettings();
      setSettings(currentSettings);
    }
  }, [user, isAdmin]);

  const handleSave = () => {
    setIsSaving(true);
    try {
      saveGameSettings(settings);
      toast.success('Game settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_GAME_SETTINGS);
    saveGameSettings(DEFAULT_GAME_SETTINGS);
    toast.success('Settings reset to defaults');
  };

  const updateSetting = (key: string, value: number | object) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Game Settings</h1>
              <p className="text-xs text-muted-foreground">Configure slot machine parameters</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              size="sm"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          {/* Spin Cost Settings */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Spin Cost</CardTitle>
              <CardDescription>
                Configure how much it costs players to spin the slot machine
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="spinCost">Cost per Spin ($)</Label>
                <Input
                  id="spinCost"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settings.spinCost}
                  onChange={(e) => updateSetting('spinCost', parseFloat(e.target.value))}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: ${settings.spinCost.toFixed(2)} per spin
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payout Settings */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Payout Multipliers</CardTitle>
              <CardDescription>
                Configure win multipliers for different symbol combinations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="threeMatch">Three Matching Symbols (x)</Label>
                <Input
                  id="threeMatch"
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.payouts.threeMatch}
                  onChange={(e) => updateSetting('payouts', {
                    ...settings.payouts,
                    threeMatch: parseFloat(e.target.value)
                  })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Payout: ${(settings.spinCost * settings.payouts.threeMatch).toFixed(2)}
                </p>
              </div>

              <div>
                <Label htmlFor="twoMatch">Two Matching Symbols (x)</Label>
                <Input
                  id="twoMatch"
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.payouts.twoMatch}
                  onChange={(e) => updateSetting('payouts', {
                    ...settings.payouts,
                    twoMatch: parseFloat(e.target.value)
                  })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Payout: ${(settings.spinCost * settings.payouts.twoMatch).toFixed(2)}
                </p>
              </div>

              <div>
                <Label htmlFor="jackpot">Jackpot (Three 7s) (x)</Label>
                <Input
                  id="jackpot"
                  type="number"
                  step="1"
                  min="0"
                  value={settings.payouts.jackpot}
                  onChange={(e) => updateSetting('payouts', {
                    ...settings.payouts,
                    jackpot: parseFloat(e.target.value)
                  })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Payout: ${(settings.spinCost * settings.payouts.jackpot).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Probabilities Settings */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Win Probabilities</CardTitle>
              <CardDescription>
                Configure the likelihood of different outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="threeMatchProb">Three Match Probability (%)</Label>
                <Input
                  id="threeMatchProb"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.probabilities.threeMatch}
                  onChange={(e) => updateSetting('probabilities', {
                    ...settings.probabilities,
                    threeMatch: parseFloat(e.target.value)
                  })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {settings.probabilities.threeMatch}%
                </p>
              </div>

              <div>
                <Label htmlFor="twoMatchProb">Two Match Probability (%)</Label>
                <Input
                  id="twoMatchProb"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.probabilities.twoMatch}
                  onChange={(e) => updateSetting('probabilities', {
                    ...settings.probabilities,
                    twoMatch: parseFloat(e.target.value)
                  })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {settings.probabilities.twoMatch}%
                </p>
              </div>

              <div>
                <Label htmlFor="jackpotProb">Jackpot Probability (%)</Label>
                <Input
                  id="jackpotProb"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.probabilities.jackpot}
                  onChange={(e) => updateSetting('probabilities', {
                    ...settings.probabilities,
                    jackpot: parseFloat(e.target.value)
                  })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {settings.probabilities.jackpot}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Initial Balance */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Player Settings</CardTitle>
              <CardDescription>
                Configure default player settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="initialBalance">Initial Balance ($)</Label>
                <Input
                  id="initialBalance"
                  type="number"
                  step="1"
                  min="0"
                  value={settings.initialBalance}
                  onChange={(e) => updateSetting('initialBalance', parseFloat(e.target.value))}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Starting balance for new players
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminGameSettings;
