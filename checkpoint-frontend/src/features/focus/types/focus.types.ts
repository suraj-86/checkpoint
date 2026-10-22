export interface FocusDay {
  day: string;
  seconds: number;
  targetMet: boolean;
}

export interface FocusState {
  todaySeconds: number;
  targetMinutes: number;
  targetReached: boolean;
  rewarded: boolean;
  rewardChest: { id: string; tier: string } | null;
  last7Days: FocusDay[];
  streakDays: number;
}
