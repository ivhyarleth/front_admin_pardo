import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { getKPIsBySedeAPI, getMetricasTiemposAPI, getSelectedSede, getUserData } from '../config/api';
import { Loading } from '../components/ui/Loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Separator } from '../components/ui/Separator';
import { formatSedeName } from '../lib/formatters';
import { getEstadoColor } from '../lib/statusColors';

const Rendimiento = () => {
  const [sedeExpandida, setSedeExpandida] = useState(null);
  const [kpisData, setKpisData] = useState({});
  const [metricasTiempos, setMetricasTiempos] = useState({});
  const [loading, setLoading] = useState(false);
  const [cargandoKPIs, setCargandoKPIs] = useState({});
  const [cargandoMetricas, setCargandoMetricas] = useState({});
  const [mostrarMetricas, setMostrarMetricas] = useState(false);
  const user = getUserData();
  
  // Si el admin tiene tenant_id_sede, es admin por sede y solo puede ver su sede
  const isAdminPorSede = user?.tenant_id_sede && user?.staff_tier === 'admin';
  const sedeFija = isAdminPorSede ? user.tenant_id_sede : null;

  const sedes = [
    { id: 'pardo_miraflores', nombre: 'Pardo Miraflores', ubicacion: 'Av. Benavides 730, Miraflores' },
    { id: 'pardo_surco', nombre: 'Pardo Surco', ubicacion: 'Av. Primavera 645, Surco' }
  ];

  // Filtrar sedes si es admin por sede
  const sedesDisponibles = sedeFija 
    ? sedes.filter(s => s.id === sedeFija)
    : sedes;

  // Cargar KPIs del backend (sin fecha = global)
  const loadKPIs = async (sedeId) => {
    const key = sedeId; // Sin fecha en la clave
    setCargandoKPIs(prev => ({ ...prev, [key]: true }));
    
    try {
      const data = await getKPIsBySedeAPI(sedeId, null); // null = sin fecha = global
      
      // Transformar ingresos_por_hora de array de números a array de objetos
      let ingresosPorHoraFormateado = [];
      if (data.ingresos_por_hora && Array.isArray(data.ingresos_por_hora)) {
        // Verificar si ya está formateado como objetos
        if (data.ingresos_por_hora.length > 0 && typeof data.ingresos_por_hora[0] === 'object' && data.ingresos_por_hora[0] !== null) {
          // Ya está formateado, usar directamente
          ingresosPorHoraFormateado = data.ingresos_por_hora.map(item => ({
            hora: item.hora !== undefined ? item.hora : 0,
            hora_formato: item.hora_formato || `${String(item.hora || 0).padStart(2, '0')}:00`,
            ingresos: Number(item.ingresos || item) || 0
          }));
        } else {
          // Es array de números, formatearlo
          ingresosPorHoraFormateado = data.ingresos_por_hora.map((ingreso, hora) => ({
            hora: hora,
            hora_formato: `${String(hora).padStart(2, '0')}:00`,
            ingresos: Number(ingreso) || 0
          }));
        }
      } else {
        // Si no hay datos, crear array vacío con 24 horas
        ingresosPorHoraFormateado = Array.from({ length: 24 }, (_, i) => ({
          hora: i,
          hora_formato: `${String(i).padStart(2, '0')}:00`,
          ingresos: 0
        }));
      }
      
      // Log para debug
      console.log('📊 KPIs cargados para', sedeId, ':', {
        numero_pedidos: data.numero_pedidos,
        ingresos_dia: data.ingresos_dia,
        estados_pedidos: data.estados_pedidos,
        ingresos_por_hora_length: ingresosPorHoraFormateado.length,
        top_productos: data.top_productos?.length || 0
      });
      
      setKpisData(prev => ({
        ...prev,
        [key]: {
          ...data,
          ingresos_por_hora: ingresosPorHoraFormateado
        }
      }));
    } catch (error) {
      console.error('Error cargando KPIs:', error);
      // Si hay error, usar datos vacíos
      setKpisData(prev => ({
        ...prev,
        [key]: {
          tenant_id: sedeId,
          fecha: null,
          numero_pedidos: 0,
          ingresos_dia: 0,
          ticket_promedio: 0,
          top_productos: [],
          estados_pedidos: {
            completados: 0,
            cancelados: 0,
            pendientes: 0,
            preparando: 0,
            despachando: 0,
            en_camino: 0,
            entregado: 0,
            rechazado: 0
          },
          tasa_exito: 0,
          ingresos_por_hora: Array.from({ length: 24 }, (_, i) => ({
            hora: i,
            hora_formato: `${String(i).padStart(2, '0')}:00`,
            ingresos: 0
          })),
          metodos_pago: []
        }
      }));
    } finally {
      setCargandoKPIs(prev => ({ ...prev, [key]: false }));
    }
  };

  // Cargar métricas de tiempos (sin fecha = global)
  const loadMetricasTiempos = async (sedeId) => {
    const key = sedeId; // Sin fecha en la clave
    setCargandoMetricas(prev => ({ ...prev, [key]: true }));
    
    try {
      const data = await getMetricasTiemposAPI(sedeId, null); // null = sin fecha = global
      setMetricasTiempos(prev => ({
        ...prev,
        [key]: data
      }));
    } catch (error) {
      console.error('Error cargando métricas de tiempos:', error);
      setMetricasTiempos(prev => ({
        ...prev,
        [key]: null
      }));
    } finally {
      setCargandoMetricas(prev => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    if (sedeExpandida) {
      loadKPIs(sedeExpandida);
      if (mostrarMetricas) {
        loadMetricasTiempos(sedeExpandida);
      }
    }
  }, [sedeExpandida, mostrarMetricas]);

  const toggleSede = (sedeId) => {
    setSedeExpandida(sedeExpandida === sedeId ? null : sedeId);
  };

  const getKpiData = (sedeId) => {
    const key = sedeId; // Sin fecha en la clave
    return kpisData[key] || {
      numero_pedidos: 0,
      ingresos_dia: 0,
      ticket_promedio: 0,
      top_productos: [],
      estados_pedidos: {
        completados: 0,
        cancelados: 0,
        pendientes: 0,
        preparando: 0,
        despachando: 0,
        en_camino: 0,
        entregado: 0,
        rechazado: 0
      },
      tasa_exito: 0,
      ingresos_por_hora: [],
      metodos_pago: []
    };
  };

  const getMetricasData = (sedeId) => {
    const key = sedeId; // Sin fecha en la clave
    return metricasTiempos[key] || null;
  };

  // Formatear tiempo en formato legible
  const formatTiempo = (segundos) => {
    if (!segundos) return '0s';
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    } else if (minutos > 0) {
      return `${minutos}m ${segs}s`;
    } else {
      return `${segs}s`;
    }
  };

  // Colores para gráficos
  const COLORS = ['#F2B10C', '#8B4513', '#228B22', '#4169E1', '#FF6347', '#9370DB', '#20B2AA'];

  // Generar datos para gráfico de pedidos por hora desde ingresos_por_hora
  const generarDatosGraficoPedidos = (ingresosPorHora, ticketPromedio) => {
    if (!ingresosPorHora || !Array.isArray(ingresosPorHora) || ingresosPorHora.length === 0) {
      return Array.from({ length: 24 }, (_, i) => ({
        hora: `${String(i).padStart(2, '0')}:00`,
        pedidos: 0
      }));
    }
    
    // Calcular pedidos aproximados desde ingresos (si ticket promedio > 0)
    const ticketProm = ticketPromedio > 0 ? ticketPromedio : 1;
    return ingresosPorHora.map(item => ({
      hora: item.hora_formato || `${String(item.hora || 0).padStart(2, '0')}:00`,
      pedidos: Math.round((item.ingresos || 0) / ticketProm)
    }));
  };

  return (
    <div className="flex-1 bg-pardos-cream p-8">
      <div className="mb-8">
        <h1 className="font-spartan font-black text-4xl mb-2">
          <span className="text-pardos-rust">RENDIMIENTO</span>{' '}
          <span className="text-black">POR SEDE</span>
        </h1>
        <p className="text-gray-600 font-lato">
          Visualiza las métricas de rendimiento de cada sede
        </p>
      </div>

      <div className="space-y-6">
        {sedesDisponibles.map((sede) => {
          const isExpanded = sedeExpandida === sede.id;
          const kpi = getKpiData(sede.id);
          const isLoading = cargandoKPIs[sede.id];
          const datosGrafico = generarDatosGraficoPedidos(kpi.ingresos_por_hora, kpi.ticket_promedio);

          return (
            <div key={sede.id} className="space-y-6">
            <Card className="overflow-hidden">
              {/* Botón de Sede */}
              <CardHeader className="bg-pardos-rust text-white cursor-pointer" onClick={() => toggleSede(sede.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl">{sede.nombre}</CardTitle>
                    <CardDescription className="text-white/80">{sede.ubicacion}</CardDescription>
                  </div>
                  <span className="text-3xl font-bold">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </CardHeader>

              {/* Contenido Expandido */}
              {isExpanded && (
                <CardContent className="p-6">
                  <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm font-lato text-blue-800">
                      📊 <strong>Datos Globales:</strong> Mostrando KPIs agregados de todos los tiempos históricos
                    </p>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loading size="lg" />
                      <span className="ml-4 font-lato font-bold text-pardos-dark">Cargando KPIs...</span>
                    </div>
                  ) : kpi.numero_pedidos === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="text-6xl mb-4">📊</div>
                      <p className="font-lato font-bold text-xl text-gray-600 mb-2">
                        No hay datos de KPIs disponibles
                      </p>
                      <p className="font-lato text-gray-500 text-sm">
                        Los KPIs se calculan automáticamente cuando hay pedidos. 
                        {kpi.numero_pedidos === 0 && ' Aún no hay pedidos registrados para esta sede.'}
                      </p>
                    </div>
                  ) : (
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Panel Izquierdo - Estadísticas */}
                    <div className="space-y-4">
                      {/* Estadística: Pedidos */}
                        <Card className="bg-white border-2 border-pardos-rust shadow-lg">
                          <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                              <div>
                                <CardDescription className="text-gray-600 mb-1 font-bold">PEDIDOS</CardDescription>
                                <CardTitle className="text-black text-4xl font-black">
                                  {kpi.numero_pedidos}
                                </CardTitle>
                                <p className="text-gray-600 text-sm mt-1 font-bold">Nº PEDIDOS</p>
                        </div>
                              <div className="text-6xl opacity-30">📦</div>
                      </div>
                          </CardContent>
                        </Card>

                      {/* Estadística: Ingresos */}
                        <Card className="bg-white border-2 border-green-600 shadow-lg">
                          <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                              <div>
                                <CardDescription className="text-gray-600 mb-1 font-bold">INGRESOS TOTALES</CardDescription>
                                <CardTitle className="text-black text-4xl font-black">
                                  S/ {kpi.ingresos_dia.toFixed(2)}
                                </CardTitle>
                                <p className="text-gray-600 text-sm mt-1 font-bold">TOTAL SOLES</p>
                        </div>
                              <div className="text-6xl opacity-30">💰</div>
                      </div>
                          </CardContent>
                        </Card>

                      {/* Estadística: Ticket */}
                        <Card className="bg-white border-2 border-blue-600 shadow-lg">
                          <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                              <div>
                                <CardDescription className="text-gray-600 mb-1 font-bold">TICKET PROMEDIO</CardDescription>
                                <CardTitle className="text-black text-4xl font-black">
                                  S/ {kpi.ticket_promedio.toFixed(2)}
                                </CardTitle>
                                <p className="text-gray-600 text-sm mt-1 font-bold">PROMEDIO POR PEDIDO</p>
                        </div>
                              <div className="text-6xl opacity-30">🎫</div>
                      </div>
                          </CardContent>
                        </Card>

                      {/* Top 3 Productos */}
                        <Card className="bg-white border-2 border-pardos-brown shadow-lg">
                          <CardContent className="p-6">
                            <CardTitle className="text-black text-xl mb-4 text-center font-bold">
                              TOP 3 PRODUCTOS VENDIDOS
                            </CardTitle>
                            {kpi.top_productos && kpi.top_productos.length > 0 ? (
                              <div className="space-y-3">
                                {kpi.top_productos.map((producto, index) => (
                                  <div key={producto.product_id || index} className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-pardos-rust">#{index + 1}</span>
                                        <span className="font-lato font-bold text-black">{producto.nombre || 'Producto sin nombre'}</span>
                                      </div>
                                      <span className="font-spartan font-black text-lg text-pardos-rust bg-pardos-rust/10 px-3 py-1 rounded">
                                        {producto.cantidad_vendida || 0} ventas
                                      </span>
                        </div>
                            </div>
                          ))}
                        </div>
                            ) : (
                              <p className="text-center text-gray-600 font-lato">
                                No hay productos vendidos
                              </p>
                            )}
                          </CardContent>
                        </Card>
                    </div>

                    {/* Panel Derecho - Gráfico */}
                    <div>
                        <Card className="border-2 border-gray-200">
                          <CardHeader className="bg-pardos-rust text-white">
                            <CardTitle className="text-white text-xl text-center">
                          GRÁFICO DE PEDIDOS POR HORA
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <ResponsiveContainer width="100%" height={400}>
                              <BarChart data={datosGrafico}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="hora" 
                                  tick={{ fontSize: 12 }}
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #ccc',
                                    borderRadius: '8px'
                                  }}
                                />
                                <Legend />
                                <Bar 
                                  dataKey="pedidos" 
                                  fill="#F2B10C" 
                                  name="Pedidos"
                                  radius={[8, 8, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

              {/* Sección de Métricas Avanzadas */}
              {isExpanded && (
                <Card className="mt-6 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
                    <CardTitle className="text-white text-2xl">📊 MÉTRICAS AVANZADAS</CardTitle>
                    <CardDescription className="text-white/80">
                      Análisis detallado de estados, ingresos, métodos de pago y más
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Tabs defaultValue="estados" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="estados">Estados</TabsTrigger>
                        <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
                        <TabsTrigger value="pagos">Métodos Pago</TabsTrigger>
                        <TabsTrigger value="productos">Productos</TabsTrigger>
                      </TabsList>

                      {/* Tab: Estados de Pedidos */}
                      <TabsContent value="estados" className="mt-6">
                        <div className="space-y-6">
                          {/* Resumen de Estados */}
                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                              <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-lato text-white/90 mb-1 font-bold">COMPLETADOS</p>
                                    <p className="text-4xl font-spartan font-black text-white">
                                      {kpi.estados_pedidos?.completados || kpi.estados_pedidos?.entregado || 0}
                                    </p>
                                    <p className="text-xs font-lato text-white/80 mt-1">Pedidos entregados</p>
                                  </div>
                                  <div className="text-5xl opacity-30">✓</div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
                              <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-lato text-white/90 mb-1 font-bold">CANCELADOS</p>
                                    <p className="text-4xl font-spartan font-black text-white">
                                      {kpi.estados_pedidos?.cancelados || 0}
                                    </p>
                                    <p className="text-xs font-lato text-white/80 mt-1">Pedidos cancelados</p>
                                  </div>
                                  <div className="text-5xl opacity-30">✗</div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                              <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-lato text-white/90 mb-1 font-bold">EN PROCESO</p>
                                    <p className="text-4xl font-spartan font-black text-white">
                                      {(kpi.estados_pedidos?.preparando || 0) + (kpi.estados_pedidos?.despachando || 0) + (kpi.estados_pedidos?.en_camino || 0)}
                                    </p>
                                    <p className="text-xs font-lato text-white/80 mt-1">En preparación/envío</p>
                                  </div>
                                  <div className="text-5xl opacity-30">⏳</div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                              <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-lato text-white/90 mb-1 font-bold">TASA DE ÉXITO</p>
                                    <p className="text-4xl font-spartan font-black text-white">
                                      {kpi.tasa_exito?.toFixed(1) || '0.0'}%
                                    </p>
                                    <p className="text-xs font-lato text-white/80 mt-1">Porcentaje exitoso</p>
                                  </div>
                                  <div className="text-5xl opacity-30">📈</div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Gráfico de Distribución de Estados */}
                          <Card>
                            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-700 text-white">
                              <CardTitle className="text-white text-xl">Distribución de Estados</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                              {/* Leyenda debajo del título, antes del gráfico */}
                              <div className="mb-8 flex items-center justify-center gap-6 flex-wrap bg-gray-50 p-5 rounded-lg border-2 border-gray-300 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 bg-red-500 rounded-full shadow-md"></div>
                                  <span className="font-lato font-bold text-gray-800 text-sm">Pendiente</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 bg-yellow-400 rounded-full shadow-md"></div>
                                  <span className="font-lato font-bold text-gray-800 text-sm">Preparando</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 bg-green-500 rounded-full shadow-md"></div>
                                  <span className="font-lato font-bold text-gray-800 text-sm">Despachado</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 bg-orange-500 rounded-full shadow-md"></div>
                                  <span className="font-lato font-bold text-gray-800 text-sm">En Camino</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 bg-blue-500 rounded-full shadow-md"></div>
                                  <span className="font-lato font-bold text-gray-800 text-sm">Entregado</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 bg-gray-500 rounded-full shadow-md"></div>
                                  <span className="font-lato font-bold text-gray-800 text-sm">Cancelados</span>
                                </div>
                              </div>
                              {(() => {
                                const datosEstados = [
                                  { name: 'Pendientes', value: kpi.estados_pedidos?.pendientes || 0, color: '#ef4444' },
                                  { name: 'Preparando', value: kpi.estados_pedidos?.preparando || 0, color: '#fbbf24' },
                                  { name: 'Despachado', value: (kpi.estados_pedidos?.despachando || 0) + (kpi.estados_pedidos?.despachado || 0), color: '#22c55e' },
                                  { name: 'En Camino', value: (kpi.estados_pedidos?.recogiendo || 0) + (kpi.estados_pedidos?.en_camino || 0), color: '#f97316' },
                                  { name: 'Entregado', value: kpi.estados_pedidos?.entregado || kpi.estados_pedidos?.completados || 0, color: '#3b82f6' },
                                  { name: 'Cancelados', value: kpi.estados_pedidos?.cancelados || 0, color: '#6b7280' },
                                ].filter(item => item.value > 0);
                                
                                if (datosEstados.length === 0) {
                                  return (
                                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                                      <p className="font-lato">No hay datos de estados disponibles</p>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                      <Pie
                                        data={datosEstados}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {[
                                      { name: 'Pendientes', value: kpi.estados_pedidos?.pendientes || 0, color: '#ef4444' }, // Rojo
                                      { name: 'Preparando', value: kpi.estados_pedidos?.preparando || 0, color: '#fbbf24' }, // Amarillo
                                      { name: 'Despachado', value: (kpi.estados_pedidos?.despachando || 0) + (kpi.estados_pedidos?.despachado || 0), color: '#22c55e' }, // Verde
                                      { name: 'En Camino', value: (kpi.estados_pedidos?.recogiendo || 0) + (kpi.estados_pedidos?.en_camino || 0), color: '#f97316' }, // Naranja
                                      { name: 'Entregado', value: kpi.estados_pedidos?.entregado || kpi.estados_pedidos?.completados || 0, color: '#3b82f6' }, // Azul
                                      { name: 'Cancelados', value: kpi.estados_pedidos?.cancelados || 0, color: '#6b7280' }, // Gris
                                        ].filter(item => item.value > 0).map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                      </Pie>
                                      <Tooltip />
                                    </PieChart>
                                  </ResponsiveContainer>
                                );
                              })()}
                            </CardContent>
                          </Card>

                          {/* Progress Bar de Tasa de Éxito */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Tasa de Éxito de Pedidos</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-lato font-bold">Progreso</span>
                                  <span className="font-spartan font-black text-lg">{kpi.tasa_exito?.toFixed(1) || '0.0'}%</span>
                                </div>
                                <Progress value={kpi.tasa_exito || 0} max={100} className="h-6" />
                                <p className="text-sm text-gray-600 font-lato">
                                  {kpi.estados_pedidos?.completados || kpi.estados_pedidos?.entregado || 0} de {kpi.numero_pedidos} pedidos completados exitosamente
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                      </div>
                      </TabsContent>

                      {/* Tab: Ingresos por Hora */}
                      <TabsContent value="ingresos" className="mt-6">
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>Ingresos por Hora (Total Histórico)</CardTitle>
                              <CardDescription>Distribución acumulada de ingresos por hora del día</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {kpi.ingresos_por_hora && kpi.ingresos_por_hora.length > 0 && kpi.ingresos_por_hora.some(h => h.ingresos > 0) ? (
                        <ResponsiveContainer width="100%" height={400}>
                                  <AreaChart data={kpi.ingresos_por_hora}>
                                    <defs>
                                      <linearGradient id={`colorIngresos-${sede.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F2B10C" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#F2B10C" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hora_formato" />
                                    <YAxis />
                                    <Tooltip 
                                      formatter={(value) => `S/ ${Number(value).toFixed(2)}`}
                                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                                    />
                                    <Area type="monotone" dataKey="ingresos" stroke="#F2B10C" fillOpacity={1} fill={`url(#colorIngresos-${sede.id})`} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-[400px] text-gray-500">
                                  <p className="font-lato">No hay datos de ingresos por hora disponibles</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Hora Pico */}
                          {kpi.ingresos_por_hora && kpi.ingresos_por_hora.length > 0 && (
                            <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardDescription className="text-white/80 mb-1">HORA PICO</CardDescription>
                                    <CardTitle className="text-white text-3xl font-black">
                                      {(() => {
                                        const horaPico = kpi.ingresos_por_hora.reduce((max, h) => h.ingresos > max.ingresos ? h : max, kpi.ingresos_por_hora[0]);
                                        return horaPico?.hora_formato || 'N/A';
                                      })()}
                                    </CardTitle>
                                    <p className="text-white/80 text-sm mt-1">
                                      S/ {(() => {
                                        const horaPico = kpi.ingresos_por_hora.reduce((max, h) => h.ingresos > max.ingresos ? h : max, kpi.ingresos_por_hora[0]);
                                        return horaPico?.ingresos?.toFixed(2) || '0.00';
                                      })()}
                                    </p>
                                  </div>
                                  <div className="text-6xl opacity-20">⏰</div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </TabsContent>

                      {/* Tab: Métodos de Pago */}
                      <TabsContent value="pagos" className="mt-6">
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>Distribución por Método de Pago</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {kpi.metodos_pago && kpi.metodos_pago.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                  <BarChart data={kpi.metodos_pago}>
                            <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="metodo" />
                            <YAxis />
                            <Tooltip />
                                    <Legend />
                                    <Bar dataKey="cantidad" fill="#F2B10C" name="Cantidad de Pedidos" />
                                    <Bar dataKey="ingresos" fill="#8B4513" name="Ingresos (S/)" />
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-[300px] text-gray-500">
                                  <p className="font-lato">No hay datos de métodos de pago disponibles</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Tabla de Métodos de Pago */}
                          {kpi.metodos_pago && kpi.metodos_pago.length > 0 && (
                            <Card>
                              <CardHeader>
                                <CardTitle>Detalle de Métodos de Pago</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-4 py-2 text-left font-spartan font-bold">Método</th>
                                        <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">Cantidad</th>
                                        <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">Ingresos</th>
                                        <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">% Cantidad</th>
                                        <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">% Ingresos</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {kpi.metodos_pago.map((metodo, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                          <td className="border border-gray-300 px-4 py-2 font-lato font-bold">
                                            <Badge variant="info">{metodo.metodo}</Badge>
                                          </td>
                                          <td className="border border-gray-300 px-4 py-2 text-center font-lato">{metodo.cantidad}</td>
                                          <td className="border border-gray-300 px-4 py-2 text-center font-lato font-bold text-green-600">
                                            S/ {metodo.ingresos.toFixed(2)}
                                          </td>
                                          <td className="border border-gray-300 px-4 py-2 text-center font-lato">
                                            <Progress value={metodo.porcentaje_cantidad} max={100} className="h-2" />
                                            <span className="text-xs text-gray-600 ml-2">{metodo.porcentaje_cantidad.toFixed(1)}%</span>
                                          </td>
                                          <td className="border border-gray-300 px-4 py-2 text-center font-lato">
                                            <Progress value={metodo.porcentaje_ingresos} max={100} className="h-2" />
                                            <span className="text-xs text-gray-600 ml-2">{metodo.porcentaje_ingresos.toFixed(1)}%</span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </TabsContent>

                      {/* Tab: Productos */}
                      <TabsContent value="productos" className="mt-6">
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>Top Productos Vendidos</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {kpi.top_productos && kpi.top_productos.length > 0 ? (
                                <div className="space-y-4">
                                  {kpi.top_productos.map((producto, index) => (
                                    <div key={producto.product_id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                      <div className="flex items-center gap-4">
                                        <Badge variant={index === 0 ? 'success' : index === 1 ? 'info' : 'default'}>
                                          #{index + 1}
                                        </Badge>
                                        <span className="font-lato font-bold text-lg">{producto.nombre || 'Producto sin nombre'}</span>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-spartan font-black text-xl text-pardos-rust">
                                          {producto.cantidad_vendida || 0} ventas
                                        </p>
                                        <Progress 
                                          value={(producto.cantidad_vendida / (kpi.top_productos[0]?.cantidad_vendida || 1)) * 100} 
                                          max={100} 
                                          className="h-2 mt-2 w-32"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-center text-gray-500 font-lato">No hay productos vendidos.</p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

            {/* Sección de Métricas de Tiempos */}
            {isExpanded && (
              <Card className="mt-6 overflow-hidden">
                <CardHeader className="bg-blue-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-2xl">⏱️ TIEMPOS DE TRANSICIÓN</CardTitle>
                      <CardDescription className="text-white/80">
                        Análisis de tiempos de transición entre estados
                      </CardDescription>
                    </div>
                    <button
                      onClick={() => {
                        setMostrarMetricas(!mostrarMetricas);
                        if (!mostrarMetricas && sedeExpandida) {
                          loadMetricasTiempos(sedeExpandida);
                        }
                      }}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-lato font-bold transition-colors"
                    >
                      {mostrarMetricas ? 'Ocultar Métricas' : 'Mostrar Métricas'}
                    </button>
                  </div>
                </CardHeader>

                {mostrarMetricas && (
                  <CardContent className="p-6">
                    {cargandoMetricas[sede.id] ? (
                      <div className="flex items-center justify-center py-20">
                        <Loading size="lg" />
                        <span className="ml-4 font-lato font-bold text-pardos-dark">Cargando métricas...</span>
                      </div>
                    ) : (
                      (() => {
                        const metricas = getMetricasData(sede.id);
                        if (!metricas || !metricas.resumen) {
                          return (
                            <div className="text-center py-10 text-gray-500">
                              <p className="font-lato">No hay métricas de tiempos disponibles.</p>
                            </div>
                          );
                        }

                        const { resumen, metricas_por_estado, metricas_por_transicion, tiempos_totales_por_pedido, tiempos_detallados_por_pedido } = metricas;

                        return (
                          <div className="space-y-6">
                            {/* Resumen General */}
                            <div className="grid md:grid-cols-4 gap-4">
                              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                                <CardContent className="p-4">
                                  <CardDescription className="text-white/80 text-xs mb-1">PEDIDOS ANALIZADOS</CardDescription>
                                  <CardTitle className="text-white text-3xl font-black">{resumen.total_pedidos_analizados}</CardTitle>
                                </CardContent>
                              </Card>
                              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                                <CardContent className="p-4">
                                  <CardDescription className="text-white/80 text-xs mb-1">TIEMPO PROMEDIO TOTAL</CardDescription>
                                  <CardTitle className="text-white text-2xl font-black">{formatTiempo(resumen.tiempo_promedio_total_segundos)}</CardTitle>
                                  <p className="text-white/80 text-xs mt-1">({resumen.tiempo_promedio_total_minutos.toFixed(2)} min)</p>
                                </CardContent>
                              </Card>
                              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                                <CardContent className="p-4">
                                  <CardDescription className="text-white/80 text-xs mb-1">TOTAL TRANSICIONES</CardDescription>
                                  <CardTitle className="text-white text-3xl font-black">{resumen.total_transiciones}</CardTitle>
                                </CardContent>
                              </Card>
                              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                                <CardContent className="p-4">
                                  <CardDescription className="text-white/80 text-xs mb-1">PROMEDIO POR TRANSICIÓN</CardDescription>
                                  <CardTitle className="text-white text-2xl font-black">
                                    {resumen.total_transiciones > 0 
                                      ? formatTiempo(Math.round(resumen.tiempo_promedio_total_segundos / resumen.total_transiciones))
                                      : '0s'
                                    }
                                  </CardTitle>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Gráficos */}
                            <div className="grid lg:grid-cols-2 gap-6">
                              {/* Gráfico de Tiempos por Estado */}
                              {metricas_por_estado && metricas_por_estado.length > 0 && (
                                <Card>
                                  <CardHeader className="bg-pardos-rust text-white">
                                    <CardTitle className="text-white text-xl">Tiempo Promedio por Estado</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-6">
                                    {/* Leyenda debajo del título, antes del gráfico */}
                                    <div className="mb-8 flex items-center justify-center gap-8 bg-gray-50 p-5 rounded-lg border-2 border-gray-300 shadow-sm">
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-yellow-400 rounded shadow-md"></div>
                                        <span className="font-lato font-bold text-gray-800 text-sm">Promedio</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-green-500 rounded shadow-md"></div>
                                        <span className="font-lato font-bold text-gray-800 text-sm">Mínimo</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-red-500 rounded shadow-md"></div>
                                        <span className="font-lato font-bold text-gray-800 text-sm">Máximo</span>
                                      </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}>
                                      <BarChart data={metricas_por_estado.map(m => ({
                                        estado: m.estado,
                                        promedio: m.promedio_segundos,
                                        minimo: m.minimo_segundos,
                                        maximo: m.maximo_segundos,
                                      }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="estado" angle={-45} textAnchor="end" height={80} />
                                        <YAxis />
                                        <Tooltip 
                                          formatter={(value) => formatTiempo(value)}
                                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="promedio" fill="#F2B10C" name="Promedio" />
                                        <Bar dataKey="minimo" fill="#22c55e" name="Mínimo" />
                                        <Bar dataKey="maximo" fill="#ef4444" name="Máximo" />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Gráfico de Tiempos por Transición */}
                              {metricas_por_transicion && metricas_por_transicion.length > 0 && (
                                <Card>
                                  <CardHeader className="bg-pardos-rust text-white">
                                    <CardTitle className="text-white text-xl">Tiempo Promedio por Transición</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-6">
                                    {/* Leyenda debajo del título, antes del gráfico */}
                                    <div className="mb-8 flex items-center justify-center bg-gray-50 p-5 rounded-lg border-2 border-gray-300 shadow-sm">
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-blue-500 rounded shadow-md"></div>
                                        <span className="font-lato font-bold text-gray-800 text-sm">Tiempo Promedio</span>
                                      </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}>
                                      <BarChart data={metricas_por_transicion.slice(0, 10).map(m => ({
                                        transicion: m.transicion,
                                        promedio: m.promedio_segundos,
                                        cantidad: m.cantidad,
                                      }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="transicion" angle={-45} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip 
                                          formatter={(value) => formatTiempo(value)}
                                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="promedio" fill="#3b82f6" name="Tiempo Promedio" />
                          </BarChart>
                        </ResponsiveContainer>
                                  </CardContent>
                                </Card>
                              )}
                            </div>

                            {/* Tabla de Métricas por Estado */}
                            {metricas_por_estado && metricas_por_estado.length > 0 && (
                              <Card>
                                <CardHeader className="bg-pardos-rust text-white">
                                  <CardTitle className="text-white text-xl">Detalle de Tiempos por Estado</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          <th className="border border-gray-300 px-4 py-2 text-left font-spartan font-bold">Estado</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">Promedio</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">Mínimo</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">Máximo</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">Mediana</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">Transiciones</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {metricas_por_estado.map((metrica, index) => (
                                          <tr key={index} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-4 py-2 font-lato font-bold">{metrica.estado}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-center font-lato">{formatTiempo(metrica.promedio_segundos)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-center font-lato text-green-600">{formatTiempo(metrica.minimo_segundos)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-center font-lato text-red-600">{formatTiempo(metrica.maximo_segundos)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-center font-lato">{formatTiempo(metrica.mediana_segundos)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-center font-lato">{metrica.cantidad_transiciones}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Tabla Detallada de Tiempos por Pedido y Estado */}
                            {tiempos_detallados_por_pedido && tiempos_detallados_por_pedido.length > 0 && (
                              <Card>
                                <CardHeader className="bg-pardos-rust text-white">
                                  <CardTitle className="text-white text-xl">⏱️ Tiempos Individuales por Pedido y Estado</CardTitle>
                                  <CardDescription className="text-white/80">
                                    Tiempos específicos de cada pedido en cada estado (no promedios)
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                    {tiempos_detallados_por_pedido.map((pedido, pedidoIndex) => (
                                      <div key={pedidoIndex} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                                        {/* Header del Pedido */}
                                        <div className="bg-gray-100 px-4 py-3 border-b-2 border-gray-300">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <span className="font-spartan font-bold text-lg text-pardos-dark">
                                                Pedido: {pedido.pedido_id.substring(0, 12)}...
                                              </span>
                                              <span className="ml-4 font-lato text-sm text-gray-600">
                                                ID completo: {pedido.pedido_id}
                                              </span>
                                            </div>
                                            <div className="text-right">
                                              <span className="font-lato text-sm text-gray-600">Tiempo Total:</span>
                                              <span className="ml-2 font-spartan font-black text-xl text-red-600">
                                                {formatTiempo(pedido.tiempo_total_segundos)}
                                              </span>
                      </div>
                    </div>
                  </div>
                                        
                                        {/* Tabla de Estados del Pedido */}
                                        <div className="overflow-x-auto">
                                          <table className="w-full border-collapse">
                                            <thead>
                                              <tr className="bg-pardos-yellow">
                                                <th className="border border-gray-300 px-4 py-2 text-left font-spartan font-bold">Estado</th>
                                                <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">Tiempo en Estado</th>
                                                <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">Siguiente Estado</th>
                                                <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">Fecha/Hora Transición</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {pedido.tiempos_por_estado.map((tiempoEstado, estadoIndex) => (
                                                tiempoEstado.transiciones.map((transicion, transIndex) => (
                                                  <tr 
                                                    key={`${pedido.pedido_id}-${estadoIndex}-${transIndex}`} 
                                                    className="hover:bg-gray-50"
                                                  >
                                                    <td className="border border-gray-300 px-4 py-2 text-center font-lato font-bold">
                                                      {(() => {
                                                        const colorInfo = getEstadoColor(tiempoEstado.estado);
                                                        return (
                                                          <span className={`px-3 py-1 ${colorInfo.bg} ${colorInfo.text} rounded-full font-bold`}>
                                                            {tiempoEstado.estado}
                                                          </span>
                                                        );
                                                      })()}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2 text-center font-lato font-bold text-blue-600 text-lg">
                                                      {formatTiempo(transicion.duracion_segundos)}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2 text-center font-lato">
                                                      {(() => {
                                                        const colorInfo = getEstadoColor(transicion.estado_nuevo);
                                                        return (
                                                          <span className={`px-3 py-1 ${colorInfo.bg} ${colorInfo.text} rounded-full font-bold`}>
                                                            {transicion.estado_nuevo}
                                                          </span>
                                                        );
                                                      })()}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2 text-center font-lato text-sm text-gray-600">
                                                      {transicion.timestamp ? new Date(transicion.timestamp).toLocaleString('es-PE', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                      }) : '-'}
                                                    </td>
                                                  </tr>
                                                ))
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Tabla de Top Pedidos más Lentos (Resumen) */}
                            {tiempos_totales_por_pedido && tiempos_totales_por_pedido.length > 0 && (
                              <Card>
                                <CardHeader className="bg-pardos-rust text-white">
                                  <CardTitle className="text-white text-xl">Resumen: Top 20 Pedidos con Mayor Tiempo Total</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                      <thead>
                                        <tr className="bg-gray-100">
                                          <th className="border border-gray-300 px-4 py-2 text-left font-spartan font-bold">#</th>
                                          <th className="border border-gray-300 px-4 py-2 text-left font-spartan font-bold">Pedido ID</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">Tiempo Total</th>
                                          <th className="border border-gray-300 px-4 py-2 text-center font-spartan font-bold">Transiciones</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {tiempos_totales_por_pedido.map((pedido, index) => (
                                          <tr key={index} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-4 py-2 text-center font-lato font-bold">{index + 1}</td>
                                            <td className="border border-gray-300 px-4 py-2 font-lato font-mono text-sm">{pedido.pedido_id.substring(0, 8)}...</td>
                                            <td className="border border-gray-300 px-4 py-2 text-center font-lato font-bold text-red-600">{formatTiempo(pedido.tiempo_total_segundos)}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-center font-lato">{pedido.cantidad_transiciones}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                </div>
                        );
                      })()
                    )}
                  </CardContent>
                )}
              </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Rendimiento;
