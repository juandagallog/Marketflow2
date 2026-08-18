/* CRUD DE PRODUCTOS: FIGO
listar productos
crear
editar
eliminar
validaciones
*/
export function renderTablaCRUD(productos) {
const productsTableBody = document.querySelector('#products-table-body');
if (!productsTableBody) return;
productsTableBody.innerHTML = "";

productos.forEach(prod => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
    <td><strong>${prod.codigo}</strong></td>
    <td>${prod.nombre}</td>
    <td>${prod.categoria}</td>
    <td>$${prod.precio.toLocaleString('es-CO')}</td>
    <td>$${prod.costo.toLocaleString('es-CO')}</td>
    <td>${prod.trackStock ? `${prod.stock} un.` : 'No aplica'}</td>
    <td>
        <button type="button" class="btn-editar" data-id="${prod.id}"></button>
        <button type="button" class="btn-eliminar" data-id="${prod.id}"></button>
    </td>
    `;
    productsTableBody.appendChild(tr);
});

  // Asigna eventos a los botones recién creados
document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', () => openProductModal(Number(btn.dataset.id), productos));
});

document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', () => confirmarEliminacion(Number(btn.dataset.id), productos));
});
}

import { guardarProductosLocalStorage } from './storage.js';

// Abre el modal (vacío para crear, o lleno para editar)
export function openProductModal(productId = null, productos = []) {
const modal = document.getElementById('product-modal');
const form = document.getElementById('product-form');
if (!modal || !form) return;

form.reset();

if (productId) {
    // MODO EDITAR
    const prod = productos.find(p => p.id === productId);
    if (!prod) return;

    document.getElementById('modal-title').textContent = "Editar Producto";
    document.getElementById('product-id').value = prod.id;
    document.getElementById('product-code').value = prod.codigo;
    document.getElementById('product-category').value = prod.categoria;
    document.getElementById('product-name').value = prod.nombre;
    document.getElementById('product-description').value = prod.descripcion || "";
    document.getElementById('product-price').value = prod.precio;
    document.getElementById('product-cost').value = prod.costo;
    document.getElementById('track-inventory').checked = prod.trackStock;
    document.getElementById('product-stock').disabled = !prod.trackStock;
    document.getElementById('product-stock').value = prod.trackStock ? prod.stock : "";
} else {
    // MODO CREAR
    document.getElementById('modal-title').textContent = "Nuevo Producto";
    document.getElementById('product-id').value = "";
    document.getElementById('product-code').value = `PROD-${String(productos.length + 1).padStart(3, '0')}`;
    document.getElementById('product-stock').disabled = true;
}

modal.classList.remove('hidden');
}

// Procesa el envío del formulario (Crear o Modificar en el arreglo)
export function handleFormSubmit(event, productos) {
event.preventDefault();

const id = document.getElementById('product-id').value;
const codigo = document.getElementById('product-code').value;
const categoria = document.getElementById('product-category').value.trim();
const nombre = document.getElementById('product-name').value.trim();
const descripcion = document.getElementById('product-description').value.trim();
const precio = Number(document.getElementById('product-price').value);
const costo = Number(document.getElementById('product-cost').value);
const trackStock = document.getElementById('track-inventory').checked;
const stock = trackStock ? Number(document.getElementById('product-stock').value || 0) : 0;

if (id) {
    // Actualiza el producto existente
    const index = productos.findIndex(p => p.id === Number(id));
    if (index !== -1) {
    productos[index] = { ...productos[index], codigo, categoria, nombre, descripcion, precio, costo, trackStock, stock };
    }
} else {
    // Crear nuevo producto
    const nuevoProducto = { id: Date.now(), codigo, categoria, nombre, descripcion, precio, costo, trackStock, stock };
    productos.push(nuevoProducto);
}

  // Guarda en localStorage y refrescar la UI
guardarProductosLocalStorage(productos);
closeProductModal();
renderTablaCRUD(productos);
}

let productoAEliminarId = null;

export function confirmarEliminacion(id, productos) {
const prod = productos.find(p => p.id === id);
if (!prod) return;

productoAEliminarId = id;
document.getElementById('delete-product-name').textContent = prod.nombre;
document.getElementById('delete-modal').classList.remove('hidden');
}

export function getProductoAEliminarId() {
return productoAEliminarId;
}