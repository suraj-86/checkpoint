export interface TopicCount {
  topic: string;
  count: number;
}

export interface DatasetSummary {
  id: string;
  name: string;
  version: string;
  importedAt: string;
  questionCount: number;
  activeQuestionCount: number;
}

export interface AdminDashboard {
  totalQuestions: number;
  activeQuestions: number;
  retiredQuestions: number;
  topicCount: number;
  datasetCount: number;
  studentCount: number;
  activeByDifficulty: Record<string, number>;
  activeByType: Record<string, number>;
  activeByTopic: TopicCount[];
  latestDataset: DatasetSummary | null;
}

export interface QuestionValidationError {
  externalId: string;
  messages: string[];
}

export interface ValidationResponse {
  datasetName: string | null;
  datasetVersion: string | null;
  total: number;
  validCount: number;
  invalidCount: number;
  datasetErrors: string[];
  errors: QuestionValidationError[];
}

export interface ImportResponse {
  datasetName: string;
  datasetVersion: string;
  totalProcessed: number;
  created: number;
  updated: number;
}

export type UploadPayload = Record<string, unknown>;

export interface AdminQuestion {
  id: string;
  externalId: string;
  topic: string;
  subtopic: string | null;
  questionType: string;
  difficulty: string;
  questionText: string;
  answerData: unknown;
  explanation: string | null;
  active: boolean;
}

export interface QuestionFilters {
  topicId: string;
  difficulty: string;
  type: string;
  active: string;
}
