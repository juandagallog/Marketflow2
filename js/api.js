const API_URL = "https://script.google.com/macros/s/AKfycbwBBWc-iJXxHumfukoUJDBzIphcGs4MRAtuuv0ugmdN16CpDR7dow0I3pPDVWpY5zEW8Q/exec";


async function fetchConTimeout(url, opciones = {}, timeoutMs = 8000) {
  const controller = new AbortController();

  const temporizador = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const respuesta = await fetch(url, {
      ...opciones,
      signal: controller.signal
    });

    // El timeout sigue activo mientras leemos el cuerpo
    const texto = await respuesta.text();

    return { respuesta, texto };

  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("La API tardó demasiado en responder");
    }

    throw error;

  } finally {
    clearTimeout(temporizador);
  }
}


async function apiGet(resource) {
  let ultimoError;

  for (let intento = 1; intento <= 3; intento++) {
    try {
      const url =
        `${API_URL}?resource=${encodeURIComponent(resource)}&_=${Date.now()}`;

      const { respuesta, texto } = await fetchConTimeout(
        url,
        {
          method: "GET",
          cache: "no-store"
        },
        20000
      );

      if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);

      let json;

      try {
        json = JSON.parse(texto);
      } catch {
        throw new Error("Google devolvió HTML en vez de JSON");
      }

      if (!json.success) {
        throw new Error(json.message);
      }

      return json.data;

    } catch (error) {
      ultimoError = error;

      if (intento < 3) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }
  }

  throw ultimoError;
}


async function apiPost(resource, action, data) {
  const maxIntentos = action === "update" ? 2 : 1;
  let ultimoError;

  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      const url =
        `${API_URL}?resource=${encodeURIComponent(resource)}&_=${Date.now()}`;

      const { respuesta, texto } = await fetchConTimeout(
        url,
        {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify({
            action,
            data
          })
        },
        20000
      );

      if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);

      let json;

      try {
        json = JSON.parse(texto);
      } catch {
        throw new Error("Google devolvió HTML en vez de JSON");
      }

      if (!json.success) {
        throw new Error(json.message);
      }

      return json.data;

    } catch (error) {
      ultimoError = error;

      if (intento < maxIntentos) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }
  }

  throw ultimoError;
}
