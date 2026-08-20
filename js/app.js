document.addEventListener("DOMContentLoaded", () => {


  // Render inicial de la tabla CRUD
renderTablaCRUD(productos);
if (typeof renderHistorial === 'function') renderHistorial();
  // Captura de elementos de navegación
const btnPos = document.querySelector("#btn-nav-pos");
const btnProductos = document.querySelector("#btn-nav-productos");
const btnHistorial = document.querySelector("#btn-nav-historial");

const vistaPos = document.querySelector("#vista-pos");
const vistaProductos = document.querySelector("#vista-productos");
const vistaHistorial = document.querySelector("#vista-historial");

  // Cambio de vistas
function mostrarVista(vistaAMostrar, botonActivo) {
    vistaPos.classList.add("vista-oculta");
    vistaProductos.classList.add("vista-oculta");
    vistaHistorial.classList.add("vista-oculta");

    btnPos.classList.remove("active");
    btnProductos.classList.remove("active");
    btnHistorial.classList.remove("active");

    vistaAMostrar.classList.remove("vista-oculta");
    botonActivo.classList.add("active");
}

  // Eventos de botones de navegación
btnPos.addEventListener("click", () => mostrarVista(vistaPos, btnPos));
btnProductos.addEventListener("click", () => {
    mostrarVista(vistaProductos, btnProductos);
    renderTablaCRUD(productos);
});
btnHistorial.addEventListener("click", () => {
    mostrarVista(vistaHistorial, btnHistorial);
    if (typeof renderHistorial === 'function') renderHistorial();
});
  // Eventos para Modales y CRUD de Productos
document.querySelector('#btn-new-product').addEventListener('click', () => {
    openProductModal(null, productos);
});

document.getElementById('product-form').addEventListener('submit', (e) => {
    handleFormSubmit(e, productos);
});

document.getElementById('confirm-delete-btn').addEventListener('click', () => {
    const id = getProductoAEliminarId();
    if (id) {
    productos = productos.filter(p => p.id !== id);
    guardarProductosLocalStorage(productos);
    renderTablaCRUD(productos);
    renderizarProductos(productos);
    closeDeleteModal();
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