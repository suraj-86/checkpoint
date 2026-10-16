import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { validateUsername } from "../../../lib/username";
import { checkUsername } from "../api/authApi";

export type UsernameState =
  | { kind: "idle" }
  | { kind: "unchanged" }
  | { kind: "invalid"; message: string }
  | { kind: "checking" }
  | { kind: "available"; message: string }
  | { kind: "taken"; message: string }
  | { kind: "limited" }
  | { kind: "error" };

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function useUsernameStatus(value: string, current?: string): UsernameState {
  const debounced = useDebounced(value, 450);
  const same = current !== undefined && value === current;
  const localError = value ? validateUsername(value) : null;
  const settled = debounced === value;
  const enabled = value !== "" && !same && !localError && settled;

  const query = useQuery({
    queryKey: ["username-check", debounced],
    queryFn: () => checkUsername(debounced),
    enabled,
    staleTime: 30_000,
    retry: false,
  });

  if (value === "") return { kind: "idle" };
  if (same) return { kind: "unchanged" };
  if (localError) return { kind: "invalid", message: localError };
  if (!settled || query.isFetching || !query.data) {
    if (query.isError && settled) {
      return isAxiosError(query.error) && query.error.response?.status === 429
        ? { kind: "limited" }
        : { kind: "error" };
    }
    return { kind: "checking" };
  }
  return query.data.available
    ? { kind: "available", message: query.data.message }
    : { kind: "taken", message: query.data.message };
}

export function blocksSubmit(state: UsernameState): boolean {
  return state.kind === "invalid" || state.kind === "taken";
}
