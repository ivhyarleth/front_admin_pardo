import { createContext, useContext, useState, useEffect } from 'react';

const PedidosContext = createContext();

export const usePedidos = () => {
  const context = useContext(PedidosContext);
  if (!context) {
    throw new Error('usePedidos debe usarse dentro de PedidosProvider');
  }
  return context;
};

export const PedidosProvider = ({ children }) => {
  // Estados de pedidos
  const ESTADOS = {
    CREADO: 'Pedido Creado',
    PENDIENTE: 'Pedido Pendiente',
    PREPARADO: 'Pedido Preparado',
    ENVIADO: 'Pedido Enviado',
    RECIBIDO: 'Pedido Recibido'
  };

  // Pedidos simulados
  const [pedidos, setPedidos] = useState([
    {
      id: 'PED001',
      horaGeneracion: '12:30:45',
      sede: 'Pollería 1',
      sedeId: 'sede-1',
      monto: 125.50,
      encargado: {
        id: 'trab-1',
        nombre: 'Trabajador 1'
      },
      productos: [
        { nombre: '1/4 Pollo + Papas', cantidad: 2 },
        { nombre: 'Inca Kola 1.5L', cantidad: 1 }
      ],
      status: 'Pedido Creado',
      historialEstados: [
        {
          estado: 'Pedido Creado',
          timestamp: new Date().getTime(),
          duracion: 0
        }
      ],
      tiempoTotal: 0,
      createdAt: new Date().getTime()
    },
    {
      id: 'PED002',
      horaGeneracion: '12:45:20',
      sede: 'Pollería 2',
      sedeId: 'sede-2',
      monto: 89.90,
      encargado: {
        id: 'trab-2',
        nombre: 'Trabajador 2'
      },
      productos: [
        { nombre: '1/2 Pollo + Ensalada', cantidad: 1 }
      ],
      status: 'Pedido Pendiente',
      historialEstados: [
        {
          estado: 'Pedido Creado',
          timestamp: new Date().getTime() - 300000,
          duracion: 0
        },
        {
          estado: 'Pedido Pendiente',
          timestamp: new Date().getTime(),
          duracion: 300000
        }
      ],
      tiempoTotal: 300000,
      createdAt: new Date().getTime() - 300000
    },
    {
      id: 'PED003',
      horaGeneracion: '13:10:15',
      sede: 'Pollería 1',
      sedeId: 'sede-1',
      monto: 210.00,
      encargado: {
        id: 'trab-3',
        nombre: 'Trabajador 3'
      },
      productos: [
        { nombre: 'Pollo Entero + Papas', cantidad: 1 },
        { nombre: 'Ensalada Grande', cantidad: 2 }
      ],
      status: 'Pedido Preparado',
      historialEstados: [
        {
          estado: 'Pedido Creado',
          timestamp: new Date().getTime() - 900000,
          duracion: 0
        },
        {
          estado: 'Pedido Pendiente',
          timestamp: new Date().getTime() - 600000,
          duracion: 300000
        },
        {
          estado: 'Pedido Preparado',
          timestamp: new Date().getTime(),
          duracion: 600000
        }
      ],
      tiempoTotal: 900000,
      createdAt: new Date().getTime() - 900000
    },
    {
      id: 'PED004',
      horaGeneracion: '13:25:30',
      sede: 'Pollería 2',
      sedeId: 'sede-2',
      monto: 156.70,
      encargado: null,
      productos: [
        { nombre: 'Anticuchos x2', cantidad: 1 },
        { nombre: 'Chicharrón', cantidad: 1 }
      ],
      status: 'Pedido Creado',
      historialEstados: [
        {
          estado: 'Pedido Creado',
          timestamp: new Date().getTime(),
          duracion: 0
        }
      ],
      tiempoTotal: 0,
      createdAt: new Date().getTime()
    }
  ]);

  // Actualizar tiempo total cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setPedidos(prevPedidos =>
        prevPedidos.map(pedido => ({
          ...pedido,
          tiempoTotal: new Date().getTime() - pedido.createdAt
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cambiar estado de un pedido (usado por trabajadores)
  const cambiarEstadoPedido = (pedidoId, nuevoEstado) => {
    setPedidos(prevPedidos =>
      prevPedidos.map(pedido => {
        if (pedido.id === pedidoId) {
          const ahora = new Date().getTime();
          const ultimoEstado = pedido.historialEstados[pedido.historialEstados.length - 1];
          const duracion = ahora - ultimoEstado.timestamp;

          return {
            ...pedido,
            status: nuevoEstado,
            historialEstados: [
              ...pedido.historialEstados,
              {
                estado: nuevoEstado,
                timestamp: ahora,
                duracion: duracion
              }
            ]
          };
        }
        return pedido;
      })
    );
  };

  // Asignar trabajador a pedido (usado por admin)
  const asignarTrabajador = (pedidoId, trabajador) => {
    setPedidos(prevPedidos =>
      prevPedidos.map(pedido =>
        pedido.id === pedidoId
          ? { ...pedido, encargado: trabajador }
          : pedido
      )
    );
  };

  // Obtener pedidos de un trabajador específico
  const getPedidosTrabajador = (trabajadorId) => {
    return pedidos.filter(p => p.encargado?.id === trabajadorId);
  };

  // Formatear tiempo en milisegundos a HH:MM:SS
  const formatearTiempo = (milisegundos) => {
    const totalSegundos = Math.floor(milisegundos / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  };

  // Obtener progreso del pedido (0-100%)
  const getProgresoPedido = (status) => {
    const estados = [
      'Pedido Creado',
      'Pedido Pendiente',
      'Pedido Preparado',
      'Pedido Enviado',
      'Pedido Recibido'
    ];
    const index = estados.indexOf(status);
    return ((index + 1) / estados.length) * 100;
  };

  const value = {
    pedidos,
    ESTADOS,
    cambiarEstadoPedido,
    asignarTrabajador,
    getPedidosTrabajador,
    formatearTiempo,
    getProgresoPedido
  };

  return (
    <PedidosContext.Provider value={value}>
      {children}
    </PedidosContext.Provider>
  );
};
