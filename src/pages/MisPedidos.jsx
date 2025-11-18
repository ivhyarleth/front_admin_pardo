import { useEffect, useState } from 'react';
import { usePedidos } from '../context/PedidosContext';
import { getAssignedOrdersAPI, updateOrderStatusAPI } from '../config/api';

const MisPedidos = ({ user }) => {
  const { getPedidosTrabajador, ESTADOS, cambiarEstadoPedido, formatearTiempo } = usePedidos();
  const [loading, setLoading] = useState(false);
  
  const misPedidos = getPedidosTrabajador(user.id);

  // ============================================
  // 🔌 CARGAR PEDIDOS DEL BACKEND
  // ============================================
  useEffect(() => {
    loadMyOrders();
  }, [user.id]);

  const loadMyOrders = async () => {
    setLoading(true);
    try {
      // ============================================
      // Descomenta cuando tengas el backend listo:
      // ============================================
      
      // const orders = await getAssignedOrdersAPI(user.id);
      // setPedidos(orders);  // Actualizar en context
      
      // ============================================
      // Por ahora usa datos del Context (mock)
      // ============================================
      
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'Pedido Creado': { color: 'bg-cyan-300', text: 'PEDIDO CREADO', textColor: 'text-cyan-900' },
      'Pedido Pendiente': { color: 'bg-yellow-300', text: 'PEDIDO PENDIENTE', textColor: 'text-yellow-900' },
      'Pedido Preparado': { color: 'bg-green-500', text: 'PEDIDO PREPARADO', textColor: 'text-white' },
      'Pedido Enviado': { color: 'bg-orange-500', text: 'PEDIDO ENVIADO', textColor: 'text-white' },
      'Pedido Recibido': { color: 'bg-blue-500', text: 'PEDIDO RECIBIDO', textColor: 'text-white' }
    };
    return statusMap[status] || statusMap['Pedido Creado'];
  };

  const handleCambiarEstado = async (pedidoId, nuevoEstado) => {
    // ============================================
    // 🔌 LLAMAR AL BACKEND
    // ============================================
    try {
      const timestamp = new Date().getTime();
      const pedido = misPedidos.find(p => p.id === pedidoId);
      const ultimoEstado = pedido.historialEstados[pedido.historialEstados.length - 1];
      const duracion = timestamp - ultimoEstado.timestamp;

      // Descomenta cuando tengas el backend listo:
      // await updateOrderStatusAPI(pedidoId, nuevoEstado, timestamp, duracion);
      
      // Actualizar estado local
      cambiarEstadoPedido(pedidoId, nuevoEstado);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado del pedido');
    }
  };

  const puedeAvanzarA = (estadoActual, nuevoEstado) => {
    const orden = [
      'Pedido Creado',
      'Pedido Pendiente',
      'Pedido Preparado',
      'Pedido Enviado',
      'Pedido Recibido'
    ];
    const indexActual = orden.indexOf(estadoActual);
    const indexNuevo = orden.indexOf(nuevoEstado);
    return indexNuevo === indexActual + 1;
  };

  return (
    <div className="flex-1 bg-white p-8">
      <div className="mb-8">
        <h1 className="font-spartan font-black text-4xl mb-2">
          <span className="text-pardos-rust">DASHBOARD</span> DE{' '}
          <span className="text-black">PEDIDOS ASIGNADOS</span>
        </h1>
      </div>

      {misPedidos.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 font-lato text-xl">
            No tienes pedidos asignados en este momento
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {misPedidos.map((pedido) => {
            const statusInfo = getStatusInfo(pedido.status);
            
            return (
              <div key={pedido.id} className="border-4 border-gray-300 rounded-2xl p-6 bg-white shadow-lg">
                {/* Header */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-pardos-yellow p-4 rounded-lg text-center">
                    <div className="font-spartan font-bold text-black text-lg">ID PEDIDO</div>
                    <div className="font-spartan font-black text-2xl text-pardos-dark mt-2">
                      {pedido.id}
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
                        {pedido.productos.map((producto, i) => (
                          <li key={i} className="font-lato text-gray-700">
                            • {producto.nombre} (x{producto.cantidad})
                          </li>
                        ))}
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

                    {/* Botones de Control */}
                    <div className="space-y-2">
                      <p className="text-center font-spartan font-bold text-sm text-gray-600 mb-2">
                        CAMBIAR ESTADO:
                      </p>
                      {Object.values(ESTADOS).map((estado) => {
                        const isCurrentState = pedido.status === estado;
                        const canAdvance = puedeAvanzarA(pedido.status, estado);
                        const isCompleted = Object.values(ESTADOS).indexOf(pedido.status) > Object.values(ESTADOS).indexOf(estado);
                        
                        return (
                          <button
                            key={estado}
                            onClick={() => handleCambiarEstado(pedido.id, estado)}
                            disabled={!canAdvance || isCurrentState}
                            className={`w-full py-3 px-4 rounded-lg font-spartan font-bold text-sm transition-all ${
                              isCurrentState
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : isCompleted
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : canAdvance
                                ? 'bg-pardos-rust hover:bg-pardos-brown text-white hover:scale-105 shadow-lg'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {isCurrentState && '✓ '}
                            {estado.toUpperCase()}
                            {isCompleted && ' ✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Historial de Estados */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-spartan font-bold text-lg mb-3">
                    TIEMPOS DE PRODUCCIÓN:
                  </h4>
                  <div className="space-y-2">
                    {pedido.historialEstados.map((historial, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-lg font-lato"
                      >
                        <span className="text-gray-700">{historial.estado}</span>
                        <span className="text-gray-500">
                          {index > 0 && `Duración: ${formatearTiempo(historial.duracion)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MisPedidos;
