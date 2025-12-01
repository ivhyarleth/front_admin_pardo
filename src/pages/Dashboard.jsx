import { useState, useEffect } from 'react';
import { getAllOrdersAPI, getWorkersAPI, assignWorkerAPI, getSelectedSede, setSelectedSede, getUserData } from '../config/api';
import { ToastContainer } from '../components/ui/Toast';
import { Loading } from '../components/ui/Loading';
import { getEstadoColor } from '../lib/statusColors';

const Dashboard = () => {
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
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos al montar y cuando cambie la sede
  useEffect(() => {
    loadData();
  }, [selectedSede]);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = getUserData();
      const sede = selectedSede || user?.tenant_id_sede || 'pardo_miraflores';
      
      // Cargar pedidos y trabajadores en paralelo
      const [ordersData, workersData] = await Promise.all([
        getAllOrdersAPI(sede),
        getWorkersAPI(sede)
      ]);
      
      // Transformar pedidos del backend al formato del frontend
      const pedidosTransformados = ordersData.map(pedido => ({
        id: pedido.pedido_id,
        pedido_id: pedido.pedido_id,
        horaGeneracion: new Date(pedido.fecha_inicio).toLocaleTimeString('es-PE'),
        fecha_inicio: pedido.fecha_inicio,
        sede: pedido.tenant_id === 'pardo_miraflores' ? 'Pardo Miraflores' : 
              pedido.tenant_id === 'pardo_surco' ? 'Pardo Surco' : pedido.tenant_id,
        tenant_id: pedido.tenant_id,
        monto: pedido.precio_total || 0,
        encargado: pedido.chef_id ? { id: pedido.chef_id, nombre: 'Chef asignado' } : null,
        motorizado: pedido.motorizado_id ? { id: pedido.motorizado_id, nombre: 'Motorizado asignado' } : null,
        productos: pedido.productos || [],
        status: mapearEstadoBackend(pedido.estado),
        estado_backend: pedido.estado,
        historialEstados: [],
        tiempoTotal: calcularTiempoTotal(pedido),
        createdAt: new Date(pedido.fecha_inicio).getTime()
      }));
      
      setPedidos(pedidosTransformados);
      
      // Transformar trabajadores
      const trabajadoresTransformados = workersData.map(t => ({
        id: t.user_id,
        user_id: t.user_id,
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

  // Mapear estados del backend a estados del frontend
  const mapearEstadoBackend = (estadoBackend) => {
    const mapeo = {
      'pendiente': 'Pedido Pendiente',
      'preparando': 'Pedido Preparado',
      'despachando': 'Pedido Enviado',
      'despachado': 'Pedido Enviado',
      'recogiendo': 'Pedido Enviado',
      'en_camino': 'Pedido Enviado',
      'entregado': 'Pedido Recibido',
      'cancelado': 'Pedido Cancelado',
      'rechazado': 'Pedido Cancelado'
    };
    return mapeo[estadoBackend] || 'Pedido Creado';
  };

  // Calcular tiempo total del pedido
  const calcularTiempoTotal = (pedido) => {
    if (!pedido.fecha_inicio) return 0;
    const inicio = new Date(pedido.fecha_inicio).getTime();
    const fin = pedido.fecha_fin ? new Date(pedido.fecha_fin).getTime() : Date.now();
    return fin - inicio;
  };

  // Formatear tiempo
  const formatearTiempo = (milisegundos) => {
    const totalSegundos = Math.floor(milisegundos / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  };

  // Obtener progreso del pedido
  const getProgresoPedido = (status) => {
    const estados = [
      'Pedido Creado',
      'Pedido Pendiente',
      'Pedido Preparado',
      'Pedido Enviado',
      'Pedido Recibido'
    ];
    const index = estados.indexOf(status);
    return index >= 0 ? ((index + 1) / estados.length) * 100 : 0;
  };

  // Obtener color del estado usando la función centralizada
  const getStatusColor = (status) => {
    const colorInfo = getEstadoColor(status);
    return `${colorInfo.bg} ${colorInfo.text}`;
  };

  // Asignar chef
  const handleAsignarChef = async (pedidoId, trabajadorEmail, tenantId) => {
    const key = `${pedidoId}_chef`;
    setAsignando(prev => ({ ...prev, [key]: true }));
    
    try {
      await assignWorkerAPI(pedidoId, trabajadorEmail, 'chef', tenantId);
      addToast('✅ Chef asignado correctamente', 'success');
      
      // Actualizar solo el pedido específico sin recargar toda la página
      setPedidos(prevPedidos => 
        prevPedidos.map(p => 
          p.pedido_id === pedidoId 
            ? { ...p, encargado: { id: trabajadorEmail, nombre: trabajadores.find(t => t.email === trabajadorEmail)?.nombre || 'Chef asignado' } }
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

  // Asignar motorizado
  const handleAsignarMotorizado = async (pedidoId, trabajadorEmail, tenantId) => {
    const key = `${pedidoId}_motorizado`;
    setAsignando(prev => ({ ...prev, [key]: true }));
    
    try {
      await assignWorkerAPI(pedidoId, trabajadorEmail, 'motorizado', tenantId);
      addToast('✅ Motorizado asignado correctamente', 'success');
      
      // Actualizar solo el pedido específico sin recargar toda la página
      setPedidos(prevPedidos => 
        prevPedidos.map(p => 
          p.pedido_id === pedidoId 
            ? { ...p, motorizado: { id: trabajadorEmail, nombre: trabajadores.find(t => t.email === trabajadorEmail)?.nombre || 'Motorizado asignado' } }
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

  // Refrescar datos
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Cambiar sede
  const handleChangeSede = (sede) => {
    setSelectedSedeState(sede);
    setSelectedSede(sede);
  };

  // Filtrar trabajadores por tipo (excluir todos los admins)
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
      {/* Header con selector de sede */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="font-spartan font-black text-4xl mb-2">
          <span className="text-pardos-rust">DASHBOARD</span> DE{' '}
          <span className="text-black">PEDIDOS</span>
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
          
          {/* Botón de refrescar */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-pardos-rust hover:bg-pardos-brown text-white rounded-lg font-spartan font-bold transition-colors disabled:opacity-50"
          >
            {refreshing ? '🔄 Actualizando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-gray-500 font-lato text-xl">Cargando pedidos...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <div className="text-8xl mb-4">📦</div>
              <h2 className="text-3xl font-spartan font-black text-gray-800 mb-2">
                No hay pedidos
              </h2>
              <p className="text-gray-500 font-lato text-lg mb-6">
                No hay pedidos registrados en {selectedSede === 'pardo_miraflores' ? 'Pardo Miraflores' : 'Pardo Surco'} en este momento
              </p>
            </div>
            <div className="bg-gradient-to-br from-pardos-rust/10 to-pardos-brown/10 rounded-lg p-6 border-2 border-pardos-rust/20">
              <h3 className="font-spartan font-bold text-lg text-gray-800 mb-3">
                💡 Información útil
              </h3>
              <ul className="text-left space-y-2 text-gray-600 font-lato">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Los pedidos aparecerán aquí cuando los clientes realicen sus órdenes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Puedes asignar chefs y motorizados desde este dashboard</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Usa el botón "Actualizar" para refrescar la lista de pedidos</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
            <thead className="bg-pardos-brown text-white">
              <tr>
                <th className="px-6 py-4 text-left font-spartan font-bold">ID PEDIDO</th>
                <th className="px-6 py-4 text-left font-spartan font-bold">HORA</th>
                <th className="px-6 py-4 text-left font-spartan font-bold">SEDE</th>
                <th className="px-6 py-4 text-left font-spartan font-bold">MONTO</th>
                <th className="px-6 py-4 text-left font-spartan font-bold">PRODUCTOS</th>
                <th className="px-6 py-4 text-left font-spartan font-bold">👨‍🍳 CHEF</th>
                <th className="px-6 py-4 text-left font-spartan font-bold">🏍️ MOTORIZADO</th>
                <th className="px-6 py-4 text-left font-spartan font-bold">ESTADO</th>
                <th className="px-6 py-4 text-left font-spartan font-bold">TIEMPO</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => {
                const progreso = getProgresoPedido(pedido.status);
                const chefsDisponibles = getChefsDisponibles();
                const motorizadosDisponibles = getMotorizadosDisponibles();
                
                return (
                  <tr key={pedido.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-lato font-bold text-sm">
                      {pedido.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 font-lato">{pedido.horaGeneracion}</td>
                    <td className="px-6 py-4 font-lato">{pedido.sede}</td>
                    <td className="px-6 py-4 font-lato font-bold text-pardos-rust">
                      S/ {pedido.monto.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {pedido.productos && pedido.productos.length > 0 ? (
                        <div className="max-w-xs">
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-lato text-pardos-dark hover:text-pardos-rust font-bold">
                              {pedido.productos.length} {pedido.productos.length === 1 ? 'producto' : 'productos'} ▼
                            </summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <ul className="space-y-1">
                                {pedido.productos.map((producto, idx) => (
                                  <li key={idx} className="text-xs font-lato text-gray-700">
                                    • {producto.nombre || producto.nombre_producto || `Producto ${idx + 1}`} 
                                    {producto.quantity && ` (x${producto.quantity})`}
                                    {producto.price && ` - S/ ${Number(producto.price).toFixed(2)}`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </details>
                        </div>
                      ) : (
                        <span className="text-xs font-lato text-gray-400">Sin productos</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {pedido.encargado ? (
                        <div className="flex items-center space-x-2">
                          <span className="font-lato text-sm">✅ Asignado</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            className="w-full px-2 py-1 text-xs bg-white border border-pardos-rust rounded font-lato focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <option value="">Sin asignar</option>
                            {chefsDisponibles.map((t) => (
                              <option key={t.id} value={t.email}>{t.nombre}</option>
                            ))}
                          </select>
                          {asignando[`${pedido.pedido_id}_chef`] && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <Loading size="sm" />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {pedido.motorizado ? (
                        <div className="flex items-center space-x-2">
                          <span className="font-lato text-sm">✅ Asignado</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            className="w-full px-2 py-1 text-xs bg-white border border-pardos-rust rounded font-lato focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <option value="">Sin asignar</option>
                            {motorizadosDisponibles.map((t) => (
                              <option key={t.id} value={t.email}>{t.nombre}</option>
                            ))}
                          </select>
                          {asignando[`${pedido.pedido_id}_motorizado`] && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <Loading size="sm" />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full font-spartan font-bold text-xs ${getStatusColor(pedido.status)} inline-block`}>
                        {pedido.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-orange-500 to-blue-500 h-full transition-all duration-500"
                              style={{width: `${progreso}%`}}
                            ></div>
                          </div>
                        </div>
                        <span className="font-lato text-xs font-bold text-pardos-dark block">
                          {formatearTiempo(pedido.tiempoTotal)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-spartan font-bold mb-3">LEYENDA DE ESTADOS:</h3>
        <div className="flex flex-wrap gap-3">
          <span className="px-4 py-2 rounded-full bg-red-500 text-white text-sm font-spartan">
            Pendiente
          </span>
          <span className="px-4 py-2 rounded-full bg-yellow-400 text-yellow-900 text-sm font-spartan">
            Preparando
          </span>
          <span className="px-4 py-2 rounded-full bg-green-500 text-white text-sm font-spartan">
            Despachado
          </span>
          <span className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-spartan">
            En Camino
          </span>
          <span className="px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-spartan">
            Entregado
          </span>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Dashboard;
