import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-slate-800">
                Checkpoint
              </h1>
              <p className="mt-2 text-slate-500">
                Phase 1 scaffold is running. Auth, dashboard, and practice
                routes arrive in later phases.
              </p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
