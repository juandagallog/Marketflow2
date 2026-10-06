// ARCHIVO PRINCIPAL - POS.JS

let productos = [];
let categorias = [];
let catalogoCargado = false;
let productosGuardando = false;

// Las propiedades de interfaz son locales; la API mantiene sus nombres oficiales.
function adaptarProducto(producto) {
  const categoriaId = String(producto.categoriaId ?? "");
  return {
    ...producto, id: String(producto.id), categoriaId,
    codigo: String(producto.codigo ?? ""), nombre: String(producto.nombre ?? ""),
    categoria: categorias.find(c => c.id === categoriaId)?.nombre || "Sin categoría",
    precio: Number(producto.precio), costo: Number(producto.costo), stock: Number(producto.stock),
    trackStock: producto.seguimientoInventario === true || String(producto.seguimientoInventario).toLowerCase() === "true",
    descripcion: String(producto.descripcion ?? ""), imagenes: String(producto.imagenes ?? "")
  };
}

async function cargarCatalogoRemoto() {
  const estado = document.getElementById('catalogo-estado');
  const reintentar = document.getElementById('btn-reintentar-catalogo');
  const nuevo = document.getElementById('btn-new-product');
  catalogoCargado = false;
  nuevo.disabled = true;
  reintentar.disabled = true;
  reintentar.classList.add('hidden');
  estado.textContent = "";
  const quitarSkeleton = mostrarSkeleton(productGrid, modoVistaLista ? 'catalogo-lista' : 'catalogo');
  const quitarSkeletonCRUD = mostrarSkeleton(document.getElementById('products-table-body'), 'tabla', 7);
  try {
    const [datosProductos, datosCategorias] = await Promise.all([apiGet("productos"), apiGet("categorias")]);
    if (!Array.isArray(datosProductos) || !Array.isArray(datosCategorias)) throw new Error("La API debe devolver listas.");
    categorias = datosCategorias.map(c => ({ ...c, id: String(c.id), nombre: String(c.nombre) }));
    productos = datosProductos.map(adaptarProducto);
    const select = document.getElementById('product-category');
    select.replaceChildren(new Option("Selecciona una categoría", ""));
    categorias.forEach(c => select.add(new Option(c.nombre, c.id)));
    catalogoCargado = true;
    renderizarProductos(obtenerProductosActuales());
    renderTablaCRUD(productos);
    estado.textContent = categorias.length ? "" : "No hay categorías disponibles en el servicio.";
  } catch (error) {
    estado.textContent = "No se pudo cargar el catálogo.";
    reintentar.classList.remove('hidden');
    mostrarNotificacion(error.message, "error");
  } finally {
    quitarSkeleton();
    quitarSkeletonCRUD();
    nuevo.disabled = !catalogoCargado || categorias.length === 0;
    reintentar.disabled = false;
    iniciarBorradorVenta();
  }
}
let factura = [];
let ventaPendienteId = null;
let ventaPendiente = null;
let ventaAbiertaActualId = null;
let ventaAbiertaActualFecha = null;
let ventaAbiertaGuardadoPendiente = null;
let modoVistaLista = true; // false = catálogo normal (cuadrícula), true = lista apilada

const productGrid = document.querySelector('#product-grid');
const listaItemsFactura = document.querySelector('#invoice-items-list');

const subtotalValor = document.querySelector('#subtotal-valor');
const ivaValor = document.querySelector('#iva-valor');
const totalValor = document.querySelector('#total-valor');
const contadorProductos = document.querySelector("#total-products-count");

const btnLista = document.querySelector("#btn-lista");
const btnCatalogo = document.querySelector("#btn-catalogo");


function renderizarProductos(listaProductos) {
  if (!catalogoCargado) return;
  productGrid.innerHTML = "";

  if (contadorProductos) {
    contadorProductos.textContent = listaProductos.length;
  }

  if (listaProductos.length === 0) {
    productGrid.innerHTML = `<p class="empty-list-message">No hay productos disponibles.</p>`;
    return;
  }

  // MODO VISTA LISTA
  if (modoVistaLista) {
    const contenedorLista = document.createElement('div');
    contenedorLista.classList.add('pos-list-container');

    listaProductos.forEach((producto) => {
      const fila = document.createElement('div');
      fila.classList.add('pos-list-row');
      
      fila.innerHTML = `
        <div class="pos-list-info">
          <div class="pos-list-header-group">
            <span class="product-cat-tag">${producto.categoria}</span>
            <h4 class="pos-list-title">${producto.nombre}</h4>
          </div>
          <span class="pos-list-desc">${producto.descripcion || ''}</span>
        </div>

        <div class="pos-list-price-container">
          <span class="pos-list-price">$${producto.precio.toLocaleString('es-CO')}</span>
        </div>

        <div class="pos-list-actions">
          <input type="number" value="1" min="1" class="cantidad-input pos-list-input" id="cantidad-${producto.id}">
          <button type="button" class="btn-añadir-carrito pos-list-btn">Agregar</button>
        </div>
      `;

      const botonAgregar = fila.querySelector('.btn-añadir-carrito');
      const inputCantidad = fila.querySelector('.cantidad-input');
      
      botonAgregar.addEventListener("click", () => {
        agregarAFactura(producto.id, inputCantidad.value);
      });
      const editar = document.createElement('button');
      editar.type = 'button'; editar.className = 'btn-editar'; editar.textContent = 'Editar';
      editar.addEventListener('click', () => openProductModal(producto.id, productos, true));
      fila.querySelector('.pos-list-actions').appendChild(editar);

      contenedorLista.appendChild(fila);
    });

    productGrid.appendChild(contenedorLista);

  } else {
    // MODO CATÁLOGO NORMAL (Cuadrícula)
    listaProductos.forEach(producto => {
      const tarjeta = document.createElement('article');
      tarjeta.classList.add("product-card");
      
      const contenedorImagen = document.createElement('div');
      contenedorImagen.classList.add('product-image-container');

      const imagen = document.createElement('img');
      imagen.classList.add('product-image');
      imagen.alt = producto.nombre;
      
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
      const editar = document.createElement('button');
      editar.type = 'button'; editar.className = 'btn-editar'; editar.textContent = 'Editar';
      editar.addEventListener('click', () => openProductModal(producto.id, productos, true));
      controlesProducto.appendChild(editar);

      pieProducto.appendChild(controlesProducto);
      tarjeta.appendChild(pieProducto);

      productGrid.appendChild(tarjeta);
    });
  }
}

function agregarAFactura(productoId, cantidadIngresada) {

  if (!catalogoCargado || productosGuardando || ventaPendiente || ventaAbiertaGuardadoPendiente || compraPendiente) return;
  let cantidad = Number(cantidadIngresada);

  if (cantidad < 1 || isNaN(cantidad)) {
    cantidad = 1;
  }

  const producto = productos.find(p => p.id === productoId);
  // Si no existe un producto con el id
  if (!producto) return;

  const productoExistente = factura.find(item => item.id === productoId);

  let cantidadActual = 0;

  if (productoExistente) {
    // Cantidad en la factura
    cantidadActual = productoExistente.cantidad
  }
  
  const cantidadFinal = cantidadActual + cantidad;

  if (producto.trackStock && cantidadFinal > producto.stock){
  mostrarNotificacion( `Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`,"error");
    return;
  }


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
    guardarBorradorVenta();
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

    const subtotalProducto = Math.round(item.precio * item.cantidad);

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
  guardarBorradorVenta();
}


function cambiarCantidad(productoId, cambio) {
    if (productosGuardando || ventaPendiente || ventaAbiertaGuardadoPendiente || compraPendiente) return;
    const producto = factura.find(item => item.id === productoId);

    if (!producto) return;

    const nuevaCantidad = producto.cantidad + cambio;

    if (nuevaCantidad < 1) return;

    const productoInventario = productos.find(p => p.id === productoId);

    if (
        cambio > 0 &&
        productoInventario &&
        productoInventario.trackStock &&
        nuevaCantidad > productoInventario.stock
    ) {
        mostrarNotificacion(
            `No puedes superar el stock disponible (${productoInventario.stock}).`,
            "error"
        );
        return;
    }

    producto.cantidad = nuevaCantidad;
    renderizarFactura();
}


function eliminarProducto(productoId) {
  if (productosGuardando || ventaPendiente || ventaAbiertaGuardadoPendiente || compraPendiente) return;
  factura = factura.filter(item => item.id !== productoId);
  renderizarFactura();
}


function calcularTotales() {
  const subtotal = Math.round(factura.reduce((acumulador, item) => acumulador + (item.precio * item.cantidad), 0));
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  subtotalValor.textContent = `$${subtotal.toLocaleString('es-CO')}`;
  ivaValor.textContent = `$${iva.toLocaleString('es-CO')}`;
  totalValor.textContent = `$${total.toLocaleString('es-CO')}`;
  actualizarCalculoCambio();
}


// Evento Búsqueda y Filtro actual
const searchInput = document.querySelector("#search-input");

function obtenerProductosActuales() {
    if (!searchInput) return productos;

    const textoBusqueda = searchInput.value.toLowerCase();

    return productos.filter(producto =>
        producto.nombre.toLowerCase().includes(textoBusqueda) ||
        producto.categoria.toLowerCase().includes(textoBusqueda) ||
        producto.codigo.toLowerCase().includes(textoBusqueda)
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
    if (productosGuardando || ventaPendiente || ventaAbiertaGuardadoPendiente || compraPendiente) return;
    factura = [];
    eliminarBorradorVenta();
    renderizarFactura();
  });
}


// Evento Finalizar Venta
const selectPago = document.querySelector('#select-pago');
const grupoEfectivo = document.querySelector('#grupo-efectivo');
const inputRecibido = document.querySelector('#monto-recibido');
const cambioValor = document.querySelector('#cambio-valor');

// Obtener el total numérico con la misma fórmula global
function calcularTotalVenta() {
  const subtotal = Math.round(factura.reduce((sum, item) => sum + (item.precio * item.cantidad), 0));
  const iva = Math.round(subtotal * 0.19);
  return subtotal + iva;
}

// Actualizar dinámicamente el valor del cambio
function actualizarCalculoCambio() {
  if (!inputRecibido || !cambioValor) return;

  const total = calcularTotalVenta();
  const recibido = Math.round(Number(inputRecibido.value) || 0);
  const cambio = recibido - total;

  // Si no se ha ingresado dinero o no alcanza, el cambio es 0
  if (recibido === 0 || cambio < 0) {
    cambioValor.textContent = '$0';
  } else {
    cambioValor.textContent = `$${Math.round(cambio).toLocaleString('es-CO')}`;
  }
}

// Manejo del cambio de Método de Pago
selectPago.addEventListener("change", () => {

    if (selectPago.value === "Efectivo") {
        grupoEfectivo.classList.remove("hidden");
    } else {
        grupoEfectivo.classList.add("hidden");

        inputRecibido.value = "";
        cambioValor.textContent = "$0";
    }
});

if (inputRecibido) {
  inputRecibido.addEventListener('input', actualizarCalculoCambio);
}

const botonFinalizar = document.querySelector('#btn-finalizar');

if (botonFinalizar) {
  botonFinalizar.addEventListener('click', async () => {
    if (!catalogoCargado || productosGuardando || compraPendiente) return;
    if (ventaAbiertaGuardadoPendiente) {
      mostrarNotificacion('Primero reintenta guardar la venta abierta pendiente.', 'error');
      return;
    }
    if (!ventaPendiente) {
    if (factura.length === 0) {
      mostrarNotificacion("La factura está vacía.","error");
      return;
    }

    if (factura.some(i => !Number.isInteger(i.precio) || !Number.isInteger(i.costo))) {
      mostrarNotificacion('Los precios y costos deben ser pesos enteros. Corrige el producto antes de guardar.', 'error'); return;
    }

    const subtotal = Math.round(factura.reduce((sum, item) => sum + (item.precio * item.cantidad), 0));
    const iva = Math.round(subtotal * 0.19);
    const total = subtotal + iva;
    const metodoPago = selectPago.value;
    const clienteId = document.getElementById('select-cliente').value;
    if (!validarClienteVenta(metodoPago, clienteId)) return;

    let recibido = 0;
    let cambio = 0;
    let saldoPendiente = 0;

    // Para pagos en efectivo:
    if (metodoPago === "Efectivo") {
        recibido = Math.round(Number(inputRecibido.value));

        // Si el usuario no escribió un número válido
        if (!Number.isFinite(recibido)) {
            recibido = 0;
        }

        // No dejamos cerrar la venta si falta dinero
        if (recibido < total) {
            mostrarNotificacion(
                "El monto recibido es menor al total de la venta.",
                "error"
            );
            return;
        }

        cambio = Math.round(recibido - total);
    }

    // Para nequi
    if (metodoPago === "Nequi") {
        // Suponemos que el vendedor confirmó que recibió el valor total por Nequi
        recibido = total;
        cambio = 0;
    }

    // DEBE
    if (metodoPago === "Debe") {
        // El cliente no paga ahora, todo queda como deuda
        recibido = 0;
        cambio = 0;
        saldoPendiente = total;
    }

    let stockValido = true;

    factura.forEach(itemVenta => {
        const productoInventario = productos.find(
            producto => producto.id === itemVenta.id
        );

        if (!productoInventario || !Number.isFinite(itemVenta.cantidad) || itemVenta.cantidad <= 0) {
            stockValido = false;
            mostrarNotificacion("Producto o cantidad no validos en la venta.", "error");
        } else {
            if (productoInventario.trackStock) {
                if (!Number.isFinite(productoInventario.stock) || itemVenta.cantidad > productoInventario.stock) {
                    stockValido = false;

                    mostrarNotificacion(
                        `No hay stock suficiente de ${productoInventario.nombre}.`,
                        "error"
                    );
                }
            }
        }
    });

    if (stockValido === false) {
        return;
    }

    const ahora = new Date().toISOString();

    const itemsVenta = factura.map(item => ({
      productoId: item.id,
      nombre: item.nombre,
      precio: item.precio,
      costo: item.costo,
      cantidad: item.cantidad
    }));

    const nuevaVenta = {
      id: ventaPendienteId || ventaAbiertaActualId || crypto.randomUUID(),
      fecha: ventaAbiertaActualFecha || ahora,
      estado: "cerrada",
      clienteId,
      metodoPago,
      subtotal,
      total,
      valorRecibido: recibido,
      cambio,
      itemsJson: itemsVenta,
      actualizadoEn: ahora
    };

    const stocksObjetivo = factura.flatMap(item => {
      const producto = productos.find(p => p.id === item.id);
      return producto && producto.trackStock
        ? [{ id: producto.id, stock: producto.stock - item.cantidad }]
        : [];
    });
    ventaPendienteId = nuevaVenta.id;
    ventaPendiente = { venta: nuevaVenta, stocksObjetivo, confirmada: false, createIntentado: false, action: ventaAbiertaActualId ? 'update' : 'create' };
    }

    const operacion = ventaPendiente;
    marcarEscrituraBorrador(operacion.venta.id);
    const nuevaVenta = operacion.venta;

    productosGuardando = true;
    botonFinalizar.disabled = true;
    try {

      if (!operacion.confirmada) {
        // Tras una respuesta incierta, consultar antes de cualquier nuevo create.
        if (operacion.createIntentado) {
          const ventas = await apiGet("ventas");
          operacion.confirmada = ventas.some(v => String(v.id) === nuevaVenta.id && v.estado === 'cerrada');
        }
        if (!operacion.confirmada) {
          operacion.createIntentado = true;
          try {
            await apiPost("ventas", operacion.action, nuevaVenta);
            operacion.confirmada = true;
          } catch (error) {
            const ventas = await apiGet("ventas");
            operacion.confirmada = ventas.some(v => String(v.id) === nuevaVenta.id && v.estado === 'cerrada');
            if (!operacion.confirmada) throw error;
          }
        }
      }

      // Siempre repetir valores absolutos capturados antes del primer envio.
      for (const objetivo of operacion.stocksObjetivo) {
        await apiPost("productos", "update", objetivo);
      }
      // No modificar el catalogo local hasta confirmar TODOS los updates.
      for (const objetivo of operacion.stocksObjetivo) {
        const producto = productos.find(p => p.id === objetivo.id);
        if (producto) producto.stock = objetivo.stock;
      }
    } catch (error) {
      renderizarProductos(obtenerProductosActuales());
      renderTablaCRUD(productos);
      mostrarNotificacion(`${operacion.confirmada ? "Venta registrada; falta confirmar el inventario" : "No se pudo confirmar la venta"}: ${error.message}. Pulsa Reintentar cierre; se conservaron el UUID y los stocks objetivo.`, "error");
      return;
    } finally {
      productosGuardando = false;
      botonFinalizar.disabled = false;
      botonFinalizar.textContent = "Reintentar cierre";
    }

    ventaPendienteId = null;
    eliminarBorradorVenta();
    ventaPendiente = null;
    ventaAbiertaActualId = null;
    ventaAbiertaActualFecha = null;
    document.getElementById('select-cliente').value = '';
    document.getElementById('venta-abierta-estado').textContent = '';
    botonFinalizar.textContent = "Finalizar Venta";
    factura = [];
    inputRecibido.value = "";
    cambioValor.textContent = "$0";
    selectPago.value = "Efectivo";
    grupoEfectivo.classList.remove("hidden");

    renderizarFactura();
    renderizarProductos(obtenerProductosActuales());
    renderTablaCRUD(productos);
    mostrarNotificacion("Venta registrada correctamente. Puedes imprimirla desde el historial.", "exito");
    renderHistorial(true);
    
  });
}


// Inicialización de la vista POS
renderizarProductos(productos);
renderizarFactura();
