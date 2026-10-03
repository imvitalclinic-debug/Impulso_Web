/* IMPULSO — interacciones
   1. Sellos de los rieles laterales
   2. Recuadros de "imagen pendiente"
   3. Palabra que cambia al hacer clic
   4. Escena del libro (se abre al bajar y suelta las etiquetas)
   5. Tarjetas que se arrastran en el tapete
   6. Toque sutil en cada clic
   7. Animación de entrada de las secciones */

document.documentElement.classList.add("js");
const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const esAncho = () => window.matchMedia("(min-width: 901px)").matches;
const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const suave = (t) => t * t * (3 - 2 * t); // easing

/* ---------- 1. Rieles ---------- */
// ✏️ Iconos de los sellos (trazos SVG en una caja de 24x24). Puedes agregar o quitar.
const ICONOS = [
  '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',                       // estrella
  '<path class="relleno" d="M12 2l1.8 8.2L22 12l-8.2 1.8L12 22l-1.8-8.2L2 12l8.2-1.8z"/>',                     // destello
  '<path d="M4 20V10M10 20V5M16 20v-8M22 20H2"/>',                                                          // gráfico de barras
  '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l6 6"/>',                                              // lupa
  '<path d="M3 10v4h3l7 5V5L6 10zM17 9a4 4 0 0 1 0 6M19.5 6.5a7.5 7.5 0 0 1 0 11"/>',                      // megáfono
  '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>', // bombillo
  '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle class="relleno" cx="12" cy="12" r="1.2"/>', // diana
  '<path class="relleno" d="M5 3l14 7-6 2-2 6z"/>',                                                         // cursor
  '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',                                                                 // tendencia
];

let altoSello = 64;
let vueltaRiel = altoSello * ICONOS.length;
const pistas = [...document.querySelectorAll(".riel__pista")];

function llenarRiel(pista, desfase) {
  altoSello = Math.max(pista.clientWidth - 8, 20) + 6;
  vueltaRiel = altoSello * ICONOS.length;
  const cantidad = Math.ceil((window.innerHeight + vueltaRiel) / altoSello) + 2;
  let html = "";
  for (let i = 0; i < cantidad; i++) {
    html += `<div class="sello"><svg viewBox="0 0 24 24">${ICONOS[(i + desfase) % ICONOS.length]}</svg></div>`;
  }
  pista.innerHTML = html;
}
pistas.forEach((p, i) => llenarRiel(p, i * 4));

/* ---------- 2. Imágenes pendientes ---------- */
function mostrarHueco(img) {
  if (img.dataset.hueco) return;
  img.dataset.hueco = "1";
  const div = document.createElement("div");
  div.className = "hueco";
  div.innerHTML = `<strong>${img.dataset.sugerencia}</strong><code>Guárdala como: ${img.getAttribute("src")}</code>`;
  img.replaceWith(div);
}
document.querySelectorAll("img[data-sugerencia]").forEach((img) => {
  if (img.complete && img.naturalWidth === 0) mostrarHueco(img);
  img.addEventListener("error", () => mostrarHueco(img));
});

/* ---------- 3. Palabra que cambia ---------- */
// ✏️ EDITAR: "es todo lo que ___"
const PALABRAS = ["necesitas", "buscabas", "te faltaba", "tu marca merece", "tus datos dicen"];
const boton = document.querySelector(".palabra");
let iPalabra = 0;

// ancho fijo = el de la palabra más larga, así la línea nunca se mueve
function fijarAnchoPalabra() {
  boton.style.width = "";
  let max = 0;
  PALABRAS.forEach((w) => { boton.textContent = w; max = Math.max(max, boton.offsetWidth); });
  boton.textContent = PALABRAS[iPalabra];
  boton.style.width = max + "px";
}
fijarAnchoPalabra();
document.fonts && document.fonts.ready.then(fijarAnchoPalabra);
boton.addEventListener("click", () => {
  iPalabra = (iPalabra + 1) % PALABRAS.length;
  boton.textContent = PALABRAS[iPalabra];
  boton.classList.remove("cambia");
  void boton.offsetWidth; // reinicia la animación
  boton.classList.add("cambia");
});

/* ---------- 4. Libro abierto ---------- */
const escena = document.querySelector(".escena");
const libro = document.querySelector(".libro");
const pagina = document.querySelector(".libro__pagina");
const etiquetas = [...document.querySelectorAll(".etq")];
const flotantesEscena = [...document.querySelectorAll(".escena .flota")];

// ✏️ Dónde termina cada etiqueta, dentro de la hoja de abajo:
//    x = fracción del ancho del libro, y = fracción del alto de la hoja, r = giro
const DESTINOS = [
  { x: -0.15, y: 0.42, r: -6 },
  { x: 0.13, y: 0.38, r: 5 },
  { x: -0.01, y: 0.64, r: -2 },
];

function animarEscena() {
  const vh = window.innerHeight;
  const quieto = !esAncho() || reducir;
  document.documentElement.classList.toggle("estatico", quieto);
  if (quieto) {
    etiquetas.forEach((e) => { e.style.transform = ""; e.style.opacity = ""; });
    return;
  }
  // avance: 0 cuando la hoja de abajo asoma, 1 cuando está bien a la vista
  const hoja = pagina.getBoundingClientRect();
  const b = suave(limitar((vh * 0.95 - hoja.top) / (vh * 0.75)));

  // las etiquetas nacen juntas en el centro de la hoja y se separan poco a poco
  const ancho = libro.offsetWidth;
  const centroY = hoja.height * 0.5;
  etiquetas.forEach((e, i) => {
    const d = DESTINOS[i];
    const x = d.x * ancho * b;
    const y = centroY + (d.y * hoja.height - centroY) * b;
    e.style.opacity = String(limitar(b * 3));
    e.style.transform = `translate(-50%, 0) translate(${x}px, ${y}px) rotate(${d.r * b}deg) scale(${0.85 + 0.15 * b})`;
  });

  const p = limitar(window.scrollY / (escena.offsetHeight || 1));
  flotantesEscena.forEach((el, i) => {
    el.style.transform = `translateY(${-p * (120 + i * 70)}px) rotate(${p * (i % 2 ? 12 : -12)}deg)`;
  });
}


/* ---------- 5. Tarjetas que se arrastran ---------- */
const area = document.querySelector(".tapete__area");
let capa = 10;

document.querySelectorAll(".tapete .tarjeta").forEach((t) => {
  let inicio = null;

  t.addEventListener("pointerdown", (ev) => {
    if (!esAncho() || ev.button !== 0) return;
    ev.preventDefault();
    t.setPointerCapture(ev.pointerId);
    t.style.zIndex = ++capa;
    t.classList.add("arrastrando");
    inicio = { x: ev.clientX, y: ev.clientY, left: t.offsetLeft, top: t.offsetTop };
  });

  t.addEventListener("pointermove", (ev) => {
    if (!inicio) return;
    const maxX = area.clientWidth - t.offsetWidth * 0.4;
    const maxY = area.clientHeight - t.offsetHeight * 0.4;
    const left = limitar(inicio.left + ev.clientX - inicio.x, -t.offsetWidth * 0.3, maxX);
    const top = limitar(inicio.top + ev.clientY - inicio.y, -t.offsetHeight * 0.3, maxY);
    // se guarda en % para que siga bien si cambia el tamaño de la ventana
    t.style.left = (left / area.clientWidth) * 100 + "%";
    t.style.top = (top / area.clientHeight) * 100 + "%";
  });

  const soltar = () => { inicio = null; t.classList.remove("arrastrando"); };
  t.addEventListener("pointerup", soltar);
  t.addEventListener("pointercancel", soltar);
});

// números de la regla del tapete
const numeros = document.querySelector(".tapete__numeros");
function llenarNumeros() {
  const celda = parseFloat(getComputedStyle(document.querySelector(".tapete__base")).getPropertyValue("--celda")) || 76;
  const n = Math.floor(numeros.parentElement.clientHeight / celda);
  numeros.innerHTML = Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join("");
}

/* ---------- 6. Toque al hacer clic: un círculo y tres rayitas tipo "¡!" ---------- */
const lienzo = document.getElementById("festejo");
const ctx = lienzo.getContext("2d");
const DURACION_TOQUE = 420; // ms
let toques = [];
let animando = false;

function ajustarLienzo() {
  const dpr = window.devicePixelRatio || 1;
  lienzo.width = innerWidth * dpr;
  lienzo.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function festejar(x, y) {
  if (reducir) return;
  toques.push({ x, y, inicio: performance.now() });
  if (!animando) { animando = true; requestAnimationFrame(pintar); }
}

// traza con un borde oscuro debajo, para que el amarillo se vea en fondos claros y oscuros
function trazo(ancho, alfa) {
  ctx.globalAlpha = alfa;
  ctx.strokeStyle = "rgba(18,17,16,.55)"; ctx.lineWidth = ancho + 1.6; ctx.stroke();
  ctx.strokeStyle = "#F9C917"; ctx.lineWidth = ancho; ctx.stroke();
}

function pintar(ahora) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.lineCap = "round";
  toques = toques.filter((t) => ahora - t.inicio < DURACION_TOQUE);
  toques.forEach((t) => {
    const p = Math.max(0, (ahora - t.inicio) / DURACION_TOQUE);
    const e = 1 - Math.pow(1 - p, 3);   // sale rápido y frena
    const alfa = 1 - p;
    // círculo que se abre
    ctx.beginPath();
    ctx.arc(t.x, t.y, 5 + 15 * e, 0, Math.PI * 2);
    trazo(2.2 * (1 - p) + 0.6, alfa);
    // tres rayitas arriba, como las marcas de los dibujos del brochure
    [-125, -90, -55].forEach((g) => {
      const a = (g * Math.PI) / 180;
      const r1 = 14 + 10 * e, r2 = r1 + 7 * (1 - p * 0.5);
      ctx.beginPath();
      ctx.moveTo(t.x + Math.cos(a) * r1, t.y + Math.sin(a) * r1);
      ctx.lineTo(t.x + Math.cos(a) * r2, t.y + Math.sin(a) * r2);
      trazo(2.4, alfa);
    });
  });
  ctx.globalAlpha = 1;
  if (toques.length) requestAnimationFrame(pintar);
  else { animando = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}

document.addEventListener("pointerdown", (ev) => festejar(ev.clientX, ev.clientY));

/* ---------- Lo que buscas: cada casilla completa la ilustración ---------- */
const marco = document.querySelector(".marco");

// estrella que salta por las 4 barras, crece en cada salto y sube al cielo
const salto = marco.querySelector(".salto");
const brillo = marco.querySelector(".brillo");
// [x, y, escala, giro] en coordenadas del dibujo (ya consideran la inclinación de la valla)
const RUTA = [
  [45, 70, 0, 0],       // aparece
  [45.5, 120, 1, 0],    // barra 1
  [56, 90, 1.1, 0],
  [66.8, 106, 1.2, 0],  // barra 2
  [77.5, 78, 1.3, 0],
  [88.3, 94, 1.4, 0],   // barra 3
  [99, 62, 1.5, 0],
  [109.5, 78, 1.6, 0],  // barra 4
];
const MOMENTOS = [0, .1, .17, .24, .31, .38, .45, .52, .7, .88, 1];
let animSalto = null;

// dónde estaba la estrella del dibujo: centro y ancho, en fracciones de la imagen del hombre
const ESTRELLA_DIBUJO = { x: 493 / 700, y: 86 / 930, ancho: 150 / 700, giro: 0 };

// convierte esa posición de la imagen a coordenadas del dibujo SVG
function destinoEstrella() {
  const svg = salto.ownerSVGElement;
  const hombre = marco.querySelector(".marco__hombre");
  const m = marco.getBoundingClientRect();
  const inv = svg.getScreenCTM().inverse();
  const aSvg = (x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(inv); };
  // posición final de la imagen (sin la animación de subida): left 64% centrado con translate -50%
  const img = { left: m.left + hombre.offsetLeft - hombre.offsetWidth / 2, top: m.top + hombre.offsetTop, width: hombre.offsetWidth, height: hombre.offsetHeight };
  const cx = img.left + img.width * ESTRELLA_DIBUJO.x;
  const cy = img.top + img.height * ESTRELLA_DIBUJO.y;
  const c = aSvg(cx, cy);
  const borde = aSvg(cx + img.width * ESTRELLA_DIBUJO.ancho / 2, cy);
  const escala = ((borde.x - c.x) * 2) / 13.4 * 1.12; // 13.4 = ancho de la estrella (img/doodles/estrella-dibujo.png) a escala 1; un poco más grande que la original
  return { x: c.x, y: c.y, s: escala };
}

function lanzarEstrella() {
  brillo.classList.remove("listo");
  if (animSalto) animSalto.cancel();
  const d = destinoEstrella();
  const giroFinal = 360 + ESTRELLA_DIBUJO.giro;
  const ruta = [
    ...RUTA,
    [(109.5 + d.x) / 2 - 20, Math.min(d.y, 40) - 10, d.s * 0.6, 160], // despega en arco
    [d.x, d.y - 8, d.s * 1.12, giroFinal + 8],                          // se pasa un poquito
    [d.x, d.y, d.s, giroFinal],                                         // se asienta en el dedo
  ];
  brillo.setAttribute("transform", `translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) scale(${(d.s / 3).toFixed(3)})`);
  const cuadros = ruta.map(([x, y, s, r], i) => ({
    transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`,
    opacity: i === 0 ? 0 : 1,
    offset: MOMENTOS[i],
    // al subir frena arriba y al caer acelera, como un salto real
    easing: i % 2 === 1 || i >= 7 ? "cubic-bezier(.2,.7,.4,1)" : "cubic-bezier(.6,0,.8,.4)",
  }));
  animSalto = salto.animate(cuadros, { duration: reducir ? 1 : 2400, delay: reducir ? 0 : 120, fill: "forwards" });
  animSalto.onfinish = () => brillo.classList.add("listo");
}
function quitarEstrella() {
  if (animSalto) { animSalto.cancel(); animSalto = null; }
  brillo.classList.remove("listo");
}

const casillas = [...document.querySelectorAll(".check input")];
let etapaAnterior = 0;
casillas.forEach((c) => c.addEventListener("change", () => {
  const n = casillas.filter((x) => x.checked).length;
  marco.dataset.etapa = String(n);
  if (n === 3 && etapaAnterior !== 3) lanzarEstrella();
  if (n < 3) quitarEstrella();
  etapaAnterior = n;
}));

/* ---------- 7. Revelar secciones ---------- */
const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visto"); observador.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".revela").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  observador.observe(el);
});

/* ---------- Scroll ---------- */
function alHacerScroll() {
  const d = (window.scrollY * 0.35) % vueltaRiel;
  pistas[0].style.transform = `translateY(${-d}px)`;
  pistas[1].style.transform = `translateY(${d - vueltaRiel}px)`;
  animarEscena();
}

let pendiente = false;
window.addEventListener("scroll", () => {
  if (!pendiente) {
    pendiente = true;
    requestAnimationFrame(() => { alHacerScroll(); pendiente = false; });
  }
}, { passive: true });
window.addEventListener("resize", () => {
  pistas.forEach((p, i) => llenarRiel(p, i * 4));
  ajustarLienzo();
  llenarNumeros();
  fijarAnchoPalabra();
  alHacerScroll();
});
ajustarLienzo();
llenarNumeros();
alHacerScroll();
