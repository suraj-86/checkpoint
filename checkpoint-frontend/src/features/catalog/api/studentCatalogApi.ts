import { apiClient } from "@/api/client";
import type { Catalog } from "@/features/admin/types/catalog.types";

export async function getStudentCatalog(): Promise<Catalog> {
  const { data } = await apiClient.get<Catalog>("/api/catalog");
  return data;
}
