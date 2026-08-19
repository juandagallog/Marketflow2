/* Puente con LocalStorage. Compartido por todos
Más adelante tendrá funciones como:

guardarProductos()
obtenerProductos()


guardarVentas()
obtenerVentas()

Este archivo será compartido por los tres módulos.

La idea importante es que ni POS ni Historial estén escribiendo:

localStorage.setItem(...)

por veinte lugares distintos.

Centralizamos esa responsabilidad aca

*/

// Guardamos la lista actualizada de productos en la memoria del navegador
// Y obtenemos los productos guardados o cargamos los iniciales del documento de data.js
function obtenerProductosLocalStorage() {
const guardados = localStorage.getItem('papel_y_luna_productos');
if (guardados) {
    return JSON.parse(guardados);
}
  // Si no hay nada, toma los de data.js y los guarda
guardarProductosLocalStorage(productosIniciales);
return productosIniciales;
}

function guardarProductosLocalStorage(productos) {
localStorage.setItem('papel_y_luna_productos', JSON.stringify(productos));
}
function obtenerVentasLocalStorage() {
  const guardadas = localStorage.getItem('papel_y_luna_ventas');
  return guardadas ? JSON.parse(guardadas) : [];
}

function guardarVentaLocalStorage(venta) {
  const historial = obtenerVentasLocalStorage();
  historial.push(venta);
  localStorage.setItem('papel_y_luna_ventas', JSON.stringify(historial));
}