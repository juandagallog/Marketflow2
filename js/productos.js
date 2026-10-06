/* CRUD DE PRODUCTOS: FIGO
listar productos
crear
editar
eliminar
validaciones
*/
let productoAEliminarId = null;
let edicionProductoDesdePOS = false;

// Renderiza la tabla CRUD
function renderTablaCRUD(listaProductos) {
const productsTableBody = document.querySelector('#products-table-body');
if (!productsTableBody) return;
productsTableBody.innerHTML = "";

listaProductos.forEach(prod => {
    let textoStock = "No aplica";

    if (prod.trackStock) {
        textoStock = `${prod.stock} un.`;
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `
    <td><strong>${prod.codigo}</strong></td>
    <td>${prod.nombre}</td>
    <td>${prod.categoria}</td>
    <td>$${prod.precio.toLocaleString('es-CO')}</td>
    <td>$${(prod.costo || 0).toLocaleString('es-CO')}</td>
    <td>${textoStock}</td>
    <td>
        <button type="button" class="btn-editar" data-id="${prod.id}">✏️</button>
        <button type="button" class="btn-eliminar" data-id="${prod.id}">🗑️</button>
    </td>
    `;
    productsTableBody.appendChild(tr);
});

  // Asigna eventos a los botones recién creados
productsTableBody.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', () => openProductModal(btn.dataset.id, listaProductos));
});

productsTableBody.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', () => confirmarEliminacion(btn.dataset.id, listaProductos));
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
    if (modal) {
        modal.classList.add('hidden');
    }
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
function openProductModal(productId = null, listaProductos = [], desdePOS = false) {
const modal = document.getElementById('product-modal');
const form = document.getElementById('product-form');
if (!modal || !form || !catalogoCargado || productosGuardando || ventaPendiente || ventaAbiertaGuardadoPendiente || compraPendiente) return;

form.reset();
edicionProductoDesdePOS = desdePOS;
document.getElementById('track-inventory').disabled = desdePOS;

if (productId) {
    // INICIA EL MODO DE EDITAR
    const prod = listaProductos.find(p => p.id === productId);
    if (!prod) return;

    document.getElementById('modal-title').textContent = "Editar Producto";
    document.getElementById('product-id').value = prod.id;
    document.getElementById('product-code').value = prod.codigo;
    document.getElementById('product-category').value = prod.categoriaId;
    document.getElementById('product-name').value = prod.nombre;
    document.getElementById('product-description').value = prod.descripcion || "";
    document.getElementById('product-price').value = prod.precio;
    document.getElementById('product-cost').value = prod.costo;
    document.getElementById('track-inventory').checked = prod.trackStock;
    document.getElementById('product-stock').disabled = !prod.trackStock;
    if (prod.trackStock) {
        document.getElementById("product-stock").value = prod.stock;
    }
    else {
        document.getElementById("product-stock").value = "";
    }

} else {
    // INICIA EL MODO DE CREAR
    document.getElementById('modal-title').textContent = "Nuevo Producto";
    document.getElementById('product-id').value = "";
    document.getElementById('product-code').value = generarCodigoProducto(listaProductos);
    document.getElementById('product-stock').disabled = true;
}

if (desdePOS) document.getElementById('product-stock').disabled = true;
modal.classList.remove('hidden');
}

// Procesa el envío del formulario (Crear o Modificar en el arreglo)
async function handleFormSubmit(event, listaProductos) {
    event.preventDefault();
    if (!catalogoCargado || productosGuardando || ventaPendiente || ventaAbiertaGuardadoPendiente || compraPendiente) return;

    const id = document.getElementById('product-id').value;
    const codigo = document.getElementById('product-code').value;
    const categoriaId = document.getElementById('product-category').value;
    const nombre = document.getElementById('product-name').value.trim();
    const descripcion = document.getElementById('product-description').value.trim();
    const precio = Number(document.getElementById('product-price').value);
    const costo = Number(document.getElementById('product-cost').value);
    const trackStock = document.getElementById('track-inventory').checked;
    let stock = 0;

    if (trackStock) {
        stock = Number(document.getElementById("product-stock").value);
    }

    if (![stock, precio, costo].every(Number.isFinite)) {
        mostrarNotificacion("Debes ingresar una cantidad de stock.", "error");
        return;
    }
    if (nombre === "" || !categorias.some(c => c.id === categoriaId)) {
        mostrarNotificacion("Nombre y categoría son obligatorios.", "error");
        return;
    }

    if (!Number.isInteger(precio) || !Number.isInteger(costo)) {
        mostrarNotificacion('Precio y costo deben ser pesos enteros.', 'error'); return;
    }
    if (precio < 0 || costo < 0) {
        mostrarNotificacion("El precio y el costo no pueden ser negativos.", "error");
        return;
    }

    if (trackStock && stock < 0) {
        mostrarNotificacion("El stock no puede ser negativo.", "error");
        return;
    }

    const anterior = listaProductos.find(p => p.id === id);
    const botones = [...document.querySelectorAll('#product-form button'), document.getElementById('btn-close-product-modal')];
    productosGuardando = true;
    botones.forEach(b => b.disabled = true);
    try {
        if (id && !anterior) throw new Error("El producto ya no existe.");
        const producto = {
            id: id || crypto.randomUUID(), codigo, nombre, categoriaId, precio, costo,
            seguimientoInventario: trackStock, stock, descripcion,
            imagenes: anterior ? anterior.imagenes : ""
        };
        if (edicionProductoDesdePOS) {
            // No enviar campos de inventario desde la edicion en el POS.
            delete producto.stock;
            delete producto.seguimientoInventario;
        }
        const respuesta = await apiPost("productos", id ? "update" : "create", producto);
        const guardado = adaptarProducto({ ...anterior, ...producto, ...respuesta });
        if (id) listaProductos[listaProductos.findIndex(p => p.id === id)] = guardado;
        else listaProductos.push(guardado);
        const item = factura.find(p => p.id === id);
        if (item) {
            Object.assign(item, guardado);
            renderizarFactura();
            actualizarCalculoCambio();
        }
        closeProductModal();
        renderTablaCRUD(listaProductos);
        renderizarProductos(obtenerProductosActuales());
        mostrarNotificacion("Producto guardado", "exito");
    } catch (error) {
        mostrarNotificacion(error.message, "error");
    } finally {
        productosGuardando = false;
        botones.forEach(b => b.disabled = false);
    }
}

function confirmarEliminacion(id, listaProductos) {
    if (!catalogoCargado || productosGuardando || ventaPendiente || ventaAbiertaGuardadoPendiente || compraPendiente) return;
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
