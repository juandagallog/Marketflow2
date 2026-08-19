// ARCHIVO PRINCIPAL - POS.JS (Corrección de ancho en Vista de Lista)

let productos = obtenerProductosLocalStorage();
let factura = [];
let modoVistaLista = false; // false = catálogo normal (cuadrícula), true = lista apilada

const productGrid = document.querySelector('#product-grid');
const listaItemsFactura = document.querySelector('#invoice-items-list');

const subtotalValor = document.querySelector('#subtotal-valor');
const ivaValor = document.querySelector('#iva-valor');
const totalValor = document.querySelector('#total-valor');
const contadorProductos = document.querySelector("#total-products-count");

const btnLista = document.querySelector("#btn-lista");
const btnCatalogo = document.querySelector("#btn-catalogo");


function renderizarProductos(listaProductos) {
  productGrid.innerHTML = "";

  if (contadorProductos) {
    contadorProductos.textContent = listaProductos.length;
  }

  if (listaProductos.length === 0) {
    productGrid.innerHTML = `<p class="empty-list-message" style="grid-column: 1 / -1; text-align: center; padding: 20px;">No hay productos disponibles.</p>`;
    return;
  }

  // SI EL MODO VISTA ES LISTA
  if (modoVistaLista) {
    const contenedorLista = document.createElement('div');
    // LA SOLUCIÓN: Se agregó 'grid-column: 1 / -1;' para que ocupe todo el ancho de la pantalla
    contenedorLista.style.cssText = "grid-column: 1 / -1; width: 100%; background: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;";

    listaProductos.forEach((producto, index) => {
      const fila = document.createElement('div');
      const bordeInferior = index < listaProductos.length - 1 ? "border-bottom: 1px solid #eee;" : "";
      fila.style.cssText = `display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; ${bordeInferior} gap: 15px; flex-wrap: wrap;`;
      
      fila.innerHTML = `
        <div style="flex: 2; display: flex; flex-direction: column; gap: 4px; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="product-cat-tag" style="font-size: 0.75rem; padding: 2px 8px; background: #fef3c7; color: #d97706; border-radius: 4px; font-weight: bold;">${producto.categoria}</span>
            <h4 style="margin: 0; font-size: 1rem; color: #333;">${producto.nombre}</h4>
          </div>
          <span style="font-size: 0.85rem; color: #666;">${producto.descripcion || ''}</span>
        </div>

        <div style="flex: 1; text-align: right; min-width: 100px;">
          <span style="font-weight: bold; font-size: 1.1rem; color: #111;">$${producto.precio.toLocaleString('es-CO')}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <input type="number" value="1" min="1" class="cantidad-input" id="cantidad-${producto.id}" style="width: 50px; padding: 6px; text-align: center; border: 1px solid #ccc; border-radius: 4px;">
          <button type="button" class="btn-añadir-carrito" style="padding: 6px 16px; background-color: #f6ad55; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Agregar</button>
        </div>
      `;

      const botonAgregar = fila.querySelector('.btn-añadir-carrito');
      const inputCantidad = fila.querySelector('.cantidad-input');
      
      botonAgregar.addEventListener("click", () => {
        agregarAFactura(producto.id, inputCantidad.value);
      });

      contenedorLista.appendChild(fila);
    });

    productGrid.appendChild(contenedorLista);

  } else {
    // MODO CATÁLOGO NORMAL (Con soporte robusto de imágenes)
    listaProductos.forEach(producto => {
      const tarjeta = document.createElement('article');
      tarjeta.classList.add("product-card");
      
      const contenedorImagen = document.createElement('div');
      contenedorImagen.style.cssText = "width: 100%; height: 150px; background-color: #f4f4f5; border-radius: 6px 6px 0 0; overflow: hidden; display: flex; align-items: center; justify-content: center;";

      const imagen = document.createElement('img');
      imagen.classList.add('product-image');
      imagen.alt = producto.nombre;
      imagen.style.cssText = "width: 100%; height: 100%; object-fit: cover;";
      
      if (producto.imagenes && producto.imagenes.trim() !== "") {
        imagen.src = producto.imagenes;
      } else {
        imagen.src = "https://via.placeholder.com/300x150?text=Sin+Imagen";
      }
      imagen.onerror = function() {
        this.onerror = null; 
        this.src = "https://via.placeholder.com/300x150?text=Sin+Imagen";
      };

      contenedorImagen.appendChild(imagen);
      tarjeta.appendChild(contenedorImagen);

      const categoria = document.createElement('span');
      categoria.classList.add('product-cat-tag');
      categoria.textContent = producto.categoria;
      tarjeta.appendChild(categoria);
      
      const titulo = document.createElement('h3');
      titulo.classList.add('product-title');
      titulo.textContent = producto.nombre;
      tarjeta.appendChild(titulo);
      
      const descripcion = document.createElement('p');
      descripcion.classList.add('product-desc');
      descripcion.textContent = producto.descripcion;
      tarjeta.appendChild(descripcion);
      
      const pieProducto = document.createElement('div');
      pieProducto.classList.add('product-footer');

      const precio = document.createElement('p');
      precio.classList.add('product-price');
      precio.textContent = `$${producto.precio.toLocaleString('es-CO')}`;
      pieProducto.appendChild(precio);

      const controlesProducto = document.createElement('div');
      controlesProducto.classList.add('product-controls');

      const cantidad = document.createElement("input");
      cantidad.type = "number";
      cantidad.value = 1;
      cantidad.min = 1;
      cantidad.classList.add("cantidad-input");
      cantidad.id = `cantidad-${producto.id}`;

      const botonAgregar = document.createElement('button');
      botonAgregar.textContent = 'Agregar';
      botonAgregar.classList.add('btn-añadir-carrito');

      botonAgregar.addEventListener("click", () => {
        agregarAFactura(producto.id, cantidad.value);
      });

      controlesProducto.appendChild(cantidad);
      controlesProducto.appendChild(botonAgregar);

      pieProducto.appendChild(controlesProducto);
      tarjeta.appendChild(pieProducto);

      productGrid.appendChild(tarjeta);
    });
  }
}

function agregarAFactura(productoId, cantidadIngresada) {
  let cantidad = Number(cantidadIngresada);
  if (cantidad < 1 || isNaN(cantidad)) {
    cantidad = 1;
  }

  const producto = productos.find(p => p.id === productoId);
  const productoExistente = factura.find(item => item.id === productoId);

  if (productoExistente) {
    productoExistente.cantidad += cantidad;
  } else {
    factura.push({
      ...producto,
      cantidad: cantidad
    });
  }
  renderizarFactura();
}


function renderizarFactura() {
  listaItemsFactura.innerHTML = "";

  if (factura.length === 0) {
    listaItemsFactura.innerHTML = `
        <div class="empty-invoice-state">
            <p>🛒 La factura está vacía</p>
            <small>Agrega productos desde el catálogo.</small>
        </div>`;

    calcularTotales();
    return;
  }

  factura.forEach(item => {
    const fila = document.createElement("div");
    fila.classList.add("invoice-item-row");

    const detalles = document.createElement("div");
    detalles.classList.add("item-details");

    const nombre = document.createElement("h4");
    nombre.textContent = item.nombre;
    detalles.appendChild(nombre);

    const subtotalProducto = item.precio * item.cantidad;

    const detallesPrecio = document.createElement("p");
    detallesPrecio.textContent = `$${item.precio.toLocaleString('es-CO')} x ${item.cantidad} = $${subtotalProducto.toLocaleString('es-CO')}`;

    detalles.appendChild(detallesPrecio);
    fila.appendChild(detalles);

    const acciones = document.createElement("div");
    acciones.classList.add("item-actions");

    const botonMenos = document.createElement("button");
    botonMenos.textContent = "-";
    botonMenos.classList.add("btn-cantidad-input");

    const botonMas = document.createElement("button");
    botonMas.textContent = "+";
    botonMas.classList.add("btn-cantidad-input");

    const cantidadTexto = document.createElement("span");
    cantidadTexto.textContent = item.cantidad;

    const botonEliminar = document.createElement("button");
    botonEliminar.textContent = "🗑️";
    botonEliminar.classList.add("btn-borrar");

    botonMas.addEventListener("click", () => cambiarCantidad(item.id, 1));
    botonMenos.addEventListener("click", () => cambiarCantidad(item.id, -1));
    botonEliminar.addEventListener("click", () => eliminarProducto(item.id));

    acciones.appendChild(botonMenos);
    acciones.appendChild(cantidadTexto);
    acciones.appendChild(botonMas);
    acciones.appendChild(botonEliminar);

    fila.appendChild(acciones);
    listaItemsFactura.appendChild(fila);
  });

  calcularTotales();
}


function cambiarCantidad(productoId, cambio) {
  const producto = factura.find(item => item.id === productoId);

  if (!producto) return;

  const nuevaCantidad = producto.cantidad + cambio;

  if (nuevaCantidad < 1) return;

  producto.cantidad = nuevaCantidad;
  renderizarFactura();
}


function eliminarProducto(productoId) {
  factura = factura.filter(item => item.id !== productoId);
  renderizarFactura();
}


function calcularTotales() {
  const subtotal = factura.reduce((acumulador, item) => acumulador + (item.precio * item.cantidad), 0);
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  subtotalValor.textContent = `$${subtotal.toLocaleString('es-CO')}`;
  ivaValor.textContent = `$${iva.toLocaleString('es-CO')}`;
  totalValor.textContent = `$${total.toLocaleString('es-CO')}`;
}


// Evento Búsqueda y Filtro actual
const searchInput = document.querySelector("#search-input");

function obtenerProductosActuales() {
  if (!searchInput) return productos;
  const textoBusqueda = searchInput.value.toLowerCase();
  return productos.filter(producto =>
    producto.nombre.toLowerCase().includes(textoBusqueda) ||
    producto.categoria.toLowerCase().includes(textoBusqueda)
  );
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    renderizarProductos(obtenerProductosActuales());
  });
}


// Eventos de los botones de Vista (Lista vs Catálogo)
if (btnLista && btnCatalogo) {
  btnLista.addEventListener("click", () => {
    modoVistaLista = true;
    btnLista.classList.add("active");
    btnCatalogo.classList.remove("active");
    renderizarProductos(obtenerProductosActuales());
  });

  btnCatalogo.addEventListener("click", () => {
    modoVistaLista = false;
    btnCatalogo.classList.add("active");
    btnLista.classList.remove("active");
    renderizarProductos(obtenerProductosActuales());
  });
}


// Evento Vaciar Factura
const botonVaciar = document.querySelector("#btn-vaciar");

if (botonVaciar) {
  botonVaciar.addEventListener("click", () => {
    factura = [];
    renderizarFactura();
  });
}


// Evento Finalizar Venta
const selectPago = document.querySelector('#select-pago');
const grupoEfectivo = document.querySelector('#grupo-efectivo');
const inputRecibido = document.querySelector('#monto-recibido');
const cambioValor = document.querySelector('#cambio-valor');

if (selectPago) {
  selectPago.addEventListener('change', () => {
    if (selectPago.value === 'Efectivo') {
      grupoEfectivo.style.display = 'flex';
    } else {
      grupoEfectivo.style.display = 'none';
    }
  });
}

if (inputRecibido) {
  inputRecibido.addEventListener('input', () => {
    const subtotal = factura.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const total = subtotal * 1.19;
    const recibido = Number(inputRecibido.value) || 0;
    const cambio = recibido - total;

    cambioValor.textContent = `$${(cambio > 0 ? cambio : 0).toLocaleString('es-CO')}`;
  });
}

const botonFinalizar = document.querySelector('#btn-finalizar');

if (botonFinalizar) {
  botonFinalizar.addEventListener('click', () => {
    if (factura.length === 0) {
      alert('La factura está vacía.');
      return;
    }

    const subtotal = factura.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    const metodoPago = selectPago ? selectPago.value : 'Efectivo';
    const recibido = metodoPago === 'Efectivo' ? (Number(inputRecibido.value) || 0) : total;

    if (metodoPago === 'Efectivo' && recibido < total) {
      alert('El monto recibido es menor al total de la venta.');
      return;
    }

    const cambio = metodoPago === 'Efectivo' ? (recibido - total) : 0;

    const nuevaVenta = {
      id: `FAC-${Date.now()}`,
      fecha: new Date().toLocaleString('es-CO'),
      items: [...factura],
      subtotal,
      iva,
      total,
      metodoPago,
      recibido,
      cambio
    };

    if (typeof guardarVentaLocalStorage === 'function') {
        guardarVentaLocalStorage(nuevaVenta);
    }

    if (typeof imprimirFactura === 'function') {
      imprimirFactura(nuevaVenta);
    }

    factura = [];
    if (inputRecibido) inputRecibido.value = '';
    if (cambioValor) cambioValor.textContent = '$0';
    renderizarFactura();

    if (typeof renderHistorial === 'function') {
      renderHistorial();
    }
 });
}

// Inicialización
renderizarProductos(productos);
renderizarFactura();