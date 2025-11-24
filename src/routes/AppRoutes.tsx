import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ReportesPage from '../pages/ReportesPage';
import LoginPage from '../pages/LoginPage';
import { useAuth } from '../context/AuthContext';

export default function AppRoutes() {
  const { user, loading } = useAuth();
  const isAuthenticated = Boolean(user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <p className="text-gray-600 text-lg">Cargando...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/reportes" replace /> : <LoginPage />}
        />
        <Route
          path="/reportes"
          element={
            isAuthenticated ? (
              <MainLayout>
                <ReportesPage />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to="/reportes" replace />} />
        <Route path="*" element={<Navigate to="/reportes" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


