const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

window.addEventListener('load', () => {
  setTimeout(() => $('.preloader').classList.add('done'), 350);
  document.body.classList.add('loaded');
});

$('#year').textContent = new Date().getFullYear();

const dot = $('.cursor-dot');
const ring = $('.cursor-ring');
let mouseX = -100, mouseY = -100, ringX = -100, ringY = -100;
if (window.matchMedia('(pointer:fine)').matches) {
  window.addEventListener('pointermove', (event) => { mouseX = event.clientX; mouseY = event.clientY; dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`; });
  const animateCursor = () => { ringX += (mouseX - ringX) * .16; ringY += (mouseY - ringY) * .16; ring.style.transform = `translate(${ringX}px, ${ringY}px)`; requestAnimationFrame(animateCursor); };
  animateCursor();
  $$('a, button, .tilt-card').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
}

const progress = $('.scroll-progress span');
window.addEventListener('scroll', () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${window.scrollY / scrollable})`;
}, { passive: true });

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (!entry.isIntersecting) return;
  entry.target.classList.add('visible');
  observer.unobserve(entry.target);
}), { threshold: .14 });
$$('.reveal-up, .reveal-right, .split-reveal').forEach((el) => observer.observe(el));

$$('.split-reveal').forEach((title) => {
  const words = title.textContent.trim().split(/\s+/);
  title.innerHTML = words.map((word) => `<span class="word"><span>${word}</span></span> `).join('');
});

const statObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (!entry.isIntersecting) return;
  const stat = entry.target;
  const target = Number(stat.dataset.target);
  const decimals = Number.isInteger(target) ? 0 : 1;
  const start = performance.now();
  const draw = (now) => {
    const p = Math.min((now - start) / 1400, 1);
    const eased = 1 - Math.pow(1 - p, 4);
    stat.textContent = (target * eased).toFixed(decimals) + stat.dataset.suffix;
    if (p < 1) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
  statObserver.unobserve(stat);
}), { threshold: .7 });
$$('.stat-number').forEach((stat) => statObserver.observe(stat));

$$('.spotlight').forEach((card) => card.addEventListener('pointermove', (event) => {
  const box = card.getBoundingClientRect();
  card.style.setProperty('--x', `${event.clientX - box.left}px`);
  card.style.setProperty('--y', `${event.clientY - box.top}px`);
}));

if (window.matchMedia('(pointer:fine)').matches) {
  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      const box = el.getBoundingClientRect();
      const x = event.clientX - box.left - box.width / 2;
      const y = event.clientY - box.top - box.height / 2;
      el.style.transform = `translate(${x * .18}px, ${y * .18}px)`;
    });
    el.addEventListener('pointerleave', () => el.style.transform = 'translate(0, 0)');
  });
  $$('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .5;
      const y = (event.clientY - box.top) / box.height - .5;
      card.style.transform = `perspective(900px) rotateY(${x * 4}deg) rotateX(${y * -4}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  });
}

const toggle = $('.menu-toggle');
const menu = $('.mobile-menu');
toggle.addEventListener('click', () => {
  const open = toggle.classList.toggle('open');
  menu.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', open);
  menu.setAttribute('aria-hidden', !open);
});
$$('.mobile-menu a').forEach((link) => link.addEventListener('click', () => toggle.click()));

const canvas = $('#neural-canvas');
const ctx = canvas.getContext('2d');
let points = [];
const resizeCanvas = () => {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio, 2);
  canvas.width = rect.width * scale; canvas.height = rect.height * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const count = Math.min(38, Math.floor(rect.width / 28));
  points = Array.from({ length: count }, () => ({ x: Math.random() * rect.width, y: Math.random() * rect.height, vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22 }));
};
const renderNetwork = () => {
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  points.forEach((p) => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > width) p.vx *= -1; if (p.y < 0 || p.y > height) p.vy *= -1; });
  for (let i = 0; i < points.length; i += 1) for (let j = i + 1; j < points.length; j += 1) {
    const dx = points[i].x - points[j].x, dy = points[i].y - points[j].y, d = Math.hypot(dx, dy);
    if (d < 120) { ctx.strokeStyle = `rgba(9,17,29,${(1 - d / 120) * .13})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(points[i].x, points[i].y); ctx.lineTo(points[j].x, points[j].y); ctx.stroke(); }
  }
  points.forEach((p) => { ctx.fillStyle = 'rgba(91,112,255,.34)'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill(); });
  requestAnimationFrame(renderNetwork);
};
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) { resizeCanvas(); window.addEventListener('resize', resizeCanvas); renderNetwork(); }
