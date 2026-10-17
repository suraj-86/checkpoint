import * as api from "../api/catalogApi";
import { GroupPage } from "../components/GroupPage";
import type { Catalog } from "../types/catalog.types";

const pickExams = (c: Catalog) => c.exams;

export function ExamsPage() {
  return (
    <GroupPage
      kind="exam"
      title="Exams"
      singular="Exam"
      placeholder="JEE Main"
      intro="An exam picks the subjects it tests, for example JEE uses Maths, Physics and Chemistry. Exams never link to topics directly."
      pick={pickExams}
      create={api.createExam}
      update={api.updateExam}
      remove={api.deleteExam}
      setSubjects={api.setExamSubjects}
    />
  );
}
