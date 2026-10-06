// Un indicador para todas las llamadas, incluidos reintentos y operaciones concurrentes.
const cargasActivas = new Map();
function iniciarCarga(texto) {
  const token = Symbol();
  cargasActivas.set(token, texto);
  pintarCarga();
  return token;
}
function finalizarCarga(token) {
  cargasActivas.delete(token);
  pintarCarga();
}
function pintarCarga() {
  const panel = document.getElementById('loading-global');
  const escrituras = [...cargasActivas.values()].filter(Boolean);
  panel.classList.toggle('hidden', escrituras.length === 0);
  document.getElementById('loading-texto').textContent = escrituras.at(-1) || '';
  panel.setAttribute('aria-busy', String(cargasActivas.size > 0));
}
// Mantener intacto api.js: envolver sus funciones sin alterar contrato ni reintentos.
const apiGetSinIndicador = apiGet;
apiGet = async function(resource) {
  const token = iniciarCarga(null);
  try { return await apiGetSinIndicador(resource); }
  finally { finalizarCarga(token); }
};
const apiPostSinIndicador = apiPost;
apiPost = async function(resource, action, data) {
  const texto = resource === 'compras' && action === 'create' ? 'Registrando compra...' :
    resource === 'ventas' ? 'Guardando venta...' : `Actualizando ${resource}...`;
  const token = iniciarCarga(texto);
  try { return await apiPostSinIndicador(resource, action, data); }
  finally { finalizarCarga(token); }
};

// Referencia visual estable; nunca se usa para relaciones ni peticiones.
function referenciaVisible(id, prefijo) {
  const texto = String(id);
  if (/^[a-z]+-\d+$/i.test(texto)) return texto.toUpperCase();
  let hash = 2166136261;
  for (const caracter of texto) hash = Math.imul(hash ^ caracter.charCodeAt(0), 16777619);
  return `${prefijo}-${(hash >>> 0).toString(36).toUpperCase().padStart(7, '0')}`;
}

// La presentación de lectura no modifica ni repite peticiones.
function mostrarSkeleton(contenedor, tipo = 'filas', columnas = 1) {
  const anteriores = [...contenedor.children];
  const visibilidad = anteriores.map(nodo => nodo.hidden);
  anteriores.forEach(nodo => nodo.hidden = true);
  const skeleton = document.createElement(tipo === 'tabla' ? 'tr' : 'span');
  skeleton.className = 'skeleton-group';
  if (tipo === 'tabla') skeleton.className = 'skeleton-table';
  if (tipo === 'catalogo') skeleton.classList.add('skeleton-catalogo');
  skeleton.setAttribute('role', 'status');
  skeleton.setAttribute('aria-label', 'Cargando contenido');
  let contenido = skeleton;
  if (tipo === 'tabla') {
    contenido = document.createElement('td');
    contenido.colSpan = columnas;
    skeleton.appendChild(contenido);
  }
  for (let i = 0; i < 3; i++) {
    const fila = document.createElement('span');
    const tarjeta = tipo === 'tarjetas' || tipo === 'catalogo';
    fila.className = tarjeta ? 'historial-card skeleton-card' : tipo === 'catalogo-lista' ? 'skeleton-producto-lista' : 'skeleton-table-row';
    for (let j = 0; j < (tipo === 'tabla' ? columnas : tarjeta || tipo === 'catalogo-lista' ? 3 : 1); j++) {
      const linea = document.createElement('span');
      linea.className = 'skeleton-row';
      fila.appendChild(linea);
    }
    contenido.appendChild(fila);
  }
  contenedor.appendChild(skeleton);
  return () => {
    skeleton.remove();
    anteriores.forEach((nodo, i) => nodo.hidden = visibilidad[i]);
  };
}
