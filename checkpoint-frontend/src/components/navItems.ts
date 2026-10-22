import {
  BookOpen,
  Database,
  Gift,
  GraduationCap,
  History,
  Home,
  Inbox,
  Layers,
  FolderTree,
  Merge,
  LayoutDashboard,
  Library,
  LifeBuoy,
  ListChecks,
  Timer,
  Settings,
  Tag,
  TrendingUp,
  Upload,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavEntry {
  to: string;
  label: string;
  icon: LucideIcon;
  tab?: boolean;
  group?: string;
}

export const studentNav: NavEntry[] = [
  { to: "/home", label: "Home", icon: Home, tab: true },
  { to: "/practice", label: "Practice", icon: BookOpen, tab: true },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/progress", label: "Progress", icon: TrendingUp, tab: true },
  { to: "/history", label: "History", icon: History, tab: true },
  { to: "/profile", label: "Profile", icon: User, tab: true },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/help", label: "Help", icon: LifeBuoy },
];

export const adminNav: NavEntry[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/streams", label: "Streams", icon: Layers, group: "Catalog" },
  { to: "/admin/exams", label: "Exams", icon: GraduationCap, group: "Catalog" },
  { to: "/admin/subjects", label: "Subjects", icon: Library, group: "Catalog" },
  { to: "/admin/topics", label: "Topics", icon: Tag, group: "Catalog" },
  { to: "/admin/datasets/upload", label: "Upload", icon: Upload, group: "Content" },
  { to: "/admin/organise", label: "Organise", icon: FolderTree, group: "Content" },
  { to: "/admin/merge", label: "Merge topics", icon: Merge, group: "Content" },
  { to: "/admin/datasets", label: "Datasets", icon: Database, group: "Content" },
  { to: "/admin/questions", label: "Questions", icon: ListChecks, group: "Content" },
  { to: "/admin/rewards", label: "Rewards", icon: Gift, group: "People" },
  { to: "/admin/requests", label: "Requests", icon: Inbox, group: "People" },
  { to: "/admin/account", label: "Account", icon: Settings, group: "People" },
];
