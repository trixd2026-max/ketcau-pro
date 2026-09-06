import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import Dashboard from './pages/Dashboard';
import ColumnPage from './pages/ColumnPage';
import FoundationPage from './pages/FoundationPage';
import BeamPage from './pages/BeamPage';
import SlabPage from './pages/SlabPage';
import ProjectsPage from './pages/ProjectsPage';
import ReportPage from './pages/ReportPage';
import ToolsPage from './pages/ToolsPage';
import { useEffect } from 'react';
import { useProjectStore } from './store/useProjectStore';

function App() {
  const darkMode = useProjectStore(s => s.darkMode);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  return (
    <BrowserRouter>
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
        </Routes>
      </Layout>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
