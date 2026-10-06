// =====================================================================

// API de Google Sheets para el POS - MVP 2

// Una hoja por recurso. Contrato:

// GET ?resource=productos -> lista los registros

// POST ?resource=ventas { action, data } -> create | update | delete

// Toda respuesta tiene la forma { success, data } o { success, message }

// =====================================================================


// Hojas que el frontend puede leer y modificar (nombres EXACTOS de las pestañas)

const RECURSOS_PERMITIDOS = [

"productos", "ventas", "compras", "clientes", "proveedores", "categorias"

];


// ------------------------------ Puntos de entrada ------------------------------


function doGet(e) {

try {

const resource = validarResource(e);

return responder({ success: true, data: leerHoja(resource) });

} catch (error) {

return responder({ success: false, message: error.message });

}

}


function doPost(e) {

const lock = LockService.getScriptLock();

let bloqueado = false;

try {

const resource = validarResource(e);

const body = JSON.parse(e.postData.contents);

if (!body.action || !body.data) {

throw new Error(

'El cuerpo debe ser { "action": "create|update|delete", "data": {...} }'

);

}


lock.waitLock(10000); // evita que dos escrituras simultáneas se pisen

bloqueado = true;


switch (body.action) {

case "create":

return responder({ success: true,

data: crearRegistro(resource, body.data) });

case "update":

return responder({ success: true,

data: actualizarRegistro(resource, body.data) });

case "delete":

return responder({ success: true,

data: eliminarRegistro(resource, body.data) });

default:

throw new Error("Acción no soportada: " + body.action);

}

} catch (error) {

return responder({ success: false, message: error.message });

} finally {

if (bloqueado) lock.releaseLock();

}

}


// ------------------------------ Lectura ------------------------------


function leerHoja(nombre) {

const hoja = obtenerHoja(nombre);

const valores = hoja.getDataRange().getValues();

const encabezados = valores[0];

const registros = [];


for (let i = 1; i < valores.length; i++) {

const fila = valores[i];

if (fila.every(function (celda) { return celda === ""; })) continue; // fila vacía


const registro = {};

encabezados.forEach(function (clave, j) {

const valor = fila[j];

registro[clave] = valor instanceof Date ? valor.toISOString() : valor;

});

registros.push(registro);

}

return registros;

}


// ------------------------------ Creación ------------------------------


function crearRegistro(nombre, datos) {

const hoja = obtenerHoja(nombre);

const encabezados = leerEncabezados(hoja);


if (datos.id === undefined || datos.id === null || datos.id === "") {

throw new Error("El registro debe incluir un id (se genera en el frontend)");

}

if (encontrarFila(hoja, datos.id) !== -1) {

throw new Error("Ya existe un registro con id " + datos.id);

}


// Un valor por cada encabezado, en el mismo orden que las columnas de la hoja

const fila = encabezados.map(function (clave) {

const valor = datos[clave];

if (valor === undefined || valor === null) return "";

// arreglos y objetos -> texto JSON

if (typeof valor === "object") return JSON.stringify(valor);

return valor;

});


const numeroFila = hoja.getLastRow() + 1;

const rango = hoja.getRange(numeroFila, 1, 1, encabezados.length);


// Los textos se guardan como "texto sin formato" para que Sheets no los convierta

// (fechas, ids con ceros a la izquierda, teléfonos con "+", etc.)

fila.forEach(function (valor, i) {

if (typeof valor === "string") rango.getCell(1, i + 1).setNumberFormat("@");

});

rango.setValues([fila]);


return datos;

}


function actualizarRegistro(nombre, datos) {
  const hoja = obtenerHoja(nombre);
  const encabezados = leerEncabezados(hoja);

  if (datos.id === undefined || datos.id === null || datos.id === "") {
    throw new Error("El registro debe incluir un id para actualizar");
  }

  const numeroFila = encontrarFila(hoja, datos.id);

  if (numeroFila === -1) {
    throw new Error("No existe un registro con id " + datos.id);
  }

  const filaActual = hoja
    .getRange(numeroFila, 1, 1, encabezados.length)
    .getValues()[0];

  const registroActualizado = {};

  const filaActualizada = encabezados.map(function (clave, i) {
    let valor;

    if (Object.prototype.hasOwnProperty.call(datos, clave)) {
      valor = datos[clave];

      if (valor === undefined || valor === null) {
        valor = "";
      }

      registroActualizado[clave] = valor;

      if (typeof valor === "object") {
        return JSON.stringify(valor);
      }

      return valor;
    }

    valor = filaActual[i];

    registroActualizado[clave] =
      valor instanceof Date ? valor.toISOString() : valor;

    return valor;
  });

  const rango = hoja.getRange(
    numeroFila,
    1,
    1,
    encabezados.length
  );

  filaActualizada.forEach(function (valor, i) {
    if (typeof valor === "string") {
      rango.getCell(1, i + 1).setNumberFormat("@");
    }
  });

  rango.setValues([filaActualizada]);

  return registroActualizado;
}


function eliminarRegistro(nombre, datos) {
  const hoja = obtenerHoja(nombre);

  if (datos.id === undefined || datos.id === null || datos.id === "") {
    throw new Error("El registro debe incluir un id para eliminar");
  }

  const numeroFila = encontrarFila(hoja, datos.id);

  if (numeroFila === -1) {
    throw new Error("No existe un registro con id " + datos.id);
  }

  hoja.deleteRow(numeroFila);

  return { id: datos.id };
}


// ------------------------------ Utilidades ------------------------------


function validarResource(e) {

const resource = e && e.parameter ? e.parameter.resource : null;

if (!resource) throw new Error("Falta el parámetro resource");

if (RECURSOS_PERMITIDOS.indexOf(resource) === -1) {

throw new Error("Recurso no permitido: " + resource);

}

return resource;

}


function obtenerHoja(nombre) {

const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);

if (!hoja) {

throw new Error("No existe la hoja '" + nombre +

"'. Revisa que el nombre de la pestaña sea idéntico.");

}

return hoja;

}


function leerEncabezados(hoja) {

return hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];

}


// Devuelve el número de fila (1 = encabezados) del registro con ese id, o -1

function encontrarFila(hoja, id) {

const columnaId = leerEncabezados(hoja).indexOf("id");

if (columnaId === -1) {

throw new Error("La hoja '" + hoja.getName() + "' necesita una columna llamada id");

}

const ultimaFila = hoja.getLastRow();

if (ultimaFila < 2) return -1;


const ids = hoja.getRange(2, columnaId + 1, ultimaFila - 1, 1).getValues();

for (let i = 0; i < ids.length; i++) {

// +2: el arreglo empieza en 0 y la fila 1 son los encabezados

if (String(ids[i][0]) === String(id)) return i + 2;

}

return -1;

}

function responder(objeto) {

return ContentService

.createTextOutput(JSON.stringify(objeto))

.setMimeType(ContentService.MimeType.JSON);

}


// ------------------------------ Pruebas desde el editor ------------------------------

// Selecciona la función en el menú superior y pulsa "Ejecutar".

// El resultado aparece en el registro de ejecución.


function probarLectura() {

Logger.log(doGet({ parameter: { resource: "productos" } }).getContent());

}


function probarCreacion() {

const e = {

parameter: { resource: "categorias" },

postData: {

contents: JSON.stringify({

action: "create",

data: { id: "prueba-" + Date.now(), nombre: "Categoría de prueba" }

})

}

};

Logger.log(doPost(e).getContent());

}

function probarActualizacion() {
  const idPrueba = "prueba-update-" + Date.now();

  // Primero creamos un registro temporal
  let eCrear = {
    parameter: { resource: "categorias" },
    postData: {
      contents: JSON.stringify({
        action: "create",
        data: {
          id: idPrueba,
          nombre: "Categoría antes de actualizar"
        }
      })
    }
  };

  Logger.log("CREACIÓN:");
  Logger.log(doPost(eCrear).getContent());

  // Después actualizamos SOLO el nombre
  let eActualizar = {
    parameter: { resource: "categorias" },
    postData: {
      contents: JSON.stringify({
        action: "update",
        data: {
          id: idPrueba,
          nombre: "Categoría actualizada"
        }
      })
    }
  };

  Logger.log("ACTUALIZACIÓN:");
  Logger.log(doPost(eActualizar).getContent());
}


function probarEliminacion() {
  const idPrueba = "prueba-delete-" + Date.now();

  // Creamos primero algo que podamos eliminar
  let eCrear = {
    parameter: { resource: "categorias" },
    postData: {
      contents: JSON.stringify({
        action: "create",
        data: {
          id: idPrueba,
          nombre: "Categoría para eliminar"
        }
      })
    }
  };

  Logger.log("CREACIÓN:");
  Logger.log(doPost(eCrear).getContent());

  // Lo eliminamos
  let eEliminar = {
    parameter: { resource: "categorias" },
    postData: {
      contents: JSON.stringify({
        action: "delete",
        data: {
          id: idPrueba
        }
      })
    }
  };

  Logger.log("ELIMINACIÓN:");
  Logger.log(doPost(eEliminar).getContent());
}