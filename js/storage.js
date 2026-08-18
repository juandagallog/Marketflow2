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

// Guardar la lista actualizada de productos en la memoria del navegador
// Obtener productos guardados o cargar los iniciales de data.js
function obtenerProductosLocalStorage() {
const guardados = localStorage.getItem('papel_y_luna_productos');
if (guardados) {
    return JSON.parse(guardados);
}

  // productosIniciales viene globalmente desde data.js
guardarProductosLocalStorage(productosIniciales);
return productosIniciales;
}

function guardarProductosLocalStorage(productos) {
localStorage.setItem('papel_y_luna_productos', JSON.stringify(productos));
}