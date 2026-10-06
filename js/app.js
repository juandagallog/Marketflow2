document.addEventListener("DOMContentLoaded", () => {


  // Render inicial de la tabla CRUD
renderTablaCRUD(productos);
cargarCatalogoRemoto();
cargarClientes();
for (const resource of ['proveedores', 'categorias']) {
  document.getElementById(`${resource}-form`).addEventListener('submit', e => guardarGestion(resource, e));
  document.getElementById(`${resource}-buscar`).addEventListener('input', () => renderGestion(resource));
  document.getElementById(`${resource}-recargar`).addEventListener('click', () => cargarGestion(resource));
  document.getElementById(`${resource}-cancelar`).addEventListener('click', () => {
    if (gestiones[resource].guardando) return;
    document.getElementById(`${resource}-form`).reset();
    document.getElementById(`${resource}-id`).value = '';
  });
}
document.getElementById('compra-form').addEventListener('submit', registrarCompra);
document.getElementById('btn-agregar-compra').addEventListener('click', agregarLineaCompra);
document.getElementById('btn-recargar-compras').addEventListener('click', cargarCompras);
document.getElementById('compra-producto').addEventListener('change', () => {
  const producto = productos.find(p => p.id === document.getElementById('compra-producto').value);
  document.getElementById('compra-costo').value = producto ? producto.costo : '';
});
document.getElementById('btn-guardar-abierta').addEventListener('click', guardarVentaAbierta);
document.getElementById('cliente-form').addEventListener('submit', guardarCliente);
document.getElementById('buscar-cliente').addEventListener('input', renderClientes);
document.getElementById('btn-recargar-clientes').addEventListener('click', cargarClientes);
document.getElementById('btn-cancelar-cliente').addEventListener('click', () => {
  if (clienteGuardando) return;
  document.getElementById('cliente-form').reset();
  document.getElementById('cliente-id').value = '';
});
document.getElementById("btn-reintentar-catalogo").addEventListener("click", cargarCatalogoRemoto);
  // Captura de elementos de navegación
const btnPos = document.querySelector("#btn-nav-pos");
const btnProductos = document.querySelector("#btn-nav-productos");
const btnHistorial = document.querySelector("#btn-nav-historial");
const btnClientes = document.querySelector('#btn-nav-clientes');

const vistaPos = document.querySelector("#vista-pos");
const vistaProductos = document.querySelector("#vista-productos");
const vistaHistorial = document.querySelector("#vista-historial");
const vistaClientes = document.querySelector('#vista-clientes');

  // Cambio de vistas
function mostrarVista(vistaAMostrar, botonActivo) {
    vistaPos.classList.add("vista-oculta");
    vistaProductos.classList.add("vista-oculta");
    vistaHistorial.classList.add("vista-oculta");
    vistaClientes.classList.add('vista-oculta');
    ['proveedores', 'compras', 'categorias'].forEach(r => document.getElementById(`vista-${r}`).classList.add('vista-oculta'));

    btnPos.classList.remove("active");
    btnProductos.classList.remove("active");
    btnHistorial.classList.remove("active");
    btnClientes.classList.remove('active');
    ['proveedores', 'compras', 'categorias'].forEach(r => document.getElementById(`btn-nav-${r}`).classList.remove('active'));

    vistaAMostrar.classList.remove("vista-oculta");
    botonActivo.classList.add("active");
}

  // Eventos de botones de navegación
btnPos.addEventListener("click", () => mostrarVista(vistaPos, btnPos));
for (const resource of ['proveedores', 'categorias']) {
  document.getElementById(`btn-nav-${resource}`).addEventListener('click', () => {
    mostrarVista(document.getElementById(`vista-${resource}`), document.getElementById(`btn-nav-${resource}`));
    cargarGestion(resource);
  });
}
document.getElementById('btn-nav-compras').addEventListener('click', async () => {
  mostrarVista(document.getElementById('vista-compras'), document.getElementById('btn-nav-compras'));
  actualizarProductosCompra(); renderLineasCompra();
  await cargarGestion('proveedores');
  cargarCompras();
});
btnClientes.addEventListener('click', () => {
  mostrarVista(vistaClientes, btnClientes);
  if (!clientesCargados) cargarClientes();
  else renderClientes();
});
btnProductos.addEventListener("click", () => {
    mostrarVista(vistaProductos, btnProductos);
    renderTablaCRUD(productos);
});
btnHistorial.addEventListener("click", () => {
    mostrarVista(vistaHistorial, btnHistorial);
    renderHistorial();
});
  // Eventos para Modales y CRUD de Productos
document.querySelector('#btn-new-product').addEventListener('click', () => {
    openProductModal(null, productos);
});

document.getElementById('product-form').addEventListener('submit', (e) => {
    handleFormSubmit(e, productos);
});

document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
    const id = getProductoAEliminarId();
    if (!id || productosGuardando || ventaPendiente || ventaAbiertaGuardadoPendiente || compraPendiente) return;
    if (factura.some(item => item.id === id)) {
        mostrarNotificacion("No puedes eliminar un producto en la venta actual", "error");
        closeDeleteModal();
        return;
    }
    const botones = ['confirm-delete-btn', 'btn-close-delete-modal', 'btn-cancel-delete-modal'].map(id => document.getElementById(id));
    productosGuardando = true;
    botones.forEach(b => b.disabled = true);
    try {
        await apiPost("productos", "delete", { id });
        productos = productos.filter(p => p.id !== id);
        renderTablaCRUD(productos);
        renderizarProductos(obtenerProductosActuales());
        closeDeleteModal();
        mostrarNotificacion("Producto eliminado", "exito");
    } catch (error) {
        mostrarNotificacion(error.message, "error");
    } finally {
        productosGuardando = false;
        botones.forEach(b => b.disabled = false);
    }
});

  // Eventos de cierre para modales
document.getElementById('btn-close-product-modal').addEventListener('click', closeProductModal);
document.getElementById('btn-cancel-product-modal').addEventListener('click', closeProductModal);
document.getElementById('btn-close-delete-modal').addEventListener('click', closeDeleteModal);
document.getElementById('btn-cancel-delete-modal').addEventListener('click', closeDeleteModal);

  // Checkbox de control de stock
document.getElementById('track-inventory').addEventListener('change', toggleStockField);

});


function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.querySelector("#notificacion");

    notificacion.textContent = mensaje;

    notificacion.classList.remove("hidden");
    notificacion.classList.remove("error");
    notificacion.classList.remove("exito");

    notificacion.classList.add(tipo);

    setTimeout(() => {
        notificacion.classList.add("hidden");
    }, 3000);
}
