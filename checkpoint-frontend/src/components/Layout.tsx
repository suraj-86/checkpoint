import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, TrendingUp, User, LogOut, Upload, Database,
  ListChecks, ChevronLeft, Search, Bell, Sparkles,
} from "lucide-react";
import { useAuth } from "../features/auth/context/AuthContext";

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
];

export function Layout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const navItems = isAdmin ? adminNav : studentNav;

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center gap-3 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">Checkpoint</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{isAdmin ? "Admin" : "Learn better"}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-5">
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={isAdmin}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`
                }>
                <Icon size={18} strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="m-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm"><Sparkles size={17}/></div>
            <p className="text-sm font-bold text-slate-800">Keep your streak alive</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">A little practice every day compounds into serious progress.</p>
          </div>

          <button onClick={logout} className="m-3 mb-5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            <LogOut size={18} /> Log out
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
            <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white lg:hidden"><Sparkles size={19}/></div>
                <div className="relative hidden max-w-md flex-1 md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/>
                  <input aria-label="Search" placeholder="Search topics, practice..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"/>
                </div>
                <div className="lg:hidden">
                  <p className="font-bold text-slate-900">Checkpoint</p>
                  <p className="text-xs text-slate-400">{isAdmin ? "Admin workspace" : "Learning dashboard"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button aria-label="Notifications" className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-50">
                  <Bell size={19}/><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"/>
                </button>
                <div className="hidden h-9 w-px bg-slate-200 sm:block"/>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {(user?.username ?? "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-bold text-slate-800">{user?.username}</p>
                    <p className="text-xs text-slate-400">{isAdmin ? "Administrator" : "Student"}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-5 flex gap-1 overflow-x-auto lg:hidden">
              {navItems.map(({to,label,icon:Icon}) => (
                <NavLink key={to} to={to} end={isAdmin} className={({isActive}) => `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                  isActive ? "bg-indigo-600 text-white" : "bg-white text-slate-500 border border-slate-200"
                }`}><Icon size={15}/>{label}</NavLink>
              ))}
              <button onClick={logout} className="ml-auto shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500"><ChevronLeft size={15}/></button>
            </div>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
