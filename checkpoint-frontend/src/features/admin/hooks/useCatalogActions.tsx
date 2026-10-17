import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import * as api from "../api/catalogApi";
import type { Catalog } from "../types/catalog.types";
import { messageFromError } from "../utils/format";

export const CATALOG_KEY = ["admin-catalog"];

export type Run = (action: () => Promise<Catalog>) => Promise<boolean>;

export interface Pending {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => Promise<Catalog>;
}

export function useCatalogActions() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const query = useQuery({ queryKey: CATALOG_KEY, queryFn: api.getCatalog });

  const run: Run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      const next = await action();
      queryClient.setQueryData(CATALOG_KEY, next);
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-datasets"] });
      return true;
    } catch (err) {
      setError(messageFromError(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const ask = (p: Pending) => setPending(p);

  async function confirmPending() {
    if (!pending) return;
    const action = pending.action;
    setPending(null);
    await run(action);
  }

  const dialog: ReactNode = (
    <ConfirmDialog
      open={pending !== null}
      title={pending?.title ?? ""}
      tone="warning"
      confirmLabel={pending?.confirmLabel ?? "Delete"}
      onConfirm={confirmPending}
      onCancel={() => setPending(null)}
    >
      <p>{pending?.message}</p>
    </ConfirmDialog>
  );

  return {
    catalog: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    busy,
    error,
    run,
    ask,
    dialog,
  };
}
