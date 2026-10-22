import {
  Anchor, Bell, Bug, BookOpen, Cloud, Code, Coffee, Crown, Flag, Flame, Gem, Heart, Key, Leaf, Moon, Music, Puzzle,
  Rocket, Shield, Star, Sun, Target, Trophy, Zap, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  star: Star, flame: Flame, book: BookOpen, rocket: Rocket, leaf: Leaf, coffee: Coffee, bolt: Zap, heart: Heart,
  trophy: Trophy, moon: Moon, "moon-sticker": Moon, sun: Sun, cloud: Cloud, gem: Gem, crown: Crown, shield: Shield, target: Target,
  bug: Bug, code: Code, key: Key, flag: Flag, bell: Bell, music: Music, puzzle: Puzzle, anchor: Anchor,
};

const COLORS = ["#8b6cf0", "#ef7fa8", "#e0a526", "#3fae85", "#4f9be8", "#e8612c"];

function colorFor(code: string): string {
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return COLORS[h % COLORS.length];
}

export function StickerIcon({ code, size = 44, dim = false }: { code: string; size?: number; dim?: boolean }) {
  const key = code.toLowerCase().replace(/^sticker[_-]/, "");
  const Icon = ICONS[key] ?? Star;
  const color = colorFor(key);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-2xl border-2"
      style={{
        width: size,
        height: size,
        borderColor: color,
        background: `${color}22`,
        color,
        opacity: dim ? 0.4 : 1,
        filter: dim ? "grayscale(1)" : undefined,
      }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.4} />
    </span>
  );
}
