import { useState, useEffect } from 'react';
import { 
  consultarInventarioAPI, 
  ajustarInventarioAPI,
  getProductosAPI,
  getSelectedSede,
  getUserData
} from '../config/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { Loading } from '../components/ui/Loading';
import { Badge } from '../components/ui/Badge';

const Inventario = () => {
  const { addToast } = useToast();
  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    limit: 20,
    has_more: false,
    next_cursor: null,
    current_cursor: null
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: '',
    tipo_movimiento: 'entrada',
    reason: '',
  });
  const user = getUserData();
  const selectedSede = user?.tenant_id_sede || getSelectedSede();

  useEffect(() => {
    loadData();
  }, [selectedSede]);

  const loadData = async (cursor = null) => {
    setLoading(true);
    try {
      // Cargar inventario (el backend ahora devuelve nombres de productos)
      const limit = pagination.limit || 20;
      const inventarioResponse = await consultarInventarioAPI(selectedSede, null, limit, cursor);
      setInventario(inventarioResponse.inventario || []);
      setPagination(prev => ({
        ...prev,
        limit,
        has_more: inventarioResponse.pagination?.has_more || false,
        next_cursor: inventarioResponse.pagination?.next_cursor || null,
        current_cursor: cursor
      }));

      // Cargar productos solo de la sede actual para el selector del diálogo
      const productosResponse = await getProductosAPI(selectedSede, {});
      if (productosResponse && productosResponse.productos) {
        setProductos(productosResponse.productos || []);
      } else if (Array.isArray(productosResponse)) {
        setProductos(productosResponse || []);
      } else {
        setProductos([]);
      }
    } catch (error) {
      addToast('Error al cargar inventario', 'error');
      console.error('Error loading inventario:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNextPage = () => {
    if (pagination.next_cursor) {
      loadData(pagination.next_cursor);
    }
  };
  
  const handlePrevPage = () => {
    // Recargar desde el inicio
    loadData(null);
  };

  const handleOpenDialog = (productoId = null) => {
    setFormData({
      producto_id: productoId || '',
      cantidad: '',
      tipo_movimiento: 'entrada',
      reason: '',
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      producto_id: '',
      cantidad: '',
      tipo_movimiento: 'entrada',
      reason: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const ajusteData = {
        producto_id: formData.producto_id,
        cantidad: parseInt(formData.cantidad),
        tipo_movimiento: formData.tipo_movimiento,
        reason: formData.reason || 'Ajuste manual',
      };

      await ajustarInventarioAPI(ajusteData, selectedSede);
      addToast('Inventario ajustado exitosamente', 'success');
      handleCloseDialog();
      loadData(null);
    } catch (error) {
      addToast(error.message || 'Error al ajustar inventario', 'error');
    }
  };

  const getProductoNombre = (item) => {
    // El backend ahora devuelve nombre_producto en el inventario
    if (item.nombre_producto) {
      return item.nombre_producto;
    }
    // Fallback: buscar en productos cargados
    const producto = productos.find(p => p.producto_id === item.producto_id);
    return producto?.nombre_producto || item.producto_id;
  };

  const getStockStatus = (stockActual, stockMinimo) => {
    if (stockActual <= 0) return { label: 'Sin Stock', variant: 'destructive' };
    if (stockActual <= stockMinimo) return { label: 'Bajo Stock', variant: 'warning' };
    return { label: 'En Stock', variant: 'success' };
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex-1 p-8 bg-gray-50">
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-spartan font-bold text-pardos-dark mb-2">
              Gestión de Inventario
            </h1>
            <p className="text-gray-600 font-lato">
              Consulta y ajusta el inventario de productos en la sede {selectedSede}
            </p>
          </div>
          <Button onClick={handleOpenDialog}>
            + Ajustar Inventario
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {inventario.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 font-lato text-lg mb-4">
                  No hay registros de inventario
                </p>
                <Button onClick={handleOpenDialog}>
                  Realizar Primer Ajuste
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Stock Mínimo</TableHead>
                    <TableHead>Stock Máximo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Actualización</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventario.map((item) => {
                    const status = getStockStatus(item.stock_actual, item.stock_minimo);
                    return (
                      <TableRow key={`${item.tenant_id}-${item.producto_id}`}>
                        <TableCell className="font-spartan font-medium">
                          {getProductoNombre(item)}
                        </TableCell>
                        <TableCell className="font-spartan font-bold text-lg">
                          {item.stock_actual || 0}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {item.stock_minimo || 0}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {item.stock_maximo || 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {item.ultima_actualizacion 
                            ? new Date(item.ultima_actualizacion).toLocaleDateString('es-PE')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(item.producto_id)}
                          >
                            Ajustar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Paginación */}
        {inventario.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600 font-lato">
              Mostrando {inventario.length} registro{inventario.length !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={!pagination.current_cursor}
              >
                ← Anterior
              </Button>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={!pagination.has_more}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog para ajustar inventario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Inventario</DialogTitle>
            <DialogDescription>
              Realiza un ajuste de inventario para un producto específico
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-spartan font-medium text-pardos-dark mb-2">
                  Producto *
                </label>
                <Select
                  value={formData.producto_id}
                  onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((producto) => (
                    <option key={producto.producto_id} value={producto.producto_id}>
                      {producto.nombre_producto}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-spartan font-medium text-pardos-dark mb-2">
                  Cantidad *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  required
                  placeholder="Cantidad a ajustar"
                />
              </div>
              <div>
                <label className="block text-sm font-spartan font-medium text-pardos-dark mb-2">
                  Tipo de Movimiento *
                </label>
                <Select
                  value={formData.tipo_movimiento}
                  onChange={(e) => setFormData({ ...formData, tipo_movimiento: e.target.value })}
                  required
                >
                  <option value="entrada">Entrada (Agregar stock)</option>
                  <option value="salida">Salida (Reducir stock)</option>
                  <option value="ajuste">Ajuste (Establecer stock exacto)</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-spartan font-medium text-pardos-dark mb-2">
                  Motivo / Notas
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-lato text-pardos-dark placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pardos-yellow focus-visible:border-transparent"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Motivo del ajuste (opcional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                Ajustar Inventario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventario;

