import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PedidosProvider } from './context/PedidosContext';
import { ToastProvider } from './components/ui/Toast';
import { logoutAPI } from './config/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Inventario from './pages/Inventario';
import Asignaciones from './pages/Asignaciones';
import MisPedidos from './pages/MisPedidos';
import SidebarAdmin from './components/SidebarAdmin';
import SidebarTrabajador from './components/SidebarTrabajador';

// Lazy load Rendimiento (tiene recharts que es pesado)
const Rendimiento = lazy(() => import('./pages/Rendimiento'));

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

  const handleLogout = async () => {
    // Limpiar estado y localStorage PRIMERO para evitar renderizado intermedio
    setUser(null);
    localStorage.removeItem('pardos-system-token');
    localStorage.removeItem('pardos-system-user');
    localStorage.removeItem('pardos-selected-sede');
    
    // Luego llamar al API de logout (sin esperar respuesta)
    try {
      logoutAPI().catch(err => console.error('Error en logout API:', err));
    } catch (error) {
      console.error('Error en logout API:', error);
    }
    
    // Forzar redirección al login
    window.location.href = '/login';
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
  const isAdmin = user.rol === 'admin' || user.staff_tier === 'admin';

  return (
    <Router>
      <ToastProvider>
        <PedidosProvider>
          <div className="flex min-h-screen bg-white">
          {/* Sidebar según el rol */}
          {isAdmin ? (
            <SidebarAdmin user={user} onLogout={handleLogout} />
          ) : (
            <SidebarTrabajador user={user} onLogout={handleLogout} />
          )}

          {/* Contenido principal */}
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pardos-rust mx-auto mb-4"></div>
                <p className="text-gray-600 font-lato">Cargando...</p>
              </div>
            </div>
          }>
            <Routes>
              {isAdmin ? (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/productos" element={<Productos />} />
                  <Route path="/inventario" element={<Inventario />} />
                  <Route path="/asignaciones" element={<Asignaciones />} />
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
          </Suspense>
          </div>
        </PedidosProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
