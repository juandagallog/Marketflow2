function validarClienteVenta(metodoPago, clienteId) {
  if (metodoPago === 'Debe' && !clienteId) {
    mostrarNotificacion('Debes seleccionar un cliente para una venta con método Debe.', 'error');
    return false;
  }
  if (clienteId && (!clientesCargados || !clientes.some(c => c.id === clienteId))) {
    mostrarNotificacion('Selecciona un cliente válido. Si es necesario, recarga Clientes.', 'error');
    return false;
  }
  return true;
}

async function guardarVentaAbierta() {
  if (!catalogoCargado || productosGuardando || ventaPendiente || compraPendiente) return;
  if (!ventaAbiertaGuardadoPendiente) {
    if (!factura.length) { mostrarNotificacion('La factura está vacía.', 'error'); return; }
    const metodoPago = selectPago.value;
    const clienteId = document.getElementById('select-cliente').value;
    if (!validarClienteVenta(metodoPago, clienteId)) return;
    if (factura.some(i => !Number.isInteger(i.precio) || !Number.isInteger(i.costo))) {
      mostrarNotificacion('Los precios y costos deben ser pesos enteros. Corrige el producto antes de guardar.', 'error'); return;
    }
    const ahora = new Date().toISOString();
    const subtotal = Math.round(factura.reduce((sum, item) => sum + item.precio * item.cantidad, 0));
    const total = subtotal + Math.round(subtotal * 0.19);
    const valorRecibido = metodoPago === 'Efectivo' ? Math.round(Number(inputRecibido.value || 0)) : 0;
    if (!Number.isFinite(valorRecibido) || valorRecibido < 0 || factura.some(i => !Number.isFinite(i.cantidad) || i.cantidad <= 0)) {
      mostrarNotificacion('Cantidades y monto recibido deben ser válidos.', 'error'); return;
    }
    const venta = {
      id: ventaAbiertaActualId || crypto.randomUUID(),
      fecha: ventaAbiertaActualFecha || ahora, actualizadoEn: ahora,
      estado: 'abierta', clienteId, metodoPago, subtotal, total, valorRecibido,
      cambio: metodoPago === 'Efectivo' ? Math.max(0, Math.round(valorRecibido - total)) : 0,
      itemsJson: factura.map(i => ({ productoId: i.id, nombre: i.nombre, precio: i.precio, costo: i.costo, cantidad: i.cantidad }))
    };
    ventaAbiertaGuardadoPendiente = { venta, action: ventaAbiertaActualId ? 'update' : 'create', intentado: false };
  }
  const operacion = ventaAbiertaGuardadoPendiente;
  marcarEscrituraBorrador(operacion.venta.id);
  const boton = document.getElementById('btn-guardar-abierta');
  productosGuardando = true;
  boton.disabled = true; botonFinalizar.disabled = true;
  try {
    let confirmada = false;
    const coincide = v => String(v.id) === operacion.venta.id && v.estado === 'abierta' && v.actualizadoEn === operacion.venta.actualizadoEn;
    if (operacion.intentado) confirmada = (await apiGet('ventas')).some(coincide);
    if (!confirmada) {
      operacion.intentado = true;
      try { await apiPost('ventas', operacion.action, operacion.venta); }
      catch (error) {
        if (!(await apiGet('ventas')).some(coincide)) throw error;
      }
    }
    // Guardar abierta nunca escribe inventario.
    eliminarBorradorVenta();
    ventaAbiertaGuardadoPendiente = null;
    ventaAbiertaActualId = null; ventaAbiertaActualFecha = null;
    ventaPendienteId = null;
    factura = [];
    document.getElementById('select-cliente').value = '';
    document.getElementById('venta-abierta-estado').textContent = '';
    selectPago.value = 'Efectivo'; inputRecibido.value = '';
    grupoEfectivo.classList.remove('hidden'); cambioValor.textContent = '$0';
    renderizarFactura();
    mostrarNotificacion('Venta abierta guardada. Puedes retomarla desde el historial.', 'exito');
    renderHistorial(true);
  } catch (error) {
    mostrarNotificacion('No se confirmó el guardado: ' + error.message + '. Reintenta Guardar venta abierta; se conserva el mismo UUID.', 'error');
  } finally {
    productosGuardando = false;
    boton.disabled = false; botonFinalizar.disabled = false;
  }
}

async function retomarVentaAbierta(id) {
  if (!catalogoCargado || productosGuardando || ventaPendiente || ventaAbiertaGuardadoPendiente || compraPendiente) {
    mostrarNotificacion('Termina la operación pendiente o espera la carga del catálogo.', 'error'); return;
  }
  if (factura.length && !window.confirm('¿Reemplazar el carrito actual por esta venta abierta?')) return;
  productosGuardando = true;
  try {
    const venta = (await apiGet('ventas')).find(v => String(v.id) === String(id));
    if (!venta || venta.estado !== 'abierta') throw new Error('Esta venta ya no está abierta. Recarga el historial.');
    if (!clientesCargados) await cargarClientes();
    const adaptada = adaptarVentaRemota(venta);
    const items = adaptada.items.map(i => {
      const producto = productos.find(p => p.id === String(i.productoId));
      return { ...producto, id: String(i.productoId), nombre: String(i.nombre), precio: Number(i.precio), costo: Number(i.costo), cantidad: Number(i.cantidad) };
    });
    if (items.some(i => !Number.isFinite(i.precio) || !Number.isFinite(i.cantidad) || i.cantidad <= 0)) throw new Error('Las líneas de la venta no son válidas.');
    factura = items;
    eliminarBorradorVenta();
    ventaAbiertaActualId = String(venta.id); ventaAbiertaActualFecha = venta.fecha;
    const select = document.getElementById('select-cliente');
    const clienteId = String(venta.clienteId || '');
    if (clienteId && ![...select.options].some(o => o.value === clienteId)) select.add(new Option(nombreCliente(clienteId), clienteId));
    select.value = clienteId;
    selectPago.value = venta.metodoPago;
    selectPago.dispatchEvent(new Event('change'));
    inputRecibido.value = adaptada.recibido;
    document.getElementById('venta-abierta-estado').textContent = `Editando venta abierta ${referenciaVisible(ventaAbiertaActualId, 'VTA')}`;
    renderizarFactura(); actualizarCalculoCambio();
    document.getElementById('btn-nav-pos').click();
  } catch (error) { mostrarNotificacion(error.message, 'error'); }
  finally { productosGuardando = false; }
}
