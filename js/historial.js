function adaptarVentaRemota(venta) {
  let items = [];

  try {
    items = typeof venta.itemsJson === "string"
      ? JSON.parse(venta.itemsJson)
      : venta.itemsJson || [];
  } catch {
    throw new Error("La venta " + venta.id + " contiene itemsJson inválido.");
  }
  if (!Array.isArray(items)) throw new Error("Las líneas de la venta deben ser una lista.");

  const subtotal = Math.round(Number(venta.subtotal) || 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;
  const recibido = Math.round(Number(venta.valorRecibido) || 0);
  return {
    ...venta,

    items,

    subtotal, total, iva, recibido,
    cambio: venta.metodoPago === 'Efectivo' ? Math.max(0, total <= recibido ? recibido - total : 0) : 0,
    saldoPendiente: venta.metodoPago === 'Debe' ? total - recibido : 0
  };
}

let historialEnCarga = null;

async function renderHistorial(refrescarTrasCarga = false) {
  if (historialEnCarga) {
    await historialEnCarga;
    if (!refrescarTrasCarga) return;
  }
  historialEnCarga = cargarYRenderizarHistorial();
  try { await historialEnCarga; }
  finally { historialEnCarga = null; }
}

async function cargarYRenderizarHistorial() {
  const historialContainer = document.querySelector('#historial-container');
  if (!historialContainer) return;

  const quitarHistorial = mostrarSkeleton(historialContainer, 'tarjetas');
  const quitarAbiertas = mostrarSkeleton(document.getElementById('ventas-abiertas-container'), 'tarjetas');
  let ventas = [];
  let abiertas = [];

  try {
    const datos = await apiGet("ventas");
    abiertas = datos.filter(venta => venta.estado === 'abierta').map(adaptarVentaRemota);

    ventas = datos
      .filter(venta => venta.estado === "cerrada")
      .map(adaptarVentaRemota);

  } catch (error) {
    mostrarNotificacion(
      "Error cargando historial: " + error.message,
      "error"
    );

    return;
  } finally { quitarHistorial(); quitarAbiertas(); }


  const contenedorAbiertas = document.getElementById('ventas-abiertas-container');
  contenedorAbiertas.replaceChildren();
  if (!abiertas.length) {
    const vacio = document.createElement('p'); vacio.textContent = 'No hay ventas abiertas.';
    contenedorAbiertas.appendChild(vacio);
  }
  abiertas.slice().reverse().forEach(venta => {
    const card = document.createElement('article'); card.className = 'historial-card';
    const texto = document.createElement('p');
    texto.textContent = `${venta.fecha} | ${nombreCliente(venta.clienteId)} | $${venta.total.toLocaleString('es-CO')}`;
    const boton = document.createElement('button'); boton.type = 'button'; boton.className = 'btn-primary'; boton.textContent = 'Retomar';
    boton.addEventListener('click', async () => {
      boton.disabled = true;
      try { await retomarVentaAbierta(venta.id); } finally { boton.disabled = false; }
    });
    card.append(texto, boton); contenedorAbiertas.appendChild(card);
  });
  historialContainer.innerHTML = "";

  if (ventas.length === 0) {
    const pVacio = document.createElement('p');
    pVacio.classList.add('historial-vacio');
    pVacio.textContent = "No hay ventas en el historial.";
    historialContainer.appendChild(pVacio);
    return;
  }

  ventas.slice().reverse().forEach(venta => {
    const card = document.createElement('article');
    card.classList.add('historial-card');

    // Header de la tarjeta
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('historial-card-header');

    const infoHeader = document.createElement('div');
    const idText = document.createElement('strong');
    idText.textContent = referenciaVisible(venta.id, 'VTA');
    
    const fechaText = document.createElement('p');
    fechaText.classList.add('historial-card-fecha');
    fechaText.textContent = venta.fecha;

    infoHeader.appendChild(idText);
    infoHeader.appendChild(fechaText);

    const totalText = document.createElement('strong');
    totalText.textContent = `$${venta.total.toLocaleString('es-CO')}`;

    cardHeader.appendChild(infoHeader);
    cardHeader.appendChild(totalText);

    // Cuerpo de la tarjeta
    const cardBody = document.createElement('div');
    cardBody.classList.add('historial-card-body');

    const tituloDetalle = document.createElement('p');
    tituloDetalle.classList.add('historial-card-titulo-detalle');
    tituloDetalle.textContent = "Detalle de la compra:";

    const lista = document.createElement('ul');
    lista.classList.add('historial-card-lista');

    venta.items.forEach(item => {
      const li = document.createElement('li');
      li.classList.add('historial-card-item');

      const spanNombre = document.createElement('span');
      spanNombre.textContent = `${item.nombre} (x${item.cantidad})`;

      const spanPrecio = document.createElement('span');
      spanPrecio.textContent = `$${Math.round(item.precio * item.cantidad).toLocaleString('es-CO')}`;

      li.appendChild(spanNombre);
      li.appendChild(spanPrecio);
      lista.appendChild(li);
    });

    cardBody.appendChild(tituloDetalle);
    cardBody.appendChild(lista);

    // Sección de Pago en Historial
    const cardPago = document.createElement('div');
    cardPago.classList.add('historial-card-pago');

    const metodoText = document.createElement('p');
    metodoText.classList.add('historial-pago-info');
    metodoText.textContent = `Pago: ${venta.metodoPago || 'Efectivo'}`;
    cardPago.appendChild(metodoText);

    if (venta.metodoPago === 'Efectivo' || !venta.metodoPago) {
      const cambioText = document.createElement('p');
      cambioText.classList.add('historial-pago-info');
      cambioText.textContent = `Recibido: $${(venta.recibido || venta.total).toLocaleString('es-CO')} | Cambio: $${(venta.cambio || 0).toLocaleString('es-CO')}`;
      cardPago.appendChild(cambioText);
    }

    if(venta.metodoPago === "Debe"){
      const deudaText = document.createElement("p");
      deudaText.classList.add("historial-pago-info");
      deudaText.textContent = `Saldo pendiente: $${venta.saldoPendiente.toLocaleString("es-CO")}`;
      cardPago.appendChild(deudaText);

    }

    cardBody.appendChild(cardPago);

    // Footer con botón de reimpresión
    const cardFooter = document.createElement('div');
    cardFooter.classList.add('historial-card-footer');

    const btnImprimir = document.createElement('button');
    btnImprimir.type = "button";
    btnImprimir.classList.add('btn-imprimir-factura');
    btnImprimir.textContent = "🖨️ Imprimir Factura";
    btnImprimir.addEventListener('click', () => {
      try { imprimirFactura(venta); }
      catch (error) { mostrarNotificacion(error.message, "error"); }
    });

    cardFooter.appendChild(btnImprimir);

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    card.appendChild(cardFooter);

    historialContainer.appendChild(card);
  });
}

function imprimirFactura(venta) {
  if (venta.itemsJson !== undefined) venta = adaptarVentaRemota(venta);
  const ventana = window.open('', '_blank', 'width=400,height=650');
  if (!ventana) throw new Error("El navegador bloqueó la ventana de impresión. Permite ventanas emergentes y reimprime desde el historial.");
  
  const metodoPago = venta.metodoPago || 'Efectivo';
  const recibido = venta.recibido ?? venta.total;
  const cambio = venta.cambio || 0;

  const filasItems = venta.items.map(i => `
    <div class="ticket-row">
      <span>${i.nombre} x${i.cantidad}</span>
      <span>$${Math.round(i.precio * i.cantidad).toLocaleString('es-CO')}</span>
    </div>
  `).join('');

  let bloqueEfectivo = '';
  if (metodoPago === 'Efectivo') {
    bloqueEfectivo = `
      <div class="ticket-row">
        <span>Recibido:</span>
        <span>$${recibido.toLocaleString('es-CO')}</span>
      </div>
      <div class="ticket-row">
        <span>Cambio:</span>
        <span>$${cambio.toLocaleString('es-CO')}</span>
      </div>
    `;
  }

  let bloqueDeuda = "";

  if (metodoPago === "Debe") {
      bloqueDeuda = `
        <div class="ticket-row">
          <span>Saldo pendiente:</span>
          <span>$${venta.saldoPendiente.toLocaleString("es-CO")}</span>
        </div>
      `;
  }

  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Factura - ${referenciaVisible(venta.id, 'VTA')}</title>
        <link rel="stylesheet" href="css/Style.css">
      </head>
      <body class="ticket-body">
        <div class="ticket-wrapper">
          <h2 class="ticket-title">Papel y Luna</h2>
          <p class="ticket-meta">Referencia: ${referenciaVisible(venta.id, 'VTA')}</p>
          <p class="ticket-meta">Fecha: ${venta.fecha}</p>
          <div class="ticket-divider"></div>
          ${filasItems}
          <div class="ticket-divider"></div>
          <div class="ticket-row">
            <span>Subtotal:</span>
            <span>$${venta.subtotal.toLocaleString('es-CO')}</span>
          </div>
          <div class="ticket-row">
            <span>IVA (19%):</span>
            <span>$${venta.iva.toLocaleString('es-CO')}</span>
          </div>
          <div class="ticket-row ticket-total">
            <span>TOTAL:</span>
            <span>$${venta.total.toLocaleString('es-CO')}</span>
          </div>
          <div class="ticket-divider"></div>
          <div class="ticket-row">
            <span>Método de Pago:</span>
            <span>${metodoPago}</span>
          </div>
          ${bloqueEfectivo}
          ${bloqueDeuda}
          
          <!-- BOTÓN CENTRADO Y OCULTO EN IMPRESIÓN -->
          <div class="ticket-actions">
            <button type="button" class="btn-imprimir-factura" onclick="window.print()">
              🖨️ Imprimir Factura
            </button>
          </div>
        </div>
      </body>
    </html>
  `);

  ventana.document.close();
  ventana.focus();
}
