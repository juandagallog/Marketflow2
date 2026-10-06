// Solo estado de interfaz: los productos y clientes se reconstruyen desde la API.
const CLAVE_BORRADOR_VENTA = 'papel-luna:venta-borrador:v1';
const CLAVE_ESCRITURA_BORRADOR = 'papel-luna:venta-borrador:escritura:v1';
let borradorPreparado = false;
let restaurandoBorrador = false;
let avisoBorradorEmitido = false;

function accederBorrador(operacion) {
  try { return operacion(localStorage); }
  catch {
    if (!avisoBorradorEmitido) {
      avisoBorradorEmitido = true;
      mostrarNotificacion('El navegador no permite guardar el borrador local. No recargues una venta en curso.', 'error');
    }
    return null;
  }
}

function eliminarBorradorVenta() {
  accederBorrador(storage => {
    storage.removeItem(CLAVE_BORRADOR_VENTA);
    storage.removeItem(CLAVE_ESCRITURA_BORRADOR);
  });
}

function guardarBorradorVenta() {
  if (!borradorPreparado || restaurandoBorrador || ventaAbiertaActualId || ventaPendiente || ventaAbiertaGuardadoPendiente) return;
  if (!factura.length) { eliminarBorradorVenta(); return; }
  const borrador = {
    items: factura.map(item => ({ productoId: item.id, cantidad: item.cantidad })),
    clienteId: document.getElementById('select-cliente').value,
    metodoPago: selectPago.value,
    valorRecibido: Math.round(Number(inputRecibido.value) || 0),
    actualizadoEn: new Date().toISOString()
  };
  accederBorrador(storage => storage.setItem(CLAVE_BORRADOR_VENTA, JSON.stringify(borrador)));
}

// No recuperamos como nueva una venta cuyo guardado pudo llegar al servicio.
// Esto solo marca el borrador; no reemplaza los reintentos ni los stocks objetivo.
function marcarEscrituraBorrador(id) {
  accederBorrador(storage => storage.setItem(CLAVE_ESCRITURA_BORRADOR, String(id)));
}

function iniciarBorradorVenta() {
  if (borradorPreparado || !catalogoCargado || !clientesCargados) return;
  borradorPreparado = true;
  document.getElementById('select-cliente').addEventListener('change', guardarBorradorVenta);
  selectPago.addEventListener('change', guardarBorradorVenta);
  inputRecibido.addEventListener('input', guardarBorradorVenta);
  const texto = accederBorrador(storage => storage.getItem(CLAVE_BORRADOR_VENTA));
  const escritura = accederBorrador(storage => storage.getItem(CLAVE_ESCRITURA_BORRADOR));
  if (escritura) {
    mostrarNotificacion('Hubo una venta en proceso de guardado antes de recargar. Revisa el historial y Sheets antes de volver a vender; no se recuperará como una venta nueva.', 'error');
    return;
  }
  if (!texto) { guardarBorradorVenta(); return; }
  let borrador;
  try {
    borrador = JSON.parse(texto);
    if (!Array.isArray(borrador.items)) throw new Error('Formato inválido');
  } catch {
    eliminarBorradorVenta();
    mostrarNotificacion('El borrador local estaba dañado y no se pudo recuperar.', 'error');
    return;
  }
  if (!borrador.items.length) { eliminarBorradorVenta(); return; }
  // Evita sustituir un carrito que el usuario haya comenzado durante la carga.
  if (factura.length || !window.confirm('Encontramos una venta sin finalizar.\n¿Deseas recuperarla?')) {
    eliminarBorradorVenta(); guardarBorradorVenta(); return;
  }
  restaurandoBorrador = true;
  const avisos = [];
  try {
    const recuperados = new Map();
    for (const item of borrador.items) {
      const producto = productos.find(p => p.id === String(item.productoId));
      if (!producto) { avisos.push('Se omitió un producto que ya no existe.'); continue; }
      const cantidad = Number(item.cantidad);
      if (!Number.isFinite(cantidad) || cantidad <= 0) { avisos.push(`Cantidad inválida: ${producto.nombre}.`); continue; }
      const anterior = recuperados.get(producto.id)?.cantidad || 0;
      let objetivo = anterior + cantidad;
      if (producto.trackStock) {
        if (!Number.isFinite(producto.stock) || producto.stock <= 0) { avisos.push(`Sin stock: ${producto.nombre}.`); continue; }
        if (objetivo > producto.stock) { objetivo = producto.stock; avisos.push(`Cantidad ajustada al stock: ${producto.nombre}.`); }
      }
      recuperados.set(producto.id, { ...producto, cantidad: objetivo });
    }
    factura = [...recuperados.values()];
    const clienteId = String(borrador.clienteId || '');
    document.getElementById('select-cliente').value = clientes.some(c => c.id === clienteId) ? clienteId : '';
    if (clienteId && !clientes.some(c => c.id === clienteId)) avisos.push('El cliente ya no existe; selecciona otro si corresponde.');
    selectPago.value = ['Efectivo', 'Nequi', 'Debe'].includes(borrador.metodoPago) ? borrador.metodoPago : 'Efectivo';
    selectPago.dispatchEvent(new Event('change'));
    const recibido = Number(borrador.valorRecibido);
    inputRecibido.value = selectPago.value === 'Efectivo' && Number.isFinite(recibido) && recibido >= 0 ? Math.round(recibido) : '';
    renderizarFactura();
  } finally { restaurandoBorrador = false; }
  guardarBorradorVenta();
  mostrarNotificacion(avisos.length ? avisos.join(' ') : 'Borrador recuperado con los datos actuales del catálogo.', avisos.length ? 'error' : 'exito');
}
