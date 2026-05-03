/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './components/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import Overview from './components/Overview';
import AttendancePage from './components/AttendancePage';
import StudentsPage from './components/StudentsPage';
import LessonsPage from './components/LessonsPage';
import Onboarding from './components/Onboarding';

import { ThemeProvider } from './context/ThemeContext';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (user && !profile) return <Navigate to="/onboarding" />;

  return <>{children}</>;
}

import ProgressPage from './components/ProgressPage';
import SkillsPage from './components/SkillsPage';
import ProjectsPage from './components/ProjectsPage';
import FirestoreDashboard from './components/FirestoreDashboard';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="skills" element={<SkillsPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="lessons" element={<LessonsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="database" element={<FirestoreDashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
