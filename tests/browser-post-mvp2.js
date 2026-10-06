// Solo para la página temporal de pruebas. No se incluye en index.html.
// Sustituye fetch antes de cargar api.js; ningún POST llega a Google Sheets.
const pruebaClave = 'post-mvp2:servicio-simulado';
const datosPrueba = JSON.parse(sessionStorage.getItem(pruebaClave) || 'null') || {
  productos: [
    { id: 'prod-1', codigo: 'PROD-001', nombre: 'Borrador', categoriaId: 'cat-1', precio: 100, costo: 50, seguimientoInventario: true, stock: 45, descripcion: 'Para lápiz', imagenes: '' },
    { id: 'prod-2', codigo: 'PROD-002', nombre: 'Servicio de impresión', categoriaId: 'cat-1', precio: 50, costo: 10, seguimientoInventario: false, stock: 0, descripcion: '', imagenes: '' }
  ],
  categorias: [{ id: 'cat-1', nombre: 'Papelería' }],
  clientes: [{ id: 'cli-1', nombre: 'Ana', telefono: '123', correo: '' }],
  proveedores: [{ id: 'prv-1', nombre: 'Distribuidora inicial', telefono: '123', correo: '' }], ventas: [], compras: []
};
window.confirm = () => true;
window.fetch = async (url, options = {}) => {
  const resource = new URL(url).searchParams.get('resource');
  let data = datosPrueba[resource];
  if (options.method === 'POST') {
    const body = JSON.parse(options.body);
    const index = data.findIndex(r => r.id === body.data.id);
    if (body.action === 'create') data.push(body.data);
    if (body.action === 'update') data[index] = { ...data[index], ...body.data };
    if (body.action === 'delete') data.splice(index, 1);
    data = body.data;
    sessionStorage.setItem(pruebaClave, JSON.stringify(datosPrueba));
  }
  return { ok: true, status: 200, text: async () => JSON.stringify({ success: true, data }) };
};
const esperarPrueba = async condicion => {
  for (let i = 0; i < 100; i++) { if (condicion()) return; await new Promise(resolve => setTimeout(resolve, 20)); }
  throw new Error('Tiempo agotado esperando la interfaz');
};
window.addEventListener('load', async () => {
  const el = id => document.getElementById(id);
  const verificar = (condicion, mensaje) => { if (!condicion) throw new Error(mensaje); };
  try {
    await esperarPrueba(() => catalogoCargado && clientesCargados && borradorPreparado);
    const etapa = sessionStorage.getItem('post-mvp2:etapa');
    if (!etapa) {
      el('btn-nav-compras').click();
      await esperarPrueba(() => gestiones.proveedores.registros.length && !gestiones.proveedores.cargando);
      el('compra-producto').value = 'prod-1'; el('compra-costo').value = 50; el('compra-cantidad').value = 2;
      el('btn-agregar-compra').click();
      el('btn-nuevo-proveedor-compra').click(); el('nuevo-proveedor-nombre').value = 'Distribuidora Luna';
      el('nuevo-proveedor-form').requestSubmit();
      await esperarPrueba(() => el('nuevo-proveedor-modal').classList.contains('hidden'));
      verificar(el('compra-proveedor').value === datosPrueba.proveedores.at(-1).id, 'Proveedor no seleccionado');
      verificar(lineasCompra.length === 1, 'Compra perdida al crear proveedor');
      el('btn-nuevo-producto-compra').click();
      el('product-name').value = 'Cuaderno'; el('product-category').value = 'cat-1'; el('product-price').value = 1000; el('product-cost').value = 500;
      el('track-inventory').checked = true; el('track-inventory').dispatchEvent(new Event('change')); el('product-stock').value = 8;
      el('product-form').requestSubmit();
      await esperarPrueba(() => el('product-modal').classList.contains('hidden'));
      verificar(el('compra-producto').value === datosPrueba.productos.at(-1).id, 'Producto no seleccionado');
      verificar(lineasCompra.length === 1, 'Compra perdida al crear producto');
      el('compra-cantidad').value = 3; el('btn-agregar-compra').click();
      verificar(lineasCompra.length === 2, 'Compra no permite varios productos');
      el('compra-form').requestSubmit(); await esperarPrueba(() => datosPrueba.compras.length === 1 && !productosGuardando);
      verificar(datosPrueba.compras[0].total === 1600, 'Total compra incorrecto');
      verificar(datosPrueba.productos[0].stock === 47 && datosPrueba.productos[2].stock === 11, 'Inventario compra incorrecto');
      el('btn-nav-pos').click(); agregarAFactura('prod-1', 2); agregarAFactura('prod-2', 1);
      el('monto-recibido').value = 1000; el('monto-recibido').dispatchEvent(new Event('input'));
      sessionStorage.setItem('post-mvp2:etapa', 'recuperar'); location.reload(); return;
    }
    if (etapa === 'recuperar') {
      verificar(factura.length === 2, 'No se recuperó el carrito al recargar');
      verificar(Number(inputRecibido.value) === 1000, 'No se recuperó el pago');
      el('btn-finalizar').click(); await esperarPrueba(() => !factura.length && !productosGuardando);
      verificar(!localStorage.getItem(CLAVE_BORRADOR_VENTA), 'Borrador persiste después de cerrar');
      verificar(datosPrueba.productos[0].stock === 45, 'Inventario venta incorrecto');
      sessionStorage.setItem('post-mvp2:etapa', 'abierta'); location.reload(); return;
    }
    if (etapa === 'abierta') {
      verificar(!factura.length, 'Se recuperó una venta ya cerrada');
      agregarAFactura('prod-1', 1); el('btn-guardar-abierta').click();
      await esperarPrueba(() => !factura.length && !productosGuardando);
      verificar(!localStorage.getItem(CLAVE_BORRADOR_VENTA), 'Borrador persiste después de guardar abierta');
      verificar(datosPrueba.productos[0].stock === 45, 'Abierta descontó inventario');
      sessionStorage.setItem('post-mvp2:etapa', 'terminado'); location.reload(); return;
    }
    verificar(!factura.length, 'Se recuperó además el borrador de una abierta guardada');
    el('btn-nav-compras').click();
    await esperarPrueba(() => document.querySelector('.compra-detalle'));
    verificar(!document.querySelector('.skeleton-card'), 'Skeleton permanente');
    verificar(document.documentElement.scrollWidth <= window.innerWidth, 'Desbordamiento horizontal de la página');
    document.body.dataset.prueba = 'PASS';
    document.querySelector('.compra-detalle').open = true;
    el('notificacion').classList.add('hidden');
  } catch (error) {
    document.body.dataset.prueba = 'FAIL'; document.body.dataset.errorPrueba = error.message;
    console.error(error);
  }
});
