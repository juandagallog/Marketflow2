/* HISTORIAL DE VENTAS:
listar ventas
mostrar detalle
mostrar factura
imprimir
*/

function renderHistorial() {
  const historialContainer = document.querySelector('#historial-container');
  if (!historialContainer) return;

  const ventas = obtenerVentasLocalStorage();
  historialContainer.innerHTML = "";

  if (ventas.length === 0) {
    historialContainer.innerHTML = `<p class="historial-vacio">No hay ventas en el historial.</p>`;
    return;
  }

  ventas.slice().reverse().forEach(venta => {
    const card = document.createElement('article');
    card.classList.add('historial-card');

    card.innerHTML = `
      <div class="historial-card-header">
        <div>
          <strong>N° ${venta.id}</strong>
          <p class="historial-card-fecha">${venta.fecha}</p>
        </div>
        <strong>$${venta.total.toLocaleString('es-CO')}</strong>
      </div>
      <div class="historial-card-body">
        <p class="historial-card-titulo-detalle">Detalle de la compra:</p>
        <ul class="historial-card-lista">
          ${venta.items.map(item => `
            <li class="historial-card-item">
              <span>${item.nombre} (x${item.cantidad})</span>
              <span>$${(item.precio * item.cantidad).toLocaleString('es-CO')}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      <div class="historial-card-footer">
        <button type="button" class="btn-imprimir-factura">🖨️ Imprimir Factura</button>
      </div>
    `;

    card.querySelector('.btn-imprimir-factura').addEventListener('click', () => imprimirFactura(venta));
    historialContainer.appendChild(card);
  });
}

function imprimirFactura(venta) {
  const ventana = window.open('', '_blank', 'width=400,height=600');
  ventana.document.write(`
    <html>
      <head>
        <title>Factura - ${venta.id}</title>
        <style>
          body { font-family: monospace; padding: 20px; text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; text-align: left; }
        </style>
      </head>
      <body>
        <h2>Papel y Luna</h2>
        <p>Factura N°: ${venta.id}</p>
        <p>Fecha: ${venta.fecha}</p>
        <div class="divider"></div>
        ${venta.items.map(i => `
          <div class="item">
            <span>${i.nombre} x${i.cantidad}</span>
            <span>$${(i.precio * i.cantidad).toLocaleString('es-CO')}</span>
          </div>
        `).join('')}
        <div class="divider"></div>
        <p>Subtotal: $${venta.subtotal.toLocaleString('es-CO')}</p>
        <p>IVA (19%): $${venta.iva.toLocaleString('es-CO')}</p>
        <p><strong>TOTAL: $${venta.total.toLocaleString('es-CO')}</strong></p>
      </body>
    </html>
  `);
  ventana.document.close();
  ventana.focus();
  ventana.print();
  ventana.close();
}