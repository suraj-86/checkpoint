import { isAxiosError } from "axios";
import type { ValidationResponse } from "../types/admin.types";

export function prettify(value: string): string {
  if (value === "TRUE_FALSE") return "True / false";
  const spaced = value.toLowerCase().replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function validationFromError(err: unknown): ValidationResponse | null {
  if (isAxiosError(err) && err.response?.status === 422) {
    return err.response.data as ValidationResponse;
  }
  return null;
}

export function messageFromError(err: unknown): string {
  if (isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (typeof message === "string") return message;
    if (err.code === "ERR_NETWORK") return "Cannot reach the server. Is the backend running?";
  }
  return "Something went wrong. Please try again.";
}
