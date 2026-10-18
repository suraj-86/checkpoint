import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomeRedirect } from "./components/HomeRedirect";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { PracticeHubPage } from "./features/practice/pages/PracticeHubPage";
import { PracticeSessionPage } from "./features/practice/pages/PracticeSessionPage";
import { SessionResultPage } from "./features/practice/pages/SessionResultPage";
import { ActiveSessionRedirect } from "./features/practice/pages/ActiveSessionRedirect";
import { ProgressPage } from "./features/progress/pages/ProgressPage";
import { HistoryPage } from "./features/progress/pages/HistoryPage";
import { SessionDetailPage } from "./features/progress/pages/SessionDetailPage";
import { ProfilePage } from "./features/progress/pages/ProfilePage";
import { AdminDashboardPage } from "./features/admin/pages/AdminDashboardPage";
import { DatasetUploadPage } from "./features/admin/pages/DatasetUploadPage";
import { DatasetHistoryPage } from "./features/admin/pages/DatasetHistoryPage";
import { QuestionBrowserPage } from "./features/admin/pages/QuestionBrowserPage";
import { StreamsPage } from "./features/admin/pages/StreamsPage";
import { SubjectsPage } from "./features/admin/pages/SubjectsPage";
import { ExamsPage } from "./features/admin/pages/ExamsPage";
import { TopicsPage } from "./features/admin/pages/TopicsPage";
import { AdminAccountPage } from "./features/account/pages/AdminAccountPage";

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
        <Route path="/home" element={<DashboardPage />} />
        <Route path="/dashboard" element={<Navigate to="/home" replace />} />
        <Route path="/practice" element={<PracticeHubPage />} />
        <Route path="/practice/fast" element={<Navigate to="/practice" replace />} />
        <Route path="/practice/active" element={<ActiveSessionRedirect />} />
        <Route path="/practice/session/:sessionId" element={<PracticeSessionPage />} />
        <Route path="/practice/result/:sessionId" element={<SessionResultPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/progress/sessions/:sessionId" element={<SessionDetailPage />} />
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
        <Route path="/admin/streams" element={<StreamsPage />} />
        <Route path="/admin/exams" element={<ExamsPage />} />
        <Route path="/admin/subjects" element={<SubjectsPage />} />
        <Route path="/admin/topics" element={<TopicsPage />} />
        <Route path="/admin/catalog" element={<Navigate to="/admin/subjects" replace />} />
        <Route path="/admin/datasets" element={<DatasetHistoryPage />} />
        <Route path="/admin/datasets/upload" element={<DatasetUploadPage />} />
        <Route path="/admin/questions" element={<QuestionBrowserPage />} />
        <Route path="/admin/account" element={<AdminAccountPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
