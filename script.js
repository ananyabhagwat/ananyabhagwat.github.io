// ── Card image upload ──────────────────────────────────────────────────────
function handleCardImage(input) {
  const slot = input.closest('.card-image-slot');
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    slot.querySelector('.card-img-preview').src = e.target.result;
    slot.classList.add('has-image');
    try { sessionStorage.setItem('cimg_' + slot.dataset.label, e.target.result); } catch(e) {}
  };
  reader.readAsDataURL(file);
}

function removeCardImage(ev, btn) {
  ev.preventDefault();
  const slot = btn.closest('.card-image-slot');
  slot.querySelector('.card-img-preview').src = '';
  slot.querySelector('input[type="file"]').value = '';
  slot.classList.remove('has-image');
  try { sessionStorage.removeItem('cimg_' + slot.dataset.label); } catch(e) {}
}

// ── Project image upload ───────────────────────────────────────────────────
function handleImage(input) {
  const slot = input.closest('.image-slot');
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    slot.querySelector('.slot-preview').src = e.target.result;
    slot.classList.add('has-image');
    try { sessionStorage.setItem('img_' + slot.dataset.label, e.target.result); } catch(e) {}
  };
  reader.readAsDataURL(file);
}

function removeImage(btn) {
  const slot = btn.closest('.image-slot');
  slot.querySelector('.slot-preview').src = '';
  slot.querySelector('input[type="file"]').value = '';
  slot.classList.remove('has-image');
  const caption = slot.querySelector('.image-caption');
  if (caption) caption.value = '';
  try { sessionStorage.removeItem('img_' + slot.dataset.label); } catch(e) {}
  try { sessionStorage.removeItem('cap_' + slot.dataset.label); } catch(e) {}
}

// ── Restore from sessionStorage ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.card-image-slot[data-label]').forEach(slot => {
    try {
      const saved = sessionStorage.getItem('cimg_' + slot.dataset.label);
      if (saved) {
        slot.querySelector('.card-img-preview').src = saved;
        slot.classList.add('has-image');
      }
    } catch(e) {}
  });

  document.querySelectorAll('.image-slot[data-label]').forEach(slot => {
    try {
      const img = sessionStorage.getItem('img_' + slot.dataset.label);
      if (img) {
        slot.querySelector('.slot-preview').src = img;
        slot.classList.add('has-image');
      }
      const cap = sessionStorage.getItem('cap_' + slot.dataset.label);
      const caption = slot.querySelector('.image-caption');
      if (cap && caption) caption.value = cap;
    } catch(e) {}
  });

  // Save captions as typed
  document.querySelectorAll('.image-caption').forEach(el => {
    el.addEventListener('input', () => {
      const slot = el.closest('.image-slot');
      if (!slot) return;
      try { sessionStorage.setItem('cap_' + slot.dataset.label, el.value); } catch(e) {}
    });
  });

  // ── Sidebar active state ─────────────────────────────────────────────────
  const sections = document.querySelectorAll('.content-section[id]');
  const navLinks = document.querySelectorAll('.sidebar-nav a');
  if (sections.length && navLinks.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach(s => obs.observe(s));
  }

  // ── Animated node/edge graph (home page only) ────────────────────────────
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, nodes, animFrame;

  // Colour from CSS var
  const nodeColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--rule').trim() || '#E2DDD8';

  function resize() {
    const wrap = canvas.parentElement;
    // offsetHeight may be 0 if nothing has rendered yet — fall back to hero height
    const hero = wrap.querySelector('.hero');
    const h = wrap.offsetHeight || (hero ? hero.offsetHeight : 400);
    W = canvas.width  = wrap.offsetWidth  || window.innerWidth;
    H = canvas.height = h;
  }

  function makeNodes(n) {
    return Array.from({ length: n }, () => ({
      x:  Math.random() * W * 0.65,          // cluster toward left/top
      y:  Math.random() * H * 0.80,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r:  Math.random() * 2 + 1.5,
      // opacity that drifts gently
      opacity: Math.random() * 0.5 + 0.15,
      opacityDir: Math.random() > 0.5 ? 1 : -1,
      opacitySpeed: Math.random() * 0.003 + 0.001,
    }));
  }

  function init() {
    resize();
    nodes = makeNodes(52);
  }

  // How far from top-left corner before we start fading the whole graph out
  function cornerFade(x, y) {
    // distance from origin as fraction of diagonal
    const diag = Math.sqrt(W * W + H * H);
    const dist = Math.sqrt(x * x + y * y);
    const frac = dist / diag;
    // full opacity up to 30% of diagonal, then fade to 0 by 75%
    if (frac < 0.30) return 1;
    if (frac > 0.75) return 0;
    return 1 - (frac - 0.30) / (0.75 - 0.30);
  }

  const MAX_DIST = 160;
  const BASE_ALPHA = 0.35; // max alpha for nodes/edges

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // move nodes
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;

      // soft bounce at edges
      if (n.x < 0 || n.x > W * 0.7)  n.vx *= -1;
      if (n.y < 0 || n.y > H)         n.vy *= -1;

      // drift opacity
      n.opacity += n.opacityDir * n.opacitySpeed;
      if (n.opacity > 0.65 || n.opacity < 0.1) n.opacityDir *= -1;
    });

    // draw edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > MAX_DIST) continue;

        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const fade = cornerFade(midX, midY);
        if (fade === 0) continue;

        const proximity = 1 - dist / MAX_DIST;
        const alpha = BASE_ALPHA * proximity * fade;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(130,120,110,${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // draw nodes
    nodes.forEach(n => {
      const fade = cornerFade(n.x, n.y);
      if (fade === 0) return;
      const alpha = BASE_ALPHA * n.opacity * fade * 1.8;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(130,120,110,${alpha})`;
      ctx.fill();
    });

    animFrame = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animFrame);
    init();
    draw();
  });

  // Small delay so the browser has finished laying out the hero before we measure it
  setTimeout(() => { init(); draw(); }, 80);

});
