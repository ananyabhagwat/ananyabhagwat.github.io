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

  // Rainbow palette — crisp solid colours, applied at low global opacity
  const PALETTE = [
    '#E05A6B', // rose
    '#E8874A', // orange
    '#D4B84A', // amber
    '#6BAE5E', // green
    '#4A9EBD', // sky
    '#6B70C4', // indigo
    '#A66BC4', // violet
    '#C46B9E', // pink
  ];

  function resize() {
    const wrap = canvas.parentElement;
    const hero = wrap.querySelector('.hero');
    const h = wrap.offsetHeight || (hero ? hero.offsetHeight : 400);
    W = canvas.width  = wrap.offsetWidth  || window.innerWidth;
    H = canvas.height = h;
  }

  function makeNodes(n) {
    return Array.from({ length: n }, (_, i) => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r:  Math.random() * 4 + 3,          // bigger, visible circles
      color: PALETTE[i % PALETTE.length], // each node gets a palette colour
    }));
  }

  function init() {
    resize();
    nodes = makeNodes(48);
  }

  // Fade out as distance from top-left increases
  function cornerFade(x, y) {
    const diag = Math.sqrt(W * W + H * H);
    const dist = Math.sqrt(x * x + y * y);
    const frac = dist / diag;
    if (frac < 0.25) return 1;
    if (frac > 0.72) return 0;
    return 1 - (frac - 0.25) / (0.72 - 0.25);
  }

  const MAX_DIST  = 220;   // longer edges
  const GLOBAL_OPACITY = 0.22; // overall watermark level — tweak this one number

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // move nodes
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });

    // draw edges first (underneath nodes)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > MAX_DIST) continue;

        const fade = cornerFade((a.x + b.x) / 2, (a.y + b.y) / 2);
        if (fade === 0) continue;

        // Edge opacity falls off with distance — closer = more visible
        const proximity = 1 - dist / MAX_DIST;
        const alpha = GLOBAL_OPACITY * proximity * fade * 0.6;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(160,152,144,${alpha})`; // neutral warm grey
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // draw nodes on top — solid fill, crisp circles
    nodes.forEach(n => {
      const fade = cornerFade(n.x, n.y);
      if (fade === 0) return;

      // Parse hex to rgb for alpha control
      const hex = n.color.replace('#','');
      const r = parseInt(hex.slice(0,2),16);
      const g = parseInt(hex.slice(2,4),16);
      const b = parseInt(hex.slice(4,6),16);
      const alpha = GLOBAL_OPACITY * fade;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
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
