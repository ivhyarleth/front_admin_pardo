// 🔌 Configuración de Endpoints API - Pardos Admin System
// ============================================

// Base URL del API Gateway (configurar en .env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sekbehf5na.execute-api.us-east-1.amazonaws.com/dev';

// ============================================
// 📍 ENDPOINTS
// ============================================

export const API_ENDPOINTS = {
  
  // 👤 AUTENTICACIÓN
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,           // POST - Login (admin/trabajador)
    LOGOUT: `${API_BASE_URL}/auth/logout`,         // POST - Cerrar sesión
  },

  // 📦 PEDIDOS (Admin)
  ORDERS: {
    GET_ALL: `${API_BASE_URL}/orders`,                              // GET - Todos los pedidos
    GET_BY_ID: (orderId) => `${API_BASE_URL}/orders/${orderId}`,   // GET - Un pedido
    ASSIGN_WORKER: (orderId) => `${API_BASE_URL}/orders/${orderId}/assign`, // PUT - Asignar trabajador
    UPDATE_STATUS: (orderId) => `${API_BASE_URL}/orders/${orderId}/status`, // PUT - Actualizar estado
  },

  // 📋 PEDIDOS ASIGNADOS (Trabajador)
  ASSIGNED_ORDERS: {
    GET_MY_ORDERS: (trabajadorId) => `${API_BASE_URL}/orders/assigned/${trabajadorId}`, // GET - Mis pedidos
  },

  // 📊 KPIs (Admin)
  KPIS: {
    GET_BY_SEDE: (sedeId, fecha) => `${API_BASE_URL}/kpis/sede/${sedeId}?fecha=${fecha}`, // GET - KPIs por sede
  },

  // 👥 TRABAJADORES
  WORKERS: {
    GET_ALL: `${API_BASE_URL}/workers`,           // GET - Todos los trabajadores
    GET_AVAILABLE: `${API_BASE_URL}/workers/available`, // GET - Disponibles
  },
};

// ============================================
// 🔧 HEADERS
// ============================================

export const getAuthHeaders = () => {
  const token = localStorage.getItem('pardos-system-token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

// ============================================
// 📝 FUNCIONES DE API
// ============================================

// Login
export const loginAPI = async (email, password, rol) => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password, rol })
    });
    
    if (!response.ok) {
      throw new Error('Error en login');
    }
    
    const data = await response.json();
    
    // Guardar token
    if (data.token) {
      localStorage.setItem('pardos-system-token', data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Error en loginAPI:', error);
    throw error;
  }
};

// Obtener todos los pedidos (Admin)
export const getAllOrdersAPI = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.ORDERS.GET_ALL, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Error obteniendo pedidos');
    }
    
    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error('Error en getAllOrdersAPI:', error);
    throw error;
  }
};

// Asignar trabajador a pedido (Admin)
export const assignWorkerAPI = async (orderId, trabajadorId) => {
  try {
    const response = await fetch(API_ENDPOINTS.ORDERS.ASSIGN_WORKER(orderId), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ trabajadorId })
    });
    
    if (!response.ok) {
      throw new Error('Error asignando trabajador');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en assignWorkerAPI:', error);
    throw error;
  }
};

// Cambiar estado de pedido (Trabajador)
export const updateOrderStatusAPI = async (orderId, status, timestamp, duracion) => {
  try {
    const response = await fetch(API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        status, 
        timestamp,
        duracion 
      })
    });
    
    if (!response.ok) {
      throw new Error('Error actualizando estado');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en updateOrderStatusAPI:', error);
    throw error;
  }
};

// Obtener pedidos asignados (Trabajador)
export const getAssignedOrdersAPI = async (trabajadorId) => {
  try {
    const response = await fetch(API_ENDPOINTS.ASSIGNED_ORDERS.GET_MY_ORDERS(trabajadorId), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Error obteniendo pedidos asignados');
    }
    
    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error('Error en getAssignedOrdersAPI:', error);
    throw error;
  }
};

// Obtener KPIs por sede (Admin)
export const getKPIsBySedeAPI = async (sedeId, fecha) => {
  try {
    const response = await fetch(API_ENDPOINTS.KPIS.GET_BY_SEDE(sedeId, fecha), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Error obteniendo KPIs');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en getKPIsBySedeAPI:', error);
    throw error;
  }
};

// Obtener lista de trabajadores (Admin)
export const getWorkersAPI = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.WORKERS.GET_ALL, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Error obteniendo trabajadores');
    }
    
    const data = await response.json();
    return data.workers || [];
  } catch (error) {
    console.error('Error en getWorkersAPI:', error);
    throw error;
  }
};

export default API_ENDPOINTS;
