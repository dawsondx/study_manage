import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import Dashboard from '@/pages/Dashboard';
import Resources from '@/pages/Resources';
import ResourceForm from '@/pages/ResourceForm';
import Progress from '@/pages/Progress';
import Payments from '@/pages/Payments';
import Settings from '@/pages/Settings';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import NotFound from '@/pages/NotFound';

// 重定向处理器组件
function RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 检查是否有保存的重定向路径
    const redirectPath = sessionStorage.getItem('redirect_path');
    if (redirectPath) {
      sessionStorage.removeItem('redirect_path');
      // 使用replace避免历史记录问题
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, location]);

  return null;
}

export default function App() {
  const Protected = (props: { element: JSX.Element }) => {
    const token = useAuthStore((s) => s.token);
    return token ? <Layout>{props.element}</Layout> : <Navigate to="/login" replace />;
  };
  
  return (
    <>
      <Router>
        <RedirectHandler />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<Protected element={<Dashboard />} />} />
          <Route path="/resources" element={<Protected element={<Resources />} />} />
          <Route path="/resources/new" element={<Protected element={<ResourceForm />} />} />
          <Route path="/resources/:id/edit" element={<Protected element={<ResourceForm />} />} />
          <Route path="/progress" element={<Protected element={<Progress />} />} />
          <Route path="/payments" element={<Protected element={<Payments />} />} />
          <Route path="/settings" element={<Protected element={<Settings />} />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </>
  );
}
