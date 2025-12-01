/**
 * Colores de estados según la leyenda:
 * - Pendiente: Rojo
 * - Preparando: Amarillo
 * - Despachado: Verde
 * - En Camino: Naranja
 * - Entregado: Azul
 */

export const getEstadoColor = (estado) => {
  const estadoLower = (estado || '').toLowerCase();
  
  // Estados que corresponden a "Pendiente" (Rojo)
  if (estadoLower === 'pendiente' || estadoLower === 'pedido pendiente') {
    return { bg: 'bg-red-500', text: 'text-white', hex: '#ef4444' };
  }
  
  // Estados que corresponden a "Preparando" (Amarillo)
  if (estadoLower === 'preparando' || estadoLower === 'pedido preparado') {
    return { bg: 'bg-yellow-400', text: 'text-yellow-900', hex: '#fbbf24' };
  }
  
  // Estados que corresponden a "Despachado" (Verde)
  if (estadoLower === 'despachando' || estadoLower === 'despachado' || 
      estadoLower === 'pedido enviado' || estadoLower === 'pedido despachado') {
    return { bg: 'bg-green-500', text: 'text-white', hex: '#22c55e' };
  }
  
  // Estados que corresponden a "En Camino" (Naranja)
  if (estadoLower === 'recogiendo' || estadoLower === 'en_camino' || 
      estadoLower === 'en camino') {
    return { bg: 'bg-orange-500', text: 'text-white', hex: '#f97316' };
  }
  
  // Estados que corresponden a "Entregado" (Azul)
  if (estadoLower === 'entregado' || estadoLower === 'pedido recibido' || 
      estadoLower === 'completado' || estadoLower === 'completados') {
    return { bg: 'bg-blue-500', text: 'text-white', hex: '#3b82f6' };
  }
  
  // Estados cancelados/rechazados (Gris)
  if (estadoLower === 'cancelado' || estadoLower === 'rechazado') {
    return { bg: 'bg-gray-500', text: 'text-white', hex: '#6b7280' };
  }
  
  // Por defecto
  return { bg: 'bg-gray-400', text: 'text-white', hex: '#9ca3af' };
};

