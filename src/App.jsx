import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import NotificationBell from './components/NotificationBell';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Schools from './views/Schools';
import Trainers from './views/Trainers';
import Expenses from './views/Expenses';
import Capital from './views/Capital';
import Reports from './views/Reports';
import ActivityLogs from './views/ActivityLogs';
import Settings from './views/Settings';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [toasts, setToasts] = React.useState([]);

  React.useEffect(() => {
    if (!user) return;

    const handleNewLogs = (e) => {
      const { newLogs } = e.detail;
      newLogs.forEach(log => {
        const toast = {
          id: log.log_id,
          message: `${log.user.split('@')[0]}: ${log.description}`,
          type: 'info'
        };
        setToasts(prev => [...prev, toast]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, 5000);
      });
    };

    const handleLocalToast = (e) => {
      const { type, message } = e.detail;
      const toast = {
        id: `local_${Date.now()}_${Math.random()}`,
        message,
        type: type || 'success'
      };
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 5000);
    };

    window.addEventListener('evm_new_logs', handleNewLogs);
    window.addEventListener('evm_toast', handleLocalToast);

    return () => {
      window.removeEventListener('evm_new_logs', handleNewLogs);
      window.removeEventListener('evm_toast', handleLocalToast);
    };
  }, [user]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
        <div style={{ color: 'var(--color-cyan)', fontWeight: 600, fontSize: '1.2rem' }}>Loading system...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      
      {/* Mobile top header bar */}
      <header className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setMobileOpen(true)} className="mobile-menu-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
            EVM<span style={{ color: 'var(--color-cyan)' }}>.</span>
          </span>
        </div>
        <NotificationBell />
      </header>

      <main className="content-wrapper">
        {children}
      </main>

      {/* Toast notifications portal container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-message toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/schools" element={<ProtectedRoute><Schools /></ProtectedRoute>} />
      <Route path="/trainers" element={<ProtectedRoute><Trainers /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route path="/capital" element={<ProtectedRoute><Capital /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      
      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
