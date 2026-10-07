import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  User,
  LogOut,
  Upload,
  Database,
  ListChecks,
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
  const width = isAdmin ? "max-w-6xl" : "max-w-5xl";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className={`mx-auto flex ${width} items-center justify-between px-4 py-3`}>
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-slate-800">
              Checkpoint{isAdmin ? " Admin" : ""}
            </span>
            <nav className="flex gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={isAdmin}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user?.username}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              <LogOut size={14} />
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className={`mx-auto ${width} px-4 py-6`}>
        <Outlet />
      </main>
    </div>
  );
}
