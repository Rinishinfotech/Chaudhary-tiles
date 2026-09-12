import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { canAccess } from './permissions';
import { useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import PartyManagement from './pages/PartyManagement';
import ReceiptManagement from './pages/ReceiptManagement';
import ExpenseManagement from './pages/ExpenseManagement';
import EmployeeWallet from './pages/EmployeeWallet';
import DispatchManagement from './pages/DispatchManagement';
import StockManagement from './pages/StockManagement';
import ProductionManagement from './pages/ProductionManagement';
import DChallanManagement from './pages/DChallanManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccess(user, location.pathname)) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/employees" element={<Protected><EmployeeManagement /></Protected>} />
            <Route path="/parties" element={<Protected><PartyManagement /></Protected>} />
            <Route path="/receipts" element={<Protected><ReceiptManagement /></Protected>} />
            <Route path="/expenses" element={<Protected><ExpenseManagement /></Protected>} />
            <Route path="/wallet" element={<Protected><EmployeeWallet /></Protected>} />
            <Route path="/dispatch" element={<Protected><DispatchManagement /></Protected>} />
            <Route path="/stock" element={<Protected><StockManagement /></Protected>} />
            <Route path="/production" element={<Protected><ProductionManagement /></Protected>} />
            <Route path="/dchallan" element={<Protected><DChallanManagement /></Protected>} />
            <Route path="/reports" element={<Protected><Reports /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
