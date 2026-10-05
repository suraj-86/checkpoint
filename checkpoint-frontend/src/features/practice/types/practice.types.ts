export type QuestionType = "MCQ" | "TRUE_FALSE" | "FILL_IN_BLANK";

export interface StudentQuestion {
  id: string;
  question: string;
  options: string[] | null;
  type: QuestionType;
  difficulty: string;
}

export interface ActiveSession {
  sessionId: string;
  sessionType: "DAILY" | "FAST";
  primaryQuestionCount: number;
  answeredPrimaryCount: number;
  totalSlots: number;
  answeredSlots: number;
  currentQuestion: StudentQuestion | null;
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
}
