import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { PracticeHubPage } from "./features/practice/pages/PracticeHubPage";
import { FastPracticeStartPage } from "./features/practice/pages/FastPracticeStartPage";
import { PracticeSessionPage } from "./features/practice/pages/PracticeSessionPage";
import { SessionResultPage } from "./features/practice/pages/SessionResultPage";
import { ActiveSessionRedirect } from "./features/practice/pages/ActiveSessionRedirect";
import { ProgressPage } from "./features/progress/pages/ProgressPage";
import { ProfilePage } from "./features/progress/pages/ProfilePage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/practice" element={<PracticeHubPage />} />
        <Route path="/practice/fast" element={<FastPracticeStartPage />} />
        <Route path="/practice/active" element={<ActiveSessionRedirect />} />
        <Route path="/practice/session/:sessionId" element={<PracticeSessionPage />} />
        <Route path="/practice/result/:sessionId" element={<SessionResultPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;
