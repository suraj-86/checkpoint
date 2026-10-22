import type { MasteryTier } from "../types/progress.types";

export type Tone = "strong" | "gold" | "rose" | "idle";

export const SHADES: Record<Tone, [string, string, string]> = {
  strong: ["#4fae7e", "#6fcf9c", "#8adfb0"],
  gold: ["#d9ab3f", "#ecc965", "#f6dc8a"],
  rose: ["#e06a80", "#ef8fa0", "#f8adbb"],
  idle: ["#b3a1e6", "#c8baf0", "#dbd0f7"],
};

export function toneFor(tier: MasteryTier): Tone {
  if (tier === "STRONG") return "strong";
  if (tier === "GROWING") return "gold";
  if (tier === "NEEDS_WORK") return "rose";
  return "idle";
}

export interface TreeTopic {
  id: string;
  name: string;
  accuracy: number;
  tier: MasteryTier;
}

export interface TreeSubject {
  id: string;
  name: string;
  accuracy: number;
  tier: MasteryTier;
  topics: TreeTopic[];
  hiddenTopics: number;
}

export interface LeafShape {
  x: number;
  y: number;
  rot: number;
  scale: number;
  shade: number;
}

export interface LeafCluster {
  id: string;
  name: string;
  accuracy: number;
  tier: MasteryTier;
  tone: Tone;
  x: number;
  y: number;
  radius: number;
  shapes: LeafShape[];
  droops: boolean;
  labelWidth: number;
}

export interface BranchTag {
  id: string;
  name: string;
  accuracy: number;
  tier: MasteryTier;
  tone: Tone;
  x: number;
  y: number;
  width: number;
  label: string;
  hidden: number;
}

export interface TreeLayout {
  width: number;
  height: number;
  barkPaths: string[];
  halos: { x: number; y: number; rx: number; ry: number; tone: Tone }[];
  clusters: LeafCluster[];
  tags: BranchTag[];
  rootPaths: { d: string; w: number }[];
  groundLeft: number;
  groundWidth: number;
  centre: number;
}

type Pt = [number, number];
type Curve = [Pt, Pt, Pt, Pt];

const bz = (p: Curve, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
    u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
  ];
};

const bzd = (p: Curve, t: number): Pt => {
  const u = 1 - t;
  return [
    3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]),
    3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]),
  ];
};

function taper(p: Curve, w0: number, w1: number): string {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const q = bz(p, t);
    const d = bzd(p, t);
    const len = Math.hypot(d[0], d[1]) || 1;
    const w = (w0 + (w1 - w0) * t) / 2;
    left.push([q[0] - (d[1] / len) * w, q[1] + (d[0] / len) * w]);
    right.push([q[0] + (d[1] / len) * w, q[1] - (d[0] / len) * w]);
  }
  const pts = left.concat(right.reverse());
  return `M${pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L")}Z`;
}

function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const OFFSETS: Record<number, [number, number][]> = {
  1: [[0, 0.96]],
  2: [[-45, 0.72], [40, 0.96]],
  3: [[-52, 0.55], [0, 0.97], [52, 0.76]],
};

function makeCluster(x: number, y: number, topic: TreeTopic): LeafCluster {
  const r = rng(topic.id + topic.name);
  const tone = toneFor(topic.tier);
  const notStarted = topic.tier === "NOT_STARTED";
  const count = notStarted ? 4 : Math.round(9 + topic.accuracy / 6);
  const radius = notStarted ? 18 : 20 + topic.accuracy * 0.2;
  const droops = topic.tier === "NEEDS_WORK";
  const shapes: LeafShape[] = [];
  for (let i = 0; i < count; i++) {
    const g = r() * Math.PI * 2;
    const q = Math.sqrt(r()) * radius;
    shapes.push({
      x: x + Math.cos(g) * q,
      y: y + Math.sin(g) * q * 0.85 + (droops ? q * 0.3 : 0),
      rot: Math.round(r() * 360),
      scale: 0.9 + r() * 0.6,
      shade: Math.floor(r() * 3),
    });
  }
  const label = `${topic.name} ${notStarted ? "" : `${topic.accuracy}%`}`.trim();
  return {
    id: topic.id,
    name: topic.name,
    accuracy: topic.accuracy,
    tier: topic.tier,
    tone,
    x,
    y,
    radius,
    shapes,
    droops,
    labelWidth: label.length * 6.6 + 18,
  };
}

export const LEAF_PATH = "M0 0C4-7 14-8 20 0C14 8 4 7 0 0Z";

export function layoutTree(subjects: TreeSubject[]): TreeLayout {
  const n = subjects.length;
  const spacing = n <= 4 ? 190 : n <= 6 ? 150 : 118;
  const width = Math.max(760, spacing * (n - 1) + 280);
  const centre = width / 2;
  const span = spacing * (n - 1);

  const barkPaths: string[] = [];
  const halos: TreeLayout["halos"] = [];
  const clusters: LeafCluster[] = [];
  const tags: BranchTag[] = [];

  subjects.forEach((subject, i) => {
    const tx = centre - span / 2 + i * spacing;
    const off = i - (n - 1) / 2;
    const side = Math.sign(off);
    const rk = Math.abs(off);
    const ty = side ? 222 + Math.min(60, Math.max(0, rk - 0.5) * 20) : 232;
    const sx = centre + side * 8;
    const sy = side ? 365 + Math.min(rk, 3.5) * 22 : 372;
    const P: Curve = side
      ? [[sx, sy], [sx + side * 28, sy - 70], [tx - side * 6, ty + 95], [tx, ty]]
      : [[centre, 372], [centre - 1, 330], [centre + 1, 290], [centre, ty]];
    barkPaths.push(taper(P, side ? Math.max(12, 22 - rk * 2) : 22, 7));

    const tone = toneFor(subject.tier);
    halos.push({ x: tx, y: ty - 75, rx: Math.min(125, spacing * 0.7), ry: 95, tone });

    const offsets = OFFSETS[Math.min(3, Math.max(1, subject.topics.length))];
    subject.topics.slice(0, 3).forEach((topic, k) => {
      const [angle, along] = offsets[k];
      const pt = bz(P, along);
      const tg = bzd(P, along);
      const ph = Math.atan2(tg[1], tg[0]) + (angle * Math.PI) / 180;
      const len = 62 + ((k * 17) % 20);
      const c = Math.cos(ph);
      const s = Math.sin(ph);
      const ex = pt[0] + c * len;
      const ey = pt[1] + s * len;
      barkPaths.push(
        taper([pt, [pt[0] + c * len * 0.3, pt[1] + s * len * 0.3], [ex - c * len * 0.3, ey - s * len * 0.3 + 6], [ex, ey]], 7, 2.5)
      );
      clusters.push(makeCluster(ex, ey, topic));
    });

    const shortName = subject.name.length > 15 ? `${subject.name.slice(0, 14)}…` : subject.name;
    const label = `${shortName} ${subject.tier === "NOT_STARTED" ? "" : `${subject.accuracy}%`}`.trim();
    tags.push({
      id: subject.id,
      name: subject.name,
      accuracy: subject.accuracy,
      tier: subject.tier,
      tone,
      x: tx,
      y: Math.max(34, ty - 158) + (n > 4 ? (i % 2) * 30 : 0),
      width: label.length * 7.4 + 38,
      label,
      hidden: subject.hiddenTopics,
    });
  });

  const rootPaths = [[270, 538], [335, 550], [428, 550], [500, 538], [600, 528]].map(([x, y], i) => {
    const dx = x - 380;
    const px = centre + dx;
    return {
      d: taper([[centre, 500], [centre + dx * 0.2, 515], [centre + dx * 0.7, y - 14], [px, y]], 24 - i * 2, 3),
      w: 0,
    };
  });

  return {
    width,
    height: 560,
    barkPaths,
    halos,
    clusters,
    tags,
    rootPaths,
    groundLeft: 60,
    groundWidth: width - 120,
    centre,
  };
}
