import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Gift, Pause, Play, Square } from "lucide-react";
import { Mascot, type MascotMood } from "../../../components/mascot/Mascot";
import { Chip } from "../../../components/ui/Chip";
import { useToast } from "../../../components/ui/Toast";
import { playSound } from "../../../lib/sound";
import { saveSettings, type UserSettings } from "../../../lib/settingsApi";
import { messageFromError } from "../../admin/utils/format";
import { ChestIcon, tierLabel } from "../../rewards/components/ChestIcon";
import { useEquippedSkin } from "../../rewards/hooks/useRewards";
import { getFocus, stopFocus, tickFocus } from "../api/focusApi";
import type { FocusDay, FocusState } from "../types/focus.types";

const TICK_MS = 30_000;
const PRESETS = [30, 60, 120, 180, 300];
const MIN_TARGET = 15;
const MAX_TARGET = 720;
const MIN_REWARD_TARGET = 30;

type Status = "idle" | "running" | "paused";

const pad = (n: number) => String(n).padStart(2, "0");

function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function duration(totalSeconds: number): string {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const targetLabel = (minutes: number) => duration(minutes * 60);

function dayLetter(day: string): string {
  const d = new Date(`${day}T00:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { weekday: "short" });
}

function Ring({ fraction, children }: { fraction: number; children: React.ReactNode }) {
  const r = 108;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]">
      <svg viewBox="0 0 260 260" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="130" cy="130" r={r} fill="none" strokeWidth="16" style={{ stroke: "rgb(var(--line))" }} opacity="0.55" />
        <circle
          cx="130"
          cy="130"
          r={r}
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - f)}
          className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
          style={{ stroke: f >= 1 ? "#2f9e76" : "rgb(var(--pri))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

function WeekBars({ days, targetSeconds }: { days: FocusDay[]; targetSeconds: number }) {
  const max = Math.max(targetSeconds, ...days.map((d) => d.seconds), 1);
  const targetPct = Math.min(100, (targetSeconds / max) * 100);
  return (
    <div>
      <div className="relative flex h-36 items-end gap-2">
        <div
          className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-slate-300"
          style={{ bottom: `${targetPct}%` }}
          aria-hidden="true"
        />
        {days.map((d) => {
          const pct = d.seconds === 0 ? 3 : Math.max(6, (d.seconds / max) * 100);
          return (
            <div key={d.day} className="flex h-full flex-1 items-end" title={`${d.day}: ${duration(d.seconds)}${d.targetMet ? " (target met)" : ""}`}>
              <div
                className="w-full rounded-t-lg"
                style={{
                  height: `${pct}%`,
                  background: d.targetMet ? "#2f9e76" : d.seconds > 0 ? "rgb(var(--pri))" : "rgb(var(--line))",
                  opacity: d.seconds === 0 ? 0.5 : 1,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-2">
        {days.map((d) => (
          <span key={d.day} className="flex-1 text-center text-[11px] font-bold text-slate-500">
            {dayLetter(d.day)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function FocusPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const skin = useEquippedSkin();

  const { data, isLoading, isError } = useQuery({ queryKey: ["focus"], queryFn: getFocus, retry: false });

  const [status, setStatus] = useState<Status>("idle");
  const [visible, setVisible] = useState(() => (typeof document === "undefined" ? true : document.visibilityState !== "hidden"));
  /** Seconds counted on this page since the last server answer. */
  const [extra, setExtra] = useState(0);
  const [reward, setReward] = useState<{ id: string; tier: string } | null>(null);
  const [custom, setCustom] = useState("");

  const accept = useCallback(
    (next: FocusState) => {
      queryClient.setQueryData(["focus"], next);
      setExtra(0);
      if (next.rewardChest) {
        setReward(next.rewardChest);
        playSound("chest");
        queryClient.invalidateQueries({ queryKey: ["rewards"] });
      }
    },
    [queryClient]
  );

  const tick = useMutation({ mutationFn: tickFocus, onSuccess: accept });
  const [saveFailed, setSaveFailed] = useState(false);
  const tickRef = useRef(tick.mutate);
  tickRef.current = tick.mutate;

  // Tab visibility: time only counts while the tab is open.
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  // While running and visible: ping now, then every 30 seconds, and count seconds locally.
  useEffect(() => {
    if (status !== "running" || !visible) return;
    tickRef.current();
    const ping = window.setInterval(() => tickRef.current(), TICK_MS);
    const second = window.setInterval(() => setExtra((e) => e + 1), 1000);
    return () => {
      window.clearInterval(ping);
      window.clearInterval(second);
    };
  }, [status, visible]);

  // Leaving the page ends the timer on the server side too (it also expires on its own after a gap).
  useEffect(() => {
    return () => {
      stopFocus().catch(() => undefined);
    };
  }, []);

  const targetMutation = useMutation({
    mutationFn: (minutes: number) => saveSettings({ dailyFocusMinutes: minutes }),
    onSuccess: (result: UserSettings) => {
      queryClient.setQueryData(["settings"], result);
      queryClient.invalidateQueries({ queryKey: ["focus"] });
      toast("Daily focus target saved.", "good");
    },
    onError: (error) => toast(messageFromError(error), "bad"),
  });

  function pickTarget(minutes: number) {
    if (minutes < MIN_TARGET || minutes > MAX_TARGET || minutes === data?.targetMinutes) return;
    targetMutation.mutate(minutes);
  }

  function submitCustom() {
    const minutes = Math.round(Number(custom));
    if (!Number.isFinite(minutes) || minutes < MIN_TARGET || minutes > MAX_TARGET) {
      toast(`Enter between ${MIN_TARGET} and ${MAX_TARGET} minutes.`, "bad");
      return;
    }
    pickTarget(minutes);
    setCustom("");
  }

  if (isLoading) {
    return <p className="text-slate-500">Loading...</p>;
  }

  if (isError || !data) {
    return (
      <div className="grid gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">Study without distractions</p>
          <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold leading-tight text-slate-800">Focus</h1>
        </div>
        <div className="card p-5 text-sm font-semibold text-slate-600">Focus is not available right now. Try again in a little while.</div>
      </div>
    );
  }

  const targetSeconds = data.targetMinutes * 60;
  const shown = data.todaySeconds + (status === "running" ? extra : 0);
  const reached = data.targetReached || shown >= targetSeconds;
  const remaining = Math.max(0, targetSeconds - shown);

  const mood: MascotMood = reached ? "proud" : status === "running" ? "happy" : status === "paused" ? "sleepy" : "idle";
  const line = reached
    ? "You hit your target!"
    : status === "running"
      ? visible
        ? "Focus mode on."
        : "Come back to this tab to keep counting."
      : status === "paused"
        ? "Paused. Take a breath."
        : "Deep breath. Start when you are ready.";

  function start() {
    setStatus("running");
  }

  /** Count the last seconds, then tell the server the timer is no longer running. */
  async function flush(next: Status) {
    const wasCounting = status === "running" && visible;
    setStatus(next);
    try {
      if (wasCounting) accept(await tickFocus());
      accept(await stopFocus());
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }

  const pause = () => void flush("paused");
  const finish = () => void flush("idle");

  const streak = data.streakDays;

  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">Study without distractions</p>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold leading-tight text-slate-800">Focus</h1>
      </div>

      {reward && (
        <div className="hero-card flex flex-wrap items-center gap-4 p-5">
          <ChestIcon tier={reward.tier} size={72} open />
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-extrabold text-white">Target reached!</p>
            <p className="text-sm font-bold text-white/95">You earned a {tierLabel(reward.tier)} chest for today&apos;s focus.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/rewards" className="btn-white">
              <Gift size={16} />
              Open it
            </Link>
            <button onClick={() => setReward(null)} className="btn-white !bg-transparent !text-white !shadow-none" aria-label="Dismiss">
              Later
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="card grid content-start gap-5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Mascot skin={skin} mood={mood} size={64} />
            <p className="text-sm font-bold text-slate-700" aria-live="polite">
              {line}
            </p>
          </div>

          <Ring fraction={targetSeconds === 0 ? 0 : shown / targetSeconds}>
            <p className="font-display text-[clamp(34px,9vw,52px)] font-extrabold tabular-nums leading-none text-slate-800" aria-label="Time studied today">
              {clock(shown)}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {duration(shown)} of {targetLabel(data.targetMinutes)}
            </p>
            <p className="mt-0.5 text-xs font-bold text-slate-500">{reached ? "Target reached" : `${duration(remaining)} to go`}</p>
          </Ring>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {status === "idle" && (
              <button onClick={start} className="btn-primary !px-8 !py-3 !text-base">
                <Play size={18} />
                Start
              </button>
            )}
            {status === "running" && (
              <>
                <button onClick={pause} className="btn-primary !px-6 !py-3">
                  <Pause size={18} />
                  Pause
                </button>
                <button onClick={finish} className="btn-secondary !px-6 !py-3">
                  <Square size={16} />
                  Stop
                </button>
              </>
            )}
            {status === "paused" && (
              <>
                <button onClick={start} className="btn-primary !px-6 !py-3">
                  <Play size={18} />
                  Resume
                </button>
                <button onClick={finish} className="btn-secondary !px-6 !py-3">
                  <Square size={16} />
                  Stop
                </button>
              </>
            )}
          </div>

          {status === "running" && !visible && (
            <p className="rounded-2xl bg-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700">
              Time only counts while this tab is open. It resumes when you come back.
            </p>
          )}
          {(tick.isError || saveFailed) && (
            <p className="text-center text-sm font-semibold text-red-600">Could not reach the server. Your last saved time is shown.</p>
          )}
        </div>

        <div className="grid content-start gap-4">
          <div className="card grid gap-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b className="text-sm text-slate-800">Daily target</b>
              {data.rewarded ? <Chip tone="good">Chest earned today</Chip> : reached ? <Chip tone="good">Target reached</Chip> : <Chip tone="neutral">{targetLabel(data.targetMinutes)}</Chip>}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Daily focus target">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  onClick={() => pickTarget(m)}
                  aria-pressed={data.targetMinutes === m}
                  disabled={targetMutation.isPending}
                  className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${
                    data.targetMinutes === m
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-slate-300 bg-slate-100 text-slate-600 hover:border-indigo-400"
                  }`}
                >
                  {targetLabel(m)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="focus-custom" className="sr-only">
                Custom target in minutes
              </label>
              <input
                id="focus-custom"
                type="number"
                inputMode="numeric"
                min={MIN_TARGET}
                max={MAX_TARGET}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitCustom()}
                placeholder={`Custom minutes (${MIN_TARGET} to ${MAX_TARGET})`}
                className="min-w-0 flex-1 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              />
              <button onClick={submitCustom} disabled={targetMutation.isPending || custom === ""} className="btn-secondary">
                Set
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Reach your target to earn a chest, once a day. Rewards need a target of at least {MIN_REWARD_TARGET} minutes, and bigger targets earn better chests.
            </p>
          </div>

          <div className="card grid gap-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <b className="text-sm text-slate-800">Last 7 days</b>
              <Chip tone={streak > 0 ? "warn" : "neutral"}>
                <Flame size={12} />
                {streak} {streak === 1 ? "day" : "days"} streak
              </Chip>
            </div>
            <WeekBars days={data.last7Days} targetSeconds={targetSeconds} />
            <p className="text-xs text-slate-500">Green bars hit the target. The dashed line is today&apos;s target.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
