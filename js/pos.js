// ARCHIVO PRINCIPAL, LOGICA EXISTENTE. Entrega 2.1

let productos = [...productosIniciales];
let factura = [];

const productGrid = document.querySelector('#product-grid');
const listaItemsFactura = document.querySelector('#invoice-items-list');

const subtotalValor = document.querySelector('#subtotal-valor');
const ivaValor = document.querySelector('#iva-valor');
const totalValor = document.querySelector('#total-valor');
const contadorProductos = document.querySelector("#total-products-count");


function renderizarProductos(listaProductos) {
  // Limpia cualquier tarjeta previamente renderizada
  productGrid.innerHTML = "";

  // Actualiza el contador con la cantidad de productos visibles
  if (contadorProductos) {
    contadorProductos.textContent = listaProductos.length;
  }

  listaProductos.forEach(producto => {
    const tarjeta = document.createElement('article');
    tarjeta.classList.add("product-card");
    
    // Etiqueta de categoría
    const categoria = document.createElement('span');
    categoria.classList.add('product-cat-tag');
    categoria.textContent = producto.categoria;
    tarjeta.appendChild(categoria);
    
    // Título del producto
    const titulo = document.createElement('h3');
    titulo.classList.add('product-title');
    titulo.textContent = producto.nombre;
    tarjeta.appendChild(titulo);
    
    // Descripción
    const descripcion = document.createElement('p');
    descripcion.classList.add('product-desc');
    descripcion.textContent = producto.descripcion;
    tarjeta.appendChild(descripcion);
    
    // Pie de la tarjeta
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


// Evento Búsqueda
const searchInput = document.querySelector("#search-input");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const textoBusqueda = searchInput.value.toLowerCase();
    const productosFiltrados = productos.filter(producto => 
      producto.nombre.toLowerCase().includes(textoBusqueda) ||
      producto.categoria.toLowerCase().includes(textoBusqueda)
    );

    renderizarProductos(productosFiltrados);
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
const botonFinalizar = document.querySelector('#btn-finalizar');

if (botonFinalizar) {
  botonFinalizar.addEventListener('click', () => {
    if (factura.length === 0) {
      alert('La factura está vacía.');
      return;
    }

    alert('Venta finalizada correctamente.');
    factura = [];
    renderizarFactura();
  });
}


// Inicialización
renderizarProductos(productos);
renderizarFactura();