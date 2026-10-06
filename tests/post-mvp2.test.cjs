// Ejecutar: node --test tests/post-mvp2.test.cjs
// DOM y API simulados; no escribe registros en Google Sheets.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const raiz = path.resolve(__dirname, '..');
const copia = value => JSON.parse(JSON.stringify(value));

class Elemento {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {};
    this.listeners = {}; this.value = ''; this.textContent = ''; this.hidden = false;
    this.disabled = false; this.checked = false; this.dataset = {};
    this.classList = {
      add: (...classes) => { this.className = [...new Set([...this.clases(), ...classes])].join(' '); },
      remove: (...classes) => { this.className = this.clases().filter(c => !classes.includes(c)).join(' '); },
      contains: name => this.clases().includes(name),
      toggle: (name, force) => { const add = force ?? !this.clases().includes(name); this.classList[add ? 'add' : 'remove'](name); }
    };
  }
  clases() { return (this.className || '').split(/\s+/).filter(Boolean); }
  setAttribute(name, value) {
    this.attrs[name] = String(value);
    if (name === 'class') this.className = String(value);
    if (name === 'id') this.id = String(value);
    if (name === 'value') this.value = this.defaultValue = String(value);
    if (name === 'disabled') this.disabled = true;
    if (name.startsWith('data-')) this.dataset[name.slice(5)] = String(value);
  }
  appendChild(node) {
    if (node.tagName === 'FRAGMENT') { [...node.children].forEach(n => this.appendChild(n)); return node; }
    node.remove(); node.parentNode = this; this.children.push(node); return node;
  }
  append(...nodes) { nodes.forEach(n => this.appendChild(n)); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(n => n !== this); this.parentNode = null; }
  replaceChildren(...nodes) { this.children.forEach(n => n.parentNode = null); this.children = []; this.append(...nodes); }
  set innerHTML(html) { this.replaceChildren(); parseHTML(html, this); }
  get innerHTML() { return ''; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  dispatchEvent(event) { this.fire(event.type); return true; }
  async fire(type) {
    for (const listener of this.listeners[type] || []) await listener({ type, target: this, preventDefault() {} });
    // Los listeners del navegador no esperan las Promises que lanzan internamente.
    await new Promise(resolve => setImmediate(resolve));
  }
  click() { return this.fire('click'); }
  focus() { this.focused = true; }
  scrollIntoView() {}
  reset() { this.querySelectorAll('input, select, textarea').forEach(n => { n.value = n.defaultValue || ''; n.checked = false; }); }
  add(option) { this.appendChild(option); }
  get options() { return this.children.filter(n => n.tagName === 'OPTION'); }
  get descendants() { return this.children.flatMap(n => [n, ...n.descendants]); }
  querySelectorAll(selector) { return this.descendants.filter(n => selector.split(',').some(s => matches(n, s.trim()))); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
function matches(node, selector) {
  const parts = selector.split(/\s+/);
  const simple = (n, s) => s[0] === '#' ? n.id === s.slice(1) : s[0] === '.' ? n.clases().includes(s.slice(1)) : n.tagName === s.toUpperCase();
  if (!simple(node, parts.pop())) return false;
  let ancestor = node.parentNode;
  while (parts.length) {
    const part = parts.pop();
    while (ancestor && !simple(ancestor, part)) ancestor = ancestor.parentNode;
    if (!ancestor) return false;
    ancestor = ancestor.parentNode;
  }
  return true;
}
function parseHTML(html, root) {
  const stack = [root];
  for (const token of html.matchAll(/<\/?([\w-]+)([^>]*)>|([^<]+)/g)) {
    if (token[3]) { stack.at(-1).textContent += token[3].trim(); continue; }
    const tag = token[1];
    if (token[0].startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
    const node = new Elemento(tag);
    for (const attr of token[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) node.setAttribute(attr[1], attr[2] || '');
    stack.at(-1).appendChild(node);
    if (!['input', 'meta', 'link', 'br', 'img', 'hr'].includes(tag)) stack.push(node);
  }
}

async function entorno({ storage = new Map(), confirm = true, datos = {} } = {}) {
  const document = new Elemento('document');
  parseHTML(fs.readFileSync(path.join(raiz, 'index.html'), 'utf8'), document);
  document.getElementById = id => document.descendants.find(n => n.id === id) || null;
  document.createElement = tag => new Elemento(tag);
  document.createDocumentFragment = () => new Elemento('fragment');
  const remotos = {
    categorias: [{ id: 'cat-1', nombre: 'Papelería' }],
    clientes: [{ id: 'cli-1', nombre: 'Ana', telefono: '123', correo: 'ana@example.test' }],
    proveedores: [{ id: 'prv-1', nombre: 'Proveedor A', telefono: '123', correo: '' }],
    productos: [
      { id: 'prod-1', codigo: 'PROD-001', nombre: 'Borrador', categoriaId: 'cat-1', precio: 100, costo: 50, seguimientoInventario: true, stock: 45, descripcion: '', imagenes: '' },
      { id: 'prod-2', codigo: 'PROD-002', nombre: 'Servicio', categoriaId: 'cat-1', precio: 50, costo: 10, seguimientoInventario: false, stock: 0, descripcion: '', imagenes: '' }
    ], ventas: [], compras: [], ...copia(datos)
  };
  const llamadas = [], notificaciones = [], fallos = { stock: 0, createPerdido: '', get: '', post: '' };
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)
  };
  let confirmaciones = 0;
  const context = vm.createContext({
    document, localStorage, console, crypto: webcrypto,
    Event: class { constructor(type) { this.type = type; } },
    Option: function(text, value) { const option = new Elemento('option'); option.textContent = text; option.value = value; return option; },
    window: { confirm() { confirmaciones++; return confirm; } },
    setTimeout: () => 1, clearTimeout() {},
    apiGet: async resource => {
      llamadas.push({ method: 'GET', resource });
      if (fallos.get === resource) throw new Error('Fallo GET de prueba');
      return copia(remotos[resource]);
    },
    apiPost: async (resource, action, data) => {
      llamadas.push({ method: 'POST', resource, action, data: copia(data) });
      if (fallos.post === resource) throw new Error('Fallo POST de prueba');
      if (resource === 'productos' && action === 'update' && 'stock' in data && fallos.stock > 0) { fallos.stock--; throw new Error('Stock sin confirmar'); }
      const index = remotos[resource].findIndex(r => String(r.id) === String(data.id));
      if (action === 'create') {
        if (index >= 0) throw new Error('ID duplicado');
        remotos[resource].push(copia(data));
      } else if (action === 'update') {
        if (index < 0) throw new Error('ID no existe');
        remotos[resource][index] = { ...remotos[resource][index], ...copia(data) };
      } else if (action === 'delete') remotos[resource].splice(index, 1);
      if (action === 'create' && fallos.createPerdido === resource) { fallos.createPerdido = ''; throw new Error('Respuesta perdida'); }
      return copia(action === 'update' ? remotos[resource][index] : data);
    }
  });
  const run = source => vm.runInContext(source, context);
  for (const file of ['loading', 'borrador-venta', 'productos', 'clientes', 'historial', 'pos', 'ventas-abiertas', 'gestion', 'compras', 'app']) {
    run(fs.readFileSync(path.join(raiz, `js/${file}.js`), 'utf8'));
  }
  context.mostrarNotificacion = (message, type) => notificaciones.push({ message, type });
  await document.fire('DOMContentLoaded');
  await new Promise(resolve => setImmediate(resolve));
  await run('cargarGestion("proveedores")');
  document.getElementById('select-pago').value ||= 'Efectivo';
  const id = name => document.getElementById(name);
  const state = source => copia(run(source));
  const cart = (quantity = 2) => run(`factura = [{ ...productos[0], cantidad: ${quantity} }]; renderizarFactura();`);
  const draft = () => JSON.parse(storage.get(run('CLAVE_BORRADOR_VENTA')) || 'null');
  return { run, state, id, cart, draft, remotos, llamadas, storage, fallos, notificaciones, document, confirmaciones: () => confirmaciones };
}

test('A: proveedor contextual reutiliza CRUD y conserva compra de varias líneas', async () => {
  const e = await entorno();
  e.run('lineasCompra = [{ productoId: "prod-1", nombre: "Borrador", cantidad: 2, costo: 50 }, { productoId: "prod-2", nombre: "Servicio", cantidad: 1, costo: 10 }];');
  await e.id('btn-nuevo-proveedor-compra').click();
  assert.equal(e.id('nuevo-proveedor-modal').classList.contains('hidden'), false);
  e.id('nuevo-proveedor-nombre').value = 'Nuevo proveedor';
  e.id('nuevo-proveedor-telefono').value = '555';
  await e.id('nuevo-proveedor-form').fire('submit');
  const nuevo = e.remotos.proveedores.at(-1);
  assert.match(nuevo.id, /^[0-9a-f-]{36}$/);
  assert.equal(e.id('compra-proveedor').value, nuevo.id);
  assert.equal(e.id('nuevo-proveedor-modal').classList.contains('hidden'), true);
  assert.equal(e.state('lineasCompra').length, 2);
  assert.equal(e.state('gestiones.proveedores.registros').length, 2);
});

test('B: producto contextual reutiliza modal, selecciona producto y conserva compra', async () => {
  const e = await entorno(); e.run('lineasCompra = [{ productoId: "prod-1", nombre: "Borrador", cantidad: 2, costo: 50 }];');
  await e.id('btn-nuevo-producto-compra').click();
  e.id('product-name').value = 'Cuaderno'; e.id('product-category').value = 'cat-1';
  e.id('product-price').value = '1000'; e.id('product-cost').value = '500';
  e.id('track-inventory').checked = true; e.id('product-stock').value = '8';
  await e.id('product-form').fire('submit');
  const nuevo = e.remotos.productos.at(-1);
  assert.equal(nuevo.nombre, 'Cuaderno'); assert.equal(nuevo.stock, 8);
  assert.equal(e.id('compra-producto').value, nuevo.id);
  assert.equal(e.id('compra-costo').value, 500);
  assert.equal(e.id('product-modal').classList.contains('hidden'), true);
  assert.equal(e.state('lineasCompra').length, 1);
});

test('C: recarga reconstruye varios productos remotos, pago y cliente sin almacenar catálogo', async () => {
  const e = await entorno(); e.run('factura = productos.map(p => ({ ...p, cantidad: 2 })); renderizarFactura();');
  e.id('select-cliente').value = 'cli-1'; await e.id('select-cliente').fire('change');
  e.id('monto-recibido').value = '1000'; await e.id('monto-recibido').fire('input');
  assert.deepEqual(Object.keys(e.draft().items[0]), ['productoId', 'cantidad']);
  const productos = copia(e.remotos.productos); productos[0].precio = 200;
  const restored = await entorno({ storage: e.storage, datos: { productos } });
  assert.equal(restored.confirmaciones(), 1);
  assert.equal(restored.state('factura').length, 2);
  assert.equal(restored.state('factura')[0].precio, 200);
  assert.equal(restored.id('select-cliente').value, 'cli-1');
  assert.equal(Number(restored.id('monto-recibido').value), 1000);
});

test('recuperación ajusta stock, omite productos eliminados y limpia cliente inexistente', async () => {
  const e = await entorno(); e.run('factura = productos.map(p => ({ ...p, cantidad: 4 })); renderizarFactura();');
  e.id('select-cliente').value = 'cli-1'; await e.id('select-cliente').fire('change');
  const producto = { ...e.remotos.productos[0], stock: 1 };
  const restored = await entorno({ storage: e.storage, datos: { productos: [producto], clientes: [] } });
  assert.equal(restored.state('factura').length, 1); assert.equal(restored.state('factura')[0].cantidad, 1);
  assert.equal(restored.id('select-cliente').value, ''); assert(restored.notificaciones.some(n => n.message.includes('stock')));
});

test('D: venta cerrada conserva inventario y elimina borrador antes de recargar', async () => {
  const e = await entorno(); e.cart(); e.id('monto-recibido').value = '1000'; await e.id('monto-recibido').fire('input');
  await e.id('btn-finalizar').click();
  assert.equal(e.remotos.ventas.length, 1); assert.equal(e.remotos.ventas[0].estado, 'cerrada');
  assert.equal(e.remotos.ventas[0].total, 238); assert.equal(e.remotos.productos[0].stock, 43);
  assert.equal(e.draft(), null); assert.equal(e.storage.size, 0);
  const restored = await entorno({ storage: e.storage }); assert.equal(restored.confirmaciones(), 0);
});

test('E: guardar abierta no descuenta stock ni deja borrador adicional', async () => {
  const e = await entorno(); e.cart(); await e.id('btn-guardar-abierta').click();
  assert.equal(e.remotos.ventas[0].estado, 'abierta'); assert.equal(e.remotos.productos[0].stock, 45);
  assert.equal(e.draft(), null); assert.equal(e.storage.size, 0);
  const restored = await entorno({ storage: e.storage, datos: { ventas: e.remotos.ventas } }); assert.equal(restored.confirmaciones(), 0);
  await e.run(`retomarVentaAbierta(${JSON.stringify(e.remotos.ventas[0].id)})`);
  const id = e.remotos.ventas[0].id; e.id('monto-recibido').value = '1000';
  await e.id('btn-finalizar').click();
  assert.equal(e.remotos.ventas.length, 1); assert.equal(e.remotos.ventas[0].id, id);
  assert.equal(e.remotos.ventas[0].estado, 'cerrada'); assert.equal(e.remotos.productos[0].stock, 43);
  assert(e.llamadas.some(l => l.resource === 'ventas' && l.action === 'update'));
});

test('compra multi-producto suma stock solo al controlado y actualiza ambos costos', async () => {
  const e = await entorno(); e.id('compra-proveedor').value = 'prv-1';
  for (const [producto, cantidad, costo] of [['prod-1', 2, 60], ['prod-2', 3, 20]]) {
    e.id('compra-producto').value = producto; e.id('compra-cantidad').value = String(cantidad); e.id('compra-costo').value = String(costo);
    await e.id('btn-agregar-compra').click();
  }
  assert.equal(e.state('lineasCompra').length, 2);
  await e.id('compra-form').fire('submit');
  assert.equal(e.remotos.compras.length, 1); assert.equal(e.remotos.compras[0].total, 180);
  assert.equal(e.remotos.compras[0].itemsJson.length, 2);
  assert.equal(e.remotos.productos[0].stock, 47); assert.equal(e.remotos.productos[0].costo, 60);
  assert.equal(e.remotos.productos[1].stock, 0); assert.equal(e.remotos.productos[1].costo, 20);
});

test('fallo de stock conserva UUID/objetivos/borrador y el reintento no duplica venta', async () => {
  const e = await entorno(); e.cart(); e.id('monto-recibido').value = '1000'; await e.id('monto-recibido').fire('input');
  e.fallos.stock = 1; await e.id('btn-finalizar').click();
  assert.equal(e.remotos.ventas.length, 1); assert(e.draft()); assert.equal(e.id('btn-finalizar').disabled, false);
  const pendiente = e.state('ventaPendiente'); assert.equal(pendiente.stocksObjetivo[0].stock, 43);
  const restored = await entorno({ storage: new Map(e.storage) });
  assert.equal(restored.confirmaciones(), 0); assert.equal(restored.state('factura').length, 0);
  assert(restored.notificaciones.some(n => n.message.includes('historial')));
  await e.id('btn-finalizar').click();
  assert.equal(e.remotos.ventas.length, 1); assert.equal(e.remotos.ventas[0].id, pendiente.venta.id);
  assert.equal(e.remotos.productos[0].stock, 43); assert.equal(e.draft(), null);
});

test('respuesta CREATE perdida no duplica venta ni recalcula inventario', async () => {
  const e = await entorno(); e.cart(); e.id('monto-recibido').value = '1000'; e.fallos.createPerdido = 'ventas';
  await e.id('btn-finalizar').click(); assert.equal(e.remotos.ventas.length, 1); assert.equal(e.remotos.productos[0].stock, 43);
  assert.equal(e.llamadas.filter(l => l.resource === 'ventas' && l.action === 'create').length, 1);
});

test('compra con inventario pendiente reintenta mismos objetivos sin duplicar registro', async () => {
  const e = await entorno(); e.id('compra-proveedor').value = 'prv-1';
  e.run('lineasCompra = [{ productoId: "prod-1", nombre: "Borrador", cantidad: 2, costo: 60 }];');
  e.fallos.stock = 1; await e.id('compra-form').fire('submit');
  assert.equal(e.state('compraPendiente').objetivos[0].stock, 47);
  await e.id('compra-form').fire('submit');
  assert.equal(e.remotos.compras.length, 1); assert.equal(e.remotos.productos[0].stock, 47);
});

test('CRUD proveedor normal y protección de relaciones siguen funcionando', async () => {
  const e = await entorno(); e.id('proveedores-nombre').value = 'Otro';
  await e.id('proveedores-form').fire('submit'); const nuevo = e.remotos.proveedores.at(-1);
  e.id('proveedores-id').value = nuevo.id; e.id('proveedores-nombre').value = 'Editado';
  await e.id('proveedores-form').fire('submit'); assert.equal(e.remotos.proveedores.at(-1).nombre, 'Editado');
  e.remotos.compras.push({ id: 'cmp-1', proveedorId: nuevo.id });
  await e.run(`eliminarGestion('proveedores', ${JSON.stringify(nuevo)})`); assert.equal(e.remotos.proveedores.length, 2);
  e.remotos.compras = []; await e.run(`eliminarGestion('proveedores', ${JSON.stringify(nuevo)})`); assert.equal(e.remotos.proveedores.length, 1);
});

test('CRUD producto normal y edición POS conservan campos de inventario', async () => {
  const e = await entorno(); await e.id('btn-new-product').click();
  e.id('product-name').value = 'Nuevo'; e.id('product-category').value = 'cat-1'; e.id('product-price').value = '100'; e.id('product-cost').value = '50';
  await e.id('product-form').fire('submit'); assert.equal(e.remotos.productos.length, 3);
  const nuevo = e.remotos.productos.at(-1);
  e.run(`openProductModal(${JSON.stringify(nuevo.id)}, productos)`); e.id('product-name').value = 'Editado';
  await e.id('product-form').fire('submit'); assert.equal(e.remotos.productos.at(-1).nombre, 'Editado');
  e.run('openProductModal("prod-1", productos, true)'); e.id('product-price').value = '150'; e.id('product-stock').value = '999';
  await e.id('product-form').fire('submit');
  assert.equal(e.remotos.productos[0].precio, 150); assert.equal(e.remotos.productos[0].stock, 45);
  e.run(`confirmarEliminacion(${JSON.stringify(nuevo.id)}, productos)`); await e.id('confirm-delete-btn').click(); assert.equal(e.remotos.productos.length, 2);
});

test('rechazo y Vaciar eliminan borrador; guardado abierto fallido lo conserva', async () => {
  const e = await entorno(); e.cart();
  const rechazado = await entorno({ storage: new Map(e.storage), confirm: false }); assert.equal(rechazado.draft(), null);
  e.fallos.post = 'ventas'; await e.id('btn-guardar-abierta').click(); assert(e.draft());
  const limpio = await entorno(); limpio.cart(); await limpio.id('btn-vaciar').click(); assert.equal(limpio.draft(), null);
});

test('fallos de GET retiran skeletons y liberan contador sin duplicar consultas', async () => {
  const e = await entorno(); e.fallos.get = 'proveedores'; const antes = e.llamadas.length;
  await e.run('cargarGestion("proveedores")');
  assert.equal(e.llamadas.length, antes + 1); assert.equal(e.run('cargasActivas.size'), 0);
  assert.equal(e.id('proveedores-body').querySelectorAll('.skeleton-table').length, 0);
  assert(e.id('proveedores-body').children.every(n => !n.hidden));
});

test('las referencias visuales no alteran IDs y permanecen estables', async () => {
  const e = await entorno(); const id = '5bd20355-dc69-4e80-944d-3697d4b30ad7';
  const label = e.run(`referenciaVisible(${JSON.stringify(id)}, 'CAT')`);
  assert.match(label, /^CAT-[A-Z0-9]{7}$/); assert.equal(label, e.run(`referenciaVisible(${JSON.stringify(id)}, 'CAT')`));
  assert.equal(e.run('referenciaVisible("cat-1", "CAT")'), 'CAT-1');
});

test('proveedor contextual con respuesta perdida confirma UUID sin duplicar', async () => {
  const e = await entorno(); e.run('lineasCompra = [{ productoId: "prod-1", nombre: "Borrador", cantidad: 2, costo: 50 }];');
  await e.id('btn-nuevo-proveedor-compra').click(); e.id('nuevo-proveedor-nombre').value = 'Respuesta perdida';
  e.fallos.createPerdido = 'proveedores'; await e.id('nuevo-proveedor-form').fire('submit');
  assert.equal(e.remotos.proveedores.length, 2);
  assert.equal(e.id('compra-proveedor').value, e.remotos.proveedores.at(-1).id);
  assert.equal(e.state('lineasCompra').length, 1);
});

test('fallos contextuales mantienen formularios/compra y liberan botones', async () => {
  const e = await entorno(); e.run('lineasCompra = [{ productoId: "prod-1", nombre: "Borrador", cantidad: 2, costo: 50 }];');
  await e.id('btn-nuevo-proveedor-compra').click(); e.id('nuevo-proveedor-nombre').value = 'Falla'; e.fallos.post = 'proveedores';
  await e.id('nuevo-proveedor-form').fire('submit');
  assert.equal(e.id('nuevo-proveedor-modal').classList.contains('hidden'), false);
  assert.equal(e.id('btn-cancelar-nuevo-proveedor').disabled, false);
  assert.equal(e.state('gestiones.proveedores.guardando'), false);
  await e.id('btn-cancelar-nuevo-proveedor').click();
  await e.id('btn-nuevo-producto-compra').click(); e.id('product-name').value = 'Falla'; e.id('product-category').value = 'cat-1';
  e.id('product-price').value = '100'; e.id('product-cost').value = '50'; e.fallos.post = 'productos';
  await e.id('product-form').fire('submit');
  assert.equal(e.id('product-modal').classList.contains('hidden'), false);
  assert.equal(e.state('productosGuardando'), false);
  assert.equal(e.state('lineasCompra').length, 1);
});

test('borrador corrupto o localStorage bloqueado no impiden operar', async () => {
  const corrupto = new Map([['papel-luna:venta-borrador:v1', '{invalido']]);
  const e = await entorno({ storage: corrupto }); assert.equal(e.draft(), null); assert.equal(e.confirmaciones(), 0);
  const bloqueado = { get() { throw new Error('Bloqueado'); }, set() { throw new Error('Bloqueado'); }, delete() { throw new Error('Bloqueado'); } };
  const b = await entorno({ storage: bloqueado }); b.cart(); assert.equal(b.state('factura').length, 1);
  assert.equal(b.notificaciones.filter(n => n.message.includes('borrador local')).length, 1);
});

test('Debe recuperado sin cliente continúa exigiendo cliente antes de guardar', async () => {
  const e = await entorno(); e.cart(); e.id('select-pago').value = 'Debe'; await e.id('select-pago').fire('change');
  const r = await entorno({ storage: e.storage }); await r.id('btn-finalizar').click(); await r.id('btn-guardar-abierta').click();
  assert.equal(r.remotos.ventas.length, 0); assert(r.draft());
  assert(r.notificaciones.some(n => n.message.includes('seleccionar un cliente')));
});

test('factura conserva importes y usa referencia visual sin UUID en impresión', async () => {
  const e = await entorno(); e.run('window.open = () => ({ document: { write: texto => globalThis.ticketPrueba = texto, close() {} }, focus() {} });');
  const id = 'c3515395-351b-413f-89a7-a4d5e8588bbe';
  e.run(`imprimirFactura(${JSON.stringify({ id, itemsJson: JSON.stringify([{ nombre: 'Borrador', precio: 100, cantidad: 2 }]), subtotal: 200, total: 238, valorRecibido: 1000, cambio: 762, metodoPago: 'Efectivo' })})`);
  const ticket = e.run('ticketPrueba'); assert(ticket.includes('VTA-')); assert(!ticket.includes(id)); assert(ticket.includes('$238'));
});
