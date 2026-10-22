import { useQuery } from "@tanstack/react-query";
import { MASCOT_SKINS, type MascotSkin } from "../../../components/mascot/Mascot";
import { getRewards } from "../api/rewardsApi";

export function useRewards(enabled = true) {
  return useQuery({
    queryKey: ["rewards"],
    queryFn: getRewards,
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}

export function asSkin(code: string | null | undefined): MascotSkin {
  return MASCOT_SKINS.some((s) => s.id === code) ? (code as MascotSkin) : "sprout";
}

export function useEquippedSkin(): MascotSkin {
  const { data } = useRewards();
  return asSkin(data?.equippedSkin);
}
