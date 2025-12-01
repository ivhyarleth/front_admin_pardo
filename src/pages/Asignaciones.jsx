import { useState, useEffect } from 'react';
import { getAllOrdersAPI, getWorkersAPI, assignWorkerAPI, getSelectedSede, setSelectedSede, getUserData } from '../config/api';
import { ToastContainer } from '../components/ui/Toast';
import { Loading } from '../components/ui/Loading';
import { getEstadoColor } from '../lib/statusColors';

const Asignaciones = () => {
  const [pedidos, setPedidos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [asignando, setAsignando] = useState({}); // { pedidoId_tipo: true/false }
  const user = getUserData();
  // Si el admin tiene tenant_id_sede, es admin por sede y solo puede ver su sede
  const isAdminPorSede = user?.tenant_id_sede && user?.staff_tier === 'admin';
  const sedeFija = isAdminPorSede ? user.tenant_id_sede : null;
  const [selectedSede, setSelectedSedeState] = useState(sedeFija || getSelectedSede());
  const [filtroEstado, setFiltroEstado] = useState('todos'); // todos, pendiente, preparando

  useEffect(() => {
    loadData();
  }, [selectedSede, filtroEstado]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, workersData] = await Promise.all([
        getAllOrdersAPI(selectedSede),
        getWorkersAPI(selectedSede)
      ]);
      
      // Filtrar pedidos que necesitan asignación
      const pedidosFiltrados = ordersData.filter(p => {
        if (filtroEstado === 'todos') return true;
        if (filtroEstado === 'pendiente') return p.estado === 'pendiente';
        if (filtroEstado === 'preparando') return p.estado === 'preparando';
        return true;
      });
      
      // Transformar pedidos
      const pedidosTransformados = pedidosFiltrados.map(pedido => ({
        id: pedido.pedido_id,
        pedido_id: pedido.pedido_id,
        horaInicial: new Date(pedido.fecha_inicio).toLocaleTimeString('es-PE'),
        sede: pedido.tenant_id === 'pardo_miraflores' ? 'Pardo Miraflores' : 
              pedido.tenant_id === 'pardo_surco' ? 'Pardo Surco' : pedido.tenant_id,
        tenant_id: pedido.tenant_id,
        productos: pedido.productos || [],
        status: pedido.estado,
        estado_backend: pedido.estado,
        tiempo: calcularTiempo(pedido),
        chef_id: pedido.chef_id,
        motorizado_id: pedido.motorizado_id,
        precio_total: pedido.precio_total || 0
      }));
      
      setPedidos(pedidosTransformados);
      
      // Transformar trabajadores
      const trabajadoresTransformados = workersData.map(t => ({
        id: t.user_id,
        email: t.email,
        nombre: t.name || t.email.split('@')[0],
        staff_tier: t.staff_tier
      }));
      
      setTrabajadores(trabajadoresTransformados);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar datos: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const calcularTiempo = (pedido) => {
    if (!pedido.fecha_inicio) return '00:00:00';
    const inicio = new Date(pedido.fecha_inicio).getTime();
    const fin = pedido.fecha_fin ? new Date(pedido.fecha_fin).getTime() : Date.now();
    const segundos = Math.floor((fin - inicio) / 1000);
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const seg = segundos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  };

  const getStatusInfo = (status) => {
    const colorInfo = getEstadoColor(status);
    const statusTextMap = {
      'pendiente': 'PEDIDO PENDIENTE',
      'preparando': 'PEDIDO PREPARADO',
      'despachando': 'PEDIDO DESPACHANDO',
      'despachado': 'PEDIDO DESPACHADO',
      'recogiendo': 'RECOGIENDO',
      'en_camino': 'EN CAMINO',
      'entregado': 'ENTREGADO',
      'cancelado': 'CANCELADO',
      'rechazado': 'RECHAZADO'
    };
    return {
      color: colorInfo.bg,
      text: statusTextMap[status] || 'PEDIDO PENDIENTE',
      textColor: colorInfo.text
    };
  };

  const handleAsignarChef = async (pedidoId, trabajadorEmail, tenantId) => {
    const key = `${pedidoId}_chef`;
    setAsignando(prev => ({ ...prev, [key]: true }));
    
    try {
      await assignWorkerAPI(pedidoId, trabajadorEmail, 'chef', tenantId);
      addToast('✅ Chef asignado correctamente', 'success');
      
      // Actualizar solo el pedido específico sin recargar toda la página
      const trabajadorNombre = trabajadores.find(t => t.email === trabajadorEmail)?.nombre || 'Chef asignado';
      setPedidos(prevPedidos => 
        prevPedidos.map(p => 
          p.pedido_id === pedidoId 
            ? { ...p, chef_id: trabajadorEmail, chef_nombre: trabajadorNombre }
            : p
        )
      );
    } catch (error) {
      console.error('Error asignando chef:', error);
      addToast('Error al asignar chef: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setAsignando(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleAsignarMotorizado = async (pedidoId, trabajadorEmail, tenantId) => {
    const key = `${pedidoId}_motorizado`;
    setAsignando(prev => ({ ...prev, [key]: true }));
    
    try {
      await assignWorkerAPI(pedidoId, trabajadorEmail, 'motorizado', tenantId);
      addToast('✅ Motorizado asignado correctamente', 'success');
      
      // Actualizar solo el pedido específico sin recargar toda la página
      const trabajadorNombre = trabajadores.find(t => t.email === trabajadorEmail)?.nombre || 'Motorizado asignado';
      setPedidos(prevPedidos => 
        prevPedidos.map(p => 
          p.pedido_id === pedidoId 
            ? { ...p, motorizado_id: trabajadorEmail, motorizado_nombre: trabajadorNombre }
            : p
        )
      );
    } catch (error) {
      console.error('Error asignando motorizado:', error);
      addToast('Error al asignar motorizado: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setAsignando(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleChangeSede = (sede) => {
    setSelectedSedeState(sede);
    setSelectedSede(sede);
    loadData();
  };

  const getTrabajadoresDisponibles = () => {
    return trabajadores.filter(t => {
      // Excluir todos los admins (tanto admin general como admins por sede)
      // Solo incluir trabajadores (staff_tier === 'trabajador')
      return t.staff_tier === 'trabajador';
    });
  };

  // Filtrar solo chefs
  const getChefsDisponibles = () => {
    return getTrabajadoresDisponibles().filter(t => {
      const email = (t.email || '').toLowerCase();
      const nombre = (t.nombre || '').toLowerCase();
      // Identificar chefs por email o nombre
      return email.includes('chef') || nombre.includes('chef');
    });
  };

  // Filtrar solo motorizados
  const getMotorizadosDisponibles = () => {
    return getTrabajadoresDisponibles().filter(t => {
      const email = (t.email || '').toLowerCase();
      const nombre = (t.nombre || '').toLowerCase();
      // Identificar motorizados por email o nombre
      return email.includes('motorizado') || nombre.includes('motorizado');
    });
  };

  // Agregar toast
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration: 3000 }]);
  };

  // Remover toast
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="flex-1 bg-white p-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="font-spartan font-black text-4xl mb-2">
          <span className="text-pardos-rust">GESTIÓN</span> DE{' '}
          <span className="text-black">ASIGNACIONES</span>
        </h1>
        <div className="flex items-center gap-4">
          {/* Selector de Sede */}
          {isAdminPorSede ? (
            <div className="px-4 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg font-lato text-gray-600">
              {selectedSede === 'pardo_miraflores' ? 'Pardo Miraflores' : 'Pardo Surco'} (Sede Fija)
            </div>
          ) : (
            <select
              value={selectedSede}
              onChange={(e) => handleChangeSede(e.target.value)}
              className="px-4 py-2 border-2 border-pardos-rust rounded-lg font-lato focus:outline-none focus:ring-2 focus:ring-pardos-orange"
            >
              <option value="pardo_miraflores">Pardo Miraflores</option>
              <option value="pardo_surco">Pardo Surco</option>
            </select>
          )}
          
          {/* Filtro de Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              // No llamar loadData() aquí, el useEffect se encargará
            }}
            className="px-4 py-2 border-2 border-pardos-rust rounded-lg font-lato focus:outline-none focus:ring-2 focus:ring-pardos-orange"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="preparando">Preparando</option>
          </select>
          
          {/* Botón de refrescar */}
          <button
            onClick={loadData}
            className="px-4 py-2 bg-pardos-rust hover:bg-pardos-brown text-white rounded-lg font-spartan font-bold transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-gray-500 font-lato text-xl">Cargando pedidos...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 font-lato text-xl">
            No hay pedidos para asignar en este momento
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pedidos.map((pedido) => {
            const statusInfo = getStatusInfo(pedido.status || pedido.estado_backend || 'pendiente');
            const chefsDisponibles = getChefsDisponibles();
            const motorizadosDisponibles = getMotorizadosDisponibles();
            
            return (
              <div key={pedido.id} className="border-4 border-gray-300 rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                {/* Header */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-pardos-yellow p-4 rounded-lg text-center">
                    <div className="font-spartan font-bold text-black text-lg">ID PEDIDO</div>
                    <div className="font-spartan font-black text-2xl text-pardos-dark mt-2">
                      {pedido.id.substring(0, 8)}...
                    </div>
                  </div>
                  <div className="bg-green-600 p-4 rounded-lg text-center text-white">
                    <div className="font-spartan font-bold text-lg">SEDE</div>
                    <div className="font-spartan font-black text-2xl mt-2">
                      {pedido.sede}
                    </div>
                  </div>
                  <div className="bg-pardos-brown p-4 rounded-lg text-center text-white">
                    <div className="font-spartan font-bold text-lg">HORA INICIAL</div>
                    <div className="font-spartan font-black text-2xl mt-2">
                      {pedido.horaInicial}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Lista de Productos */}
                  <div>
                    <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                      <h3 className="font-spartan font-bold text-lg mb-4">LISTA DE PRODUCTOS</h3>
                      <ul className="space-y-2">
                        {pedido.productos.map((producto, i) => (
                          <li key={i} className="font-lato text-gray-700">
                            • {producto.nombre || `Producto ${i + 1}`} (x{producto.cantidad || 1})
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <div className="font-spartan font-bold text-lg text-pardos-rust">
                          Total: S/ {pedido.precio_total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center justify-center">
                    <div className={`${statusInfo.color} ${statusInfo.textColor} px-8 py-4 rounded-xl text-center shadow-lg w-full transform transition-transform hover:scale-105`}>
                      <div className="font-spartan font-black text-xl">
                        {statusInfo.text}
                      </div>
                    </div>
                  </div>

                  {/* Asignaciones */}
                  <div className="space-y-4">
                    {/* Asignar Chef */}
                    <div>
                      <label className="font-spartan font-bold text-sm mb-2 block">
                        👨‍🍳 CHEF:
                      </label>
                      {pedido.chef_id ? (
                        <div className="bg-green-100 p-3 rounded-lg text-center border-2 border-green-300">
                          <span className="font-lato font-bold text-green-700">✅ {pedido.chef_nombre || 'Chef Asignado'}</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            className="w-full px-3 py-2 bg-white border-2 border-pardos-rust rounded-lg font-lato focus:outline-none focus:ring-2 focus:ring-pardos-orange disabled:opacity-50 disabled:cursor-not-allowed"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAsignarChef(pedido.pedido_id, e.target.value, pedido.tenant_id);
                                // Resetear el select después de asignar
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            disabled={asignando[`${pedido.pedido_id}_chef`]}
                          >
                            <option value="">Seleccionar Chef</option>
                            {chefsDisponibles.map((t) => (
                              <option key={t.id} value={t.email}>{t.nombre}</option>
                            ))}
                          </select>
                          {asignando[`${pedido.pedido_id}_chef`] && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loading size="sm" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Asignar Motorizado */}
                    <div>
                      <label className="font-spartan font-bold text-sm mb-2 block">
                        🏍️ MOTORIZADO:
                      </label>
                      {pedido.motorizado_id ? (
                        <div className="bg-green-100 p-3 rounded-lg text-center border-2 border-green-300">
                          <span className="font-lato font-bold text-green-700">✅ {pedido.motorizado_nombre || 'Motorizado Asignado'}</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            className="w-full px-3 py-2 bg-white border-2 border-pardos-rust rounded-lg font-lato focus:outline-none focus:ring-2 focus:ring-pardos-orange disabled:opacity-50 disabled:cursor-not-allowed"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAsignarMotorizado(pedido.pedido_id, e.target.value, pedido.tenant_id);
                                // Resetear el select después de asignar
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            disabled={asignando[`${pedido.pedido_id}_motorizado`]}
                          >
                            <option value="">Seleccionar Motorizado</option>
                            {motorizadosDisponibles.map((t) => (
                              <option key={t.id} value={t.email}>{t.nombre}</option>
                            ))}
                          </select>
                          {asignando[`${pedido.pedido_id}_motorizado`] && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loading size="sm" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tiempo */}
                    <div className="text-center bg-gray-100 p-4 rounded-lg">
                      <div className="font-spartan font-bold text-gray-600 text-sm mb-1">
                        TIEMPO TRANSCURRIDO
                      </div>
                      <div className="font-spartan font-black text-2xl text-pardos-rust">
                        {pedido.tiempo}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Asignaciones;
