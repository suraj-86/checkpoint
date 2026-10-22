import { Avatar } from "../../../components/ui/Avatar";
import { MascotAvatar } from "../../../components/mascot/Mascot";
import { asSkin, useRewards } from "../hooks/useRewards";

export function UserAvatar({ name, color, size = 40 }: { name: string; color?: string | null; size?: number }) {
  const { data } = useRewards();
  if (data?.equippedSkin) {
    return <MascotAvatar skin={asSkin(data.equippedSkin)} mood="happy" size={size} />;
  }
  return <Avatar name={name} color={color} size={size} />;
}
