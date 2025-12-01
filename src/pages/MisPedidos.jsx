import { useEffect, useState } from 'react';
import { getMyAssignmentsAPI, chefConfirmaAPI, despachadoConfirmaAPI, motorizadoConfirmaAPI, getOrderStatusAPI, getOrderByIdAPI, getUserData, getSelectedSede } from '../config/api';
import { getEstadoColor } from '../lib/statusColors';
import { ToastContainer } from '../components/ui/Toast';
import { Loading } from '../components/ui/Loading';

const MisPedidos = ({ user }) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [procesando, setProcesando] = useState({}); // { pedidoId: true/false }
  const [historialDialog, setHistorialDialog] = useState({ open: false, pedido: null, historial: [] });

  useEffect(() => {
    loadMyOrders();
  }, [user?.id]);

  const loadMyOrders = async () => {
    setLoading(true);
    try {
      const sede = getSelectedSede();
      const orders = await getMyAssignmentsAPI(null, sede); // null = todos los tipos
      
      // Debug: Ver qué viene del backend
      console.log('📦 Pedidos recibidos del backend:', orders);
      
      // Transformar pedidos del backend
      const pedidosTransformados = orders.map(pedido => {
        const pedidoTransformado = {
          id: pedido.pedido_id,
          pedido_id: pedido.pedido_id,
          horaGeneracion: new Date(pedido.fecha_inicio).toLocaleTimeString('es-PE'),
          fecha_inicio: pedido.fecha_inicio,
          sede: pedido.tenant_id === 'pardo_miraflores' ? 'Pardo Miraflores' : 
                pedido.tenant_id === 'pardo_surco' ? 'Pardo Surco' : pedido.tenant_id,
          tenant_id: pedido.tenant_id,
          productos: pedido.productos || [],
          status: mapearEstadoBackend(pedido.estado),
          estado_backend: pedido.estado,
          tiempoTotal: calcularTiempoTotal(pedido),
          createdAt: new Date(pedido.fecha_inicio).getTime(),
          mi_rol: pedido.mi_rol || {}
        };
        
        // Debug: Ver el pedido transformado
        console.log('🔄 Pedido transformado:', pedidoTransformado);
        
        return pedidoTransformado;
      });
      
      setPedidos(pedidosTransformados);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      addToast('Error al cargar pedidos: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const mapearEstadoBackend = (estadoBackend) => {
    const mapeo = {
      'pendiente': 'PEDIDO PENDIENTE',
      'preparando': 'PEDIDO PREPARADO',
      'despachando': 'PEDIDO ENVIADO',
      'despachado': 'PEDIDO ENVIADO',
      'recogiendo': 'PEDIDO ENVIADO',
      'en_camino': 'PEDIDO ENVIADO',
      'entregado': 'PEDIDO RECIBIDO',
      'cancelado': 'PEDIDO CANCELADO',
      'rechazado': 'PEDIDO CANCELADO'
    };
    return mapeo[estadoBackend] || 'PEDIDO CREADO';
  };

  const calcularTiempoTotal = (pedido) => {
    if (!pedido.fecha_inicio) return 0;
    const inicio = new Date(pedido.fecha_inicio).getTime();
    const fin = pedido.fecha_fin ? new Date(pedido.fecha_fin).getTime() : Date.now();
    return fin - inicio;
  };

  const formatearTiempo = (milisegundos) => {
    const totalSegundos = Math.floor(milisegundos / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  };

  const getStatusInfo = (status) => {
    // status viene como 'PEDIDO PENDIENTE', 'PEDIDO PREPARADO', etc.
    // Necesitamos mapearlo al estado backend para obtener el color correcto
    const statusToBackendMap = {
      'PEDIDO CREADO': 'pendiente',
      'PEDIDO PENDIENTE': 'pendiente',
      'PEDIDO PREPARADO': 'preparando',
      'PEDIDO ENVIADO': 'despachado',
      'PEDIDO RECIBIDO': 'entregado',
      'PEDIDO CANCELADO': 'cancelado'
    };
    
    const estadoBackend = statusToBackendMap[status] || 'pendiente';
    const colorInfo = getEstadoColor(estadoBackend);
    
    const statusTextMap = {
      'PEDIDO CREADO': 'PEDIDO CREADO',
      'PEDIDO PENDIENTE': 'PEDIDO PENDIENTE',
      'PEDIDO PREPARADO': 'PEDIDO PREPARADO',
      'PEDIDO ENVIADO': 'PEDIDO DESPACHADO',
      'PEDIDO RECIBIDO': 'PEDIDO RECIBIDO',
      'PEDIDO CANCELADO': 'PEDIDO CANCELADO'
    };
    
    return {
      color: colorInfo.bg,
      text: statusTextMap[status] || 'PEDIDO CREADO',
      textColor: colorInfo.text
    };
  };

  // Función para actualizar un pedido específico
  const actualizarPedidoEnLista = async (pedidoId, tenantId) => {
    try {
      const pedidoActualizado = await getOrderByIdAPI(pedidoId, tenantId);
      if (pedidoActualizado) {
        const pedidoTransformado = {
          id: pedidoActualizado.pedido_id,
          pedido_id: pedidoActualizado.pedido_id,
          horaGeneracion: new Date(pedidoActualizado.fecha_inicio).toLocaleTimeString('es-PE'),
          fecha_inicio: pedidoActualizado.fecha_inicio,
          sede: pedidoActualizado.tenant_id === 'pardo_miraflores' ? 'Pardo Miraflores' : 
                pedidoActualizado.tenant_id === 'pardo_surco' ? 'Pardo Surco' : pedidoActualizado.tenant_id,
          tenant_id: pedidoActualizado.tenant_id,
          productos: pedidoActualizado.productos || [],
          status: mapearEstadoBackend(pedidoActualizado.estado),
          estado_backend: pedidoActualizado.estado,
          tiempoTotal: calcularTiempoTotal(pedidoActualizado),
          createdAt: new Date(pedidoActualizado.fecha_inicio).getTime(),
          mi_rol: pedidos.find(p => p.pedido_id === pedidoId)?.mi_rol || {}
        };
        
        setPedidos(prevPedidos =>
          prevPedidos.map(p =>
            p.pedido_id === pedidoId ? pedidoTransformado : p
          )
        );
      }
    } catch (error) {
      console.error('Error actualizando pedido:', error);
      // Si falla, recargar todos los pedidos como fallback
      loadMyOrders();
    }
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

  // Chef confirma pedido
  const handleChefConfirma = async (pedido) => {
    setProcesando(prev => ({ ...prev, [pedido.pedido_id]: true }));
    try {
      const userData = getUserData();
      await chefConfirmaAPI(pedido.pedido_id, userData.id, true, pedido.tenant_id);
      addToast('✅ Pedido confirmado para preparación', 'success');
      await actualizarPedidoEnLista(pedido.pedido_id, pedido.tenant_id);
    } catch (error) {
      console.error('Error confirmando pedido:', error);
      addToast('Error al confirmar pedido: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setProcesando(prev => ({ ...prev, [pedido.pedido_id]: false }));
    }
  };

  // Chef rechaza pedido
  const handleChefRechaza = async (pedido) => {
    setProcesando(prev => ({ ...prev, [pedido.pedido_id]: true }));
    try {
      const userData = getUserData();
      await chefConfirmaAPI(pedido.pedido_id, userData.id, false, pedido.tenant_id);
      addToast('❌ Pedido rechazado', 'error');
      await actualizarPedidoEnLista(pedido.pedido_id, pedido.tenant_id);
    } catch (error) {
      console.error('Error rechazando pedido:', error);
      addToast('Error al rechazar pedido: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setProcesando(prev => ({ ...prev, [pedido.pedido_id]: false }));
    }
  };

  // Despachado confirma
  const handleDespachadoConfirma = async (pedido) => {
    setProcesando(prev => ({ ...prev, [pedido.pedido_id]: true }));
    try {
      await despachadoConfirmaAPI(pedido.pedido_id, pedido.tenant_id);
      addToast('✅ Pedido despachado confirmado', 'success');
      await actualizarPedidoEnLista(pedido.pedido_id, pedido.tenant_id);
    } catch (error) {
      console.error('Error confirmando despachado:', error);
      addToast('Error al confirmar despachado: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setProcesando(prev => ({ ...prev, [pedido.pedido_id]: false }));
    }
  };

  // Motorizado confirma recogida
  const handleMotorizadoConfirma = async (pedido) => {
    setProcesando(prev => ({ ...prev, [pedido.pedido_id]: true }));
    try {
      const userData = getUserData();
      await motorizadoConfirmaAPI(pedido.pedido_id, userData.id, pedido.tenant_id);
      addToast('✅ Recogida confirmada, pedido en camino', 'success');
      await actualizarPedidoEnLista(pedido.pedido_id, pedido.tenant_id);
    } catch (error) {
      console.error('Error confirmando recogida:', error);
      addToast('Error al confirmar recogida: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setProcesando(prev => ({ ...prev, [pedido.pedido_id]: false }));
    }
  };

  // Ver historial de estados
  const handleVerHistorial = async (pedido) => {
    try {
      const data = await getOrderStatusAPI(pedido.pedido_id, true, pedido.tenant_id);
      if (data.historial && data.historial.length > 0) {
        setHistorialDialog({
          open: true,
          pedido: pedido,
          historial: data.historial
        });
      } else {
        addToast('No hay historial disponible', 'error');
      }
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      addToast('Error al obtener historial', 'error');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMyOrders();
    setRefreshing(false);
  };

  return (
    <div className="flex-1 bg-white p-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="font-spartan font-black text-4xl mb-2">
          <span className="text-pardos-rust">MIS</span> PEDIDOS{' '}
          <span className="text-black">ASIGNADOS</span>
        </h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-pardos-rust hover:bg-pardos-brown text-white rounded-lg font-spartan font-bold transition-colors disabled:opacity-50"
        >
          {refreshing ? '🔄 Actualizando...' : '🔄 Actualizar'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-gray-500 font-lato text-xl">Cargando pedidos...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 font-lato text-xl">
            No tienes pedidos asignados en este momento
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pedidos.map((pedido) => {
            const statusInfo = getStatusInfo(pedido.status);
            const esChef = pedido.mi_rol?.es_chef || false;
            const esMotorizado = pedido.mi_rol?.es_motorizado || false;
            
            // Debug: Log para ver qué está pasando
            console.log('Pedido:', {
              id: pedido.id,
              estado: pedido.estado_backend,
              esChef,
              esMotorizado,
              mi_rol: pedido.mi_rol
            });
            
            return (
              <div key={pedido.id} className="border-4 border-gray-300 rounded-2xl p-6 bg-white shadow-lg">
                {/* Header */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-pardos-yellow p-4 rounded-lg text-center">
                    <div className="font-spartan font-bold text-black text-lg">ID PEDIDO</div>
                    <div className="font-spartan font-black text-xl text-pardos-dark mt-2">
                      {pedido.id.substring(0, 8)}...
                    </div>
                  </div>
                  <div className="bg-green-600 p-4 rounded-lg text-center text-white">
                    <div className="font-spartan font-bold text-lg">SEDE</div>
                    <div className="font-spartan font-black text-xl mt-2">
                      {pedido.sede}
                    </div>
                  </div>
                  <div className="bg-pardos-brown p-4 rounded-lg text-center text-white">
                    <div className="font-spartan font-bold text-lg">HORA INICIAL</div>
                    <div className="font-spartan font-black text-xl mt-2">
                      {pedido.horaGeneracion}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Lista de Productos */}
                  <div>
                    <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                      <h3 className="font-spartan font-bold text-lg mb-4">LISTA DE PRODUCTOS</h3>
                      <ul className="space-y-2">
                        {pedido.productos && pedido.productos.length > 0 ? (
                          pedido.productos.map((producto, i) => {
                            const nombreProducto = producto.nombre || producto.nombre_producto || `Producto ${i + 1}`;
                            const cantidad = producto.cantidad || producto.quantity || 1;
                            return (
                              <li key={producto.product_id || producto.producto_id || i} className="font-lato text-gray-700">
                                • {nombreProducto} (x{cantidad})
                              </li>
                            );
                          })
                        ) : (
                          <li className="font-lato text-gray-500 italic">No hay productos en este pedido</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Estados y Acciones */}
                  <div className="space-y-4">
                    {/* Estado Actual */}
                    <div className={`${statusInfo.color} ${statusInfo.textColor} px-8 py-4 rounded-xl text-center shadow-lg`}>
                      <div className="font-spartan font-black text-xl">
                        {statusInfo.text}
                      </div>
                    </div>

                    {/* Tiempo Total */}
                    <div className="text-center bg-gray-100 p-4 rounded-lg">
                      <div className="font-spartan font-bold text-gray-600 text-sm mb-1">
                        TIEMPO TOTAL
                      </div>
                      <div className="font-spartan font-black text-3xl text-pardos-rust">
                        {formatearTiempo(pedido.tiempoTotal)}
                      </div>
                    </div>

                    {/* Botones de Acción según Rol y Estado */}
                    <div className="space-y-2">
                      {/* Debug info - remover en producción */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs bg-gray-100 p-2 rounded mb-2">
                          <p>Estado: {pedido.estado_backend}</p>
                          <p>Es Chef: {esChef ? 'Sí' : 'No'}</p>
                          <p>Es Motorizado: {esMotorizado ? 'Sí' : 'No'}</p>
                          <p>Mi Rol: {JSON.stringify(pedido.mi_rol)}</p>
                        </div>
                      )}

                      {esChef && pedido.estado_backend === 'pendiente' && (
                        <>
                          <button
                            onClick={() => handleChefConfirma(pedido)}
                            disabled={procesando[pedido.pedido_id]}
                            className="w-full py-3 px-4 rounded-lg font-spartan font-bold text-sm bg-green-500 hover:bg-green-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {procesando[pedido.pedido_id] ? (
                              <>
                                <Loading size="sm" />
                                <span>Procesando...</span>
                              </>
                            ) : (
                              '✅ CONFIRMAR PREPARACIÓN'
                            )}
                          </button>
                          <button
                            onClick={() => handleChefRechaza(pedido)}
                            disabled={procesando[pedido.pedido_id]}
                            className="w-full py-3 px-4 rounded-lg font-spartan font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {procesando[pedido.pedido_id] ? (
                              <>
                                <Loading size="sm" />
                                <span>Procesando...</span>
                              </>
                            ) : (
                              '❌ RECHAZAR PEDIDO'
                            )}
                          </button>
                        </>
                      )}
                      
                      {esChef && pedido.estado_backend === 'preparando' && (
                        <p className="text-center text-sm text-gray-600">
                          Preparando pedido...
                        </p>
                      )}
                      
                      {/* Despachado confirma - cuando el pedido está en "despachando" */}
                      {/* Cualquier staff (chef o admin) que NO sea motorizado puede confirmar despacho */}
                      {!esMotorizado && pedido.estado_backend === 'despachando' && (
                        <button
                          onClick={() => handleDespachadoConfirma(pedido)}
                          disabled={procesando[pedido.pedido_id]}
                          className="w-full py-3 px-4 rounded-lg font-spartan font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {procesando[pedido.pedido_id] ? (
                            <>
                              <Loading size="sm" />
                              <span>Procesando...</span>
                            </>
                          ) : (
                            '📦 CONFIRMAR DESPACHO'
                          )}
                        </button>
                      )}
                      
                      {/* Mensaje cuando el pedido ya está despachado */}
                      {!esMotorizado && pedido.estado_backend === 'despachado' && (
                        <p className="text-center text-sm text-green-600 font-bold">
                          ✅ Pedido despachado, esperando recogida
                        </p>
                      )}
                      
                      {/* Motorizado confirma recogida - solo en estados válidos */}
                      {esMotorizado && (
                        <>
                          {/* Estados válidos: despachado o recogiendo */}
                          {(pedido.estado_backend === 'despachado' || 
                            pedido.estado_backend === 'recogiendo') && (
                            <button
                              onClick={() => handleMotorizadoConfirma(pedido)}
                              disabled={procesando[pedido.pedido_id]}
                              className="w-full py-3 px-4 rounded-lg font-spartan font-bold text-sm bg-purple-500 hover:bg-purple-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {procesando[pedido.pedido_id] ? (
                                <>
                                  <Loading size="sm" />
                                  <span>Procesando...</span>
                                </>
                              ) : (
                                '🏍️ CONFIRMAR RECOGIDA'
                              )}
                            </button>
                          )}
                          
                          {/* Si está en despachando, mostrar mensaje de espera */}
                          {pedido.estado_backend === 'despachando' && (
                            <p className="text-center text-sm text-orange-600 font-bold">
                              ⏳ Esperando confirmación de despacho...
                            </p>
                          )}
                          
                          {/* Si el pedido ya está en camino, mostrar mensaje */}
                          {pedido.estado_backend === 'en_camino' && (
                            <p className="text-center text-sm text-gray-600">
                              Pedido en camino al cliente...
                            </p>
                          )}
                        </>
                      )}
                      
                      {/* Si no es motorizado, mostrar mensaje cuando está en camino */}
                      {!esMotorizado && pedido.estado_backend === 'en_camino' && (
                        <p className="text-center text-sm text-gray-600">
                          Pedido en camino al cliente...
                        </p>
                      )}
                      
                      {pedido.estado_backend === 'entregado' && (
                        <p className="text-center text-sm text-green-600 font-bold">
                          ✅ PEDIDO ENTREGADO
                        </p>
                      )}
                      
                      {/* Botón para ver historial */}
                      <button
                        onClick={() => handleVerHistorial(pedido)}
                        className="w-full py-2 px-4 rounded-lg font-spartan font-bold text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all"
                      >
                        📋 Ver Historial de Estados
                      </button>
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

      {/* Dialog de Historial */}
      {historialDialog.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setHistorialDialog({ open: false, pedido: null, historial: [] })}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-spartan font-black text-2xl text-pardos-dark">
                📋 Historial de Estados
              </h2>
              <button
                onClick={() => setHistorialDialog({ open: false, pedido: null, historial: [] })}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            {historialDialog.pedido && (
              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <p className="font-lato font-bold">
                  <span className="text-pardos-rust">Pedido:</span> {historialDialog.pedido.pedido_id.substring(0, 12)}...
                </p>
              </div>
            )}
            <div className="space-y-3">
              {historialDialog.historial.map((h, i) => (
                <div key={i} className="border-l-4 border-pardos-rust pl-4 py-2">
                  <div className="font-spartan font-bold text-lg">
                    {i + 1}. {h.estado_anterior || 'Inicial'} → {h.estado_nuevo}
                  </div>
                  <div className="font-lato text-sm text-gray-600 mt-1">
                    {new Date(h.timestamp).toLocaleString('es-PE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {h.motivo && (
                    <div className="font-lato text-sm text-gray-500 mt-1 italic">
                      Motivo: {h.motivo}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setHistorialDialog({ open: false, pedido: null, historial: [] })}
                className="px-4 py-2 bg-pardos-rust hover:bg-pardos-brown text-white rounded-lg font-spartan font-bold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisPedidos;
