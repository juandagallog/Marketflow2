const productos = [
  { id: 1, nombre: "Cuaderno Moleskine", categoria: "Cuadernos", precio: 18000, descripcion: "Cuaderno argollado tapa dura 100 hojas", imagen: "CuadernoMoleskine.jpg" },
  { id: 2, nombre: "Set Bolígrafos Gel", categoria: "Escritura", precio: 12500, descripcion: "Pack de 5 bolígrafos de colores 0.7mm", imagen: "BoligrafosGel.jpg" },
  { id: 3, nombre: "Resaltadores Pastel", categoria: "Escritura", precio: 9800, descripcion: "Set de 6 marcadores tonos pastel", imagen: "ResaltadoresPastel.jpg" },
  { id: 4, nombre: "Regla de Aluminio 30cm", categoria: "Medición", precio: 6500, descripcion: "Regla metálica antideslizante", imagen: "ReglaMetal.jpg" },
  { id: 5, nombre: "Carpeta Organizadora", categoria: "Oficina", precio: 15000, descripcion: "Carpeta plástica fuelle de 12 bolsillos", imagen: "CarpetaOrganizadora.jpg" },
  { id: 6, nombre: "Tijeras de Precisión", categoria: "Corte", precio: 7200, descripcion: "Hojas de acero inoxidable ergonómicas", imagen: "Tijeras.jpg" },
  { id: 7, nombre: "Borrador de Nata", categoria: "Escritura", precio: 1500, descripcion: "Borrador suave sin manchar la hoja", imagen: "Borrador.jpg" },
  { id: 8, nombre: "Sacapuntas Depósito", categoria: "Accesorios", precio: 3200, descripcion: "Doble orificio para lápices estándar y jumbo", imagen: "Sacapuntas.jpg" },
  { id: 9, nombre: "Cinta Adhesiva", categoria: "Oficina", precio: 2800, descripcion: "Cinta adhesiva transparente 18mm x 30m", imagen: "CintaAdhesiva.jpg" },
  { id: 10, nombre: "Calculadora Científica", categoria: "Tecnología", precio: 45000, descripcion: "240 funciones con pantalla de 2 líneas", imagen: "Calcu.jpg" },
  { id: 11, nombre: "Notas Adhesivas", categoria: "Oficina", precio: 4200, descripcion: "Block notas 76x76mm amarillo fluorescente", imagen: "NotasAdhesivas.jpg" },
  { id: 12, nombre: "Marcadores Permanentes", categoria: "Escritura", precio: 11000, descripcion: "Caja x4 colores básicos punta fina", imagen: "MarcadoresPermanentes.jpg" }
];

const productGrid = document.querySelector('#product-grid');

productos.forEach(producto => {
  const tarjeta = document.createElement('article');
  
  const imagen = document.createElement('img');
  imagen.src = producto.imagen;
  imagen.alt = 'Imagen del producto: ' + producto.nombre;
  tarjeta.appendChild(imagen);
  
  const categoria = document.createElement('span');
  categoria.textContent = producto.categoria;
  tarjeta.appendChild(categoria);
  
  const titulo = document.createElement('h3');
  titulo.textContent = producto.nombre;
  tarjeta.appendChild(titulo);
  
  const descripcion = document.createElement('p');
  descripcion.textContent = producto.descripcion;
  tarjeta.appendChild(descripcion);
  
  const precio = document.createElement('p');
  precio.textContent = `$${producto.precio.toLocaleString('es-CO')}`;
  tarjeta.appendChild(precio);
  
  productGrid.appendChild(tarjeta);
});












const contadorProductos = document.querySelector("#total-products-count");
contadorProductos.textContent = productos.length;

