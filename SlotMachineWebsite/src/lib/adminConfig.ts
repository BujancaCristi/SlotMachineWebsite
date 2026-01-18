// Local admin configuration - no database required
// Add admin emails here to grant admin access

export const ADMIN_EMAILS = [
  'admin@example.com',
  'cris.bujanca03@gmail.com',
];

export const isAdminEmail = (email: string | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// Local storage keys
export const STORAGE_KEYS = {
  GAME_SETTINGS: 'slot_machine_game_settings',
  GAME_SPINS: 'slot_machine_game_spins',
  BLOCKED_USERS: 'slot_machine_blocked_users',
  USER_BALANCES: 'slot_machine_user_balances',
  DAILY_LIMITS: 'slot_machine_daily_limits',
  DAILY_SPENDING: 'slot_machine_daily_spending',
  ACHIEVEMENTS: 'slot_machine_achievements',
};

// Default game settings
export const DEFAULT_GAME_SETTINGS = {
  spinCost: 10,
  payouts: {
    jackpot: 100,      // 100x for three 7s
    threeMatch: 10,    // 10x for three matching symbols
    twoMatch: 2,       // 2x for two matching symbols
  },
  probabilities: {
    jackpot: 1,        // 1% chance
    threeMatch: 10,    // 10% chance
    twoMatch: 25,      // 25% chance
  },
  initialBalance: 100,
};

// Get game settings from localStorage
export const getGameSettings = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS);
  return stored ? JSON.parse(stored) : DEFAULT_GAME_SETTINGS;
};

// Save game settings to localStorage
export const saveGameSettings = (settings: typeof DEFAULT_GAME_SETTINGS) => {
  localStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, JSON.stringify(settings));
};

// Get game spins from localStorage
export const getGameSpins = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.GAME_SPINS);
  return stored ? JSON.parse(stored) : [];
};

// Save game spin to localStorage
export const saveGameSpin = (spin: {
  user_id: string;
  spin_cost: number;
  win_amount: number;
  result: string[];
}) => {
  const spins = getGameSpins();
  spins.push({
    ...spin,
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEYS.GAME_SPINS, JSON.stringify(spins));
};

// Get blocked users from localStorage
export const getBlockedUsers = (): string[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS);
  return stored ? JSON.parse(stored) : [];
};

// Block/unblock user
export const toggleBlockUser = (userId: string, block: boolean) => {
  const blocked = getBlockedUsers();
  const index = blocked.indexOf(userId);
  if (block && index === -1) {
    blocked.push(userId);
  } else if (!block && index > -1) {
    blocked.splice(index, 1);
  }
  localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(blocked));
};

// Reset user balance
export const resetUserBalance = (userId: string) => {
  // This function would normally update the database
  // For local storage, the balance is managed in the SlotMachine component
  // We can clear any local cache if needed
  console.log(`Reset balance for user: ${userId}`);
};

// Check if user is blocked
export const isUserBlocked = (userId: string): boolean => {
  return getBlockedUsers().includes(userId);
};

// Daily spending limit management
interface DailySpending {
  date: string;
  amount: number;
}

interface DailyLimits {
  [userId: string]: number; // userId -> limit amount (0 means no limit)
}

interface DailySpendingData {
  [userId: string]: DailySpending;
}

// Get user's daily limit
export const getDailyLimit = (userId: string): number => {
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_LIMITS);
  if (!stored) return 0; // 0 means no limit
  const limits: DailyLimits = JSON.parse(stored);
  return limits[userId] || 0;
};

// Set user's daily limit
export const setDailyLimit = (userId: string, limit: number) => {
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_LIMITS);
  const limits: DailyLimits = stored ? JSON.parse(stored) : {};
  limits[userId] = limit;
  localStorage.setItem(STORAGE_KEYS.DAILY_LIMITS, JSON.stringify(limits));
};

// Get user's spending for today
export const getTodaySpending = (userId: string): number => {
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_SPENDING);
  if (!stored) return 0;
  
  const spendingData: DailySpendingData = JSON.parse(stored);
  const userSpending = spendingData[userId];
  
  if (!userSpending) return 0;
  
  const today = new Date().toDateString();
  if (userSpending.date !== today) {
    // Reset if it's a new day
    return 0;
  }
  
  return userSpending.amount;
};

// Add spending to today's total
export const addTodaySpending = (userId: string, amount: number) => {
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_SPENDING);
  const spendingData: DailySpendingData = stored ? JSON.parse(stored) : {};
  
  const today = new Date().toDateString();
  const currentSpending = spendingData[userId];
  
  if (!currentSpending || currentSpending.date !== today) {
    // New day or first spending
    spendingData[userId] = { date: today, amount };
  } else {
    // Add to today's spending
    spendingData[userId].amount += amount;
  }
  
  localStorage.setItem(STORAGE_KEYS.DAILY_SPENDING, JSON.stringify(spendingData));
};

// Check if user can spend (hasn't reached limit)
export const canSpend = (userId: string, amount: number): boolean => {
  const limit = getDailyLimit(userId);
  if (limit === 0) return true; // No limit set
  
  const todaySpending = getTodaySpending(userId);
  return (todaySpending + amount) <= limit;
};

// Get remaining spending allowance for today
export const getRemainingAllowance = (userId: string): number => {
  const limit = getDailyLimit(userId);
  if (limit === 0) return Infinity; // No limit
  
  const todaySpending = getTodaySpending(userId);
  return Math.max(0, limit - todaySpending);
};

// Achievement system
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (userSpins: any[], userId: string) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_spin',
    name: 'First Spin',
    description: 'Complete your first spin',
    icon: '🎰',
    condition: (userSpins) => userSpins.length >= 1,
  },
  {
    id: 'ten_spins',
    name: 'Getting Started',
    description: 'Complete 10 spins',
    icon: '🔟',
    condition: (userSpins) => userSpins.length >= 10,
  },
  {
    id: 'fifty_spins',
    name: 'Slot Enthusiast',
    description: 'Complete 50 spins',
    icon: '🎯',
    condition: (userSpins) => userSpins.length >= 50,
  },
  {
    id: 'hundred_spins',
    name: 'Spin Master',
    description: 'Complete 100 spins',
    icon: '💯',
    condition: (userSpins) => userSpins.length >= 100,
  },
  {
    id: 'first_win',
    name: 'First Win',
    description: 'Win your first prize',
    icon: '🏆',
    condition: (userSpins) => userSpins.some((spin: any) => spin.win_amount > 0),
  },
  {
    id: 'big_win',
    name: 'Big Winner',
    description: 'Win 10x your bet in a single spin',
    icon: '💰',
    condition: (userSpins) => userSpins.some((spin: any) => spin.win_amount >= spin.spin_cost * 10),
  },
  {
    id: 'first_jackpot',
    name: 'Jackpot!',
    description: 'Hit your first jackpot (three 7s)',
    icon: '🎰',
    condition: (userSpins) => userSpins.some((spin: any) => {
      if (!spin.result) return false;
      return spin.result.every((symbol: string) => symbol === '7');
    }),
  },
  {
    id: 'lucky_streak',
    name: 'Lucky Streak',
    description: 'Win 5 times in a row',
    icon: '🍀',
    condition: (userSpins) => {
      if (userSpins.length < 5) return false;
      const recent = userSpins.slice(0, 5);
      return recent.every((spin: any) => spin.win_amount > 0);
    },
  },
  {
    id: 'profit_maker',
    name: 'Profit Maker',
    description: 'Have a net profit of $100 or more',
    icon: '📈',
    condition: (userSpins) => {
      const totalSpent = userSpins.reduce((sum: number, spin: any) => sum + spin.spin_cost, 0);
      const totalWon = userSpins.reduce((sum: number, spin: any) => sum + spin.win_amount, 0);
      return (totalWon - totalSpent) >= 100;
    },
  },
];

interface UserAchievements {
  [userId: string]: {
    [achievementId: string]: {
      unlocked: boolean;
      unlockedAt?: string;
    };
  };
}

// Get user's achievements
export const getUserAchievements = (userId: string): { [key: string]: { unlocked: boolean; unlockedAt?: string } } => {
  const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
  if (!stored) return {};
  
  const allAchievements: UserAchievements = JSON.parse(stored);
  return allAchievements[userId] || {};
};

// Check and unlock achievements
export const checkAchievements = (userId: string): string[] => {
  const spins = getGameSpins();
  const userSpins = spins.filter((spin: any) => spin.user_id === userId);
  const userAchievements = getUserAchievements(userId);
  const newlyUnlocked: string[] = [];

  ACHIEVEMENTS.forEach((achievement) => {
    if (!userAchievements[achievement.id]?.unlocked && achievement.condition(userSpins, userId)) {
      // Unlock achievement
      const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      const allAchievements: UserAchievements = stored ? JSON.parse(stored) : {};
      
      if (!allAchievements[userId]) {
        allAchievements[userId] = {};
      }
      
      allAchievements[userId][achievement.id] = {
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(allAchievements));
      newlyUnlocked.push(achievement.id);
    }
  });

  return newlyUnlocked;
};

// Get achievement progress
export const getAchievementProgress = (userId: string) => {
  const userAchievements = getUserAchievements(userId);
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = Object.values(userAchievements).filter((a) => a.unlocked).length;
  
  return {
    total: totalAchievements,
    unlocked: unlockedCount,
    percentage: (unlockedCount / totalAchievements) * 100,
  };
};

// Leaderboard types
export interface LeaderboardPlayer {
  userId: string;
  email: string;
  totalWinnings: number;
  gamesPlayed: number;
  achievementsUnlocked: number;
  biggestWin: number;
  profitLoss: number;
}

// Get leaderboard data for all players
export const getLeaderboardData = (): LeaderboardPlayer[] => {
  const spins = getGameSpins();
  const userIds = [...new Set(spins.map((spin: any) => spin.user_id))];
  
  const players: LeaderboardPlayer[] = userIds.map((userId: any) => {
    const userIdStr = String(userId);
    const userSpins = spins.filter((spin: any) => spin.user_id === userId);
    const totalWinnings = userSpins.reduce((sum: number, spin: any) => sum + spin.win_amount, 0);
    const totalSpent = userSpins.reduce((sum: number, spin: any) => sum + spin.spin_cost, 0);
    const biggestWin = Math.max(...userSpins.map((spin: any) => spin.win_amount), 0);
    const profitLoss = totalWinnings - totalSpent;
    const achievementsUnlocked = getAchievementProgress(userIdStr).unlocked;
    
    // Try to get email from stored user data or use a placeholder
    let email = `User ${userIdStr.substring(0, 8)}`;
    try {
      // Check if we have user email stored
      const stored = localStorage.getItem('user_emails');
      if (stored) {
        const emails = JSON.parse(stored);
        email = emails[userIdStr] || email;
      }
    } catch (e) {
      // Use default
    }
    
    return {
      userId: userIdStr,
      email,
      totalWinnings,
      gamesPlayed: userSpins.length,
      achievementsUnlocked,
      biggestWin,
      profitLoss,
    };
  });
  
  return players;
};

// Store user email for leaderboard display
export const storeUserEmail = (userId: string, email: string) => {
  try {
    const stored = localStorage.getItem('user_emails');
    const emails = stored ? JSON.parse(stored) : {};
    emails[userId] = email;
    localStorage.setItem('user_emails', JSON.stringify(emails));
  } catch (e) {
    console.error('Failed to store user email:', e);
  }
};
