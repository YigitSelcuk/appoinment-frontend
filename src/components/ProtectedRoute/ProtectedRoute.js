import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Navbar/Navbar';

const ProtectedRoute = ({ children, requiredPermission, requireAdmin = false }) => {
  const { isAuthenticated, loading, user, logout } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5'
      }}>
        <div className="loading-spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ 
          marginTop: '20px', 
          color: '#666',
          fontSize: '16px'
        }}>
          Oturum kontrol ediliyor...
        </p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Oturum açık değilse login sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin, başkan rolü veya BAŞKAN department gereksinimi
  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'başkan' && user?.department !== 'BAŞKAN') {
    return <Navigate to="/dashboard" replace />;
  }

  // Sayfa-bazlı izin kontrolü (admin, başkan rolü ve BAŞKAN department her zaman geçer)
  if (requiredPermission && user?.role !== 'admin' && user?.role !== 'başkan' && user?.department !== 'BAŞKAN') {
    const hasPermission = Boolean(user?.permissions && user.permissions[requiredPermission]);
    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Oturum açıksa Navbar ve children'ı render et
  return (
    <>
      <Navbar user={user} onLogout={logout} />
      {children}
    </>
  );
};

export default ProtectedRoute;