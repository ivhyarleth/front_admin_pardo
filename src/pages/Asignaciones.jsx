import { useState } from 'react';

const Asignaciones = () => {
  const [pedidos, setPedidos] = useState([
    {
      id: 'PED001',
      sede: 'Pollería 1',
      horaInicial: '12:30',
      productos: [
        'Producto X',
        'Producto X',
        'Producto X',
        'Producto X',
        'Producto X',
        'Producto X',
        'Producto X',
        'Producto X',
        'Producto X'
      ],
      status: 'creado',
      tiempo: '00:05:30'
    },
    {
      id: 'PED002',
      sede: 'Pollería 1',
      horaInicial: '12:35',
      productos: [
        'Producto X',
        'Producto X',
        'Producto X'
      ],
      status: 'pendiente',
      tiempo: '00:10:15'
    },
    {
      id: 'PED003',
      sede: 'Pollería 2',
      horaInicial: '12:40',
      productos: [
        'Producto X',
        'Producto X'
      ],
      status: 'preparado',
      tiempo: '00:15:45'
    },
    {
      id: 'PED004',
      sede: 'Pollería 1',
      horaInicial: '12:45',
      productos: [
        'Producto X',
        'Producto X',
        'Producto X',
        'Producto X'
      ],
      status: 'enviado',
      tiempo: '00:20:30'
    },
    {
      id: 'PED005',
      sede: 'Pollería 3',
      horaInicial: '12:50',
      productos: [
        'Producto X'
      ],
      status: 'recibido',
      tiempo: '00:25:10'
    }
  ]);

  const getStatusInfo = (status) => {
    const statusMap = {
      'creado': { color: 'bg-cyan-300', text: 'PEDIDO CREADO', textColor: 'text-cyan-900' },
      'pendiente': { color: 'bg-yellow-300', text: 'PEDIDO PENDIENTE', textColor: 'text-yellow-900' },
      'preparado': { color: 'bg-green-500', text: 'PEDIDO PREPARADO', textColor: 'text-white' },
      'enviado': { color: 'bg-orange-500', text: 'PEDIDO ENVIADO', textColor: 'text-white' },
      'recibido': { color: 'bg-blue-500', text: 'PEDIDO RECIBIDO', textColor: 'text-white' }
    };
    return statusMap[status] || statusMap['creado'];
  };

  return (
    <div className="flex-1 bg-white p-8">
      <div className="mb-8">
        <h1 className="font-spartan font-black text-4xl mb-2">
          <span className="text-pardos-rust">DASHBOARD</span> DE{' '}
          <span className="text-black">PEDIDOS ASIGNADOS</span>
        </h1>
      </div>

      <div className="space-y-6">
        {pedidos.map((pedido, index) => {
          const statusInfo = getStatusInfo(pedido.status);
          
          return (
            <div key={index} className="border-4 border-gray-300 rounded-2xl p-6">
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
                    {pedido.horaInicial} - {parseInt(pedido.horaInicial.split(':')[1]) + 5} seg
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
                          • {producto}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center">
                  <div className={`${statusInfo.color} ${statusInfo.textColor} px-8 py-4 rounded-xl text-center shadow-lg w-full`}>
                    <div className="font-spartan font-black text-xl">
                      {statusInfo.text}
                    </div>
                  </div>
                </div>

                {/* Tiempo */}
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="font-spartan font-bold text-gray-600 text-lg mb-2">
                      - min --seg
                    </div>
                    <div className="font-spartan font-black text-4xl text-pardos-rust">
                      {pedido.tiempo}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Asignaciones;
