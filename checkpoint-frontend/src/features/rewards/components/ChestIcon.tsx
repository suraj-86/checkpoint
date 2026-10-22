const TIER_COLORS: Record<string, { lid: string; body: string }> = {
  BRONZE: { lid: "#d99a62", body: "#b9773f" },
  SILVER: { lid: "#cfd6e4", body: "#9aa5bb" },
  GOLD: { lid: "#f7d56a", body: "#e0a526" },
};

export function tierLabel(tier: string): string {
  const t = tier.toUpperCase();
  return t.charAt(0) + t.slice(1).toLowerCase();
}

export function ChestIcon({ tier, size = 72, open = false }: { tier: string; size?: number; open?: boolean }) {
  const c = TIER_COLORS[tier.toUpperCase()] ?? TIER_COLORS.BRONZE;
  const ink = "#2f2457";
  return (
    <svg viewBox="0 0 80 72" width={size} height={(size * 72) / 80} role="img" aria-label={`${tierLabel(tier)} chest`}>
      <ellipse cx="40" cy="67" rx="28" ry="4" fill={ink} opacity=".12" />
      <rect x="10" y="32" width="60" height="32" rx="6" fill={c.body} stroke={ink} strokeWidth="3" />
      <g style={{ transformOrigin: "10px 32px", transform: open ? "rotate(-28deg)" : undefined, transition: "transform .3s" }}>
        <path d="M10 32V22a10 10 0 0 1 10-10h40a10 10 0 0 1 10 10v10z" fill={c.lid} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      </g>
      <rect x="34" y="28" width="12" height="14" rx="3" fill="#fff" stroke={ink} strokeWidth="2.5" />
      <circle cx="40" cy="35" r="2" fill={ink} />
    </svg>
  );
}
