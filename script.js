// Card image upload
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

// Project image upload
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
  try { sessionStorage.removeItem('img_' + slot.dataset.label); } catch(e) {}
}

// Restore images from sessionStorage
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
      const saved = sessionStorage.getItem('img_' + slot.dataset.label);
      if (saved) {
        slot.querySelector('.slot-preview').src = saved;
        slot.classList.add('has-image');
      }
    } catch(e) {}
  });

  // Sidebar active state
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
});
