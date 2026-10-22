/**
 * The Checkpoint mascot. One SVG, five skins, six moods. The face also works as
 * a round avatar. Skins other than "sprout" become rewards later (UI-6).
 */
export type MascotSkin = "sprout" | "moon" | "scholar" | "astro" | "autumn";
export type MascotMood = "idle" | "happy" | "hype" | "sleepy" | "oops" | "proud";

const INK = "#2f2457";

export const MASCOT_SKINS: { id: MascotSkin; name: string; body: string; belly: string; bg: string }[] = [
  { id: "sprout", name: "Sprout", body: "#c9b6ff", belly: "#e8dfff", bg: "#efe6ff" },
  { id: "moon", name: "Moonlit", body: "#9db4ff", belly: "#d6e0ff", bg: "#dfe6ff" },
  { id: "scholar", name: "Scholar", body: "#ffd6a3", belly: "#fff0dc", bg: "#fff0dc" },
  { id: "astro", name: "Astronaut", body: "#f2efff", belly: "#ffffff", bg: "#dff2ff" },
  { id: "autumn", name: "Autumn", body: "#ffb089", belly: "#ffe0cf", bg: "#ffe4d2" },
];

const ACCESSORY: Record<MascotSkin, string> = {
  sprout: `<path d="M60 30V16" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><path d="M60 18c-14-2-20-10-18-16 12 0 20 6 18 16z" fill="#4fbf94" stroke="${INK}" stroke-width="3"/><path d="M60 18c12-2 18-10 16-16-12 0-18 6-16 16z" fill="#7fe0b8" stroke="${INK}" stroke-width="3"/>`,
  moon: `<path d="M38 36Q60 4 84 32Q64 24 38 36Z" fill="#3b4a9c" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M84 32q10 6 8 16" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="92" cy="50" r="5" fill="#ffe08a" stroke="${INK}" stroke-width="2"/>`,
  scholar: `<path d="M26 34L60 16L94 34L60 50Z" fill="#3b2a6b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M94 34V52" stroke="#f4c95d" stroke-width="3" stroke-linecap="round"/><circle cx="94" cy="54" r="4" fill="#f4c95d"/>`,
  astro: `<path d="M60 30V14" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><circle cx="60" cy="12" r="5" fill="#ef7fa8" stroke="${INK}" stroke-width="3"/>`,
  autumn: `<path d="M60 36l-9-7 4-3-3-9 8 4 4-9 4 9 8-4-3 9 4 3z" fill="#e8612c" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" transform="translate(0 -6)"/>`,
};

const OVERLAY: Partial<Record<MascotSkin, string>> = {
  scholar: `<circle cx="46" cy="68" r="11" fill="none" stroke="${INK}" stroke-width="2.5"/><circle cx="74" cy="68" r="11" fill="none" stroke="${INK}" stroke-width="2.5"/><path d="M57 68h6" stroke="${INK}" stroke-width="2.5"/>`,
  astro: `<ellipse cx="60" cy="70" rx="38" ry="34" fill="#bfe3ff" fill-opacity=".28" stroke="#fff" stroke-width="4"/><path d="M38 54q8-10 20-10" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`,
};

const star = (x: number, y: number, k: number) =>
  `<path transform="translate(${x} ${y}) scale(${k})" d="M0-8l2.4 5.2 5.6.6-4.2 3.8 1.2 5.6L0 4.2-5 7.2l1.2-5.6L-8-2.2l5.6-.6z" fill="#ffd54a" stroke="${INK}" stroke-width="1.4"/>`;

const FACE: Record<MascotMood, string> = {
  idle: `<ellipse cx="46" cy="68" rx="6" ry="8" fill="${INK}"/><ellipse cx="74" cy="68" rx="6" ry="8" fill="${INK}"/><circle cx="48" cy="65" r="2.2" fill="#fff"/><circle cx="76" cy="65" r="2.2" fill="#fff"/><path d="M54 80q6 6 12 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  happy: `<path d="M39 70q7-10 14 0M67 70q7-10 14 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M52 78q8 11 16 0z" fill="${INK}"/>`,
  hype: `${star(46, 68, 1.5)}${star(74, 68, 1.5)}<path d="M50 79q10 15 20 0z" fill="${INK}"/>${star(12, 38, 0.9)}${star(108, 52, 0.8)}`,
  sleepy: `<path d="M39 70h14M67 70h14" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><circle cx="60" cy="82" r="3.5" fill="${INK}"/><text x="88" y="36" font-size="15" font-weight="800" fill="${INK}">z</text><text x="99" y="24" font-size="11" font-weight="800" fill="${INK}">z</text>`,
  oops: `<ellipse cx="46" cy="68" rx="7" ry="9" fill="#fff" stroke="${INK}" stroke-width="2.5"/><ellipse cx="74" cy="68" rx="7" ry="9" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="47" cy="70" r="2.8" fill="${INK}"/><circle cx="73" cy="70" r="2.8" fill="${INK}"/><path d="M52 84q4-5 8 0t8 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M98 46q5 8 0 12q-5-4 0-12z" fill="#8cc5f5" stroke="${INK}" stroke-width="2"/>`,
  proud: `<path d="M39 70q7-9 14 0M67 70q7-9 14 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M52 79q8 8 16 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>${star(60, 100, 1.3)}${star(104, 40, 0.8)}${star(14, 56, 0.7)}`,
};

export const MASCOT_LINES: Record<MascotMood, string> = {
  idle: "Your garden is waiting.",
  happy: "Nice work!",
  hype: "Combo! Keep going!",
  sleepy: "Your streak needs a visit today.",
  oops: "Shake it off. Next one.",
  proud: "Level up! I am so proud.",
};

function inner(skin: MascotSkin, mood: MascotMood): string {
  const s = MASCOT_SKINS.find((x) => x.id === skin) ?? MASCOT_SKINS[0];
  return (
    `<ellipse cx="60" cy="121" rx="32" ry="6" fill="${INK}" opacity=".12"/>` +
    `<circle cx="28" cy="44" r="13" fill="${s.body}" stroke="${INK}" stroke-width="3.5"/>` +
    `<circle cx="92" cy="44" r="13" fill="${s.body}" stroke="${INK}" stroke-width="3.5"/>` +
    `<path d="M60 30c-26 0-42 16-42 42 0 26 14 44 42 44s42-18 42-44c0-26-16-42-42-42z" fill="${s.body}" stroke="${INK}" stroke-width="3.5"/>` +
    `<ellipse cx="60" cy="101" rx="22" ry="12" fill="${s.belly}"/>` +
    `<circle cx="34" cy="80" r="6" fill="#ef7fa8" opacity=".6"/><circle cx="86" cy="80" r="6" fill="#ef7fa8" opacity=".6"/>` +
    FACE[mood] +
    (OVERLAY[skin] ?? "") +
    ACCESSORY[skin]
  );
}

export function Mascot({
  skin = "sprout",
  mood = "idle",
  size = 100,
  className,
}: {
  skin?: MascotSkin;
  mood?: MascotMood;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 130"
      width={size}
      height={(size * 130) / 120}
      className={className}
      role="img"
      aria-label={`Mascot feeling ${mood}`}
      dangerouslySetInnerHTML={{ __html: inner(skin, mood) }}
    />
  );
}

/** The mascot's face in a round frame, used as the student avatar. */
export function MascotAvatar({
  skin = "sprout",
  mood = "happy",
  size = 40,
}: {
  skin?: MascotSkin;
  mood?: MascotMood;
  size?: number;
}) {
  const s = MASCOT_SKINS.find((x) => x.id === skin) ?? MASCOT_SKINS[0];
  return (
    <svg
      viewBox="12 18 96 96"
      width={size}
      height={size}
      className="shrink-0"
      style={{ borderRadius: "50%", background: s.bg, boxShadow: "0 0 0 2px #fff, 0 0 0 4px #8b6cf0" }}
      role="img"
      aria-label="Your avatar"
      dangerouslySetInnerHTML={{ __html: inner(skin, mood) }}
    />
  );
}
