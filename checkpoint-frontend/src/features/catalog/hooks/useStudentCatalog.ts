import { useQuery } from "@tanstack/react-query";
import { getStudentCatalog } from "../api/studentCatalogApi";

export const STUDENT_CATALOG_KEY = ["student-catalog"];

export function useStudentCatalog() {
  return useQuery({ queryKey: STUDENT_CATALOG_KEY, queryFn: getStudentCatalog, staleTime: 60_000 });
}
