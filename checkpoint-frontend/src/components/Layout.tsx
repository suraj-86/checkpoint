import { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LifeBuoy, LogOut, Search } from "lucide-react";
import { useAuth } from "../features/auth/context/AuthContext";
import { getAccount } from "../features/account/api/accountApi";
import { getDashboard, getProfile } from "../features/progress/api/progressApi";
import { Avatar } from "./ui/Avatar";
import { Mascot, type MascotMood } from "./mascot/Mascot";
import { BackgroundScene } from "./BackgroundScene";
import { CommandPalette } from "./CommandPalette";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Footer } from "./Footer";
import { adminNav, studentNav, type NavEntry } from "./navItems";

function Brand() {
  return (
    <Link to="/" className="px-2 font-display text-[22px] font-extrabold text-slate-800">
      Check<span className="text-indigo-500">point</span>
    </Link>
  );
}

/** The mascot in the rail reacts to the real state of the student's day. */
function mascotMood(d: { hasActiveSession: boolean; dailySessionCompletedToday: boolean; currentStreak: number } | undefined): {
  mood: MascotMood;
  line: string;
} {
  if (!d) return { mood: "idle", line: "Hi! Your garden is waiting." };
  if (d.hasActiveSession) return { mood: "hype", line: "Combo! Keep going!" };
  if (d.dailySessionCompletedToday) return { mood: "proud", line: "Nice work today!" };
  if (d.currentStreak > 0) return { mood: "sleepy", line: "Your streak needs a visit today." };
  return { mood: "idle", line: "Hi! Your garden is waiting." };
}

function MascotCard() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  const { mood, line } = mascotMood(data);
  return (
    <div className="card grid justify-items-center gap-1.5 p-3 text-center">
      <Mascot mood={mood} size={84} />
      <p className="rounded-xl bg-slate-200 px-3 py-2 text-[13px] font-semibold text-slate-500">{line}</p>
    </div>
  );
}

function LevelCard() {
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  if (!profile) return null;
  const progress = profile.levelProgress;
  const next = progress.xpToNextLevel === null ? null : profile.totalXp + progress.xpToNextLevel;
  return (
    <Link to="/progress" className="card block p-4 transition hover:-translate-y-0.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold text-slate-500">Level {progress.level}</span>
        <b className="text-sm text-slate-800">
          {profile.totalXp.toLocaleString()}
          {next !== null && ` / ${next.toLocaleString()}`} XP
        </b>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress.percent}%`, background: "linear-gradient(90deg, #a98bf5, #ef7fa8)" }}
        />
      </div>
    </Link>
  );
}

function RailNav({ items, isAdmin }: { items: NavEntry[]; isAdmin: boolean }) {
  let lastGroup: string | undefined;
  return (
    <nav className="grid gap-1" aria-label="Main">
      {items.map(({ to, label, group }, i) => {
        const heading = group && group !== lastGroup ? group : null;
        lastGroup = group;
        return (
          <div key={to} className="contents">
            {heading && (
              <p className="mb-0.5 mt-3 px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{heading}</p>
            )}
            <NavLink
              to={to}
              end={isAdmin}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-2xl px-3.5 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-[0_3px_0_rgba(47,36,87,0.25)]"
                    : "text-slate-500 hover:bg-slate-200/80 hover:text-slate-800"
                }`
              }
            >
              {label}
              {!isAdmin && i < 9 && <span className="kbd ml-auto !text-slate-500">{i + 1}</span>}
            </NavLink>
          </div>
        );
      })}
    </nav>
  );
}

const phoneLink = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 whitespace-nowrap rounded-2xl px-3 py-2 text-sm font-bold ${
    isActive ? "bg-indigo-500 text-white" : "text-slate-500"
  }`;

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";
  const navItems = isAdmin ? adminNav : studentNav;
  const accountPath = isAdmin ? "/admin/account" : "/profile";
  const [paletteOpen, setPaletteOpen] = useState(false);

  const { data: account } = useQuery({ queryKey: ["account"], queryFn: getAccount });
  const name = account?.displayName || account?.username || user?.username || "";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      // Number keys jump between the main pages, like the nav hints show.
      if (isAdmin || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      const index = Number(e.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < studentNav.length) {
        navigate(studentNav[index].to);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAdmin, navigate]);

  const tabs = studentNav.filter((n) => n.tab);

  return (
    <div className="relative min-h-screen">
      <BackgroundScene />

      <div className="relative z-10 mx-auto grid w-full max-w-[1800px] gap-5 px-4 py-5 md:grid-cols-[240px_1fr] md:px-6 xl:gap-8 xl:px-8">
        {/* Rail (desktop) */}
        <aside className="sticky top-5 hidden max-h-[calc(100vh-2.5rem)] gap-3 self-start overflow-y-auto md:grid">
          <Brand />
          {isAdmin && (
            <span className="-mt-1 ml-2 w-fit rounded-lg bg-slate-800 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-50">
              Admin console
            </span>
          )}
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex w-full items-center gap-2 rounded-2xl border-2 border-slate-300 bg-white/70 px-3 py-2 text-left text-[13px] font-semibold text-slate-500 transition hover:border-indigo-400"
          >
            <Search size={15} />
            Jump to...
            <span className="kbd ml-auto whitespace-nowrap">Ctrl K</span>
          </button>

          {!isAdmin && <MascotCard />}
          <RailNav items={navItems} isAdmin={isAdmin} />
          {!isAdmin && <LevelCard />}

          <div className="card grid gap-2 p-2.5">
            <ThemeSwitcher />
            <Link to={accountPath} className="flex items-center gap-3 rounded-xl p-1 hover:bg-slate-200/70">
              <Avatar name={name} color={account?.avatarColor} size={34} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">{name}</p>
                <p className="truncate text-xs font-semibold text-slate-500">@{user?.username}</p>
              </div>
            </Link>
            <button onClick={logout} className="btn-secondary w-full !py-1.5">
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Phone header */}
          <header className="mb-4 md:hidden">
            <div className="card flex items-center justify-between px-3 py-2">
              <Brand />
              <div className="flex items-center gap-1">
                <button onClick={() => setPaletteOpen(true)} aria-label="Jump to" className="rounded-lg p-2 text-slate-500">
                  <Search size={18} />
                </button>
                {!isAdmin && (
                  <Link to="/help" aria-label="Help" className="rounded-lg p-2 text-slate-500">
                    <LifeBuoy size={18} />
                  </Link>
                )}
                <button onClick={logout} aria-label="Log out" className="rounded-lg p-2 text-slate-500">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
            {isAdmin && (
              <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Main">
                {navItems.map(({ to, label }) => (
                  <NavLink key={to} to={to} end className={phoneLink}>
                    {label}
                  </NavLink>
                ))}
              </nav>
            )}
          </header>

          <main className={isAdmin ? "" : "pb-24 md:pb-4"}>
            <div key={location.pathname} className="page-enter">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>

      {/* Phone bottom tabs (students) */}
      {!isAdmin && (
        <nav
          className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-3xl border-2 border-slate-400 bg-slate-100 p-1.5 shadow-[0_4px_0_rgb(var(--cs))] md:hidden"
          aria-label="Main"
        >
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-extrabold ${
                  isActive ? "bg-indigo-500 text-white" : "text-slate-500"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} nav={navItems} />
    </div>
  );
}
