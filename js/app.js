/*

iniciar aplicación
cambiar entre vistas
coordinar elementos generales

*/

const btnPos = document.querySelector("#btn-nav-pos");
const btnProductos = document.querySelector("#btn-nav-productos");
const btnHistorial = document.querySelector("#btn-nav-historial");
const vistaPos = document.querySelector("#vista-pos");
const vistaProductos = document.querySelector("#vista-productos");
const vistaHistorial = document.querySelector("#vista-historial");


function mostrarVista (vistaAMostrar){
    vistaPos.classList.add("vista-oculta");
    vistaProductos.classList.add("vista-oculta");
    vistaHistorial.classList.add("vista-oculta");

    vistaAMostrar.classList.remove("vista-oculta");
}

btnPos.addEventListener("click", () => {
    mostrarVista(vistaPos);
});

btnProductos.addEventListener("click", () => {
    mostrarVista(vistaProductos);
});

btnHistorial.addEventListener("click", () => {
    mostrarVista(vistaHistorial);
});

import { renderTablaCRUD, openProductModal, handleFormSubmit, getProductoAEliminarId, closeDeleteModal } from './productos.js';
import { guardarProductosLocalStorage } from './storage.js';

document.addEventListener("DOMContentLoaded", () => {

  // 1. Botón "Nuevo Producto" -> Abre el modal en modo crear
document.querySelector('#btn-new-product')?.addEventListener('click', () => {
    openProductModal(null, productos);
});

  // 2. Submit del Formulario -> Guarda/Edita el producto
document.getElementById('product-form')?.addEventListener('submit', (e) => {
    handleFormSubmit(e, productos);
});

  // 3. Confirmar Eliminación -> Borra el producto seleccionado
document.getElementById('confirm-delete-btn')?.addEventListener('click', () => {
    const id = getProductoAEliminarId();
    if (id) {
    productos = productos.filter(p => p.id !== id); 
    guardarProductosLocalStorage(productos);      
    renderTablaCRUD(productos);                   
    closeDeleteModal();                            
    }
});

});
