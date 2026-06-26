import { Routes, Route, Navigate } from "react-router-dom";
import FilesPage from "./pages/FilesPage";
import UploadPage from "./pages/UploadPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LandingPage from "./pages/LandingPage";
import Layout from "./layout/Layout";
import RequireAuth from "./components/RequireAuth";
import { WorkspaceProvider } from "./context/WorkspaceContext";

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

