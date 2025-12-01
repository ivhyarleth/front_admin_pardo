export function formatCategoryName(category) {
  const categoryMap = {
    'pollo': 'Pollo',
    'parrillas': 'Parrillas',
    'bebidas': 'Bebidas',
    'postres': 'Postres',
    'combos': 'Combos',
    'promociones': 'Promociones'
  };
  return categoryMap[category] || category;
}

export function formatSedeName(tenantId) {
  const sedeMap = {
    'pardo_miraflores': 'Pardo Miraflores',
    'pardo_surco': 'Pardo Surco',
    'pardo': 'Pardo'
  };
  return sedeMap[tenantId] || tenantId;
}

