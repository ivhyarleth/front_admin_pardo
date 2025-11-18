import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePedidos } from '../context/PedidosContext';
import { getKPIsBySedeAPI } from '../config/api';

const Rendimiento = () => {
  const { pedidos, formatearTiempo } = usePedidos();
  const [sedeExpandida, setSedeExpandida] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [kpisData, setKpisData] = useState({});
  const [loading, setLoading] = useState(false);

  // Datos simulados de gráfico de pedidos por hora
  const dataPedidosPorHora = [
    { hora: '0', pedidos: 0 },
    { hora: '2', pedidos: 2 },
    { hora: '4', pedidos: 3 },
    { hora: '6', pedidos: 5 },
    { hora: '8', pedidos: 4 },
    { hora: '10', pedidos: 3 },
    { hora: '12', pedidos: 2 },
    { hora: '14', pedidos: 0 },
  ];

  // ============================================
  // 🔌 CARGAR KPIs DEL BACKEND
  // ============================================
  const loadKPIs = async (sedeId, fecha) => {
    if (!fecha) return;
    
    setLoading(true);
    try {
      // ============================================
      // Descomenta cuando tengas el backend listo:
      // ============================================
      
      // const data = await getKPIsBySedeAPI(sedeId, fecha);
      // setKpisData(prev => ({
      //   ...prev,
      //   [sedeId]: data
      // }));
      
      // ============================================
      // Por ahora usa cálculo local
      // ============================================
      
    } catch (error) {
      console.error('Error cargando KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sedeExpandida && fechaSeleccionada) {
      loadKPIs(sedeExpandida, fechaSeleccionada);
    }
  }, [sedeExpandida, fechaSeleccionada]);

  // Calcular KPIs por sede
  const calcularKPIsSede = (sedeId) => {
    const pedidosSede = pedidos.filter(p => p.sedeId === sedeId);
    
    const totalPedidos = pedidosSede.length;
    const totalIngresos = pedidosSede.reduce((sum, p) => sum + p.monto, 0);
    const ticketPromedio = totalPedidos > 0 ? totalIngresos / totalPedidos : 0;
    
    // Calcular tiempo promedio
    const tiempoTotal = pedidosSede.reduce((sum, p) => sum + p.tiempoTotal, 0);
    const tiempoPromedio = totalPedidos > 0 ? tiempoTotal / totalPedidos : 0;
    
    // Top 3 productos (simulado)
    const topProductos = [
      { nombre: '1/4 Pollo + Papas Fritas', ventas: 45 },
      { nombre: '1/2 Pollo + Papas Fritas', ventas: 38 },
      { nombre: 'Pollo Entero + Papas Fritas', ventas: 32 }
    ];

    return {
      pedidos: totalPedidos,
      ingresos: totalIngresos,
      ticket: ticketPromedio,
      tiempo: formatearTiempo(tiempoPromedio),
      topProductos
    };
  };

  const sedes = [
    { id: 'sede-1', nombre: 'SEDE 1', ubicacion: 'San Isidro' },
    { id: 'sede-2', nombre: 'SEDE 2', ubicacion: 'Miraflores' }
  ];

  const toggleSede = (sedeId) => {
    setSedeExpandida(sedeExpandida === sedeId ? null : sedeId);
  };

  return (
    <div className="flex-1 bg-white p-8">
      <div className="mb-8">
        <h1 className="font-spartan font-black text-4xl mb-2">
          <span className="text-pardos-rust">RENDIMIENTO</span>{' '}
          <span className="text-black">POR SEDE</span>
        </h1>
      </div>

      <div className="space-y-6">
        {sedes.map((sede) => {
          const stats = calcularKPIsSede(sede.id);
          const isExpanded = sedeExpandida === sede.id;

          return (
            <div key={sede.id}>
              {/* Botón de Sede */}
              <button
                onClick={() => toggleSede(sede.id)}
                className="bg-pardos-purple hover:bg-pardos-brown text-white px-8 py-3 rounded-full font-spartan font-bold text-lg shadow-lg w-64 transition-all flex items-center justify-between"
              >
                <span>{sede.nombre}</span>
                <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
              </button>

              {/* Contenido Expandido */}
              {isExpanded && (
                <div className="border-4 border-gray-300 rounded-2xl p-6 mt-4 bg-white animate-fadeIn">
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Panel Izquierdo - Estadísticas */}
                    <div className="space-y-4">
                      {/* Selector de Fecha */}
                      <div className="bg-pardos-yellow p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-spartan font-bold text-white">SELECCIONAR</span>
                          <select 
                            className="px-4 py-2 rounded-lg font-lato border-2 border-white"
                            value={fechaSeleccionada}
                            onChange={(e) => setFechaSeleccionada(e.target.value)}
                          >
                            <option value="">Seleccionar fecha</option>
                            <option value="2025-01-18">18/01/2025 (Hoy)</option>
                            <option value="2025-01-17">17/01/2025</option>
                            <option value="2025-01-16">16/01/2025</option>
                          </select>
                        </div>
                      </div>

                      {/* Estadística: Pedidos */}
                      <div className="bg-pardos-rust p-4 rounded-lg text-white">
                        <div className="flex items-center justify-between">
                          <span className="font-spartan font-bold">PEDIDOS</span>
                          <span className="font-spartan font-black text-2xl">{stats.pedidos}</span>
                        </div>
                        <div className="text-right text-sm mt-1">Nº PEDIDOS</div>
                      </div>

                      {/* Estadística: Ingresos */}
                      <div className="bg-pardos-rust p-4 rounded-lg text-white">
                        <div className="flex items-center justify-between">
                          <span className="font-spartan font-bold">INGRESOS DEL DÍA</span>
                          <span className="font-spartan font-black text-2xl">S/ {stats.ingresos.toFixed(2)}</span>
                        </div>
                        <div className="text-right text-sm mt-1">TOTAL SOLES</div>
                      </div>

                      {/* Estadística: Ticket */}
                      <div className="bg-pardos-rust p-4 rounded-lg text-white">
                        <div className="flex items-center justify-between">
                          <span className="font-spartan font-bold">TICKET PROMEDIO</span>
                          <span className="font-spartan font-black text-2xl">S/ {stats.ticket.toFixed(2)}</span>
                        </div>
                        <div className="text-right text-sm mt-1">TOTAL SOLES</div>
                      </div>

                      {/* Estadística: Tiempo */}
                      <div className="bg-pardos-rust p-4 rounded-lg text-white">
                        <div className="flex items-center justify-between">
                          <span className="font-spartan font-bold text-sm">TIEMPO PROMEDIO DE PREPARACIÓN Y ENTREGA</span>
                          <span className="font-spartan font-black text-2xl">{stats.tiempo}</span>
                        </div>
                        <div className="text-right text-sm mt-1">TIEMPO PROMEDIO</div>
                      </div>

                      {/* Top 3 Productos */}
                      <div className="bg-pardos-rust p-4 rounded-lg text-white">
                        <div className="font-spartan font-bold mb-3 text-center">
                          TOP 3 PRODUCTOS VENDIDOS EN ESTE DÍA
                        </div>
                        <div className="space-y-2">
                          {stats.topProductos.map((producto, index) => (
                            <div key={index} className="bg-white/20 p-2 rounded text-sm">
                              {index + 1}. {producto.nombre}
                              <span className="float-right">({producto.ventas} ventas)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Panel Derecho - Gráfico */}
                    <div>
                      <div className="bg-pardos-rust p-4 rounded-lg text-white mb-4">
                        <h3 className="font-spartan font-bold text-center text-xl">
                          GRÁFICO DE PEDIDOS POR HORA
                        </h3>
                      </div>
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={dataPedidosPorHora}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hora" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="pedidos" fill="#F2B10C" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Rendimiento;
