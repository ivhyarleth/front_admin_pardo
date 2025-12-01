// 🔌 Configuración de Endpoints API - Pardos Admin System
// ============================================

// Base URL del API Gateway
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tl5son9q35.execute-api.us-east-1.amazonaws.com/dev';

// ============================================
// 📍 ENDPOINTS
// ============================================

export const API_ENDPOINTS = {
  
  // 👤 AUTENTICACIÓN
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,           // POST - Login (admin/trabajador)
    LOGOUT: `${API_BASE_URL}/auth/logout`,         // POST - Cerrar sesión
    REGISTRO: `${API_BASE_URL}/auth/registro`,     // POST - Registro staff
    GENERAR_INVITATION: `${API_BASE_URL}/auth/generate-invitation`, // POST - Generar código
  },

  // 📦 PEDIDOS
  PEDIDOS: {
    CONSULTAR: `${API_BASE_URL}/pedido/consultar`, // GET - Todos los pedidos (admin ve todas las sedes)
    MIS_ASIGNACIONES: `${API_BASE_URL}/pedido/mis-asignaciones`, // GET - Pedidos asignados (trabajador)
  },

  // 📊 ESTADOS
  ESTADOS: {
    OBTENER: `${API_BASE_URL}/estados/obtener`,    // GET - Obtener estado y historial
    ACTUALIZAR: `${API_BASE_URL}/estados/actualizar`, // POST - Actualizar estado manualmente
    METRICAS_TIEMPOS: `${API_BASE_URL}/estados/metricas-tiempos`, // GET - Obtener métricas de tiempos de transición
  },

  // 👥 ASIGNACIONES
  ASIGNACIONES: {
    ASIGNAR: `${API_BASE_URL}/asignaciones/asignar`, // POST - Asignar trabajador
    OBTENER_TRABAJADORES: `${API_BASE_URL}/asignaciones/obtener`, // GET - Listar trabajadores
  },

  // 🔄 WORKFLOW
  WORKFLOW: {
    CHEF_CONFIRMA: `${API_BASE_URL}/chef/confirma`, // POST - Chef confirma
    DESPACHADO_CONFIRMA: `${API_BASE_URL}/despachado/confirma`, // POST - Despachado confirma
    MOTORIZADO_CONFIRMA: `${API_BASE_URL}/motorizado/confirma`, // POST - Motorizado confirma
  },

  // 📊 KPIs
  KPIS: {
    CALCULAR: `${API_BASE_URL}/kpis/calcular`, // POST - Calcular KPIs
    CONSULTAR: `${API_BASE_URL}/kpis/consultar`, // GET - Consultar KPIs
  },
};

// ============================================
// 🔧 HEADERS Y UTILIDADES
// ============================================

// Obtener token de autenticación
export const getAuthToken = () => {
  return localStorage.getItem('pardos-system-token');
};

// Obtener datos del usuario
export const getUserData = () => {
  const userStr = localStorage.getItem('pardos-system-user');
  return userStr ? JSON.parse(userStr) : null;
};

// Obtener sede seleccionada
export const getSelectedSede = () => {
  return localStorage.getItem('pardos-selected-sede') || 'pardo_miraflores';
};

// Guardar sede seleccionada
export const setSelectedSede = (sede) => {
  localStorage.setItem('pardos-selected-sede', sede);
};

// Headers con autenticación
export const getAuthHeaders = (tenantId = null) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  } else {
    // Si no se especifica, usar la sede del usuario o la seleccionada
    const user = getUserData();
    const sede = user?.tenant_id_sede || getSelectedSede();
    headers['x-tenant-id'] = sede;
  }
  
  return headers;
};

// Headers sin autenticación
export const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

// ============================================
// 📝 FUNCIONES DE API
// ============================================

// Login
export const loginAPI = async (email, password, frontendType = 'staff', tenantIdSede = null) => {
  try {
    const body = {
      email,
      password,
      frontend_type: frontendType,
    };
    
    // Si es staff, agregar tenant_id_sede (puede ser null para admin general)
    if (frontendType === 'staff') {
      // Permitir null explícitamente para admin general
      body.tenant_id_sede = tenantIdSede !== undefined ? tenantIdSede : null;
    }
    
    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error en login');
    }
    
    // Guardar token y datos de usuario
    if (data.token) {
      localStorage.setItem('pardos-system-token', data.token);
    }
    
    if (data.user) {
      localStorage.setItem('pardos-system-user', JSON.stringify(data.user));
      // Guardar sede del usuario
      if (data.user.tenant_id_sede) {
        setSelectedSede(data.user.tenant_id_sede);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error en loginAPI:', error);
    throw error;
  }
};

// Logout
export const logoutAPI = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      headers: getAuthHeaders(),
      mode: 'cors' // Asegurar que use CORS
    });
    
    // Limpiar localStorage siempre, incluso si la respuesta falla
    localStorage.removeItem('pardos-system-token');
    localStorage.removeItem('pardos-system-user');
    localStorage.removeItem('pardos-selected-sede');
    
    // Si la respuesta no es OK, no lanzar error (ya limpiamos localStorage)
    if (!response.ok) {
      console.warn('Logout API response not OK, but localStorage cleared');
      return { message: 'Sesión cerrada localmente' };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en logoutAPI:', error);
    // Limpiar localStorage incluso si hay error (importante para UX)
    localStorage.removeItem('pardos-system-token');
    localStorage.removeItem('pardos-system-user');
    localStorage.removeItem('pardos-selected-sede');
    // Retornar éxito aunque haya error de red (el logout local ya se hizo)
    return { message: 'Sesión cerrada localmente' };
  }
};

// Obtener todos los pedidos (Admin ve todas las sedes)
export const getAllOrdersAPI = async (tenantId = null) => {
  try {
    const response = await fetch(API_ENDPOINTS.PEDIDOS.CONSULTAR, {
      method: 'GET',
      headers: getAuthHeaders(tenantId)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error obteniendo pedidos');
    }
    
    return data.pedidos || [];
  } catch (error) {
    console.error('Error en getAllOrdersAPI:', error);
    throw error;
  }
};

// Obtener pedido por ID
export const getOrderByIdAPI = async (pedidoId, tenantId = null) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.PEDIDOS.CONSULTAR}?pedido_id=${pedidoId}`, {
      method: 'GET',
      headers: getAuthHeaders(tenantId)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error obteniendo pedido');
    }
    
    return data.pedido;
  } catch (error) {
    console.error('Error en getOrderByIdAPI:', error);
    throw error;
  }
};

// Obtener mis asignaciones (Trabajador)
export const getMyAssignmentsAPI = async (tipo = null, tenantId = null) => {
  try {
    let endpoint = API_ENDPOINTS.PEDIDOS.MIS_ASIGNACIONES;
    if (tipo) {
      endpoint += `?tipo=${tipo}`;
    }
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders(tenantId)
    });
    
    const data = await response.json();
    
    // Debug: Ver respuesta del backend
    console.log('🔍 Respuesta de mis-asignaciones:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Error obteniendo asignaciones');
    }
    
    return data.pedidos || [];
  } catch (error) {
    console.error('Error en getMyAssignmentsAPI:', error);
    throw error;
  }
};

// Asignar trabajador a pedido (Admin)
export const assignWorkerAPI = async (pedidoId, trabajadorEmail, tipoAsignacion, tenantId = null) => {
  try {
    const body = {
      tenant_id: tenantId || getSelectedSede(),
      pedido_id: pedidoId,
      trabajador_email: trabajadorEmail,
      tipo_asignacion: tipoAsignacion // 'chef' o 'motorizado'
    };
    
    const response = await fetch(API_ENDPOINTS.ASIGNACIONES.ASIGNAR, {
      method: 'POST',
      headers: getAuthHeaders(tenantId),
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error asignando trabajador');
    }
    
    return data;
  } catch (error) {
    console.error('Error en assignWorkerAPI:', error);
    throw error;
  }
};

// Obtener trabajadores disponibles
export const getWorkersAPI = async (tenantIdSede = null, email = null, staffTier = null) => {
  try {
    let endpoint = API_ENDPOINTS.ASIGNACIONES.OBTENER_TRABAJADORES;
    const params = new URLSearchParams();
    
    if (tenantIdSede) {
      params.append('tenant_id_sede', tenantIdSede);
    } else {
      params.append('tenant_id_sede', getSelectedSede());
    }
    
    if (email) {
      params.append('email', email);
    }
    
    if (staffTier) {
      params.append('staff_tier', staffTier);
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error obteniendo trabajadores');
    }
    
    return data.trabajadores || [];
  } catch (error) {
    console.error('Error en getWorkersAPI:', error);
    throw error;
  }
};

// Obtener estado de pedido con historial
export const getOrderStatusAPI = async (pedidoId, incluirHistorial = true, tenantId = null) => {
  try {
    let endpoint = `${API_ENDPOINTS.ESTADOS.OBTENER}?pedido_id=${pedidoId}`;
    if (incluirHistorial) {
      endpoint += '&incluir_historial=true';
    }
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders(tenantId)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error obteniendo estado');
    }
    
    return data;
  } catch (error) {
    console.error('Error en getOrderStatusAPI:', error);
    throw error;
  }
};

// Actualizar estado de pedido (Manual)
export const updateOrderStatusAPI = async (pedidoId, nuevoEstado, motivo = null, tenantId = null) => {
  try {
    const body = {
      tenant_id: tenantId || getSelectedSede(),
      pedido_id: pedidoId,
      estado: nuevoEstado
    };
    
    if (motivo) {
      body.motivo = motivo;
    }
    
    const response = await fetch(API_ENDPOINTS.ESTADOS.ACTUALIZAR, {
      method: 'POST',
      headers: getAuthHeaders(tenantId),
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error actualizando estado');
    }
    
    return data;
  } catch (error) {
    console.error('Error en updateOrderStatusAPI:', error);
    throw error;
  }
};

// Chef confirma pedido
export const chefConfirmaAPI = async (pedidoId, chefId, aprobado = true, tenantId = null) => {
  try {
    const body = {
      tenant_id: tenantId || getSelectedSede(),
      pedido_id: pedidoId,
      chef_id: chefId,
      aprobado: aprobado
    };
    
    const response = await fetch(API_ENDPOINTS.WORKFLOW.CHEF_CONFIRMA, {
      method: 'POST',
      headers: getAuthHeaders(tenantId),
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error confirmando chef');
    }
    
    return data;
  } catch (error) {
    console.error('Error en chefConfirmaAPI:', error);
    throw error;
  }
};

// Despachado confirma pedido
export const despachadoConfirmaAPI = async (pedidoId, tenantId = null) => {
  try {
    const body = {
      tenant_id: tenantId || getSelectedSede(),
      pedido_id: pedidoId
    };
    
    const response = await fetch(API_ENDPOINTS.WORKFLOW.DESPACHADO_CONFIRMA, {
      method: 'POST',
      headers: getAuthHeaders(tenantId),
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error confirmando despachado');
    }
    
    return data;
  } catch (error) {
    console.error('Error en despachadoConfirmaAPI:', error);
    throw error;
  }
};

// Motorizado confirma pedido
export const motorizadoConfirmaAPI = async (pedidoId, motorizadoId, tenantId = null) => {
  try {
    const body = {
      tenant_id: tenantId || getSelectedSede(),
      pedido_id: pedidoId,
      motorizado_id: motorizadoId
    };
    
    const response = await fetch(API_ENDPOINTS.WORKFLOW.MOTORIZADO_CONFIRMA, {
      method: 'POST',
      headers: getAuthHeaders(tenantId),
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error confirmando motorizado');
    }
    
    return data;
  } catch (error) {
    console.error('Error en motorizadoConfirmaAPI:', error);
    throw error;
  }
};

// Generar código de invitación (Admin)
export const generarInvitationCodeAPI = async (tenantIdSede, staffTier = 'trabajador') => {
  try {
    const body = {
      tenant_id_sede: tenantIdSede,
      staff_tier: staffTier
    };
    
    const response = await fetch(API_ENDPOINTS.AUTH.GENERAR_INVITATION, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error generando código');
    }
    
    return data;
  } catch (error) {
    console.error('Error en generarInvitationCodeAPI:', error);
    throw error;
  }
};

// Obtener KPIs por sede (Admin)
// Si fecha es null, retorna datos globales agregados
export const getKPIsBySedeAPI = async (sedeId, fecha = null) => {
  try {
    const params = new URLSearchParams({
      tenant_id: sedeId
    });
    // Solo agregar fecha si se proporciona explícitamente
    if (fecha) {
      params.append('fecha', fecha);
    }
    
    const response = await fetch(`${API_ENDPOINTS.KPIS.CONSULTAR}?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(sedeId)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error obteniendo KPIs');
    }
    
    return {
      tenant_id: data.tenant_id || sedeId,
      fecha: data.fecha || fecha,
      numero_pedidos: data.numero_pedidos || 0,
      ingresos_dia: data.ingresos_dia || 0,
      ticket_promedio: data.ticket_promedio || 0,
      top_productos: data.top_productos || [],
      // Nuevas métricas
      estados_pedidos: data.estados_pedidos || {
        completados: 0,
        cancelados: 0,
        pendientes: 0,
        preparando: 0,
        despachando: 0,
        en_camino: 0,
        entregado: 0,
        rechazado: 0
      },
      tasa_exito: data.tasa_exito || 0,
      ingresos_por_hora: data.ingresos_por_hora || [],
      metodos_pago: data.metodos_pago || []
    };
  } catch (error) {
    console.error('Error en getKPIsBySedeAPI:', error);
    throw error;
  }
};

// Obtener métricas de tiempos de transición
// Si fecha es null, retorna métricas globales agregadas
export const getMetricasTiemposAPI = async (sedeId, fecha = null) => {
  try {
    const params = new URLSearchParams({
      tenant_id: sedeId
    });
    // Solo agregar fecha si se proporciona explícitamente
    if (fecha) {
      params.append('fecha', fecha);
    }
    
    const response = await fetch(`${API_ENDPOINTS.ESTADOS.METRICAS_TIEMPOS}?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(sedeId)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error obteniendo métricas de tiempos');
    }
    
    return data;
  } catch (error) {
    console.error('Error en getMetricasTiemposAPI:', error);
    throw error;
  }
};

export default API_ENDPOINTS;
