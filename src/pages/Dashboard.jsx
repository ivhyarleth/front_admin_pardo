import { useState, useEffect } from 'react';
import { usePedidos } from '../context/PedidosContext';
import { getAllOrdersAPI, assignWorkerAPI, getWorkersAPI } from '../config/api';

const Dashboard = () => {
  const { pedidos, asignarTrabajador, formatearTiempo, getProgresoPedido } = usePedidos();
  const [trabajadores, setTrabajadores] = useState([
    { id: 'trab-1', nombre: 'Trabajador 1' },
    { id: 'trab-2', nombre: 'Trabajador 2' },
    { id: 'trab-3', nombre: 'Trabajador 3' }
  ]);
  const [loading, setLoading] = useState(false);

  // ============================================
  // 🔌 CARGAR DATOS DEL BACKEND
  // ============================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // ============================================
      // Descomenta cuando tengas el backend listo:
      // ============================================
      
      // const [ordersData, workersData] = await Promise.all([
      //   getAllOrdersAPI(),
      //   getWorkersAPI()
      // ]);
      
      // setPedidos(ordersData);  // Actualizar en context
      // setTrabajadores(workersData);
      
      // ============================================
      // Por ahora usa datos del Context (mock)
      // ============================================
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pedido Creado': 'bg-red-500 text-white',
      'Pedido Pendiente': 'bg-yellow-400 text-yellow-900',
      'Pedido Preparado': 'bg-green-500 text-white',
      'Pedido Enviado': 'bg-orange-500 text-white',
      'Pedido Recibido': 'bg-blue-500 text-white'
    };
    return colors[status] || 'bg-gray-400 text-white';
  };

  const handleAsignarTrabajador = async (pedidoId, trabajadorId) => {
    const trabajador = trabajadores.find(t => t.id === trabajadorId);
    if (trabajador) {
      // ============================================
      // 🔌 LLAMAR AL BACKEND
      // ============================================
      try {
        // Descomenta cuando tengas el backend listo:
        // await assignWorkerAPI(pedidoId, trabajadorId);
        
        // Actualizar estado local
        asignarTrabajador(pedidoId, trabajador);
      } catch (error) {
        console.error('Error asignando trabajador:', error);
        alert('Error al asignar trabajador');
      }
    }
  };

  return (
    <div className="flex-1 bg-white p-8">
      <div className="mb-8">
        <h1 className="font-spartan font-black text-4xl mb-2">
          <span className="text-pardos-rust">DASHBOARD</span> DE{' '}
          <span className="text-black">PEDIDOS</span>
        </h1>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
          <thead className="bg-pardos-brown text-white">
            <tr>
              <th className="px-6 py-4 text-left font-spartan font-bold">ID PEDIDOS</th>
              <th className="px-6 py-4 text-left font-spartan font-bold">HORA DE GENERACIÓN</th>
              <th className="px-6 py-4 text-left font-spartan font-bold">SEDES</th>
              <th className="px-6 py-4 text-left font-spartan font-bold">MONTO TOTAL</th>
              <th className="px-6 py-4 text-left font-spartan font-bold">ENCARGADO</th>
              <th className="px-6 py-4 text-left font-spartan font-bold">ESTATUS</th>
              <th className="px-6 py-4 text-left font-spartan font-bold">TIEMPO TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido, index) => {
              const progreso = getProgresoPedido(pedido.status);
              
              return (
                <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-lato font-bold">{pedido.id}</td>
                  <td className="px-6 py-4 font-lato">{pedido.horaGeneracion}</td>
                  <td className="px-6 py-4 font-lato">{pedido.sede}</td>
                  <td className="px-6 py-4 font-lato font-bold text-pardos-rust">
                    S/ {pedido.monto.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {pedido.encargado ? (
                      <div className="flex items-center space-x-2">
                        <span className="font-lato">{pedido.encargado.nombre}</span>
                        <span className="text-yellow-500">⭐</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          className="w-full px-3 py-2 bg-white border-2 border-pardos-rust rounded-lg font-lato focus:outline-none focus:ring-2 focus:ring-pardos-orange"
                          onChange={(e) => handleAsignarTrabajador(pedido.id, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>Sin asignar</option>
                          {trabajadores.map((t) => (
                            <option key={t.id} value={t.id}>{t.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-4 py-2 rounded-full font-spartan font-bold text-sm ${getStatusColor(pedido.status)} inline-block`}>
                      {pedido.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {/* Barra de Progreso */}
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-orange-500 to-blue-500 h-full transition-all duration-500"
                            style={{width: `${progreso}%`}}
                          ></div>
                        </div>
                      </div>
                      {/* Tiempo */}
                      <span className="font-lato text-sm font-bold text-pardos-dark block">
                        {formatearTiempo(pedido.tiempoTotal)}
                      </span>
                      {/* Último Cambio */}
                      {pedido.historialEstados.length > 1 && (
                        <span className="text-xs text-gray-500 block">
                          Último: {formatearTiempo(pedido.historialEstados[pedido.historialEstados.length - 1].duracion)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-spartan font-bold mb-3">LEYENDA DE ESTADOS:</h3>
        <div className="flex flex-wrap gap-3">
          <span className="px-4 py-2 rounded-full bg-red-500 text-white text-sm font-spartan">
            Pedido Creado
          </span>
          <span className="px-4 py-2 rounded-full bg-yellow-400 text-yellow-900 text-sm font-spartan">
            Pedido Pendiente
          </span>
          <span className="px-4 py-2 rounded-full bg-green-500 text-white text-sm font-spartan">
            Pedido Preparado
          </span>
          <span className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-spartan">
            Pedido Enviado
          </span>
          <span className="px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-spartan">
            Pedido Recibido
          </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
