import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PedidosProvider } from './context/PedidosContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rendimiento from './pages/Rendimiento';
import MisPedidos from './pages/MisPedidos';
import SidebarAdmin from './components/SidebarAdmin';
import SidebarTrabajador from './components/SidebarTrabajador';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Verificar si hay un usuario guardado
    const savedUser = localStorage.getItem('pardos-system-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('pardos-system-user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pardos-system-user');
  };

  // Si no hay usuario, mostrar login
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  // Determinar si es admin o trabajador
  const isAdmin = user.rol === 'admin';

  return (
    <Router>
      <PedidosProvider>
        <div className="flex min-h-screen bg-white">
          {/* Sidebar según el rol */}
          {isAdmin ? (
            <SidebarAdmin user={user} onLogout={handleLogout} />
          ) : (
            <SidebarTrabajador user={user} onLogout={handleLogout} />
          )}

          {/* Contenido principal */}
          <Routes>
            {isAdmin ? (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/rendimiento" element={<Rendimiento />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </>
            ) : (
              <>
                <Route path="/mis-pedidos" element={<MisPedidos user={user} />} />
                <Route path="*" element={<Navigate to="/mis-pedidos" />} />
              </>
            )}
          </Routes>
        </div>
      </PedidosProvider>
    </Router>
  );
}

export default App;
