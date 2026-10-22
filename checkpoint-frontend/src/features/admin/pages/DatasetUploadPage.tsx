import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { importDataset, validateDataset } from "../api/adminApi";
import * as catalogApi from "../api/catalogApi";
import type { Catalog } from "../types/catalog.types";
import { EMPTY_TARGET, TargetPicker, targetReady, type Target } from "../components/TargetPicker";
import { useCatalogActions } from "../hooks/useCatalogActions";
import type { ImportResponse, UploadPayload, ValidationResponse } from "../types/admin.types";
import { messageFromError, validationFromError } from "../utils/format";

function isFullyValid(v: ValidationResponse): boolean {
  return v.invalidCount === 0 && v.datasetErrors.length === 0;
}

function describePayload(payload: UploadPayload) {
  const dataset = payload.dataset as { name?: unknown; version?: unknown } | undefined;
  return {
    name: typeof dataset?.name === "string" ? dataset.name : "(missing)",
    version: typeof dataset?.version === "string" ? dataset.version : "(missing)",
    questionCount: Array.isArray(payload.questions) ? payload.questions.length : 0,
  };
}

export function DatasetUploadPage() {
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const { catalog, run, error: catalogError } = useCatalogActions();
  const [target, setTarget] = useState<Target>(EMPTY_TARGET);
  const preselected = useRef(false);

  // Preselect from deep links such as /admin/datasets/upload?topic=... (once, when the catalog arrives).
  useEffect(() => {
    if (!catalog || preselected.current) return;
    preselected.current = true;
    const topicParam = params.get("topic");
    const subjectParam = params.get("subject");
    const streamParam = params.get("stream") ?? "";
    if (topicParam) {
      const owner = catalog.subjects.find((s) => s.topics.some((t) => t.id === topicParam));
      if (owner) {
        setTarget({ streamId: streamParam, subjectId: owner.id, topicId: topicParam, mode: "topic" });
        return;
      }
    }
    if (subjectParam && catalog.subjects.some((s) => s.id === subjectParam)) {
      setTarget({ streamId: streamParam, subjectId: subjectParam, topicId: "", mode: "topic" });
      return;
    }
    if (streamParam) setTarget({ ...EMPTY_TARGET, streamId: streamParam });
  }, [catalog, params]);

  // A different target changes what the validator checks, so an old validation no longer counts.
  const targetKey = `${target.mode}:${target.topicId}:${target.subjectId}`;
  useEffect(() => {
    setValidation(null);
  }, [targetKey]);

  async function createTopicInline(subjectId: string, name: string): Promise<string | null> {
    const box: { next?: Catalog } = {};
    const ok = await run(async () => {
      box.next = await catalogApi.createTopicInSubject({ subjectId, name });
      return box.next;
    });
    if (!ok) return null;
    const created = box.next?.subjects
      .find((s) => s.id === subjectId)
      ?.topics.find((t) => t.name.toLowerCase() === name.toLowerCase());
    return created?.id ?? null;
  }

  function withTarget(base: UploadPayload): UploadPayload {
    const { topicId: _t, subjectId: _s, ...rest } = base;
    void _t;
    void _s;
    return target.mode === "topic" ? { ...rest, topicId: target.topicId } : { ...rest, subjectId: target.subjectId };
  }

  const [fileKey, setFileKey] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [payload, setPayload] = useState<UploadPayload | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  function resetAll() {
    setFileKey((k) => k + 1);
    setFileName(null);
    setPayload(null);
    setParseError(null);
    setValidation(null);
    setImportResult(null);
    setServerError(null);
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPayload(null);
    setParseError(null);
    setValidation(null);
    setImportResult(null);
    setServerError(null);
    setFileName(file?.name ?? null);
    if (!file) return;

    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setParseError("The file must contain a JSON object with 'dataset' and 'questions'.");
        return;
      }
      setPayload(parsed as UploadPayload);
    } catch (err) {
      setParseError(`This file is not valid JSON: ${err instanceof Error ? err.message : "parse error"}`);
    }
  }

  const validateMutation = useMutation({
    mutationFn: validateDataset,
    onMutate: () => {
      setServerError(null);
      setImportResult(null);
    },
    onSuccess: (result) => setValidation(result),
    onError: (err) => {
      setValidation(null);
      setServerError(messageFromError(err));
    },
  });

  const importMutation = useMutation({
    mutationFn: importDataset,
    onMutate: () => setServerError(null),
    onSuccess: (result) => {
      setImportResult(result);
      setValidation(null);
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-datasets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["student-catalog"] });
    },
    onError: (err) => {
      const failed = validationFromError(err);
      if (failed) {
        setValidation(failed);
        setServerError("Import was rejected and nothing was saved. Fix the problems below and validate again.");
      } else {
        setServerError(messageFromError(err));
      }
    },
  });

  const summary = payload ? describePayload(payload) : null;
  const ready = targetReady(target);
  const canImport = payload !== null && ready && validation !== null && isFullyValid(validation);
  const busy = validateMutation.isPending || importMutation.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-[clamp(26px,3.5vw,36px)] font-extrabold text-slate-800">Upload dataset</h1>

      {importResult ? (
        <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-5">
          <h2 className="font-semibold text-green-800">Import complete</h2>
          <p className="text-sm text-green-800">
            {importResult.datasetName} v{importResult.datasetVersion}: {importResult.totalProcessed} questions processed,{" "}
            <strong>{importResult.created} created</strong>, <strong>{importResult.updated} updated</strong>.
          </p>
          <p className="text-sm text-green-800">
            Saved to: <strong>{importResult.target}</strong>
          </p>
          <div className="flex gap-3">
            <Link
              to={target.mode === "topic" && target.topicId ? `/admin/questions?topic=${target.topicId}` : target.subjectId ? `/admin/questions?subject=${target.subjectId}` : "/admin/questions"}
              className="btn-primary"
            >
              View questions
            </Link>
            <Link
              to="/admin/datasets"
              className="btn-secondary"
            >
              Dataset history
            </Link>
            <button
              onClick={resetAll}
              className="btn-secondary"
            >
              Upload another
            </button>
          </div>
        </div>
      ) : (
        <>
          {catalogError && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{catalogError}</p>}
          {catalog ? (
            <TargetPicker catalog={catalog} target={target} onChange={setTarget} onCreateTopic={createTopicInline} disabled={busy} />
          ) : (
            <p className="text-sm text-slate-500">Loading subjects and topics...</p>
          )}

          <div className="card p-5">
            <label className="mb-2 block text-sm font-extrabold text-slate-700">Dataset file (.json)</label>
            <input
              key={fileKey}
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              className="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-xl file:border-2 file:border-indigo-700 file:bg-indigo-500 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-indigo-600"
            />
            {parseError && <p className="mt-3 text-sm text-red-600">{parseError}</p>}

            {summary && (
              <div className="mt-4 rounded-2xl bg-slate-100 p-3 text-sm text-slate-700">
                <p className="text-xs text-slate-500">{fileName}</p>
                <p>
                  <span className="font-medium">{summary.name}</span> · version {summary.version} ·{" "}
                  {summary.questionCount} questions
                </p>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => payload && validateMutation.mutate(withTarget(payload))}
                disabled={!payload || !ready || busy}
                className="btn-primary"
              >
                {validateMutation.isPending ? "Validating..." : "Validate"}
              </button>
              <button
                onClick={() => payload && importMutation.mutate(withTarget(payload))}
                disabled={!canImport || busy}
                className="btn-primary"
              >
                {importMutation.isPending ? "Importing..." : "Import"}
              </button>
              {fileName && (
                <button
                  onClick={resetAll}
                  disabled={busy}
                  className="btn-secondary"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {ready ? "" : "Choose where the dataset goes first. "}Import is only enabled after a clean validation. Import is all-or-nothing: if anything fails, nothing is saved.
            </p>
          </div>

          {serverError && (
            <div className="rounded-2xl border-2 border-rose-400 bg-rose-500/10 p-3 text-sm font-semibold text-rose-700">{serverError}</div>
          )}

          {validation && <ValidationReport result={validation} />}
        </>
      )}
    </div>
  );
}

function ValidationReport({ result }: { result: ValidationResponse }) {
  const ok = isFullyValid(result);

  return (
    <div className="space-y-4 card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Validation result</h2>
        <span
          className={`rounded-full px-3 py-0.5 text-xs font-medium ${
            ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {ok ? "Ready to import" : "Problems found"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-slate-100 p-3">
          <p className="text-xs text-slate-500">Total</p>
          <p className="font-display text-xl font-bold text-slate-800">{result.total}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3">
          <p className="text-xs text-slate-500">Valid</p>
          <p className="text-lg font-semibold text-green-600">{result.validCount}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3">
          <p className="text-xs text-slate-500">Invalid</p>
          <p className="text-lg font-semibold text-red-600">{result.invalidCount}</p>
        </div>
      </div>

      {result.datasetErrors.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-medium text-slate-700">Dataset problems</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
            {result.datasetErrors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {result.errors.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Invalid questions</h3>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {result.errors.map((e, i) => (
              <div key={`${e.externalId}-${i}`} className="rounded-md border border-red-100 bg-red-50 p-3">
                <p className="text-sm font-medium text-slate-800">{e.externalId}</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-red-700">
                  {e.messages.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
