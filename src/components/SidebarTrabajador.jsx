import { useNavigate } from 'react-router-dom';

const SidebarTrabajador = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-black text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 flex flex-col items-center border-b border-gray-700">
        <img
          src="https://images-frontent-user-pardos.s3.us-east-1.amazonaws.com/logo_pardos_blanco.jpg"
          alt="Logo Pardos Chicken"
          className="w-32 h-32 object-contain mb-4"
        />
      </div>

      {/* User Info */}
      <div className="p-6 text-center border-b border-gray-700">
        <h2 className="font-spartan font-bold text-xl mb-1">
          Hola<br />
          <span className="text-2xl">COLABORADOR</span>
        </h2>
        {user && (
          <p className="text-sm text-gray-400 font-lato mt-2">{user.nombre}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="block px-6 py-3 rounded-lg font-spartan font-medium bg-pardos-yellow text-pardos-dark">
          Asignaciones
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full bg-pardos-rust hover:bg-pardos-brown text-white px-6 py-3 rounded-lg font-spartan font-bold transition-colors flex items-center justify-center space-x-2"
        >
          <span>CERRAR SESIÓN</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default SidebarTrabajador;
