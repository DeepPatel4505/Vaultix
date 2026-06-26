import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import FilesPage from "./pages/FilesPage";
import UploadPage from "./pages/UploadPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LandingPage from "./pages/LandingPage";
import Layout from "./layout/Layout";
import { useAuth } from "./hooks/useAuth";
import { WorkspaceProvider } from "./context/WorkspaceContext";

const RequireAuth = () => {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 select-none">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted animate-pulse">Initializing Session...</span>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<RequireAuth />}>
        <Route element={
          <WorkspaceProvider>
            <Layout />
          </WorkspaceProvider>
        }>
          <Route path="/files" element={<FilesPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Route>
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

