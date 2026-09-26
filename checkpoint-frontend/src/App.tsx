import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./features/auth/context/AuthContext";

function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-800">Checkpoint</h1>
        <p className="mt-2 text-slate-500">
          Logged in as <span className="font-medium text-slate-700">{user?.username}</span>{" "}
          ({user?.role})
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Dashboard and practice routes arrive in later phases.
        </p>
        <button
          onClick={logout}
          className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
