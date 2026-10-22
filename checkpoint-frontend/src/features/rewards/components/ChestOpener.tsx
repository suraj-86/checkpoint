import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { messageFromError } from "../../admin/utils/format";
import { Mascot } from "../../../components/mascot/Mascot";
import { openChest } from "../api/rewardsApi";
import type { Chest, ChestOpenResult } from "../types/rewards.types";
import { asSkin } from "../hooks/useRewards";
import { ChestIcon, tierLabel } from "./ChestIcon";
import { playSound } from "../../../lib/sound";
import { StickerIcon } from "./StickerIcon";

type Phase = "closed" | "opening" | "revealed";

export function ChestOpener({ chest, onClose }: { chest: Chest; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("closed");
  const [result, setResult] = useState<ChestOpenResult | null>(null);

  const mutation = useMutation({
    mutationFn: () => openChest(chest.id),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });

  useEffect(() => {
    if (phase === "revealed") playSound("chest");
  }, [phase]);

  useEffect(() => {
    if (phase === "opening" && result) {
      const t = window.setTimeout(() => setPhase("revealed"), 700);
      return () => window.clearTimeout(t);
    }
  }, [phase, result]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function start() {
    if (phase !== "closed" || mutation.isPending) return;
    setPhase("opening");
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Open chest">
      <div className="card relative w-full max-w-sm p-6 text-center">
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500 hover:bg-slate-200">
          <X size={18} />
        </button>

        {phase !== "revealed" && (
          <>
            <h2 className="font-display text-xl font-bold text-slate-800">{tierLabel(chest.tier)} chest</h2>
            <button
              onClick={start}
              disabled={phase === "opening"}
              aria-label="Open the chest"
              className={`mx-auto mt-4 block rounded-3xl p-2 ${phase === "opening" ? "chest-shake" : "hover:-translate-y-0.5 transition"}`}
            >
              <ChestIcon tier={chest.tier} size={140} open={phase === "opening"} />
            </button>
            <p className="mt-3 text-sm font-semibold text-slate-500">{phase === "opening" ? "Opening..." : "Tap the chest to open it."}</p>
            {mutation.isError && (
              <p className="mt-3 text-sm font-bold text-red-600">
                {messageFromError(mutation.error)}{" "}
                <button
                  className="underline"
                  onClick={() => {
                    mutation.reset();
                    setPhase("closed");
                  }}
                >
                  Try again
                </button>
              </p>
            )}
          </>
        )}

        {phase === "revealed" && result && (
          <div className="reveal-pop">
            <p className="text-sm font-semibold text-slate-500">{result.duplicateConvertedToBoost ? "You already had this one" : "You found"}</p>
            <div className="mt-3 flex justify-center">
              {result.kind === "SKIN" ? (
                <Mascot skin={asSkin(result.code)} mood="proud" size={120} />
              ) : result.kind === "STICKER" ? (
                <StickerIcon code={result.code} size={96} />
              ) : (
                <span className="grid h-24 w-24 place-items-center rounded-3xl border-2 border-amber-400 bg-amber-100 font-display text-2xl font-extrabold text-amber-800">
                  XP
                </span>
              )}
            </div>
            <h2 className="mt-3 font-display text-2xl font-extrabold text-slate-800">{result.name}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {result.duplicateConvertedToBoost ? `Turned into an XP boost: ${result.label}` : result.label}
            </p>
            <button onClick={onClose} className="btn-primary mt-5 w-full">
              Nice!
            </button>
          </div>
        )}
        {phase === "revealed" && !result && <p className="text-sm text-slate-500">Something went wrong.</p>}
      </div>
    </div>
  );
}
