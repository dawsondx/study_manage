import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Dashboard from '@/pages/Dashboard';
import Resources from '@/pages/Resources';
import ResourceForm from '@/pages/ResourceForm';
import Progress from '@/pages/Progress';
import Payments from '@/pages/Payments';
import Settings from '@/pages/Settings';
import Layout from '@/components/Layout';

export default function App() {
  return (
    <>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/new" element={<ResourceForm />} />
            <Route path="/resources/:id/edit" element={<ResourceForm />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster position="top-right" />
    </>
  );
}
