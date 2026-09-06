import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import ColumnPage from './pages/ColumnPage';
import FoundationPage from './pages/FoundationPage';
import BeamPage from './pages/BeamPage';
import SlabPage from './pages/SlabPage';
import ProjectsPage from './pages/ProjectsPage';
import ReportPage from './pages/ReportPage';
import ToolsPage from './pages/ToolsPage';
import ImportPage from './pages/ImportPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useEffect } from 'react';
import { useProjectStore } from './store/useProjectStore';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const darkMode = useProjectStore(s => s.darkMode);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Re-bind project storage when user changes
  useEffect(() => {
    useProjectStore.persist.setOptions({
      name: user ? `ketcau-pro-data-${user.id}` : 'ketcau-pro-storage',
    });
    useProjectStore.persist.rehydrate();
  }, [user?.id]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/column" element={<ColumnPage />} />
                  <Route path="/foundation" element={<FoundationPage />} />
                  <Route path="/beam" element={<BeamPage />} />
                  <Route path="/slab" element={<SlabPage />} />
                  <Route path="/report" element={<ReportPage />} />
                  <Route path="/tools" element={<ToolsPage />} />
                  <Route path="/import" element={<ImportPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
