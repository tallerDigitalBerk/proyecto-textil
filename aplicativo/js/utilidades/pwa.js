// App instalable y sin internet: aplica versiones nuevas automáticamente,
// muestra "Sin internet" y ofrece el botón "Instalar".
let pedidoInstalar = null;
let aviso = () => {};

// Botón de instalar: Android/Chrome lo permite; en iPhone se explica cómo
// (el iPad desde iPadOS 13 dice ser "Macintosh": se reconoce porque tiene pantalla táctil)
export const esIphone = /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (/macintosh/i.test(navigator.userAgent) && (navigator.maxTouchPoints > 1 || 'ontouchend' in document));
export const instalada = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const puedeInstalar = () => !instalada() && (pedidoInstalar !== null || esIphone);
export const alCambiarInstalar = (fn) => { aviso = fn; };

export async function instalar() {
  if (!pedidoInstalar) return false;
  pedidoInstalar.prompt();
  await pedidoInstalar.userChoice;
  pedidoInstalar = null;
  aviso();
  return true;
}

export function mostrarBarra(texto, boton, accion) {
  document.querySelector('.barra-aviso')?.remove();
  const barra = document.createElement('div');
  barra.className = 'barra-aviso';
  barra.setAttribute('role', 'status');
  barra.innerHTML = `<span>${texto}</span>${boton ? `<button type="button" class="btn btn-principal">${boton}</button>` : ''}
    <button type="button" class="cerrar-aviso" aria-label="Cerrar aviso de actualización">✕</button>`;
  barra.querySelector('.btn')?.addEventListener('click', accion);
  barra.querySelector('.cerrar-aviso').addEventListener('click', () => barra.remove());
  document.body.append(barra);
}

export function iniciarPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    pedidoInstalar = e;
    aviso();
  });
  window.addEventListener('appinstalled', () => aviso());

  // Aviso de "Sin internet" (la app sigue funcionando)
  const conexion = () => document.body.classList.toggle('sin-internet', !navigator.onLine);
  window.addEventListener('online', conexion);
  window.addEventListener('offline', conexion);
  conexion();

  if (!('serviceWorker' in navigator)) return;
  // En la vista local los archivos deben reflejar los cambios al recargar.
  if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    navigator.serviceWorker.getRegistrations().then((registros) => registros.forEach((registro) => registro.unregister()));
    return;
  }
  const workers = navigator.serviceWorker;
  let versionEnPantalla = workers.controller;
  let versionOfrecida = null;
  let recargando = false;
  let editando = false;
  let recargaPendiente = false;
  const recargar = () => {
    if (editando) { recargaPendiente = true; return; }
    if (recargando) return;
    recargando = true;
    location.reload();
  };
  // Si la descarga termina mientras se escriben medidas, esperar al cambio de pantalla.
  document.addEventListener('input', () => { editando = true; });
  window.addEventListener('hashchange', () => {
    editando = false;
    if (recargaPendiente) recargar();
  });

  const ofrecerVersion = (nueva) => {
    if (!nueva || !versionEnPantalla || nueva === versionOfrecida) return;
    versionOfrecida = nueva;
    if (workers.controller === nueva) recargar();
    else nueva.postMessage('actualizar');
  };

  workers.addEventListener('controllerchange', () => {
    const actual = workers.controller;
    if (!actual || actual === versionEnPantalla) return;
    if (!versionEnPantalla) { versionEnPantalla = actual; return; } // Primera visita.
    recargar();
  });

  workers.register('sw.js', { updateViaCache: 'none' }).then((registro) => {
    const observarDescarga = () => {
      const nueva = registro.installing;
      if (!nueva) return;
      nueva.addEventListener('statechange', () => {
        if (nueva.state === 'installed') ofrecerVersion(nueva);
      });
    };
    registro.addEventListener('updatefound', observarDescarga);
    observarDescarga();
    ofrecerVersion(registro.waiting);

    const comprobar = () => {
      if (navigator.onLine && registro.active && !registro.installing) registro.update().catch(() => {});
    };
    comprobar();
    window.addEventListener('online', comprobar);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) comprobar(); });
  }).catch(() => { /* sin service worker la app igual funciona con internet */ });
}
