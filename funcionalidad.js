const productos = [
  { id: 1, nombre: "Cuaderno Moleskine", categoria: "Cuadernos", precio: 18000, descripcion: "Cuaderno argollado tapa dura 100 hojas", imagen: "imagenes/CuadernoMoleskine.jpg" },
  { id: 2, nombre: "Set Bolígrafos Gel", categoria: "Escritura", precio: 12500, descripcion: "Pack de 5 bolígrafos de colores 0.7mm", imagen: "imagenes/BoligrafosGel.jpg" },
  { id: 3, nombre: "Resaltadores Pastel", categoria: "Escritura", precio: 9800, descripcion: "Set de 6 marcadores tonos pastel", imagen: "imagenes/ResaltadoresPastel.jpg" },
  { id: 4, nombre: "Regla de Aluminio 30cm", categoria: "Medición", precio: 6500, descripcion: "Regla metálica antideslizante", imagen: "imagenes/ReglaMetal.jpg" },
  { id: 5, nombre: "Carpeta Organizadora", categoria: "Oficina", precio: 15000, descripcion: "Carpeta plástica fuelle de 12 bolsillos", imagen: "imagenes/CarpetaOrganizadora.jpg" },
  { id: 6, nombre: "Tijeras de Precisión", categoria: "Corte", precio: 7200, descripcion: "Hojas de acero inoxidable ergonómicas", imagen: "imagenes/Tijeras.jpg" },
  { id: 7, nombre: "Borrador de Nata", categoria: "Escritura", precio: 1500, descripcion: "Borrador suave sin manchar la hoja", imagen: "imagenes/Borrador.jpg" },
  { id: 8, nombre: "Sacapuntas Depósito", categoria: "Accesorios", precio: 3200, descripcion: "Doble orificio para lápices estándar y jumbo", imagen: "imagenes/Sacapuntas.jpg" },
  { id: 9, nombre: "Cinta Adhesiva", categoria: "Oficina", precio: 2800, descripcion: "Cinta adhesiva transparente 18mm x 30m", imagen: "imagenes/CintaAdhesiva.jpg" },
  { id: 10, nombre: "Calculadora Científica", categoria: "Tecnología", precio: 45000, descripcion: "240 funciones con pantalla de 2 líneas", imagen: "imagenes/Calculadora.jpg" },
  { id: 11, nombre: "Notas Adhesivas", categoria: "Oficina", precio: 4200, descripcion: "Block notas 76x76mm amarillo fluorescente", imagen: "imagenes/NotasAdhesivas.jpg" },
  { id: 12, nombre: "Marcadores Permanentes", categoria: "Escritura", precio: 11000, descripcion: "Caja x4 colores básicos punta fina", imagen: "imagenes/MarcadoresPermanentes.jpg" }
];


let factura = [];

const productGrid = document.querySelector('#product-grid');
const invoiceItemsList = document.querySelector('#invoice-items-list');

const subtotalValor = document.querySelector('#subtotal-valor');
const ivaValor = document.querySelector('#iva-valor');
const totalValor = document.querySelector('#total-valor');



function renderizarProductos(listaProductos){
  // Esta linea de codigo lo que hace es borrar cualquier tarjeta previamente renderizada para evitar acumular productos al buscar cosas
  productGrid.innerHTML = "";

  listaProductos.forEach(producto => {
    const tarjeta = document.createElement('article');
    tarjeta.classList.add("product-card")
    
    const imagen = document.createElement('img');
    imagen.classList.add('product-img');
    imagen.src = producto.imagen;
    imagen.alt = 'Imagen del producto: ' + producto.nombre;
    tarjeta.appendChild(imagen);
    
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
    
    const precio = document.createElement('p');
    precio.classList.add('product-price');
    precio.textContent = `$${producto.precio.toLocaleString('es-CO')}`;
    tarjeta.appendChild(precio);

    const cantidad = document.createElement("input");
    cantidad.type = "number";
    cantidad.value = 1;
    cantidad.min = 1;
    cantidad.classList.add("cantidad-input")
    cantidad.id = `cantidad-${producto.id}`;
    tarjeta.appendChild(cantidad);

    const botonAgregar = document.createElement('button');
    botonAgregar.textContent = 'Agregar';
    botonAgregar.classList.add('btn-añadir-carrito');
    botonAgregar.addEventListener("click", () => {
      agregarAFactura(producto.id, cantidad.value);
    })
    tarjeta.appendChild(botonAgregar);


    productGrid.appendChild(tarjeta);
});

}


function agregarAFactura(productoId, cantidadIngresada){
  let cantidad = Number(cantidadIngresada);
  if (cantidad < 1 || isNaN(cantidad)) {
    cantidad = 1;
  }

  const producto = productos.find(producto => producto.id === productoId)

  const productoExistente = factura.find(item => item.id === productoId)

  if (productoExistente) {
    productoExistente.cantidad += cantidad;
  }
  else {
    factura.push({
      // El ...producto copia todas las propiedades de producto. Con el push hacemos que en la factura 
      // salgan todos los atributos de producto mas la cantidad
      ...producto,
      cantidad: cantidad
    })
  }
  renderizarFactura();
}

function renderizarFactura() {
  invoiceItemsList.innerHTML="";

  if (factura.length === 0) {
    invoiceItemsList.innerHTML = `
        <div class="empty-invoice-state">
            <p>🛒 La factura está vacía</p>
            <small>Agrega productos desde el catálogo.</small>
        </div> `;

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


    botonMas.addEventListener("click", () => {
      cambiarCantidad(item.id,1);
    })

    botonMenos.addEventListener("click", () => {
      cambiarCantidad(item.id,-1);
    })

    botonEliminar.addEventListener("click", () => {
      eliminarProducto(item.id);
    })

    acciones.appendChild(botonMenos);
    acciones.appendChild(cantidadTexto);
    acciones.appendChild(botonMas);
    acciones.appendChild(botonEliminar);

    fila.appendChild(acciones);
    
    invoiceItemsList.appendChild(fila);


  })
  calcularTotales();
}


function cambiarCantidad(productoId,cambio) {
  const producto = factura.find( item => item.id === productoId);

  if (!producto){
    return;
  }

  const nuevaCantidad = producto.cantidad + cambio

  if (nuevaCantidad < 1){
    return;
  }

  producto.cantidad = nuevaCantidad;

  renderizarFactura();
}


function eliminarProducto(productoId){
  // La nueva factura son todos los demas elementos, excepto el que queremos eliminar
  factura = factura.filter (item => item.id !== productoId);

  renderizarFactura();
}


function calcularTotales() {
  const subtotal = factura.reduce ((acumulador, item) => {
    return acumulador + item.precio * item.cantidad;},0 );

    const iva = subtotal * 0.19;

    const total = subtotal + iva;

    subtotalValor.textContent = `$${subtotal.toLocaleString('es-CO')}`;

  ivaValor.textContent = `$${iva.toLocaleString('es-CO')}`;

  totalValor.textContent = `$${total.toLocaleString('es-CO')}`;
  }


const searchInput = document.querySelector("#search-input");

if (searchInput){

  searchInput.addEventListener("input", () => {
    const textoBusqueda = searchInput.value.toLowerCase();

    const productosFiltrados = productos.filter (producto => producto.nombre.toLowerCase().includes(textoBusqueda));

    renderizarProductos(productosFiltrados);
  })
}


const botonVaciar = document.querySelector("#btn-vaciar");

if (botonVaciar){
  botonVaciar.addEventListener("click", () => {
    factura = [];

    renderizarFactura();
  })
}



const botonFinalizar = document.querySelector('#btn-finalizar');

if (botonFinalizar){
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



renderizarProductos(productos);
renderizarFactura();











const contadorProductos = document.querySelector("#total-products-count");
contadorProductos.textContent = productos.length;

