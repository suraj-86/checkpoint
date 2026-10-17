export type QuestionType = "MCQ" | "TRUE_FALSE" | "FILL_IN_BLANK";

export interface StudentQuestion {
  id: string;
  question: string;
  options: string[] | null;
  type: QuestionType;
  difficulty: string;
}

export type SlotStatus = "CORRECT" | "WRONG" | "SKIPPED" | "NOT_ATTEMPTED";

export interface SlotInfo {
  position: number;
  questionId: string;
  primary: boolean;
  status: SlotStatus;
}

export interface SlotReview {
  correct: boolean;
  yourAnswer: string | boolean | null;
  correctAnswer: unknown;
  explanation: string | null;
}

export interface SlotQuestion {
  position: number;
  status: SlotStatus;
  primary: boolean;
  question: StudentQuestion;
  review: SlotReview | null;
}

export interface ActiveSession {
  sessionId: string;
  sessionType: "DAILY" | "FAST";
  primaryQuestionCount: number;
  answeredPrimaryCount: number;
  totalSlots: number;
  answeredSlots: number;
  currentQuestion: StudentQuestion | null;
  slots: SlotInfo[];
  currentPosition: number;
}

export interface AnswerSubmitRequest {
  questionId: string;
  answer: string | boolean;
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: unknown;
  explanation: string;
  requeued: boolean;
}

export interface FastPracticeStartRequest {
  count: number;
  topicId?: string | null;
  difficulty?: string | null;
  questionType?: string | null;
}

export interface SessionCompletion {
  sessionId: string;
  status: string;
  primaryQuestionCount: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number | null;
  xpChange: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  currentStreak: number;
  longestStreak: number;
  streakMilestoneBonus: number;
  answeredCount: number;
  unattemptedCount: number;
}
