import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { SimpleToastProvider } from './contexts/SimpleToastContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Appointments from './pages/Appointments/Appointments';
import Contacts from './pages/Contacts/Contacts';
import Categories from './pages/Categories/Categories';
import Messages from './pages/Messages/Messages';
import MessagingPanel from './pages/MessagingPanel/MessagingPanel';
import Requests from './pages/Requests/Requests';
import Tasks from './pages/Tasks/Tasks';
import Activities from './pages/Activities/Activities';
import CV from './pages/CV/CV';
import Profile from './pages/Profile/Profile';
import Users from './pages/Users/Users';
import './App.css';

// Ana route yönlendirmesi için ayrı bir component
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  // Yükleme durumunda
  if (loading) {
    return (
      <div className="app-loading" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div>Uygulama yükleniyor...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/appointments" 
        element={
          <ProtectedRoute requiredPermission="appointments">
            <Appointments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/contacts" 
        element={
          <ProtectedRoute requiredPermission="contacts">
            <Contacts />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/categories" 
        element={
          <ProtectedRoute requiredPermission="categories">
            <Categories />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/messages" 
        element={
          <ProtectedRoute requiredPermission="messages">
            <Messages />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/messaging" 
        element={
          <ProtectedRoute requiredPermission="messaging">
            <MessagingPanel />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/messaging-panel" 
        element={
          <ProtectedRoute>
            <MessagingPanel />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/requests" 
        element={
          <ProtectedRoute requiredPermission="requests">
            <Requests />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tasks" 
        element={
          <ProtectedRoute requiredPermission="tasks">
            <Tasks />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/activities" 
        element={
          <ProtectedRoute requiredPermission="management">
            <Activities />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cv" 
        element={
          <ProtectedRoute requiredPermission="cv">
            <CV />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/users" 
        element={
          <ProtectedRoute requiredPermission="management">
            <Users />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <SimpleToastProvider>
        <SocketProvider>
          <Router>
            <div className="App">
              <AppRoutes />
            </div>
          </Router>
        </SocketProvider>
      </SimpleToastProvider>
    </AuthProvider>
  );
}

export default App;
