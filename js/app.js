document.addEventListener("DOMContentLoaded", () => {

  // Cargar lista de productos con tu if / else tradicional
let listaProductos = [];

if (obtenerProductosLocalStorage) {
    listaProductos = obtenerProductosLocalStorage();
} else if (productos) {
    listaProductos = productos;
} else {
    listaProductos = [];
}

  // Render inicial de la tabla CRUD
renderTablaCRUD(listaProductos);

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
    renderTablaCRUD(listaProductos);
});
btnHistorial.addEventListener("click", () => mostrarVista(vistaHistorial, btnHistorial));

  // Eventos para Modales y CRUD de Productos
document.querySelector('#btn-new-product').addEventListener('click', () => {
    openProductModal(null, listaProductos);
});

document.getElementById('product-form').addEventListener('submit', (e) => {
    handleFormSubmit(e, listaProductos);
    renderizarProductos(listaProductos);
});

document.getElementById('confirm-delete-btn').addEventListener('click', () => {
    const id = getProductoAEliminarId();
    if (id) {
    listaProductos = listaProductos.filter(p => p.id !== id);
    guardarProductosLocalStorage(listaProductos);
    renderTablaCRUD(listaProductos);
    renderizarProductos(listaProductos);
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