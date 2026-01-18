import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ACHIEVEMENTS, getUserAchievements, getAchievementProgress } from '@/lib/adminConfig';
import { useAuth } from '@/hooks/useAuth';

export const Achievements = () => {
  const { user } = useAuth();
  const [userAchievements, setUserAchievements] = useState<{ [key: string]: { unlocked: boolean; unlockedAt?: string } }>({});
  const [progress, setProgress] = useState({ total: 0, unlocked: 0, percentage: 0 });

  useEffect(() => {
    if (user) {
      const achievements = getUserAchievements(user.id);
      setUserAchievements(achievements);
      setProgress(getAchievementProgress(user.id));
    }
  }, [user]);

  return (
    <Card className="bg-background/40 backdrop-blur-lg border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🏆 Achievements</span>
          <Badge variant="secondary">
            {progress.unlocked}/{progress.total}
          </Badge>
        </CardTitle>
        <CardDescription>
          Unlock badges by reaching milestones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = userAchievements[achievement.id]?.unlocked || false;
            return (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg border transition-all ${
                  isUnlocked
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-muted/30 border-border/50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{achievement.name}</h4>
                      {isUnlocked && (
                        <Badge variant="default" className="text-xs">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
