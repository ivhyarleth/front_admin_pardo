import { useState, useEffect } from 'react';
import { 
  getProductosAPI, 
  createProductoAPI, 
  updateProductoAPI, 
  deleteProductoAPI,
  consultarInventarioAPI,
  ajustarInventarioAPI,
  getSelectedSede,
  getUserData
} from '../config/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { Loading } from '../components/ui/Loading';
import { Badge } from '../components/ui/Badge';

const Productos = () => {
  const { addToast } = useToast();
  const [productos, setProductos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    limit: 20,
    has_more: false,
    next_cursor: null,
    current_cursor: null
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInventarioDialogOpen, setIsInventarioDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [formData, setFormData] = useState({
    nombre_producto: '',
    descripcion: '',
    precio_producto: '',
    tipo: 'comida',
    is_active: true,
  });
  const [inventarioFormData, setInventarioFormData] = useState({
    producto_id: '',
    cantidad: '',
    tipo_movimiento: 'entrada',
    reason: '',
  });
  const [deletingId, setDeletingId] = useState(null);
  const user = getUserData();
  const selectedSede = user?.tenant_id_sede || getSelectedSede();

  useEffect(() => {
    loadProductos();
  }, [selectedSede]);

  const loadProductos = async (cursor = null) => {
    setLoading(true);
    try {
      // Cargar productos de la sede actual y inventario
      const limit = pagination.limit || 20;
      const filters = { is_active: true, limit };
      if (cursor) {
        filters.cursor = cursor;
      }
      
      const [productosResponse, inventarioResponse] = await Promise.all([
        getProductosAPI(selectedSede, filters),
        consultarInventarioAPI(selectedSede)
      ]);
      
      setProductos(productosResponse.productos || []);
      setPagination(prev => ({
        ...prev,
        limit,
        has_more: productosResponse.pagination?.has_more || false,
        next_cursor: productosResponse.pagination?.next_cursor || null,
        current_cursor: cursor
      }));
      
      // Inventario puede venir como objeto con paginación o array
      if (inventarioResponse && typeof inventarioResponse === 'object' && inventarioResponse.inventario) {
        setInventario(inventarioResponse.inventario || []);
      } else if (Array.isArray(inventarioResponse)) {
        setInventario(inventarioResponse || []);
      } else {
        setInventario([]);
      }
    } catch (error) {
      addToast('Error al cargar productos', 'error');
      console.error('Error loading productos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNextPage = () => {
    if (pagination.next_cursor) {
      loadProductos(pagination.next_cursor);
    }
  };
  
  const handlePrevPage = () => {
    // Para ir atrás, necesitamos mantener un historial de cursors
    // Por simplicidad, recargamos desde el inicio
    loadProductos(null);
  };

  const handleOpenDialog = (producto = null) => {
    if (producto) {
      setEditingProducto(producto);
      setFormData({
        nombre_producto: producto.nombre_producto || '',
        descripcion: producto.descripcion || '',
        precio_producto: producto.precio_producto?.toString() || '',
        tipo: producto.tipo || 'comida',
        is_active: producto.is_active !== false,
      });
    } else {
      setEditingProducto(null);
      setFormData({
        nombre_producto: '',
        descripcion: '',
        precio_producto: '',
        tipo: 'comida',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProducto(null);
    setFormData({
      nombre_producto: '',
      descripcion: '',
      precio_producto: '',
      tipo: 'comida',
      is_active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productoData = {
        nombre_producto: formData.nombre_producto,
        descripcion: formData.descripcion,
        precio_producto: parseFloat(formData.precio_producto),
        tipo: formData.tipo,
        is_active: formData.is_active,
      };

      if (editingProducto) {
        await updateProductoAPI(editingProducto.producto_id, productoData, selectedSede);
        addToast('Producto actualizado exitosamente', 'success');
      } else {
        await createProductoAPI(productoData, selectedSede);
        addToast('Producto creado exitosamente', 'success');
      }
      
      handleCloseDialog();
      loadProductos();
    } catch (error) {
      addToast(error.message || 'Error al guardar producto', 'error');
    }
  };

  const handleDeleteClick = (producto) => {
    setDeletingId(producto.producto_id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProductoAPI(deletingId, selectedSede);
      addToast('Producto eliminado exitosamente', 'success');
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
      loadProductos();
    } catch (error) {
      addToast(error.message || 'Error al eliminar producto', 'error');
    }
  };

  const handleOpenInventarioDialog = (producto) => {
    const inventarioItem = inventario.find(item => item.producto_id === producto.producto_id);
    setInventarioFormData({
      producto_id: producto.producto_id,
      cantidad: '',
      tipo_movimiento: 'entrada',
      reason: '',
    });
    setIsInventarioDialogOpen(true);
  };

  const handleCloseInventarioDialog = () => {
    setIsInventarioDialogOpen(false);
    setInventarioFormData({
      producto_id: '',
      cantidad: '',
      tipo_movimiento: 'entrada',
      reason: '',
    });
  };

  const handleInventarioSubmit = async (e) => {
    e.preventDefault();
    try {
      const ajusteData = {
        producto_id: inventarioFormData.producto_id,
        cantidad: parseInt(inventarioFormData.cantidad),
        tipo_movimiento: inventarioFormData.tipo_movimiento,
        reason: inventarioFormData.reason || 'Ajuste manual desde productos',
      };

      await ajustarInventarioAPI(ajusteData, selectedSede);
      addToast('Inventario ajustado exitosamente', 'success');
      handleCloseInventarioDialog();
      loadProductos();
    } catch (error) {
      addToast(error.message || 'Error al ajustar inventario', 'error');
    }
  };

  const getStockInfo = (productoId) => {
    const inventarioItem = inventario.find(item => item.producto_id === productoId);
    if (!inventarioItem) return null;
    return {
      stock_actual: inventarioItem.stock_actual || 0,
      stock_minimo: inventarioItem.stock_minimo || 0,
    };
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
              Gestión de Productos
            </h1>
            <p className="text-gray-600 font-lato">
              Administra los productos disponibles en la sede {selectedSede}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            + Nuevo Producto
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {productos.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 font-lato text-lg mb-4">
                  No hay productos registrados
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  Crear Primer Producto
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((producto) => (
                    <TableRow key={producto.producto_id}>
                      <TableCell className="font-spartan font-medium">
                        {producto.nombre_producto}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {producto.descripcion || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={producto.tipo === 'comida' ? 'default' : 'secondary'}>
                          {producto.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-spartan font-bold">
                        S/ {producto.precio_producto?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={producto.is_active ? 'success' : 'destructive'}>
                          {producto.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenInventarioDialog(producto)}
                            title="Ajustar inventario"
                          >
                            📦 Inventario
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(producto)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(producto)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Paginación */}
        {productos.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600 font-lato">
              Mostrando {productos.length} producto{productos.length !== 1 ? 's' : ''}
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

      {/* Dialog para crear/editar producto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogClose onClose={handleCloseDialog} />
          <DialogHeader>
            <DialogTitle>
              {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {editingProducto 
                ? 'Modifica la información del producto' 
                : 'Completa la información para crear un nuevo producto'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-spartan font-medium text-pardos-dark mb-2">
                  Nombre del Producto *
                </label>
                <Input
                  value={formData.nombre_producto}
                  onChange={(e) => setFormData({ ...formData, nombre_producto: e.target.value })}
                  required
                  placeholder="Ej: Pollo a la Brasa"
                />
              </div>
              <div>
                <label className="block text-sm font-spartan font-medium text-pardos-dark mb-2">
                  Descripción
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-lato text-pardos-dark placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pardos-yellow focus-visible:border-transparent"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del producto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-spartan font-medium text-pardos-dark mb-2">
                    Precio (S/) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_producto}
                    onChange={(e) => setFormData({ ...formData, precio_producto: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-spartan font-medium text-pardos-dark mb-2">
                    Tipo *
                  </label>
                  <Select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    required
                  >
                    <option value="comida">Comida</option>
                    <option value="bebida">Bebida</option>
                    <option value="combo">Combo</option>
                    <option value="postre">Postre</option>
                  </Select>
                </div>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-pardos-rust border-gray-300 rounded focus:ring-pardos-yellow"
                  />
                  <span className="text-sm font-lato text-pardos-dark">Producto activo</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingProducto ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar Producto?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ajustar inventario */}
      <Dialog open={isInventarioDialogOpen} onOpenChange={setIsInventarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Inventario</DialogTitle>
            <DialogDescription>
              Realiza un ajuste de inventario para este producto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInventarioSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-spartan font-medium text-pardos-dark mb-2">
                  Producto
                </label>
                <Input
                  value={productos.find(p => p.producto_id === inventarioFormData.producto_id)?.nombre_producto || ''}
                  disabled
                  className="bg-gray-100"
                />
                {(() => {
                  const stockInfo = getStockInfo(inventarioFormData.producto_id);
                  return stockInfo ? (
                    <p className="text-sm text-gray-600 mt-1 font-lato">
                      Stock actual: <span className="font-bold">{stockInfo.stock_actual}</span> | 
                      Stock mínimo: <span className="font-bold">{stockInfo.stock_minimo}</span>
                    </p>
                  ) : null;
                })()}
              </div>
              <div>
                <label className="block text-sm font-spartan font-medium text-pardos-dark mb-2">
                  Cantidad *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={inventarioFormData.cantidad}
                  onChange={(e) => setInventarioFormData({ ...inventarioFormData, cantidad: e.target.value })}
                  required
                  placeholder="Cantidad a ajustar"
                />
              </div>
              <div>
                <label className="block text-sm font-spartan font-medium text-pardos-dark mb-2">
                  Tipo de Movimiento *
                </label>
                <Select
                  value={inventarioFormData.tipo_movimiento}
                  onChange={(e) => setInventarioFormData({ ...inventarioFormData, tipo_movimiento: e.target.value })}
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
                  value={inventarioFormData.reason}
                  onChange={(e) => setInventarioFormData({ ...inventarioFormData, reason: e.target.value })}
                  placeholder="Motivo del ajuste (opcional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseInventarioDialog}>
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

export default Productos;

