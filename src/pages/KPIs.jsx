import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const KPIs = () => {
  const [sedeSeleccionada, setSedeSeleccionada] = useState('sede2');
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');

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

  const stats = {
    pedidos: '156',
    ingresos: '12,450.50',
    ticket: '79.90',
    tiempo: '25 min',
    topProductos: [
      { nombre: '1/4 Pollo + Papas Fritas', ventas: 45 },
      { nombre: '1/2 Pollo + Papas Fritas', ventas: 38 },
      { nombre: 'Pollo Entero + Papas Fritas', ventas: 32 }
    ]
  };

  return (
    <div className="flex-1 bg-white p-8">
      <div className="mb-8">
        <h1 className="font-spartan font-black text-4xl mb-2">
          <span className="text-pardos-rust">RENDIMIENTO</span>{' '}
          <span className="text-black">POR SEDE</span>
        </h1>
      </div>

      {/* Sede 1 */}
      <div className="mb-6">
        <button className="bg-pardos-purple text-white px-8 py-3 rounded-full font-spartan font-bold text-lg shadow-lg w-64">
          SEDE 1
        </button>
      </div>

      {/* Sede 2 - Expandida */}
      <div className="border-4 border-gray-300 rounded-2xl p-6 mb-6">
        <button className="bg-pardos-purple text-white px-8 py-3 rounded-full font-spartan font-bold text-lg shadow-lg mb-6 w-64">
          SEDE 2
        </button>

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
                  <option value="2025-01-15">15/01/2025</option>
                  <option value="2025-01-14">14/01/2025</option>
                  <option value="2025-01-13">13/01/2025</option>
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
                <span className="font-spartan font-black text-2xl">S/ {stats.ingresos}</span>
              </div>
              <div className="text-right text-sm mt-1">TOTAL SOLES</div>
            </div>

            {/* Estadística: Ticket */}
            <div className="bg-pardos-rust p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <span className="font-spartan font-bold">TICKET</span>
                <span className="font-spartan font-black text-2xl">S/ {stats.ticket}</span>
              </div>
              <div className="text-right text-sm mt-1">TOTAL SOLES</div>
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
    </div>
  );
};

export default KPIs;
