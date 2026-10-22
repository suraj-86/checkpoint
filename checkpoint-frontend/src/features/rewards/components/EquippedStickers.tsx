import { StickerIcon } from "./StickerIcon";
import { useRewards } from "../hooks/useRewards";

export function EquippedStickers({ size = 36 }: { size?: number }) {
  const { data } = useRewards();
  const owned = new Set((data?.stickers ?? []).filter((s) => s.owned).map((s) => s.code));
  const shown = (data?.equippedStickers ?? []).filter((c) => owned.has(c)).slice(0, 3);
  if (shown.length === 0) return null;
  return (
    <div className="mt-3 flex justify-center gap-2" aria-label="Equipped stickers">
      {shown.map((code) => (
        <StickerIcon key={code} code={code} size={size} />
      ))}
    </div>
  );
}
