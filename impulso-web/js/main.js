/* IMPULSO — interacciones
   1. Sellos de los rieles laterales
   2. Recuadros de "imagen pendiente"
   3. Animación de entrada al hacer scroll
   4. Parallax + efecto de la portada */

const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function llenarRiel(pista, desfase) {
  // cada sello es cuadrado: ancho del riel - padding (8) + gap (6)
  altoSello = Math.max(pista.clientWidth - 8, 20) + 6;
  vueltaRiel = altoSello * ICONOS.length;
  const cantidad = Math.ceil((window.innerHeight + vueltaRiel) / altoSello) + 2;
  let html = "";
  for (let i = 0; i < cantidad; i++) {
    const icono = ICONOS[(i + desfase) % ICONOS.length];
    html += `<div class="sello"><svg viewBox="0 0 24 24">${icono}</svg></div>`;
  }
  pista.innerHTML = html;
}
const pistas = [...document.querySelectorAll(".riel__pista")];
pistas.forEach((p, i) => llenarRiel(p, i * 4));

/* ---------- 2. Imágenes pendientes ---------- */
// Si una imagen de img/trabajos/ todavía no existe, mostramos un recuadro
// con la ruta exacta donde debes guardarla.
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

/* ---------- 3. Revelar al hacer scroll ---------- */
const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("visto");
      observador.unobserve(e.target);
    }
  });
}, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

document.querySelectorAll(".revela, .tarjeta, .nota").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 90}ms`;
  observador.observe(el);
});

/* ---------- 4. Parallax y portada ---------- */
const portada = document.querySelector(".portada");
const cuaderno = document.querySelector(".cuaderno");
const flotantes = [...document.querySelectorAll("[data-vel]")];

function alHacerScroll() {
  const y = window.scrollY;
  const vh = window.innerHeight;

  // los rieles se mueven en sentidos opuestos (bucle infinito)
  const d = (y * 0.35) % vueltaRiel;
  pistas[0].style.transform = `translateY(${-d}px)`;
  pistas[1].style.transform = `translateY(${d - vueltaRiel}px)`;

  if (reducir) return;

  // la portada se aleja mientras la hoja de "nosotros" sube encima
  const p = Math.min(y / vh, 1);
  cuaderno.style.transform = `perspective(1400px) rotateX(${p * 10}deg) scale(${1 - p * 0.08})`;
  portada.style.opacity = String(1 - p * 0.55);

  flotantes.forEach((el) => {
    const r = el.parentElement.getBoundingClientRect();
    const v = parseFloat(el.dataset.vel);
    el.style.transform = `translateY(${(r.top) * v}px) rotate(${(r.top) * v * 0.04}deg)`;
  });
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
  alHacerScroll();
});
alHacerScroll();
