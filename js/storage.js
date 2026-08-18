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