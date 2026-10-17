export interface CatalogStream {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  subjectCount: number;
}

export type CatalogExam = CatalogStream;

export interface CatalogTopic {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  questionCount: number;
  activeQuestionCount: number;
}

export interface CatalogSubject {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  streamIds: string[];
  examIds: string[];
  topics: CatalogTopic[];
}

export interface Catalog {
  streams: CatalogStream[];
  subjects: CatalogSubject[];
  exams: CatalogExam[];
}

export interface NamedItemPayload {
  name: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export interface SubjectPayload extends NamedItemPayload {
  streamIds?: string[];
  examIds?: string[];
}

export interface TopicPayload {
  name: string;
  sortOrder?: number;
  active?: boolean;
}
