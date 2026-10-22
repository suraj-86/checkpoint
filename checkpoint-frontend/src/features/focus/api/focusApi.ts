import { apiClient } from "@/api/client";
import type { FocusState } from "../types/focus.types";

export async function getFocus(): Promise<FocusState> {
  const { data } = await apiClient.get<FocusState>("/api/focus");
  return data;
}

/** "Still studying": the server adds the time since the previous tick. */
export async function tickFocus(): Promise<FocusState> {
  const { data } = await apiClient.post<FocusState>("/api/focus/tick");
  return data;
}

/** Pause or stop: the server forgets the running timer without adding time. */
export async function stopFocus(): Promise<FocusState> {
  const { data } = await apiClient.post<FocusState>("/api/focus/stop");
  return data;
}
