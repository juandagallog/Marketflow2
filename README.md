# Papel y Luna — POS MVP 2

Sistema de punto de venta para una papelería desarrollado con HTML, CSS y JavaScript vanilla. Productos, categorías, clientes, proveedores, ventas y compras se leen y guardan en Google Sheets mediante Google Apps Script. El navegador mantiene el carrito y las operaciones pendientes en memoria; no utiliza localStorage como fuente de datos.

## Tecnologías y arquitectura

- HTML5, CSS3 y JavaScript, sin frameworks ni librerías externas.
- `fetch`, `async/await` y JSON para comunicarse con la API.
- Google Apps Script como servicio y Google Sheets como almacenamiento remoto.
- `crypto.randomUUID()` para identificadores y fechas ISO para ventas y compras.
- Impresión y opción Guardar como PDF del navegador.

```text
Frontend HTML/CSS/JS → API Google Apps Script → Google Sheets
```

El frontend llama a `GET ?resource=...` para consultar y a `POST ?resource=...` con `{ action, data }` para crear, actualizar o eliminar. El POST usa `Content-Type: text/plain;charset=utf-8`. Se comprueba `success` y se muestran los errores del servicio.

## Funcionalidades actuales

- POS con búsqueda, vista lista/catálogo, carrito, cantidades, subtotales, IVA y total.
- Venta cerrada con Efectivo, Nequi o Debe; recibido y cambio para efectivo.
- Cliente opcional en la venta, obligatorio para Debe.
- Ventas abiertas: guardar, listar, retomar, editar y cerrar conservando el ID.
- Historial remoto de ventas y factura imprimible desde el historial.
- CRUD de productos con categoría seleccionada, costo y seguimiento de inventario.
- Edición de nombre, categoría, precio y costo desde el POS mediante el modal existente; el stock se ajusta desde el CRUD de productos.
- CRUD y búsqueda de clientes, proveedores y categorías.
- Protección de eliminación para entidades con registros asociados.
- Compras con proveedor, cantidades, costos, total, listado y detalle.
- Descuento de stock al cerrar ventas; incremento de stock y actualización de costo con compras. Los productos sin seguimiento no cambian su stock.
- Indicador global de carga, botones de guardado deshabilitados y mensajes de error.

## Ejecución local

1. Descargar o clonar este repositorio y abrir su carpeta raíz.
2. Comprobar que `API_URL` en `js/api.js` apunta a la implementación activa de Apps Script terminada en `/exec`.
3. Servir la carpeta con un servidor HTTP local. Si tienes Python instalado:

   ```powershell
   python -m http.server 8000 --bind 127.0.0.1
   ```

4. Abrir `http://localhost:8000` en un navegador moderno.
5. Mantener conexión a Internet para consultar y guardar información en Sheets.

No hay dependencias del frontend que instalar ni proceso de compilación. Para generar UUID se requiere HTTPS o localhost; usar el servidor local en lugar de abrir `index.html` con `file://`.

## Configuración del servicio

El código Apps Script se administra en el editor de Google; no está incluido actualmente en este repositorio. Debe implementar `create`, `update` y `delete`, incluyendo rechazo de IDs duplicados. Después de cambiarlo se debe publicar una nueva versión de la implementación, ejecutada como propietario y accesible para cualquier persona, según la guía del curso.

| Recurso | Encabezados |
|---|---|
| productos | id, codigo, nombre, categoriaId, precio, costo, seguimientoInventario, stock |
| categorias | id, nombre |
| clientes | id, nombre, telefono, correo |
| proveedores | id, nombre, telefono, correo |
| ventas | id, fecha, estado, clienteId, metodoPago, subtotal, total, valorRecibido, cambio, itemsJson, actualizadoEn |
| compras | id, fecha, proveedorId, total, itemsJson |

La aplicación también usa `descripcion` e `imagenes` en productos: agregar ambas columnas para conservar esos campos en Sheets. `categoriaId`, `clienteId` y `proveedorId` referencian registros existentes. Los productos migrados del MVP 1 deben tener `categoriaId` válido. Los datos iniciales se cargan en Sheets, no en el frontend.

## Organización del código

| Archivo | Responsabilidad |
|---|---|
| index.html / css/Style.css | Vistas, formularios y estilos |
| js/api.js | URL, peticiones, timeout y reintentos limitados |
| js/loading.js | Indicador de operaciones remotas concurrentes; envuelve las funciones de API |
| js/app.js | Inicialización, navegación y conexión de eventos |
| js/pos.js | Catálogo, carrito, pagos y cierre de ventas con stocks objetivo |
| js/ventas-abiertas.js | Guardado y recuperación de ventas abiertas |
| js/productos.js | Tabla CRUD y modal de productos reutilizado desde POS |
| js/historial.js | Historial remoto, adaptación de ventas y factura imprimible |
| js/clientes.js | CRUD de clientes y selector del POS |
| js/gestion.js | CRUD compartido de proveedores y categorías, y comprobación de relaciones |
| js/compras.js | Registro de compras, objetivos de inventario/costo, listado y detalle |
| imagenes/ | Recursos visuales; las rutas se obtienen de los productos del servicio |

## Reintentos y limitaciones

- Cada petición tiene timeout, incluida la lectura de la respuesta. GET tiene hasta tres intentos y UPDATE hasta dos; CREATE y DELETE no se repiten automáticamente.
- Si una creación devuelve un error después de haberse guardado, se consulta el mismo UUID en el servicio antes de continuar o volver a intentar manualmente.
- Stocks y costos objetivo se calculan una sola vez por operación. Un reintento envía los mismos valores absolutos para evitar aplicar dos veces el movimiento.
- El estado local se actualiza cuando se confirman las escrituras. Un error del historial conserva el último historial válido.
- Sheets no proporciona una transacción conjunta de venta/compra e inventario: una operación puede quedar parcialmente guardada. La interfaz conserva la operación pendiente en memoria para reintentar. No recargar ni cerrar la página mientras esa recuperación esté pendiente.
- El inventario parte de la copia cargada en el navegador; escrituras simultáneas desde varios equipos pueden entrar en conflicto. La demostración debe hacerse con un solo operador.
- La API es pública y no implementa autenticación ni roles. Usar datos de demostración; autenticación corresponde al MVP 3.

## Verificación pendiente antes de entregar

- Corregir el cambio mostrado si se modifica el carrito después de ingresar el efectivo: el total se recalcula, pero el cambio visible puede conservar el valor anterior.
- Unificar el manejo de dinero en pesos enteros según la guía: el cálculo de IVA actual puede producir decimales (por ejemplo, precio 50 genera total 59,5).
- Verificar todos los flujos en el servicio y frontend desplegados, incluida la impresión y la navegación móvil. La revisión de sintaxis no sustituye esas pruebas.

## Integrantes

- Juan
- Jacobo
- Jero

## URL desplegada

**Pendiente:** reemplazar este texto por la URL HTTPS del frontend publicado y verificado.

La URL del frontend abre la aplicación; es distinta de `API_URL`, que recibe las peticiones de datos.

## Entrega MVP 2

- Mantener el mismo repositorio del MVP 1, con commits visibles de todos los integrantes.
- Publicar el frontend en GitHub Pages u otra plataforma gratuita y comprobar los flujos en la URL pública, también en móvil.
- Completar la URL anterior y preparar `desarrollo-web-2026-2-parcial2-apellidoA-apellidoB-apellidoC.zip` con código fuente, README y recursos, sin dependencias instaladas ni carpetas de compilación.
- Conservar una copia del código Apps Script utilizado para reproducir el servicio y explicarlo en la sustentación.

El alcance de esta entrega se toma del documento MVP 2. Descuentos, reembolsos, correcciones de ventas cerradas, reportes, autenticación, roles y backend propio quedan para MVP 3.
