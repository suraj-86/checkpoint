import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomeRedirect } from "./components/HomeRedirect";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { PracticeHubPage } from "./features/practice/pages/PracticeHubPage";
import { FastPracticeStartPage } from "./features/practice/pages/FastPracticeStartPage";
import { PracticeSessionPage } from "./features/practice/pages/PracticeSessionPage";
import { SessionResultPage } from "./features/practice/pages/SessionResultPage";
import { ActiveSessionRedirect } from "./features/practice/pages/ActiveSessionRedirect";
import { ProgressPage } from "./features/progress/pages/ProgressPage";
import { ProfilePage } from "./features/progress/pages/ProfilePage";
import { AdminDashboardPage } from "./features/admin/pages/AdminDashboardPage";
import { DatasetUploadPage } from "./features/admin/pages/DatasetUploadPage";
import { DatasetHistoryPage } from "./features/admin/pages/DatasetHistoryPage";
import { QuestionBrowserPage } from "./features/admin/pages/QuestionBrowserPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeRedirect />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute requireRole="STUDENT">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/practice" element={<PracticeHubPage />} />
        <Route path="/practice/fast" element={<FastPracticeStartPage />} />
        <Route path="/practice/active" element={<ActiveSessionRedirect />} />
        <Route path="/practice/session/:sessionId" element={<PracticeSessionPage />} />
        <Route path="/practice/result/:sessionId" element={<SessionResultPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute requireRole="ADMIN">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/datasets" element={<DatasetHistoryPage />} />
        <Route path="/admin/datasets/upload" element={<DatasetUploadPage />} />
        <Route path="/admin/questions" element={<QuestionBrowserPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
