import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ResumeParsing } from './pages/ResumeParsing';
import { AIMatching } from './pages/AIMatching';
import { JobPositions } from './pages/JobPositions';
import { TalentPool } from './pages/TalentPool';
import { ShortlistedPool } from './pages/ShortlistedPool';
import { Interviews } from './pages/Interviews';
import { CandidateProfiles } from './pages/CandidateProfiles';
import { HiringMatrix } from './pages/HiringMatrix';
import { UserManagement } from './pages/UserManagement';
import { ProfileManagement } from './pages/ProfileManagement';
import { Toaster } from './components/ui/sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/resume-parsing" element={
        <ProtectedRoute>
          <Layout>
            <ResumeParsing />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/ai-matching" element={
        <ProtectedRoute>
          <Layout>
            <AIMatching />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-positions" element={
        <ProtectedRoute>
          <Layout>
            <JobPositions />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/talent-pool" element={
        <ProtectedRoute>
          <Layout>
            <TalentPool />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/shortlisted-pool" element={
        <ProtectedRoute>
          <Layout>
            <ShortlistedPool />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/interviews" element={
        <ProtectedRoute>
          <Layout>
            <Interviews />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/candidate-profiles" element={
        <ProtectedRoute>
          <Layout>
            <CandidateProfiles />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/hiring-matrix" element={
        <ProtectedRoute>
          <Layout>
            <HiringMatrix />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <Layout>
            <UserManagement />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <ProfileManagement />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
