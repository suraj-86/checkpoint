import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Chip } from "../../../components/ui/Chip";
import { useToast } from "../../../components/ui/Toast";
import { inputClass } from "../../../components/ui/styles";
import { getAdminRewards, updateMilestones, updateOdds, updateRewardItem } from "../../rewards/api/rewardsApi";
import type { AdminMilestone, AdminOdds, AdminRewardItem } from "../../rewards/types/rewards.types";
import { messageFromError } from "../utils/format";

const TIERS = ["BRONZE", "SILVER", "GOLD"];
const num = (v: string) => (v.trim() === "" ? 0 : Number(v));

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold text-slate-800">{value.toLocaleString()}</p>
    </div>
  );
}

function ItemRow({ item, onSaved }: { item: AdminRewardItem; onSaved: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(item.name);
  const [enabled, setEnabled] = useState(item.enabled);
  useEffect(() => {
    setName(item.name);
    setEnabled(item.enabled);
  }, [item.name, item.enabled]);

  const mutation = useMutation({
    mutationFn: () => updateRewardItem(item.id, { enabled, name: name.trim() }),
    onSuccess: () => {
      toast("Saved", "good");
      onSaved();
    },
    onError: (e) => toast(messageFromError(e), "bad"),
  });
  const dirty = name !== item.name || enabled !== item.enabled;

  return (
    <tr className="border-t border-slate-200">
      <td className="py-2 pr-3 text-xs font-bold text-slate-500">{item.code}</td>
      <td className="py-2 pr-3">
        <input className={inputClass} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-label={`Name for ${item.code}`} />
      </td>
      <td className="py-2 pr-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enabled
        </label>
      </td>
      <td className="py-2 pr-3 text-sm font-semibold text-slate-600">{item.ownedCount}</td>
      <td className="py-2 text-right">
        <button className="btn-secondary !py-1" disabled={!dirty || !name.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
          Save
        </button>
      </td>
    </tr>
  );
}

function ItemsCard({ items, onSaved }: { items: AdminRewardItem[]; onSaved: () => void }) {
  const [kind, setKind] = useState<"SKIN" | "STICKER">("SKIN");
  const shown = items.filter((i) => i.kind.toUpperCase() === kind);
  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-slate-800">Items</h2>
        <div className="flex gap-2" role="group" aria-label="Item kind">
          {(["SKIN", "STICKER"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={`rounded-full border-2 px-4 py-1 text-sm font-bold ${
                kind === k ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 bg-slate-100 text-slate-600"
              }`}
            >
              {k === "SKIN" ? "Skins" : "Stickers"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              <th className="pb-2 pr-3">Code</th>
              <th className="pb-2 pr-3">Name</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Owned by</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((i) => (
              <ItemRow key={i.id} item={i} onSaved={onSaved} />
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="mt-2 text-sm text-slate-500">Nothing here yet.</p>}
      </div>
    </section>
  );
}

function OddsCard({ odds, onSaved }: { odds: AdminOdds[]; onSaved: () => void }) {
  const toast = useToast();
  const [rows, setRows] = useState<AdminOdds[]>(odds);
  useEffect(() => setRows(odds), [odds]);

  const sum = (r: AdminOdds) => r.stickerPct + r.boostPct + r.skinPct;
  const valid = rows.every((r) => sum(r) === 100 && [r.stickerPct, r.boostPct, r.skinPct].every((n) => Number.isInteger(n) && n >= 0));
  const mutation = useMutation({
    mutationFn: () => updateOdds(rows),
    onSuccess: () => {
      toast("Odds saved", "good");
      onSaved();
    },
    onError: (e) => toast(messageFromError(e), "bad"),
  });

  function set(i: number, key: "stickerPct" | "boostPct" | "skinPct", v: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: num(v) } : r)));
  }

  return (
    <section className="card p-5">
      <h2 className="font-display text-xl font-bold text-slate-800">Chest odds</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">Each chest tier must add up to exactly 100%.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <thead>
            <tr className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              <th className="pb-2 pr-3">Tier</th>
              <th className="pb-2 pr-3">Sticker %</th>
              <th className="pb-2 pr-3">XP boost %</th>
              <th className="pb-2 pr-3">Skin %</th>
              <th className="pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.tier} className="border-t border-slate-200">
                <td className="py-2 pr-3 text-sm font-bold text-slate-800">{r.tier.charAt(0) + r.tier.slice(1).toLowerCase()}</td>
                {(["stickerPct", "boostPct", "skinPct"] as const).map((k) => (
                  <td key={k} className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className={`${inputClass} !w-24`}
                      value={r[k]}
                      onChange={(e) => set(i, k, e.target.value)}
                      aria-label={`${r.tier} ${k}`}
                    />
                  </td>
                ))}
                <td className="py-2">
                  <Chip tone={sum(r) === 100 ? "good" : "bad"}>{sum(r)}%</Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn-primary mt-3" disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
        Save odds
      </button>
    </section>
  );
}

function MilestonesCard({ milestones, onSaved }: { milestones: AdminMilestone[]; onSaved: () => void }) {
  const toast = useToast();
  const [rows, setRows] = useState<AdminMilestone[]>(milestones);
  useEffect(() => setRows(milestones), [milestones]);

  const days = rows.map((r) => r.days);
  const valid = rows.every((r) => Number.isInteger(r.days) && r.days > 0) && new Set(days).size === days.length;
  const mutation = useMutation({
    mutationFn: () => updateMilestones([...rows].sort((a, b) => a.days - b.days)),
    onSuccess: () => {
      toast("Milestones saved", "good");
      onSaved();
    },
    onError: (e) => toast(messageFromError(e), "bad"),
  });

  function patch(i: number, p: Partial<AdminMilestone>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  }

  return (
    <section className="card p-5">
      <h2 className="font-display text-xl font-bold text-slate-800">Streak milestones</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">A student gets one chest the first time they reach each day count in a streak.</p>
      <ul className="mt-3 grid gap-2">
        {rows.map((r, i) => (
          <li key={i} className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={1}
              className={`${inputClass} !w-24`}
              value={r.days}
              onChange={(e) => patch(i, { days: num(e.target.value) })}
              aria-label="Streak days"
            />
            <span className="text-sm font-semibold text-slate-500">days</span>
            <select className={`${inputClass} !w-32`} value={r.tier.toUpperCase()} onChange={(e) => patch(i, { tier: e.target.value })} aria-label="Chest tier">
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={r.enabled} onChange={(e) => patch(i, { enabled: e.target.checked })} /> Enabled
            </label>
            <button
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"
              aria-label="Remove milestone"
              onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      {!valid && <p className="mt-2 text-sm font-bold text-red-600">Each milestone needs a different whole number of days above zero.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={() => setRows((prev) => [...prev, { days: 0, tier: "BRONZE", enabled: true }])}>
          <Plus size={15} /> Add milestone
        </button>
        <button className="btn-primary" disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
          Save milestones
        </button>
      </div>
    </section>
  );
}

export function RewardsAdminPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin-rewards"], queryFn: getAdminRewards, retry: false });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-semibold text-slate-500">Chests, skins, stickers and streak milestones</p>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold leading-tight text-slate-800">Rewards</h1>
      </div>

      {isLoading && <p className="text-slate-500">Loading...</p>}
      {isError && <div className="card p-5 text-sm font-semibold text-red-600">Could not load rewards. Try refreshing.</div>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Chests granted" value={data.stats.chestsGranted} />
            <Stat label="Chests opened" value={data.stats.chestsOpened} />
            <Stat label="Boosts used" value={data.stats.boostsUsed} />
          </div>
          <ItemsCard items={data.items} onSaved={refresh} />
          <OddsCard odds={data.odds} onSaved={refresh} />
          <MilestonesCard milestones={data.milestones} onSaved={refresh} />
        </>
      )}
    </div>
  );
}
