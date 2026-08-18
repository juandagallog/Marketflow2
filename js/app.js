document.addEventListener("DOMContentLoaded", () => {

  // Cargar lista de productos desde el almacenamiento o la variable global
let listaProductos = (typeof obtenerProductosLocalStorage === "function") 
    ? obtenerProductosLocalStorage() 
    : (typeof productos !== "undefined" ? productos : []);

  // Si existe la función en pos.js, sincroniza la variable global
if (typeof productos !== "undefined") {
    productos = listaProductos;
}

  // Render inicial de la tabla CRUD
if (typeof renderTablaCRUD === "function") {
    renderTablaCRUD(listaProductos);
}

  // Captura de elementos de navegación
const btnPos = document.querySelector("#btn-nav-pos");
const btnProductos = document.querySelector("#btn-nav-productos");
const btnHistorial = document.querySelector("#btn-nav-historial");

const vistaPos = document.querySelector("#vista-pos");
const vistaProductos = document.querySelector("#vista-productos");
const vistaHistorial = document.querySelector("#vista-historial");

  // Cambio de vistas
function mostrarVista(vistaAMostrar, botonActivo) {
    if (vistaPos) vistaPos.classList.add("vista-oculta");
    if (vistaProductos) vistaProductos.classList.add("vista-oculta");
    if (vistaHistorial) vistaHistorial.classList.add("vista-oculta");

    if (btnPos) btnPos.classList.remove("active");
    if (btnProductos) btnProductos.classList.remove("active");
    if (btnHistorial) btnHistorial.classList.remove("active");

    if (vistaAMostrar) vistaAMostrar.classList.remove("vista-oculta");
    if (botonActivo) botonActivo.classList.add("active");
}

  // Eventos de botones de navegación
btnPos?.addEventListener("click", () => mostrarVista(vistaPos, btnPos));
btnProductos?.addEventListener("click", () => {
    mostrarVista(vistaProductos, btnProductos);
    if (typeof renderTablaCRUD === "function") {
    renderTablaCRUD(listaProductos);
    }
});
btnHistorial?.addEventListener("click", () => mostrarVista(vistaHistorial, btnHistorial));

  // Eventos para Modales y CRUD de Productos
document.querySelector('#btn-new-product')?.addEventListener('click', () => {
    if (typeof openProductModal === "function") {
    openProductModal(null, listaProductos);
    }
});

document.getElementById('product-form')?.addEventListener('submit', (e) => {
    if (typeof handleFormSubmit === "function") {
    handleFormSubmit(e, listaProductos);
      // Sincronizar catálogo POS si la función existe
    if (typeof renderizarProductos === "function") {
        renderizarProductos(listaProductos);
    }
    }
});

document.getElementById('confirm-delete-btn')?.addEventListener('click', () => {
    if (typeof getProductoAEliminarId === "function") {
    const id = getProductoAEliminarId();
    if (id) {
        listaProductos = listaProductos.filter(p => p.id !== id);
        
        if (typeof productos !== "undefined") {
        productos = listaProductos;
        }

        if (typeof guardarProductosLocalStorage === "function") {
        guardarProductosLocalStorage(listaProductos);
        }

        if (typeof renderTablaCRUD === "function") {
        renderTablaCRUD(listaProductos);
        }

        if (typeof renderizarProductos === "function") {
        renderizarProductos(listaProductos);
        }

        if (typeof closeDeleteModal === "function") {
        closeDeleteModal();
        }
    }
    }
});

  // Eventos de cierre para modales
document.getElementById('btn-close-product-modal')?.addEventListener('click', () => {
    if (typeof closeProductModal === "function") closeProductModal();
});
document.getElementById('btn-cancel-product-modal')?.addEventListener('click', () => {
    if (typeof closeProductModal === "function") closeProductModal();
});
document.getElementById('btn-close-delete-modal')?.addEventListener('click', () => {
    if (typeof closeDeleteModal === "function") closeDeleteModal();
});
document.getElementById('btn-cancel-delete-modal')?.addEventListener('click', () => {
    if (typeof closeDeleteModal === "function") closeDeleteModal();
});

  // Checkbox de control de stock
document.getElementById('track-inventory')?.addEventListener('change', () => {
    if (typeof toggleStockField === "function") toggleStockField();
});

});