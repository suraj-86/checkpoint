export interface Profile {
  id: string;
  username: string;
  role: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalDailySessions: number;
  totalFastSessions: number;
}

export interface SessionSummary {
  sessionId: string;
  sessionType: "DAILY" | "FAST";
  status: string;
  startedAt: string;
  completedAt: string | null;
  correctCount: number;
  wrongCount: number;
  accuracy: number | null;
  xpChange: number | null;
}

export interface Dashboard {
  username: string;
  level: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  dailySessionCompletedToday: boolean;
  hasActiveSession: boolean;
  questionsNeedingReview: number;
  recentSessions: SessionSummary[];
}

export interface ProgressOverall {
  distinctQuestionsAttempted: number;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
  overallAccuracy: number;
  needsReviewCount: number;
  stableCount: number;
  overdueCount: number;
  dueForReviewCount: number;
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  questionsAttempted: number;
  correctCount: number;
  accuracy: number;
}

export interface ActivityDayPoint {
  date: string;
  sessionCount: number;
  xpTotal: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Topic {
  id: string;
  name: string;
}
