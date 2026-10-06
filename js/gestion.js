// Patrón compartido solo para los dos CRUD nuevos; Clientes conserva su flujo actual.
const gestiones = {
  proveedores: { campos: ['nombre', 'telefono', 'correo'], registros: [], guardando: false, cargando: null },
  categorias: { campos: ['nombre'], registros: [], guardando: false, cargando: null }
};

function sincronizarGestion(resource) {
  if (resource === 'proveedores') {
    const select = document.getElementById('compra-proveedor');
    const id = select.value;
    select.replaceChildren(new Option('Selecciona un proveedor', ''));
    gestiones.proveedores.registros.forEach(p => select.add(new Option(p.nombre, p.id)));
    select.value = id;
  } else {
    categorias = gestiones.categorias.registros;
    const select = document.getElementById('product-category');
    const id = select.value;
    select.replaceChildren(new Option('Selecciona una categoría', ''));
    categorias.forEach(c => select.add(new Option(c.nombre, c.id)));
    select.value = id;
    productos.forEach(p => p.categoria = categorias.find(c => c.id === p.categoriaId)?.nombre || 'Sin categoría');
    factura.forEach(p => p.categoria = categorias.find(c => c.id === p.categoriaId)?.nombre || 'Sin categoría');
    renderizarProductos(obtenerProductosActuales()); renderTablaCRUD(productos); renderizarFactura();
    document.getElementById('btn-new-product').disabled = !catalogoCargado || !categorias.length;
  }
}

function renderGestion(resource) {
  const gestion = gestiones[resource];
  const body = document.getElementById(`${resource}-body`);
  const texto = document.getElementById(`${resource}-buscar`).value.toLowerCase().trim();
  body.replaceChildren();
  gestion.registros.filter(r => gestion.campos.some(c => r[c].toLowerCase().includes(texto))).forEach(r => {
    const tr = document.createElement('tr');
    const referencia = document.createElement('td');
    referencia.className = 'referencia-registro';
    referencia.textContent = referenciaVisible(r.id, resource === 'categorias' ? 'CAT' : 'PRV');
    tr.appendChild(referencia);
    gestion.campos.forEach(c => { const td = document.createElement('td'); td.textContent = r[c]; tr.appendChild(td); });
    const td = document.createElement('td');
    const editar = document.createElement('button'); editar.type = 'button'; editar.className = 'btn-editar'; editar.textContent = 'Editar'; editar.disabled = gestion.guardando;
    editar.addEventListener('click', async () => {
      if (gestion.guardando) return;
      if (gestion.cargando) await gestion.cargando;
      if (gestion.guardando) return;
      const actual = gestion.registros.find(registro => registro.id === r.id);
      if (!actual) return;
      ['id', ...gestion.campos].forEach(c => document.getElementById(`${resource}-${c}`).value = actual[c]);
      const nombre = document.getElementById(`${resource}-nombre`);
      nombre.scrollIntoView({ block: 'center' });
      nombre.focus({ preventScroll: true });
    });
    const eliminar = document.createElement('button'); eliminar.type = 'button'; eliminar.className = 'btn-eliminar'; eliminar.textContent = 'Eliminar'; eliminar.disabled = gestion.guardando;
    eliminar.addEventListener('click', () => eliminarGestion(resource, r));
    td.append(editar, eliminar); tr.appendChild(td); body.appendChild(tr);
  });
}

function bloquearGestion(resource, valor) {
  gestiones[resource].guardando = valor;
  document.querySelectorAll(`#vista-${resource} button, #${resource}-form input`).forEach(e => e.disabled = valor);
  document.getElementById(`${resource}-estado`).textContent = valor ? 'Guardando cambios...' : '';
  renderGestion(resource);
}

async function cargarGestion(resource) {
  const gestion = gestiones[resource];
  if (gestion.cargando) return gestion.cargando;
  if (gestion.guardando) return;
  const estado = document.getElementById(`${resource}-estado`);
  estado.textContent = '';
  const quitarSkeleton = mostrarSkeleton(document.getElementById(`${resource}-body`), 'tabla', gestion.campos.length + 2);
  gestion.cargando = (async () => {
    try {
      const datos = await apiGet(resource);
      if (!Array.isArray(datos)) throw new Error('La API debe devolver una lista.');
      gestion.registros = datos.map(r => Object.fromEntries(['id', ...gestion.campos].map(c => [c, String(r[c] ?? '')])));
      sincronizarGestion(resource); renderGestion(resource);
      document.getElementById(`${resource}-estado`).textContent = '';
    } catch (error) {
      document.getElementById(`${resource}-estado`).textContent = 'No se pudo cargar. Pulsa Recargar.';
      mostrarNotificacion(error.message, 'error');
    }
  })();
  try { await gestion.cargando; } finally { quitarSkeleton(); gestion.cargando = null; }
}

async function guardarGestion(resource, event, desdeCompra = false) {
  event.preventDefault();
  const gestion = gestiones[resource];
  if (gestion.guardando || gestion.cargando || productosGuardando || ventaPendiente || ventaAbiertaGuardadoPendiente || compraPendiente) return;
  const prefijo = desdeCompra ? 'nuevo-proveedor' : resource;
  const idInput = document.getElementById(`${prefijo}-id`);
  const datos = Object.fromEntries(gestion.campos.map(c => [c, document.getElementById(`${prefijo}-${c}`).value.trim()]));
  if (!datos.nombre) { mostrarNotificacion('El nombre es obligatorio.', 'error'); return; }
  const existente = gestion.registros.some(r => r.id === idInput.value);
  idInput.value = idInput.value || crypto.randomUUID();
  datos.id = idInput.value;
  bloquearGestion(resource, true);
  if (desdeCompra) document.querySelectorAll('#nuevo-proveedor-modal button, #nuevo-proveedor-form input').forEach(e => e.disabled = true);
  try {
    let respuesta;
    try { respuesta = await apiPost(resource, existente ? 'update' : 'create', datos); }
    catch (error) {
      if (existente) throw error;
      respuesta = (await apiGet(resource)).find(r => String(r.id) === datos.id);
      if (!respuesta) throw error;
    }
    const guardado = Object.fromEntries(['id', ...gestion.campos].map(c => [c, String(respuesta?.[c] ?? datos[c])]));
    const index = gestion.registros.findIndex(r => r.id === datos.id);
    if (index < 0) gestion.registros.push(guardado); else gestion.registros[index] = guardado;
    document.getElementById(desdeCompra ? 'nuevo-proveedor-form' : `${resource}-form`).reset(); idInput.value = '';
    sincronizarGestion(resource);
    if (desdeCompra) {
      document.getElementById('compra-proveedor').value = guardado.id;
      document.getElementById('nuevo-proveedor-modal').classList.add('hidden');
      document.getElementById('btn-nuevo-proveedor-compra').focus();
    }
    mostrarNotificacion('Registro guardado correctamente.', 'exito');
  } catch (error) { mostrarNotificacion(error.message, 'error'); }
  finally {
    bloquearGestion(resource, false);
    if (desdeCompra) document.querySelectorAll('#nuevo-proveedor-modal button, #nuevo-proveedor-form input').forEach(e => e.disabled = false);
  }
}

function abrirProveedorDesdeCompra() {
  if (gestiones.proveedores.guardando || gestiones.proveedores.cargando || productosGuardando || compraPendiente || ventaPendiente || ventaAbiertaGuardadoPendiente) return;
  document.getElementById('nuevo-proveedor-form').reset();
  document.getElementById('nuevo-proveedor-id').value = '';
  document.getElementById('nuevo-proveedor-modal').classList.remove('hidden');
  document.getElementById('nuevo-proveedor-nombre').focus();
}

function cerrarProveedorDesdeCompra() {
  if (gestiones.proveedores.guardando) return;
  document.getElementById('nuevo-proveedor-modal').classList.add('hidden');
  document.getElementById('btn-nuevo-proveedor-compra').focus();
}

async function eliminarGestion(resource, registro) {
  const gestion = gestiones[resource];
  if (gestion.guardando || gestion.cargando || productosGuardando || ventaPendiente || ventaAbiertaGuardadoPendiente || compraPendiente) return;
  if (!window.confirm(`¿Eliminar ${registro.nombre}?`)) return;
  bloquearGestion(resource, true);
  try {
    const asociados = await apiGet(resource === 'proveedores' ? 'compras' : 'productos');
    const campo = resource === 'proveedores' ? 'proveedorId' : 'categoriaId';
    if (asociados.some(r => String(r[campo]) === registro.id)) throw new Error(resource === 'proveedores' ? 'No puedes eliminar un proveedor con compras asociadas.' : 'No puedes eliminar una categoría usada por productos.');
    await apiPost(resource, 'delete', { id: registro.id });
    gestion.registros = gestion.registros.filter(r => r.id !== registro.id);
    if (document.getElementById(`${resource}-id`).value === registro.id) {
      document.getElementById(`${resource}-form`).reset(); document.getElementById(`${resource}-id`).value = '';
    }
    sincronizarGestion(resource);
    mostrarNotificacion('Registro eliminado.', 'exito');
  } catch (error) { mostrarNotificacion(error.message, 'error'); }
  finally { bloquearGestion(resource, false); }
}
