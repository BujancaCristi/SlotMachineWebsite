import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Gamepad2, Award } from 'lucide-react';
import { getLeaderboardData, type LeaderboardPlayer } from '@/lib/adminConfig';

type SortBy = 'totalWinnings' | 'gamesPlayed' | 'achievementsUnlocked' | 'profitLoss';

export const Leaderboard = () => {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('totalWinnings');

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = () => {
    const data = getLeaderboardData();
    const sorted = [...data].sort((a, b) => {
      if (sortBy === 'totalWinnings') return b.totalWinnings - a.totalWinnings;
      if (sortBy === 'gamesPlayed') return b.gamesPlayed - a.gamesPlayed;
      if (sortBy === 'achievementsUnlocked') return b.achievementsUnlocked - a.achievementsUnlocked;
      if (sortBy === 'profitLoss') return b.profitLoss - a.profitLoss;
      return 0;
    });
    setPlayers(sorted.slice(0, 10)); // Top 10 players
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <Card className="bg-background/40 backdrop-blur-lg border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Leaderboard
            </CardTitle>
            <CardDescription>
              Top 10 players ranked by performance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sort buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sortBy === 'totalWinnings' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('totalWinnings')}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Total Winnings
          </Button>
          <Button
            variant={sortBy === 'gamesPlayed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('gamesPlayed')}
          >
            <Gamepad2 className="h-4 w-4 mr-1" />
            Games Played
          </Button>
          <Button
            variant={sortBy === 'achievementsUnlocked' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('achievementsUnlocked')}
          >
            <Award className="h-4 w-4 mr-1" />
            Achievements
          </Button>
          <Button
            variant={sortBy === 'profitLoss' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('profitLoss')}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Profit/Loss
          </Button>
        </div>

        {/* Leaderboard table */}
        {players.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No players yet. Be the first to play!</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Games</TableHead>
                  <TableHead className="text-right">Winnings</TableHead>
                  <TableHead className="text-right">Profit/Loss</TableHead>
                  <TableHead className="text-right">Achievements</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player, index) => (
                  <TableRow key={player.userId} className={index < 3 ? 'bg-primary/5' : ''}>
                    <TableCell className="font-medium">
                      <span className="text-lg">{getMedalIcon(index)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{player.email}</span>
                        {player.biggestWin > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Biggest win: ${player.biggestWin.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{player.gamesPlayed}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-green-500">
                        ${player.totalWinnings.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${player.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {player.profitLoss >= 0 ? '+' : ''}${player.profitLoss.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="gap-1">
                        <Trophy className="h-3 w-3" />
                        {player.achievementsUnlocked}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
