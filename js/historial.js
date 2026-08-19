/* HISTORIAL DE VENTAS: JERO
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
    historialContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: #776a5f;">No hay ventas en el historial.</p>`;
    return;
  }

  ventas.slice().reverse().forEach(venta => {
    const card = document.createElement('article');
    card.classList.add('historial-card');

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
        <div>
          <strong>N° ${venta.id}</strong>
          <p style="font-size: 0.85rem; color: #666; margin:0;">${venta.fecha}</p>
        </div>
        <strong>$${venta.total.toLocaleString('es-CO')}</strong>
      </div>
      <div style="margin-bottom: 10px;">
        <p style="font-size: 0.9rem; font-weight: bold;">Detalle de la compra:</p>
        <ul style="list-style: none; padding-left: 0; font-size: 0.85rem;">
          ${venta.items.map(item => `
            <li style="display:flex; justify-content:space-between;">
              <span>${item.nombre} (x${item.cantidad})</span>
              <span>$${(item.precio * item.cantidad).toLocaleString('es-CO')}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      <div style="display:flex; justify-content:flex-end;">
        <button type="button" class="btn-imprimir-factura" style="padding: 6px 12px; cursor: pointer;">🖨️ Imprimir Factura</button>
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