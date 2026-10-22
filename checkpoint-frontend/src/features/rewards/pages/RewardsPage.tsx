import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Lock, Zap } from "lucide-react";
import { Mascot } from "../../../components/mascot/Mascot";
import { Chip } from "../../../components/ui/Chip";
import { useToast } from "../../../components/ui/Toast";
import { messageFromError } from "../../admin/utils/format";
import { equip } from "../api/rewardsApi";
import { ChestIcon, tierLabel } from "../components/ChestIcon";
import { ChestOpener } from "../components/ChestOpener";
import { StickerIcon } from "../components/StickerIcon";
import { asSkin, useRewards } from "../hooks/useRewards";
import type { Chest, Collectible, RewardsState } from "../types/rewards.types";

const MAX_STICKERS = 3;
const DEFAULT_SKIN: Collectible = { code: "sprout", name: "Sprout", owned: true };

export function RewardsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading, isError } = useRewards();
  const [opening, setOpening] = useState<Chest | null>(null);

  const equipMutation = useMutation({
    mutationFn: equip,
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ["rewards"] });
      const prev = queryClient.getQueryData<RewardsState>(["rewards"]);
      if (prev) queryClient.setQueryData<RewardsState>(["rewards"], { ...prev, equippedSkin: next.skin, equippedStickers: next.stickers });
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["rewards"], ctx.prev);
      toast(messageFromError(err), "bad");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["rewards"] }),
  });

  if (isLoading) return <p className="text-slate-500">Loading...</p>;
  if (isError || !data) {
    return (
      <div className="grid gap-4">
        <Header />
        <div className="card p-6 text-sm font-semibold text-slate-500">Rewards are not available right now. Try again in a moment.</div>
      </div>
    );
  }

  const skins = data.skins.some((s) => s.code === DEFAULT_SKIN.code) ? data.skins : [DEFAULT_SKIN, ...data.skins];
  const equippedSkin = data.equippedSkin ?? "sprout";
  const ownedStickers = new Set(data.stickers.filter((s) => s.owned).map((s) => s.code));
  const equippedStickers = data.equippedStickers.filter((c) => ownedStickers.has(c));

  function pickSkin(code: string) {
    equipMutation.mutate({ skin: code === "sprout" ? null : code, stickers: equippedStickers });
  }

  function toggleSticker(code: string) {
    const has = equippedStickers.includes(code);
    if (!has && equippedStickers.length >= MAX_STICKERS) {
      toast(`You can show up to ${MAX_STICKERS} stickers. Remove one first.`, "info");
      return;
    }
    const next = has ? equippedStickers.filter((c) => c !== code) : [...equippedStickers, code];
    equipMutation.mutate({ skin: data!.equippedSkin, stickers: next });
  }

  const ownedSkinCount = skins.filter((s) => s.owned).length;

  return (
    <div className="grid gap-5">
      <Header />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5" aria-label="Chests">
          <h2 className="font-display text-xl font-bold text-slate-800">Your chests</h2>
          {data.chests.length === 0 ? (
            <p className="mt-3 text-sm font-semibold text-slate-500">
              No chests yet. Finish a session with 10 or more answers and a strong score, or keep a streak going, and one will show up here.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.chests.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setOpening(c)}
                    className="grid w-full justify-items-center gap-1 rounded-2xl border-2 border-slate-300 bg-slate-100 p-3 transition hover:-translate-y-0.5 hover:border-indigo-400"
                  >
                    <ChestIcon tier={c.tier} size={72} />
                    <b className="text-sm text-slate-800">{tierLabel(c.tier)}</b>
                    <span className="text-xs font-semibold text-slate-500">Tap to open</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card grid content-start gap-3 p-5" aria-label="XP boosts">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-slate-800">
            <Zap size={18} className="text-amber-500" /> XP boost
          </h2>
          {data.activeBoost ? (
            <div className="rounded-2xl border-2 border-amber-400 bg-amber-100 p-3">
              <b className="text-amber-900">{data.activeBoost.label}</b>
              <p className="mt-1 text-xs font-semibold text-amber-800">Applies to your next session that earns XP.</p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-500">No boost active. Chests sometimes hold one.</p>
          )}
          {data.queuedBoosts.length > 0 && (
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Waiting</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {data.queuedBoosts.map((b) => (
                  <Chip key={b.id} tone="warn">
                    {b.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="card p-5" aria-label="Mascot skins">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-bold text-slate-800">Mascot skins</h2>
          <span className="text-sm font-semibold text-slate-500">
            {ownedSkinCount} of {skins.length} collected
          </span>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {skins.map((s) => {
            const active = equippedSkin === s.code;
            return (
              <li key={s.code}>
                <button
                  disabled={!s.owned || equipMutation.isPending}
                  onClick={() => pickSkin(s.code)}
                  aria-pressed={active}
                  className={`relative grid w-full justify-items-center gap-1 rounded-2xl border-2 p-3 transition ${
                    active ? "border-indigo-500 bg-indigo-100" : "border-slate-300 bg-slate-100"
                  } ${s.owned ? "hover:-translate-y-0.5 hover:border-indigo-400" : "cursor-not-allowed"}`}
                >
                  <div style={{ opacity: s.owned ? 1 : 0.35, filter: s.owned ? undefined : "grayscale(1)" }}>
                    <Mascot skin={asSkin(s.code)} mood={active ? "happy" : "idle"} size={80} />
                  </div>
                  <b className="text-sm text-slate-800">{s.name}</b>
                  <span className="text-xs font-semibold text-slate-500">
                    {active ? "Equipped" : s.owned ? "Tap to equip" : "Locked"}
                  </span>
                  {active && <Check size={16} className="absolute right-2 top-2 text-indigo-600" />}
                  {!s.owned && <Lock size={14} className="absolute right-2 top-2 text-slate-400" />}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card p-5" aria-label="Stickers">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-bold text-slate-800">Stickers</h2>
          <span className="text-sm font-semibold text-slate-500">
            {ownedStickers.size} of {data.stickers.length} collected, {equippedStickers.length}/{MAX_STICKERS} shown on your profile
          </span>
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {data.stickers.map((s) => {
            const active = equippedStickers.includes(s.code);
            return (
              <li key={s.code}>
                <button
                  disabled={!s.owned || equipMutation.isPending}
                  onClick={() => toggleSticker(s.code)}
                  aria-pressed={active}
                  aria-label={`${s.name}${s.owned ? "" : " (locked)"}`}
                  className={`grid w-full justify-items-center gap-1.5 rounded-2xl border-2 p-3 transition ${
                    active ? "border-indigo-500 bg-indigo-100" : "border-slate-300 bg-slate-100"
                  } ${s.owned ? "hover:-translate-y-0.5 hover:border-indigo-400" : "cursor-not-allowed"}`}
                >
                  <StickerIcon code={s.code} size={44} dim={!s.owned} />
                  <span className="max-w-full truncate text-xs font-bold text-slate-700">{s.owned ? s.name : "???"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {opening && <ChestOpener chest={opening} onClose={() => setOpening(null)} />}
    </div>
  );
}

function Header() {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-500">Chests, skins and stickers</p>
      <h1 className="font-display text-[clamp(28px,4vw,40px)] font-extrabold leading-tight text-slate-800">Rewards</h1>
    </div>
  );
}
