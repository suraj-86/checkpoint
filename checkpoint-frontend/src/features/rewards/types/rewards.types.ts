export type ChestTier = "BRONZE" | "SILVER" | "GOLD";

export interface Chest {
  id: string;
  tier: ChestTier | string;
  source: string;
  earnedAt: string;
}

export interface Boost {
  id: string;
  type: string;
  label: string;
}

export interface Collectible {
  code: string;
  name: string;
  owned: boolean;
}

export interface RewardsState {
  chests: Chest[];
  activeBoost: Boost | null;
  queuedBoosts: Boost[];
  stickers: Collectible[];
  skins: Collectible[];
  equippedSkin: string | null;
  equippedStickers: string[];
}

export interface ChestOpenResult {
  kind: "SKIN" | "STICKER" | "BOOST";
  code: string;
  name: string;
  label: string;
  duplicateConvertedToBoost: boolean;
}

export interface EquipRequest {
  skin: string | null;
  stickers: string[];
}

export interface SessionRewards {
  chestEarned: { id: string; tier: string; reason: "SESSION" | "STREAK" } | null;
  streakChest: { id: string; tier: string; days: number } | null;
  boostApplied: { label: string; bonusXp: number } | null;
}

export interface AdminRewardItem {
  id: string;
  kind: string;
  code: string;
  name: string;
  enabled: boolean;
  ownedCount: number;
}

export interface AdminOdds {
  tier: string;
  stickerPct: number;
  boostPct: number;
  skinPct: number;
}

export interface AdminMilestone {
  days: number;
  tier: string;
  enabled: boolean;
}

export interface AdminRewards {
  items: AdminRewardItem[];
  odds: AdminOdds[];
  milestones: AdminMilestone[];
  stats: { chestsGranted: number; chestsOpened: number; boostsUsed: number };
}
