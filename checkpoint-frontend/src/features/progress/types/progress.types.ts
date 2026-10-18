export interface LevelProgress {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number | null;
  xpIntoLevel: number;
  xpToNextLevel: number | null;
  percent: number;
}

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
  levelProgress: LevelProgress;
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

export interface QuestionReview {
  number: number;
  questionId: string;
  question: string;
  type: "MCQ" | "TRUE_FALSE" | "FILL_IN_BLANK";
  difficulty: string;
  topic: string;
  subtopic: string | null;
  options: string[] | null;
  status: "CORRECT" | "WRONG" | "UNANSWERED";
  yourAnswer: string | boolean | null;
  correctAnswer: unknown;
  explanation: string | null;
}

export interface SessionDetail {
  summary: SessionSummary;
  totalQuestions: number;
  unansweredCount: number;
  questions: QuestionReview[];
}

export interface SessionHistoryItem {
  summary: SessionSummary;
  totalQuestions: number;
  topics: string[];
}

export interface HistoryFilters {
  q: string;
  type: "" | "DAILY" | "FAST";
  status: "" | "COMPLETED" | "ABANDONED" | "IN_PROGRESS";
  subjectId: string;
  topicId: string;
  result: "" | "PERFECT" | "HAS_WRONG";
  fromDate: string;
  toDate: string;
  sort: "newest" | "oldest";
}
