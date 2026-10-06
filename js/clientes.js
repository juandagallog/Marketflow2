let clientes = [];
let clientesCargados = false;
let clientesEnCarga = null;
let clienteGuardando = false;

function nombreCliente(id) {
  return clientes.find(c => c.id === String(id))?.nombre || (id ? `Cliente ${id}` : "Sin cliente");
}

function actualizarSelectClientes() {
  const select = document.getElementById('select-cliente');
  const seleccionado = select.value;
  select.replaceChildren(new Option("Sin cliente", ""));
  clientes.forEach(c => select.add(new Option(c.nombre, c.id)));
  if (seleccionado && !clientes.some(c => c.id === seleccionado)) {
    select.add(new Option(nombreCliente(seleccionado), seleccionado));
  }
  select.value = seleccionado;
}

function renderClientes() {
  const body = document.getElementById('clientes-table-body');
  const busqueda = document.getElementById('buscar-cliente').value.toLowerCase().trim();
  body.replaceChildren();
  clientes.filter(c => [c.nombre, c.telefono, c.correo].some(v => v.toLowerCase().includes(busqueda))).forEach(c => {
    const tr = document.createElement('tr');
    [c.nombre, c.telefono, c.correo].forEach(valor => {
      const td = document.createElement('td');
      td.textContent = valor;
      tr.appendChild(td);
    });
    const acciones = document.createElement('td');
    const editar = document.createElement('button');
    editar.type = 'button'; editar.className = 'btn-editar'; editar.textContent = 'Editar';
    editar.disabled = clienteGuardando;
    editar.addEventListener('click', () => {
      if (clienteGuardando) return;
      ['id', 'nombre', 'telefono', 'correo'].forEach(campo => document.getElementById(`cliente-${campo}`).value = c[campo]);
    });
    const eliminar = document.createElement('button');
    eliminar.type = 'button'; eliminar.className = 'btn-eliminar'; eliminar.textContent = 'Eliminar';
    eliminar.disabled = clienteGuardando;
    eliminar.addEventListener('click', () => eliminarCliente(c));
    acciones.append(editar, eliminar); tr.appendChild(acciones); body.appendChild(tr);
  });
}

function bloquearClientes(bloqueado) {
  clienteGuardando = bloqueado;
  document.getElementById('clientes-estado').textContent = bloqueado ? 'Guardando cambios...' : '';
  document.querySelectorAll('#vista-clientes button, #cliente-form input').forEach(e => e.disabled = bloqueado);
  renderClientes();
}

async function cargarClientes() {
  if (clientesEnCarga) return clientesEnCarga;
  if (clienteGuardando) return;
  const estado = document.getElementById('clientes-estado');
  const estadoPos = document.getElementById('clientes-pos-estado');
  estado.textContent = estadoPos.textContent = '';
  const quitarSkeleton = mostrarSkeleton(estado);
  const quitarSkeletonPos = mostrarSkeleton(estadoPos);
  document.getElementById('btn-recargar-clientes').disabled = true;
  clientesEnCarga = (async () => {
    try {
      const datos = await apiGet('clientes');
      if (!Array.isArray(datos)) throw new Error('La API debe devolver una lista de clientes.');
      clientes = datos.map(c => ({ id: String(c.id), nombre: String(c.nombre ?? ''), telefono: String(c.telefono ?? ''), correo: String(c.correo ?? '') }));
      clientesCargados = true;
      renderClientes(); actualizarSelectClientes();
      estado.textContent = estadoPos.textContent = '';
    } catch (error) {
      estado.textContent = estadoPos.textContent = 'No se pudieron cargar los clientes. Reintenta desde Clientes.';
      mostrarNotificacion(error.message, 'error');
    } finally {
      quitarSkeleton(); quitarSkeletonPos();
      document.getElementById('btn-recargar-clientes').disabled = false;
    }
  })();
  try { await clientesEnCarga; } finally { clientesEnCarga = null; }
}

async function guardarCliente(event) {
  event.preventDefault();
  if (clienteGuardando || clientesEnCarga) return;
  const idInput = document.getElementById('cliente-id');
  const nombre = document.getElementById('cliente-nombre').value.trim();
  if (!nombre) { mostrarNotificacion('El nombre es obligatorio.', 'error'); return; }
  const existente = clientes.some(c => c.id === idInput.value);
  // Conservar UUID si create guarda el registro pero se pierde su respuesta.
  idInput.value = idInput.value || crypto.randomUUID();
  const cliente = { id: idInput.value, nombre, telefono: document.getElementById('cliente-telefono').value.trim(), correo: document.getElementById('cliente-correo').value.trim() };
  bloquearClientes(true);
  try {
    let guardado;
    try { guardado = await apiPost('clientes', existente ? 'update' : 'create', cliente); }
    catch (error) {
      if (existente) throw error;
      const remotos = await apiGet('clientes');
      guardado = remotos.find(c => String(c.id) === cliente.id);
      if (!guardado) throw error;
    }
    const actualizado = {
      id: cliente.id,
      nombre: String(guardado?.nombre ?? cliente.nombre),
      telefono: String(guardado?.telefono ?? cliente.telefono),
      correo: String(guardado?.correo ?? cliente.correo)
    };
    const index = clientes.findIndex(c => c.id === cliente.id);
    if (index < 0) clientes.push(actualizado); else clientes[index] = actualizado;
    document.getElementById('cliente-form').reset(); idInput.value = '';
    actualizarSelectClientes();
    mostrarNotificacion('Cliente guardado correctamente.', 'exito');
  } catch (error) { mostrarNotificacion(error.message, 'error'); }
  finally { bloquearClientes(false); }
}

async function eliminarCliente(cliente) {
  if (clienteGuardando || clientesEnCarga || productosGuardando || ventaPendiente || ventaAbiertaGuardadoPendiente) return;
  if (!window.confirm(`¿Eliminar a ${cliente.nombre}?`)) return;
  bloquearClientes(true);
  try {
    const ventas = await apiGet('ventas');
    if (ventas.some(v => String(v.clienteId) === cliente.id) || document.getElementById('select-cliente').value === cliente.id) {
      throw new Error('No puedes eliminar un cliente asociado a una venta.');
    }
    await apiPost('clientes', 'delete', { id: cliente.id });
    clientes = clientes.filter(c => c.id !== cliente.id);
    if (document.getElementById('cliente-id').value === cliente.id) {
      document.getElementById('cliente-form').reset(); document.getElementById('cliente-id').value = '';
    }
    actualizarSelectClientes();
    mostrarNotificacion('Cliente eliminado.', 'exito');
  } catch (error) { mostrarNotificacion(error.message, 'error'); }
  finally { bloquearClientes(false); }
}
