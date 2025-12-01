import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAPI } from '../config/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState(null); // 'admin' o 'trabajador'
  const [tenantIdSede, setTenantIdSede] = useState('pardo_miraflores'); // Sede seleccionada
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rolSeleccionado) {
      setError('Por favor selecciona tu rol');
      return;
    }

    // Si es trabajador, validar que haya seleccionado una sede
    // Si es admin, la sede es opcional (puede ser admin general con tenant_id_sede: null)
    if (rolSeleccionado === 'trabajador') {
      if (!tenantIdSede) {
        setError('Por favor selecciona una sede');
        return;
      }
    }

    setLoading(true);
    setError('');
    
    try {
      // Para admin, permitir enviar null si no se seleccionó sede (admin general)
      // Para trabajador, siempre enviar la sede seleccionada
      const sedeParaEnviar = rolSeleccionado === 'admin' && !tenantIdSede ? null : tenantIdSede;
      
      // Llamar al API real
      const data = await loginAPI(email, password, 'staff', sedeParaEnviar);
      
      // Preparar datos del usuario para el contexto
      const userData = {
        email: data.user.email,
        nombre: data.user.name || data.user.email.split('@')[0],
        rol: data.user.staff_tier === 'admin' ? 'admin' : 'trabajador',
        id: data.user.user_id,
        staff_tier: data.user.staff_tier,
        tenant_id_sede: data.user.tenant_id_sede,
        permissions: data.user.permissions || []
      };
      
      onLogin(userData);
      
      // Redirigir según el rol
      if (userData.rol === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/mis-pedidos');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Logo & Tagline */}
        <div className="flex flex-col items-center justify-center space-y-6 p-8">
          <div className="w-64 h-64 flex items-center justify-center">
            <img
              src="https://images-frontent-user-pardos.s3.us-east-1.amazonaws.com/logo_pardos_blanco.jpg"
              alt="Logo Pardos Chicken"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="font-spartan font-black text-white text-3xl mb-2 border-t-4 border-b-4 border-white py-2">
              A BRASA LO NUESTRO
            </h1>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-pardos-rust rounded-3xl p-8 shadow-2xl border-4 border-pardos-brown">
          <h2 className="text-white font-spartan font-bold text-3xl mb-6 text-center">
            Hola COLABORADOR
          </h2>
          
          {/* Selección de Rol */}
          <div className="mb-6">
            <label className="text-white font-spartan font-bold mb-3 block text-center">
              SELECCIONA TU ROL
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRolSeleccionado('admin')}
                className={`py-4 px-6 rounded-full font-spartan font-bold transition-all ${
                  rolSeleccionado === 'admin'
                    ? 'bg-pardos-yellow text-pardos-dark scale-105 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                👨‍💼 ADMIN
              </button>
              <button
                type="button"
                onClick={() => setRolSeleccionado('trabajador')}
                className={`py-4 px-6 rounded-full font-spartan font-bold transition-all ${
                  rolSeleccionado === 'trabajador'
                    ? 'bg-pardos-yellow text-pardos-dark scale-105 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                👨‍🍳 TRABAJADOR
              </button>
            </div>
          </div>

          {/* Selección de Sede (solo para staff) */}
          {rolSeleccionado && (
            <div className="mb-6">
              <label className="text-white font-spartan font-bold mb-3 block text-center">
                SELECCIONA LA SEDE {rolSeleccionado === 'admin' && <span className="text-xs text-white/70">(Opcional para Admin General)</span>}
              </label>
              <select
                value={tenantIdSede}
                onChange={(e) => setTenantIdSede(e.target.value)}
                className="w-full px-6 py-4 rounded-full font-lato text-gray-700 focus:outline-none focus:ring-4 focus:ring-pardos-orange"
                required={rolSeleccionado === 'trabajador'}
              >
                <option value="">{rolSeleccionado === 'admin' ? 'Admin General (Todas las sedes)' : 'Selecciona una sede'}</option>
                <option value="pardo_miraflores">Pardo Miraflores</option>
                <option value="pardo_surco">Pardo Surco</option>
              </select>
              {rolSeleccionado === 'admin' && (
                <p className="text-white/70 text-xs mt-2 text-center">
                  💡 Deja en blanco si eres Admin General (ves todas las sedes)
                </p>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 rounded-full font-lato text-gray-700 focus:outline-none focus:ring-4 focus:ring-pardos-orange"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-full font-lato text-gray-700 focus:outline-none focus:ring-4 focus:ring-pardos-orange pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  )}
                </svg>
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-pardos-purple hover:bg-pardos-brown text-white font-spartan font-bold py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!rolSeleccionado || loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {error && (
            <p className="text-center text-red-200 text-sm mt-4 font-lato bg-red-500/20 py-2 px-4 rounded-lg">
              ⚠️ {error}
            </p>
          )}

          {!rolSeleccionado && !error && (
            <p className="text-center text-white/70 text-sm mt-4 font-lato">
              ⚠️ Selecciona tu rol para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
