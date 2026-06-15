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
  const { token } = useAuth();
  const location = useLocation();

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

