const gallery = document.querySelector('#gallery');
const search = document.querySelector('#search');
const viewer = document.querySelector('#viewer');
const about = document.querySelector('#about');
const stage = document.querySelector('#stage');
const fullImage = document.querySelector('#full-image');
const viewButtons = [...document.querySelectorAll('[data-view]')];
const orderedWorlds = [...WORLDS].sort((a, b) =>
  a.id === '085' ? -1 : b.id === '085' ? 1 : Number(a.id) - Number(b.id)
);

let visibleWorlds = orderedWorlds;
let currentWorld;
let zoom = 1;
let offset = { x: 0, y: 0 };
let drag;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function drawGallery() {
  const query = search.value.trim().toLowerCase();
  visibleWorlds = orderedWorlds.filter(world =>
    world.name.toLowerCase().includes(query) ||
    (/^\d+$/.test(query) ? Number(world.id) === Number(query) : world.id.includes(query))
  );
  gallery.replaceChildren(...visibleWorlds.map(world => {
    const featured = world.id === '085';
    const card = document.createElement('button');
    card.className = `card${featured ? ' featured' : ''}`;
    card.dataset.id = world.id;
    card.setAttribute('aria-label', `Open ${world.id} — ${world.name}`);

    const picture = document.createElement('div');
    picture.className = 'picture';
    const image = document.createElement('img');
    image.src = featured ? 'assets/angled.jpg' : `assets/${world.id}-thumb.png`;
    image.alt = '';
    image.className = 'picture-image';
    image.loading = featured ? 'eager' : 'lazy';
    const background = image.cloneNode();
    background.className = 'picture-backdrop';
    background.setAttribute('aria-hidden', 'true');
    picture.append(background, image);

    const caption = document.createElement('div');
    caption.className = 'caption';
    for (const [className, text] of [['number', world.id], ['name', world.name]]) {
      const span = document.createElement('span');
      span.className = className;
      span.textContent = text;
      caption.append(span);
    }
    card.append(picture, caption);
    card.addEventListener('click', () => openWorld(world));
    return card;
  }));
  document.querySelector('#count').textContent = visibleWorlds.length;
  document.querySelector('#empty').hidden = visibleWorlds.length !== 0;
}

function openWorld(world) {
  if (viewer.classList.contains('closing')) return;
  currentWorld = world;
  document.querySelector('#world-id').textContent = world.id;
  document.querySelector('#world-name').textContent = world.name;
  const download = document.querySelector('#download');
  download.href = `downloads/world-${world.id}.zip`;
  download.download = `world-${world.id}.zip`;
  download.setAttribute('aria-label', `Download ${world.name} for Minecraft Java Edition`);
  document.querySelector('#views').hidden = world.id !== '085';
  if (!viewer.open) viewer.showModal();
  setView(world.id === '085' ? 'angled' : 'map');
}

async function closeDialog(dialog) {
  if (!dialog.open || dialog.classList.contains('closing')) return;
  dialog.classList.add('closing');
  const exitAnimations = dialog.getAnimations().filter(animation => animation.animationName === 'viewer-out');
  await Promise.allSettled(exitAnimations.map(animation => animation.finished));
  dialog.close();
  dialog.classList.remove('closing');
}

function setView(view) {
  zoom = 1;
  offset = { x: 0, y: 0 };
  fullImage.style.visibility = 'hidden';
  const source = view === 'map' ? `assets/${currentWorld.id}.png` : `assets/${view}.jpg`;
  const background = view === 'map' ? `assets/${currentWorld.id}-thumb.png` : source;
  stage.style.setProperty('--preview-image', `url("${background}")`);
  fullImage.classList.toggle('render', view !== 'map');
  fullImage.alt = `${currentWorld.name} — ${view}`;
  fullImage.src = source;
  for (const button of viewButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  }
  if (fullImage.complete && fullImage.naturalWidth) fitImage();
}

function fitImage() {
  if (!fullImage.naturalWidth) return;
  const padding = stage.clientWidth < 650 ? 32 : 100;
  const fit = Math.min(
    (stage.clientWidth - padding) / fullImage.naturalWidth,
    (stage.clientHeight - 36) / fullImage.naturalHeight
  );
  fullImage.style.width = `${fullImage.naturalWidth * fit}px`;
  fullImage.style.height = `${fullImage.naturalHeight * fit}px`;
  fullImage.style.visibility = 'visible';
  positionImage();
}

function positionImage() {
  const width = parseFloat(fullImage.style.width) * zoom;
  const height = parseFloat(fullImage.style.height) * zoom;
  const limitX = Math.max(0, (width - stage.clientWidth) / 2 + 40);
  const limitY = Math.max(0, (height - stage.clientHeight) / 2 + 40);
  offset.x = Math.max(-limitX, Math.min(limitX, offset.x));
  offset.y = Math.max(-limitY, Math.min(limitY, offset.y));
  fullImage.style.transform = `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`;
  stage.classList.toggle('zoomed', zoom > 1);
  document.querySelector('#zoom-out').disabled = zoom <= 1;
  document.querySelector('#zoom-in').disabled = zoom >= 16;
}

function changeZoom(factor) {
  zoom = Math.max(1, Math.min(16, zoom * factor));
  if (zoom === 1) offset = { x: 0, y: 0 };
  positionImage();
}

function stepWorld(direction) {
  const index = visibleWorlds.indexOf(currentWorld);
  openWorld(visibleWorlds[(index + direction + visibleWorlds.length) % visibleWorlds.length]);
}

search.addEventListener('input', drawGallery);
fullImage.addEventListener('load', () => {
  fitImage();
  if (!reducedMotion.matches) fullImage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
});
function isOutsideDialog(dialog, event) {
  const rect = dialog.getBoundingClientRect();
  return event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom;
}
for (const [dialog, closeButton] of [[viewer, '#close'], [about, '#about-close']]) {
  let backdropPressed = false;
  document.querySelector(closeButton).addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeDialog(dialog);
  });
  dialog.addEventListener('pointerdown', event => { backdropPressed = isOutsideDialog(dialog, event); });
  dialog.addEventListener('pointerup', event => {
    if (backdropPressed && isOutsideDialog(dialog, event)) closeDialog(dialog);
    backdropPressed = false;
  });
}
document.querySelector('#about-open').addEventListener('click', () => about.showModal());
document.querySelector('#previous').addEventListener('click', () => stepWorld(-1));
document.querySelector('#next').addEventListener('click', () => stepWorld(1));
document.querySelector('#zoom-in').addEventListener('click', () => changeZoom(1.5));
document.querySelector('#zoom-out').addEventListener('click', () => changeZoom(1 / 1.5));
document.querySelector('#fit').addEventListener('click', () => {
  zoom = 1;
  offset = { x: 0, y: 0 };
  fitImage();
});
for (const button of viewButtons) {
  button.addEventListener('click', () => setView(button.dataset.view));
}
stage.addEventListener('wheel', event => {
  event.preventDefault();
  changeZoom(event.deltaY < 0 ? 1.15 : 1 / 1.15);
}, { passive: false });
stage.addEventListener('pointerdown', event => {
  if (event.target.closest('button') || zoom === 1) return;
  drag = { x: event.clientX - offset.x, y: event.clientY - offset.y };
  stage.setPointerCapture(event.pointerId);
  stage.classList.add('dragging');
});
stage.addEventListener('pointermove', event => {
  if (!drag) return;
  offset = { x: event.clientX - drag.x, y: event.clientY - drag.y };
  positionImage();
});
function endDrag() {
  drag = null;
  stage.classList.remove('dragging');
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
viewer.addEventListener('close', endDrag);
viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); stepWorld(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); stepWorld(1); }
  if (event.key === '+' || event.key === '=') changeZoom(1.5);
  if (event.key === '-') changeZoom(1 / 1.5);
});
new ResizeObserver(() => { if (viewer.open) fitImage(); }).observe(stage);
drawGallery();
