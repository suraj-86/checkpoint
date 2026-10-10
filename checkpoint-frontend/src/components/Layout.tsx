import { NavLink, Link, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Database,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
import { useAuth } from "../features/auth/context/AuthContext";
import { getAccount } from "../features/account/api/accountApi";
import { Avatar } from "./ui/Avatar";
import { Footer } from "./Footer";

const studentNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/practice", label: "Practice", icon: BookOpen },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/profile", label: "Profile", icon: User },
];

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/datasets/upload", label: "Upload", icon: Upload },
  { to: "/admin/datasets", label: "Datasets", icon: Database },
  { to: "/admin/questions", label: "Questions", icon: ListChecks },
  { to: "/admin/account", label: "Account", icon: Settings },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200">
        <CheckCircle2 size={20} />
      </div>
      <span className="text-lg font-semibold text-slate-800">Checkpoint</span>
    </div>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const navItems = isAdmin ? adminNav : studentNav;
  const accountPath = isAdmin ? "/admin/account" : "/profile";

  const { data: account } = useQuery({ queryKey: ["account"], queryFn: getAccount });
  const name = account?.displayName || account?.username || user?.username || "";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
        : "text-slate-600 hover:bg-white/80 hover:text-indigo-700"
    }`;

  return (
    <div className="app-bg flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 p-4 md:block">
        <div className="card flex h-full flex-col p-4">
          <Brand />
          {isAdmin && (
            <span className="mt-3 w-fit rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
              Admin console
            </span>
          )}

          <nav className="mt-6 flex flex-1 flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={isAdmin} className={linkClass}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-slate-200/70 pt-4">
            <Link to={accountPath} className="flex items-center gap-3 rounded-xl p-1 hover:bg-white/70">
              <Avatar name={name} color={account?.avatarColor} size={38} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{name}</p>
                <p className="truncate text-xs text-slate-500">@{user?.username}</p>
              </div>
            </Link>
            <button
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-600 transition hover:bg-white"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="px-4 pt-4 md:hidden">
          <div className="card flex items-center justify-between px-3 py-2">
            <Brand />
            <div className="flex items-center gap-2">
              <Link to={accountPath}>
                <Avatar name={name} color={account?.avatarColor} size={32} />
              </Link>
              <button onClick={logout} aria-label="Log out" className="rounded-lg p-2 text-slate-500 hover:bg-white/70">
                <LogOut size={18} />
              </button>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={isAdmin} className={linkClass}>
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <div className="hidden items-center justify-between px-8 pt-6 md:flex">
          <div>
            <p className="text-sm text-slate-500">{isAdmin ? "Signed in as" : "Welcome back,"}</p>
            <p className="text-xl font-semibold text-slate-800">{name}</p>
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
