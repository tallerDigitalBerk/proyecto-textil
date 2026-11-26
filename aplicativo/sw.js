// Service worker: guarda los archivos de la app en el celular para usarla sin internet.
// Las medidas y trabajos NO se guardan aquí (van en LocalStorage), así que
// actualizar la app nunca borra los datos de la persona.

// ⚠️ Cambiar VERSION cada vez que se publique un cambio (así el celular se actualiza)
const VERSION = 'mi-taller-v70';

const ARCHIVOS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/base.css',
  'css/componentes.css',
  'css/costos.css',
  'css/decoracion.css',
  'css/pantallas.css',
  'css/impresion.css',
  'css/marco.css',
  'fuentes/dancing-script.woff2',
  'fuentes/fraunces.woff2',
  'fuentes/nunito.woff2',
  'js/app.js',
  'js/calculos/costos.js',
  'js/calculos/cotizacion.js',
  'js/calculos/tela.js',
  'js/calculos/unidades.js',
  'js/calculos/validacion.js',
  'js/datos/almacenamiento.js',
  'js/datos/cotizaciones.js',
  'js/datos/diccionario.js',
  'js/datos/ejercicios.js',
  'js/datos/figurin.js',
  'js/datos/personas.js',
  'js/datos/medidas.js',
  'js/datos/prendas.js',
  'js/datos/referencias.js',
  'js/datos/tallas.js',
  'js/datos/tiempos.js',
  'js/moldes/dibujo-svg.js',
  'js/moldes/geometria.js',
  'js/moldes/impresion.js',
  'js/moldes/registro.js',
  'js/vendor/pdf.js',
  'js/vendor/pdf-LICENSE.txt',
  'js/moldes/prendas/blusa.js',
  'js/moldes/prendas/buzo-dama.js',
  'js/moldes/prendas/buzo-varon.js',
  'js/moldes/prendas/camisa-comun.js',
  'js/moldes/prendas/camisa-dama.js',
  'js/moldes/prendas/camisa-varon.js',
  'js/moldes/prendas/falda-recta.js',
  'js/moldes/prendas/falda-uniforme.js',
  'js/moldes/prendas/pantalon-comun.js',
  'js/moldes/prendas/pantalon-dama.js',
  'js/moldes/prendas/pantalon-varon.js',
  'js/moldes/prendas/polera-comun.js',
  'js/moldes/prendas/polera-dama.js',
  'js/moldes/prendas/polera-varon.js',
  'js/moldes/prendas/vestido.js',
  'js/pantallas/ayuda.js',
  'js/pantallas/bienvenida.js',
  'js/pantallas/costos.js',
  'js/pantallas/cronometro.js',
  'js/pantallas/cotizaciones.js',
  'js/pantallas/diccionario.js',
  'js/pantallas/ejercicios.js',
  'js/pantallas/elegir-prenda.js',
  'js/pantallas/entrada.js',
  'js/pantallas/guardadas.js',
  'js/pantallas/herramientas.js',
  'js/pantallas/inicio.js',
  'js/pantallas/lista-corte.js',
  'js/pantallas/medidas.js',
  'js/pantallas/molde.js',
  'js/pantallas/tela.js',
  'js/utilidades/avatares.js',
  'js/utilidades/ayuda-precio.js',
  'js/utilidades/compat.js',
  'js/utilidades/compartir.js',
  'js/utilidades/formato.js',
  'js/utilidades/iconos.js',
  'js/utilidades/marco.js',
  'js/utilidades/opinion.js',
  'js/utilidades/pwa.js',
  'js/utilidades/ui.js',
  'js/utilidades/voz.js',
  'img/figurin.webp',
  'img/logo-cea.webp',
  'img/marca.webp',
  'img/qr-mi-taller.svg',
  'img/fotos/blusa.webp',
  'img/fotos/buzo-dama.png',
  'img/fotos/buzo-varon.png',
  'img/fotos/camisa.webp',
  'img/fotos/camisa-dama.webp',
  'img/fotos/camisa-varon.webp',
  'img/fotos/falda-recta.webp',
  'img/fotos/falda-uniforme.webp',
  'img/fotos/pantalon-dama.webp',
  'img/fotos/pantalon-varon.webp',
  'img/fotos/polera-dama.webp',
  'img/fotos/polera-varon.webp',
  'img/fotos/vestido.webp',
  'img/iconos/icono-180.png',
  'img/iconos/icono-192.png',
  'img/iconos/icono-512.png',
  'img/iconos/icono-maskable-512.png',
  'img/iconos/icono.svg',
  'img/iconos/icono-maskable.svg',
  'img/prendas/blusa.svg',
  'img/prendas/buzo-dama.svg',
  'img/prendas/buzo-varon.svg',
  'img/prendas/camisa-dama.svg',
  'img/prendas/camisa-varon.svg',
  'img/prendas/falda-recta.svg',
  'img/prendas/falda-uniforme.svg',
  'img/prendas/pantalon-dama.svg',
  'img/prendas/pantalon-varon.svg',
  'img/prendas/polera-dama.svg',
  'img/prendas/polera-varon.svg',
  'img/prendas/vestido.svg',
];

// 1. Primera visita con internet: descarga y guarda todo
self.addEventListener('install', (e) => {
  const archivos = ARCHIVOS.map((ruta) => new Request(ruta, { cache: 'reload' }));
  e.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(archivos)).then(() => self.skipWaiting()));
});

// 2. Al activar una versión nueva, borra solo las versiones viejas de la app
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n.startsWith('mi-taller-') && n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// 3. Cada archivo se busca primero en el celular; si no está, en internet
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  // Las páginas de prueba no se guardan: así siempre se ve la última versión
  if (url.pathname.includes('/pruebas/')) return;
  e.respondWith(
    caches.match(request, { cacheName: VERSION, ignoreSearch: true }).then((guardado) => guardado ?? fetch(request).then((respuesta) => {
      if (respuesta.ok) {
        const copia = respuesta.clone();
        caches.open(VERSION).then((cache) => cache.put(request, copia));
      }
      return respuesta;
    }).catch(() => (request.mode === 'navigate' ? caches.match('index.html', { cacheName: VERSION }) : Response.error()))),
  );
});

// 4. Activar la descarga completa cuando lo solicite la página.
self.addEventListener('message', (e) => {
  if (e.data === 'actualizar') e.waitUntil(self.skipWaiting());
});
