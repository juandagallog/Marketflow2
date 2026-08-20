/* CRUD DE PRODUCTOS: FIGO
listar productos
crear
editar
eliminar
validaciones
*/
let productoAEliminarId = null;

// Renderiza la tabla CRUD
function renderTablaCRUD(listaProductos) {
const productsTableBody = document.querySelector('#products-table-body');
if (!productsTableBody) return;
productsTableBody.innerHTML = "";

listaProductos.forEach(prod => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
    <td><strong>${prod.codigo}</strong></td>
    <td>${prod.nombre}</td>
    <td>${prod.categoria}</td>
    <td>$${prod.precio.toLocaleString('es-CO')}</td>
    <td>$${(prod.costo || 0).toLocaleString('es-CO')}</td>
    <td>${prod.trackStock ? `${prod.stock} un.` : 'No aplica'}</td>
    <td>
        <button type="button" class="btn-editar" data-id="${prod.id}">✏️</button>
        <button type="button" class="btn-eliminar" data-id="${prod.id}">🗑️</button>
    </td>
    `;
    productsTableBody.appendChild(tr);
});

  // Asigna eventos a los botones recién creados
document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', () => openProductModal(Number(btn.dataset.id), listaProductos));
});

document.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', () => confirmarEliminacion(Number(btn.dataset.id), listaProductos));
});
}

// Cierra el modal de productos
function closeProductModal() {
const modal = document.getElementById('product-modal');
if (modal) modal.classList.add('hidden');
}

// Cierra el modal de confirmación de eliminación
function closeDeleteModal() {
const modal = document.getElementById('delete-modal');
if (modal) modal.classList.add('hidden');
}

// Habilita o deshabilita el campo de stock según el checkbox
function toggleStockField() {
const trackCheckbox = document.getElementById('track-inventory');
const stockInput = document.getElementById('product-stock');
if (trackCheckbox && stockInput) {
    stockInput.disabled = !trackCheckbox.checked;
    if (!trackCheckbox.checked) stockInput.value = "";
}
}

// Abre el modal (vacío para crear, o lleno para editar)
function openProductModal(productId = null, listaProductos = []) {
const modal = document.getElementById('product-modal');
const form = document.getElementById('product-form');
if (!modal || !form) return;

form.reset();

if (productId) {
    // INICIA EL MODO DE EDITAR
    const prod = listaProductos.find(p => p.id === productId);
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
    // INICIA EL MODO DE CREAR
    document.getElementById('modal-title').textContent = "Nuevo Producto";
    document.getElementById('product-id').value = "";
    document.getElementById('product-code').value = generarCodigoProducto(listaProductos);
    document.getElementById('product-stock').disabled = true;
}

modal.classList.remove('hidden');
}

// Procesa el envío del formulario (Crear o Modificar en el arreglo)
function handleFormSubmit(event, listaProductos) {
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
        const index = listaProductos.findIndex(p => p.id === Number(id));
        if (index !== -1) {
        listaProductos[index] = { ...listaProductos[index], codigo, categoria, nombre, descripcion, precio, costo, trackStock, stock };
        }
    } else {
        // Crear un nuevo producto
        const nuevoProducto = { id: Date.now(), codigo, categoria, nombre, descripcion, precio, costo, trackStock, stock };
        listaProductos.push(nuevoProducto);
    }

    // Guarda en localStorage si la función existe y refresca la interfaz

    guardarProductosLocalStorage(listaProductos);

    closeProductModal();
    renderTablaCRUD(listaProductos);

    // Si existe la función de re-renderizar la catálogo POS, la ejecuta

    renderizarProductos(listaProductos);

    }

function confirmarEliminacion(id, listaProductos) {
    const prod = listaProductos.find(p => p.id === id);
    if (!prod) return;

    productoAEliminarId = id;
    const nombreElem = document.getElementById('delete-product-name');
    if (nombreElem) nombreElem.textContent = prod.nombre;

    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.remove('hidden');
    }

    function getProductoAEliminarId() {
    return productoAEliminarId;
}

function generarCodigoProducto(listaProductos) {
    let numeroMayor = 0;

    listaProductos.forEach(producto => {
        // Recorremos cada uno de los productos en la lista, y el guardamos el valor numerico del codigo
        // Por ejemplo para PROD-08, Se reemplaza por 08, y luego se convierte de string a number.
        const numero = Number(producto.codigo.replace("PROD-", ""));

        // Verificamos que el numero no sea un NaN (sea un numero valido)
        // Si el numero que obtuvimos es mayor que el numeroMayor que teniamos, se actualiza
        if (!isNaN(numero) && numero > numeroMayor) {
            numeroMayor = numero;
        }
    });

    // Retornamos el nuevo codigo, al numero mayor que teniamos le sumamos 1 para el siguiente codigo
    // padStart garantiza que el texto tenga una longitud de 3 caracteres, añadiendo 0 a la izquierda si es necesario
    // Por ejemplo, si tenemos 5. El codigo termina siendo PROD-005
    return `PROD-${String(numeroMayor + 1).padStart(3, '0')}`;
}