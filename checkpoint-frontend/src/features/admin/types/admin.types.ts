export interface TopicCount {
  topic: string;
  count: number;
}

export interface DatasetTopicRef {
  topicId: string;
  topicName: string;
  subjectId: string | null;
  subjectName: string | null;
  questionCount: number;
}

export interface NameCount {
  name: string;
  count: number;
}

export interface DatasetSummary {
  id: string;
  name: string;
  version: string;
  importedAt: string;
  questionCount: number;
  activeQuestionCount: number;
  topics: DatasetTopicRef[];
}

export interface AdminDashboard {
  totalQuestions: number;
  activeQuestions: number;
  retiredQuestions: number;
  topicCount: number;
  subjectCount: number;
  streamCount: number;
  examCount: number;
  datasetCount: number;
  studentCount: number;
  activeByDifficulty: Record<string, number>;
  activeByType: Record<string, number>;
  activeByTopic: TopicCount[];
  activeBySubject: NameCount[];
  activeByStream: NameCount[];
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
  target: string;
}

export type UploadPayload = Record<string, unknown>;

export interface AdminQuestion {
  id: string;
  externalId: string;
  topic: string;
  subject: string | null;
  dataset: string;
  subtopic: string | null;
  questionType: string;
  difficulty: string;
  questionText: string;
  answerData: unknown;
  explanation: string | null;
  active: boolean;
}

export interface QuestionFilters {
  streamId: string;
  examId: string;
  subjectId: string;
  topicId: string;
  datasetId: string;
  difficulty: string;
  type: string;
  active: string;
  q: string;
}
