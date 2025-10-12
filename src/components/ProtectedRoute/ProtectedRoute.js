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
    // Permissions array formatında geldiği için includes kullanıyoruz
    let hasPermission = false;
    
    if (user?.permissions) {
      if (Array.isArray(user.permissions)) {
        // Array formatında ise
        hasPermission = user.permissions.includes(requiredPermission);
      } else if (typeof user.permissions === 'object') {
        // Object formatında ise (eski format için uyumluluk)
        hasPermission = Boolean(user.permissions[requiredPermission]);
      } else if (typeof user.permissions === 'string') {
        // String formatında ise JSON parse et
        try {
          const parsedPermissions = JSON.parse(user.permissions);
          if (Array.isArray(parsedPermissions)) {
            hasPermission = parsedPermissions.includes(requiredPermission);
          } else if (typeof parsedPermissions === 'object') {
            hasPermission = Boolean(parsedPermissions[requiredPermission]);
          }
        } catch (e) {
          console.warn('ProtectedRoute: permissions parse edilemedi:', user.permissions);
          hasPermission = false;
        }
      }
    }
    
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