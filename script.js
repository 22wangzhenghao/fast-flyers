const canvas = document.getElementById('flyerCanvas');
const addTextBtn = document.getElementById('addTextBtn');
const addImageBtn = document.getElementById('addImageBtn');
const imageInput = document.getElementById('imageInput');
const exportBtn = document.getElementById('exportBtn');
const newFlyerBtn = document.getElementById('newFlyerBtn');
const emptyInspector = document.getElementById('emptyInspector');
const textInspector = document.getElementById('textInspector');
const imageInspector = document.getElementById('imageInspector');
const drawInspector = document.getElementById('drawInspector');
const textContent = document.getElementById('textContent');
const fontSize = document.getElementById('fontSize');
const textColor = document.getElementById('textColor');
const imageSize = document.getElementById('imageSize');
const imageSizeValue = document.getElementById('imageSizeValue');
const drawLayer = document.getElementById('drawLayer');
const drawToolBtn = document.getElementById('drawToolBtn');
const eraseToolBtn = document.getElementById('eraseToolBtn');
const deleteToolBtn = document.getElementById('deleteToolBtn');
const shapeToolBtn = document.getElementById('shapeToolBtn');
const shapePicker = document.getElementById('shapePicker');
const shapeInspector = document.getElementById('shapeInspector');
const shapeColor = document.getElementById('shapeColor');
const shapeSize = document.getElementById('shapeSize');
const shapeSizeValue = document.getElementById('shapeSizeValue');
const drawColor = document.getElementById('drawColor');
const brushSize = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const toast = document.getElementById('toast');
const selectToolBtn = document.getElementById('selectToolBtn');
const resizeToolBtn = document.getElementById('resizeToolBtn');
const resizeOverlay = document.getElementById('resizeOverlay');
const resizeHandle = document.getElementById('resizeHandle');
const showGrid = document.getElementById('showGrid');
const snapGrid = document.getElementById('snapGrid');
const gridSize = document.getElementById('gridSize');
const dimensionsSelect = document.getElementById('dimensionsSelect');
const customColor = document.getElementById('customColor');
let selectedElement = null;
let toastTimer;
let drawMode = false;
let eraseMode = false;
let selectMode = true;
let resizeMode = false;
let snapToGrid = true;
let gridPercent = 5;
let resizing = false;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartScale = 1;
let isDrawing = false;
let drawContext;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function hideResizeOverlay() {
  resizeOverlay.hidden = true;
}

function showResizeOverlay() {
  if (!resizeMode || !selectedElement) {
    hideResizeOverlay();
    return;
  }
  const canvasRect = canvas.getBoundingClientRect();
  const elementRect = selectedElement.getBoundingClientRect();
  resizeOverlay.hidden = false;
  resizeOverlay.style.left = `${elementRect.left - canvasRect.left}px`;
  resizeOverlay.style.top = `${elementRect.top - canvasRect.top}px`;
  resizeOverlay.style.width = `${elementRect.width}px`;
  resizeOverlay.style.height = `${elementRect.height}px`;
}

function selectElement(element) {
  if (selectedElement) selectedElement.classList.remove('selected');
  selectedElement = element;
  if (!element) {
    emptyInspector.hidden = false;
    textInspector.hidden = true;
    imageInspector.hidden = true;
    shapeInspector.hidden = true;
    hideResizeOverlay();
    document.querySelector('.selection-count').textContent = 'No selection';
    return;
  }
  element.classList.add('selected');
  emptyInspector.hidden = true;
  textInspector.hidden = element.dataset.type !== 'text';
  imageInspector.hidden = element.dataset.type !== 'image';
  shapeInspector.hidden = element.dataset.type !== 'shape';
  document.querySelector('.selection-count').textContent = resizeMode ? 'Resize mode' : element.dataset.type === 'image' ? 'Image selected' : element.dataset.type === 'shape' ? 'Shape selected' : 'Text selected';
  if (element.dataset.type === 'text') {
    textContent.value = element.innerText.trim();
    fontSize.value = element.dataset.size || 'medium';
    textColor.value = element.dataset.color || rgbToHex(getComputedStyle(element).color) || '#19272a';
  }
  if (element.dataset.type === 'image') {
    const size = parseInt(element.dataset.size || element.style.width || '32', 10);
    imageSize.value = size;
    imageSizeValue.value = `${size}%`;
  }
  if (element.dataset.type === 'shape') {
    const size = parseInt(element.dataset.size || '18', 10);
    shapeColor.value = element.dataset.color || rgbToHex(getComputedStyle(element).backgroundColor) || '#f36f56';
    shapeSize.value = size;
    shapeSizeValue.value = `${size}%`;
  }
  showResizeOverlay();
}

function rgbToHex(rgb) {
  const values = rgb.match(/\d+/g);
  if (!values || values.length < 3) return '#19272a';
  return `#${values.slice(0, 3).map((value) => Number(value).toString(16).padStart(2, '0')).join('')}`;
}

function makeDraggable(element) {
  let startX, startY, originLeft, originTop, dragging = false;
  element.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || (event.target === element && element.isContentEditable)) return;
    dragging = true;
    selectElement(element);
    element.setPointerCapture(event.pointerId);
    const canvasRect = canvas.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    startX = event.clientX; startY = event.clientY;
    originLeft = ((rect.left - canvasRect.left) / canvasRect.width) * 100;
    originTop = ((rect.top - canvasRect.top) / canvasRect.height) * 100;
    event.preventDefault();
  });
  element.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const canvasRect = canvas.getBoundingClientRect();
    const nextLeft = originLeft + ((event.clientX - startX) / canvasRect.width) * 100;
    const nextTop = originTop + ((event.clientY - startY) / canvasRect.height) * 100;
    const positionedLeft = snapToGrid ? Math.round(nextLeft / gridPercent) * gridPercent : nextLeft;
    const positionedTop = snapToGrid ? Math.round(nextTop / gridPercent) * gridPercent : nextTop;
    element.style.left = `${Math.max(2, Math.min(90, positionedLeft))}%`;
    element.style.top = `${Math.max(2, Math.min(94, positionedTop))}%`;
    showResizeOverlay();
  });
  element.addEventListener('pointerup', () => { dragging = false; showResizeOverlay(); });
  element.addEventListener('click', (event) => { event.stopPropagation(); selectElement(element); });
  if (element.dataset.type === 'text') {
    element.addEventListener('dblclick', () => {
      element.contentEditable = 'true';
      element.focus();
      document.execCommand('selectAll', false, null);
    });
    element.addEventListener('blur', () => {
      element.contentEditable = 'false';
      textContent.value = element.innerText.trim();
    });
  }
}

function registerElement(element) {
  makeDraggable(element);
  element.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { element.blur(); selectElement(null); }
  });
}

function syncDrawCanvas() {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const previous = drawContext && drawLayer.width ? drawContext.getImageData(0, 0, drawLayer.width, drawLayer.height) : null;
  drawLayer.width = Math.max(1, Math.floor(rect.width * pixelRatio));
  drawLayer.height = Math.max(1, Math.floor(rect.height * pixelRatio));
  drawContext = drawLayer.getContext('2d');
  drawContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  if (previous && previous.width === drawLayer.width && previous.height === drawLayer.height) drawContext.putImageData(previous, 0, 0);
}

function pointerPosition(event) {
  const rect = drawLayer.getBoundingClientRect();
  return [event.clientX - rect.left, event.clientY - rect.top];
}

function setToolMode(mode) {
  shapePicker.hidden = true;
  shapeToolBtn.classList.remove('active');
  drawMode = mode === 'draw' || mode === 'erase';
  eraseMode = mode === 'erase';
  selectMode = mode === 'select';
  resizeMode = mode === 'resize';
  canvas.classList.toggle('draw-mode', drawMode);
  selectToolBtn.classList.toggle('active', selectMode);
  resizeToolBtn.classList.toggle('active', resizeMode);
  drawToolBtn.classList.toggle('active', mode === 'draw');
  eraseToolBtn.classList.toggle('active', mode === 'erase');
  drawInspector.hidden = !drawMode;
  if (drawMode) {
    selectElement(null);
    emptyInspector.hidden = true;
    document.querySelector('.selection-count').textContent = eraseMode ? 'Erase mode' : 'Drawing mode';
    document.querySelector('#drawInspector > label').textContent = eraseMode ? 'Eraser brush' : 'Draw color';
    showToast(eraseMode ? 'Erase mode on — brush over painted marks' : 'Draw mode on — sketch anywhere on the flyer');
  } else if (resizeMode) {
    if (selectedElement) {
      emptyInspector.hidden = true;
      document.querySelector('.selection-count').textContent = 'Resize mode';
      showResizeOverlay();
    } else {
      emptyInspector.hidden = false;
      document.querySelector('.selection-count').textContent = 'No selection';
      hideResizeOverlay();
    }
  } else {
    emptyInspector.hidden = !selectedElement;
    if (!selectedElement) document.querySelector('.selection-count').textContent = 'No selection';
    hideResizeOverlay();
  }
}

function toggleDrawMode() {
  setToolMode(drawMode && !eraseMode ? 'select' : 'draw');
}

function toggleEraseMode() {
  setToolMode(eraseMode ? 'select' : 'erase');
}

document.querySelectorAll('.flyer-element').forEach(registerElement);
syncDrawCanvas();
window.addEventListener('resize', syncDrawCanvas);
canvas.addEventListener('click', () => { if (!drawMode) selectElement(null); });

drawLayer.addEventListener('pointerdown', (event) => {
  if (!drawMode) return;
  isDrawing = true;
  drawLayer.setPointerCapture(event.pointerId);
  const [x, y] = pointerPosition(event);
  drawContext.beginPath();
  drawContext.moveTo(x, y);
  drawContext.globalCompositeOperation = eraseMode ? 'destination-out' : 'source-over';
  drawContext.strokeStyle = drawColor.value;
  drawContext.fillStyle = drawColor.value;
  drawContext.lineWidth = Number(brushSize.value);
  drawContext.lineCap = 'round';
  drawContext.lineJoin = 'round';
  drawContext.lineTo(x + 0.01, y + 0.01);
  drawContext.stroke();
});
drawLayer.addEventListener('pointermove', (event) => {
  if (!isDrawing || !drawMode) return;
  const [x, y] = pointerPosition(event);
  drawContext.lineTo(x, y);
  drawContext.stroke();
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => drawLayer.addEventListener(eventName, () => { isDrawing = false; }));

resizeHandle.addEventListener('pointerdown', (event) => {
  if (!resizeMode || !selectedElement) return;
  resizing = true;
  resizeStartX = event.clientX;
  resizeStartY = event.clientY;
  resizeStartWidth = selectedElement.getBoundingClientRect().width;
  resizeStartScale = Number(selectedElement.dataset.resizeScale || 1);
  selectedElement.style.transformOrigin = 'top left';
  resizeHandle.setPointerCapture(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
});
resizeHandle.addEventListener('pointermove', (event) => {
  if (!resizing || !selectedElement) return;
  const nextWidth = Math.max(24, resizeStartWidth + (event.clientX - resizeStartX));
  const scale = resizeStartScale * (nextWidth / resizeStartWidth);
  selectedElement.dataset.resizeScale = scale.toFixed(3);
  selectedElement.style.transform = `scale(${scale})`;
  showResizeOverlay();
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => resizeHandle.addEventListener(eventName, () => { resizing = false; showResizeOverlay(); }));

drawToolBtn.addEventListener('click', toggleDrawMode);
eraseToolBtn.addEventListener('click', toggleEraseMode);
selectToolBtn.addEventListener('click', () => setToolMode('select'));
resizeToolBtn.addEventListener('click', () => {
  if (!selectedElement) {
    setToolMode('select');
    showToast('Select an item first, then resize it');
    return;
  }
  setToolMode('resize');
  showToast('Drag the coral handle to resize');
});
deleteToolBtn.addEventListener('click', () => {
  if (!selectedElement) {
    showToast('Select an item first, then delete it');
    return;
  }
  setToolMode('select');
  selectedElement.remove();
  selectElement(null);
  showToast('Item deleted');
});

addTextBtn.addEventListener('click', () => {
  setToolMode('select');
  const element = document.createElement('div');
  element.className = 'flyer-element new-text';
  element.dataset.type = 'text';
  element.dataset.editable = 'true';
  element.dataset.size = 'medium';
  element.textContent = 'Your text here';
  element.style.left = '29%';
  element.style.top = '42%';
  element.style.color = 'var(--ink)';
  element.style.font = '600 22px/1.1 "Space Grotesk", sans-serif';
  element.style.maxWidth = '58%';
  canvas.appendChild(element);
  registerElement(element);
  selectElement(element);
  element.contentEditable = 'true';
  element.focus();
  document.execCommand('selectAll', false, null);
  showToast('Text added — type your message');
});

addImageBtn.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    setToolMode('select');
    const image = document.createElement('img');
    image.src = reader.result;
    image.alt = file.name;
    image.className = 'flyer-element uploaded-image';
    image.dataset.type = 'image';
    image.dataset.size = '32';
    image.style.left = '48%'; image.style.top = '41%'; image.style.width = '32%'; image.style.borderRadius = '10px'; image.style.objectFit = 'cover'; image.style.aspectRatio = '1';
    image.style.boxShadow = '0 4px 12px rgba(25,39,42,.14)';
    canvas.appendChild(image);
    registerElement(image);
    selectElement(image);
    showToast('Image added — drag it anywhere');
  };
  reader.readAsDataURL(file);
  event.target.value = '';
});

function createShape(type, options = {}) {
  setToolMode('select');
  shapePicker.hidden = true;
  shapeToolBtn.classList.remove('active');
  const element = document.createElement('div');
  const size = options.size || (type === 'oval' ? 25 : 18);
  element.className = `flyer-element shape-element shape-${type}`;
  element.dataset.type = 'shape';
  element.dataset.shape = type;
  element.dataset.size = size;
  element.dataset.color = options.color || '#f36f56';
  element.style.left = `${options.left ?? 38}%`;
  element.style.top = `${options.top ?? 39}%`;
  element.style.width = `${size}%`;
  element.style.background = options.color || '#f36f56';
  if (type === 'oval') element.style.height = `${options.height || 11}%`;
  else element.style.height = `${size}%`;
  if (options.border) element.style.border = options.border;
  canvas.appendChild(element);
  registerElement(element);
  selectElement(element);
  if (!options.silent) showToast(`${type[0].toUpperCase()}${type.slice(1)} added — drag to move it`);
  return element;
}

function createTemplateText(options) {
  const element = document.createElement('div');
  element.className = `flyer-element template-text ${options.className || ''}`;
  element.dataset.type = 'text';
  element.dataset.editable = 'true';
  element.dataset.size = options.size || 'medium';
  element.dataset.color = options.color || '#19272a';
  element.style.left = `${options.left}%`;
  element.style.top = `${options.top}%`;
  element.style.maxWidth = options.maxWidth || '78%';
  element.style.color = options.color || '#19272a';
  element.style.font = options.font || '500 14px/1.45 "DM Sans", sans-serif';
  element.style.whiteSpace = 'pre-line';
  if (options.letterSpacing) element.style.letterSpacing = options.letterSpacing;
  if (options.align) element.style.textAlign = options.align;
  element.textContent = options.text;
  canvas.appendChild(element);
  registerElement(element);
  return element;
}

const templates = {
  club: {
    name: 'Club meeting',
    background: '#e8f0ed',
    elements: [
      { type: 'text', text: 'YOUR NEXT CHAPTER\nSTARTS HERE.', left: 9, top: 13, color: '#19272a', font: '700 clamp(32px, 7vw, 54px)/.9 "Space Grotesk", sans-serif', className: 'template-title' },
      { type: 'text', text: 'ART + DESIGN CLUB\nTUESDAY · 3:30 PM\nROOM 204', left: 10, top: 55, color: '#5e6d6d', font: '600 13px/1.6 "DM Mono", monospace', letterSpacing: '.5px' },
      { type: 'text', text: 'ALL SKILL LEVELS WELCOME  →', left: 10, top: 86, color: '#f36f56', font: '600 11px "DM Mono", monospace', letterSpacing: '1px' },
      { type: 'shape', shape: 'circle', left: 66, top: 18, size: 25, color: '#afc5b3' },
      { type: 'shape', shape: 'oval', left: 66, top: 72, size: 24, height: 10, color: '#f36f56' },
    ],
  },
  bake: {
    name: 'Bake sale',
    background: '#fff0e5',
    elements: [
      { type: 'text', text: '$5\nBAKE SALE', left: 9, top: 14, color: '#c7624d', font: '700 clamp(44px, 9vw, 68px)/.84 "Space Grotesk", sans-serif', className: 'template-title' },
      { type: 'text', text: 'FRIDAY · COURTYARD\n11 AM — 2 PM', left: 10, top: 57, color: '#7d655c', font: '600 14px/1.65 "DM Mono", monospace', letterSpacing: '.5px' },
      { type: 'text', text: 'COOKIES · BROWNIES · CAKE', left: 10, top: 86, color: '#19272a', font: '600 10px "DM Mono", monospace', letterSpacing: '1px' },
      { type: 'shape', shape: 'square', left: 66, top: 22, size: 25, color: '#f7cf69' },
      { type: 'shape', shape: 'circle', left: 69, top: 70, size: 16, color: '#f36f56' },
    ],
  },
  movie: {
    name: 'Movie night',
    background: '#edeafa',
    elements: [
      { type: 'text', text: 'MOVIE\nNIGHT', left: 9, top: 14, color: '#5e4e80', font: '700 clamp(48px, 10vw, 74px)/.8 "Space Grotesk", sans-serif', className: 'template-title' },
      { type: 'text', text: 'FRIDAY · 7 PM\nAUDITORIUM', left: 10, top: 57, color: '#746d83', font: '600 14px/1.65 "DM Mono", monospace', letterSpacing: '.5px' },
      { type: 'text', text: 'FREE POPCORN · BRING A BLANKET', left: 10, top: 86, color: '#19272a', font: '600 10px "DM Mono", monospace', letterSpacing: '1px' },
      { type: 'shape', shape: 'circle', left: 68, top: 20, size: 25, color: '#5e4e80' },
      { type: 'shape', shape: 'oval', left: 62, top: 69, size: 28, height: 11, color: '#f36f56' },
    ],
  },
};

function clearFlyerContent() {
  document.querySelectorAll('.flyer-element').forEach((element) => element.remove());
  if (drawContext) {
    const rect = drawLayer.getBoundingClientRect();
    drawContext.clearRect(0, 0, rect.width, rect.height);
  }
  hideResizeOverlay();
  setToolMode('select');
  selectElement(null);
}

function setFlyerColor(color) {
  canvas.style.background = color;
  customColor.value = color;
  document.querySelectorAll('.swatch').forEach((item) => item.classList.toggle('active', item.dataset.color === color));
}

function loadTemplate(templateKey) {
  const template = templates[templateKey];
  if (!template) return;
  if (document.querySelectorAll('.flyer-element').length && !confirm(`Replace the current flyer with the ${template.name} template?`)) return;
  clearFlyerContent();
  setFlyerColor(template.background);
  dimensionsSelect.value = 'letter';
  canvas.dataset.dimensions = 'letter';
  canvas.style.aspectRatio = '8.5 / 11';
  syncDrawCanvas();
  template.elements.forEach((item) => {
    if (item.type === 'text') createTemplateText(item);
    if (item.type === 'shape') createShape(item.shape, { ...item, silent: true });
  });
  selectElement(null);
  showToast(`${template.name} template loaded`);
}

shapeToolBtn.addEventListener('click', () => {
  setToolMode('select');
  shapePicker.hidden = !shapePicker.hidden;
  shapeToolBtn.classList.toggle('active', !shapePicker.hidden);
});
document.querySelectorAll('[data-shape]').forEach((button) => button.addEventListener('click', () => createShape(button.dataset.shape)));
document.querySelectorAll('[data-template]').forEach((button) => button.addEventListener('click', () => loadTemplate(button.dataset.template)));

textContent.addEventListener('input', () => {
  if (!selectedElement) return;
  selectedElement.innerText = textContent.value;
});

fontSize.addEventListener('change', () => {
  if (!selectedElement) return;
  selectedElement.dataset.size = fontSize.value;
  const sizes = { small: '12px', medium: '22px', large: '36px', xl: '52px' };
  selectedElement.style.fontSize = sizes[fontSize.value];
});

function applyTextColor(color) {
  if (!selectedElement || selectedElement.dataset.type !== 'text') return;
  selectedElement.dataset.color = color;
  selectedElement.style.color = color;
  selectedElement.querySelectorAll('*').forEach((child) => { child.style.color = color; });
  textColor.value = color;
}

textColor.addEventListener('input', () => applyTextColor(textColor.value));
document.querySelectorAll('[data-text-color]').forEach((button) => button.addEventListener('click', () => applyTextColor(button.dataset.textColor)));

imageSize.addEventListener('input', () => {
  if (!selectedElement || selectedElement.dataset.type !== 'image') return;
  selectedElement.dataset.size = imageSize.value;
  selectedElement.style.width = `${imageSize.value}%`;
  imageSizeValue.value = `${imageSize.value}%`;
});

function applyShapeColor(color) {
  if (!selectedElement || selectedElement.dataset.type !== 'shape') return;
  selectedElement.dataset.color = color;
  selectedElement.style.background = color;
  shapeColor.value = color;
}

shapeColor.addEventListener('input', () => applyShapeColor(shapeColor.value));
document.querySelectorAll('[data-shape-color]').forEach((button) => button.addEventListener('click', () => applyShapeColor(button.dataset.shapeColor)));
shapeSize.addEventListener('input', () => {
  if (!selectedElement || selectedElement.dataset.type !== 'shape') return;
  const size = Number(shapeSize.value);
  selectedElement.dataset.size = size;
  selectedElement.style.width = `${size}%`;
  selectedElement.style.height = selectedElement.dataset.shape === 'oval' ? `${Math.max(7, Math.round(size * 0.44))}%` : `${size}%`;
  shapeSizeValue.value = `${size}%`;
});

document.querySelectorAll('[data-align]').forEach((button) => button.addEventListener('click', () => {
  if (!selectedElement) return;
  selectedElement.style.textAlign = button.dataset.align;
  document.querySelectorAll('[data-align]').forEach((item) => item.classList.toggle('active', item === button));
}));

document.querySelectorAll('.swatch').forEach((swatch) => swatch.addEventListener('click', () => {
  setFlyerColor(swatch.dataset.color);
  showToast('Flyer color updated');
}));
customColor.addEventListener('input', (event) => {
  canvas.style.background = event.target.value;
  document.querySelectorAll('.swatch').forEach((item) => item.classList.remove('active'));
});

showGrid.addEventListener('change', () => {
  canvas.classList.toggle('hide-grid', !showGrid.checked);
});
snapGrid.addEventListener('change', () => {
  snapToGrid = snapGrid.checked;
  showToast(snapToGrid ? 'Snap to grid on' : 'Free movement on');
});
gridSize.addEventListener('change', () => {
  gridPercent = Number(gridSize.value);
  canvas.style.setProperty('--grid-step', `${gridPercent}%`);
});

dimensionsSelect.addEventListener('change', () => {
  const dimensions = {
    letter: '8.5 / 11',
    portrait: '9 / 16',
    landscape: '16 / 9',
    square: '1 / 1',
  };
  canvas.dataset.dimensions = dimensionsSelect.value;
  canvas.style.aspectRatio = dimensions[dimensionsSelect.value];
  syncDrawCanvas();
  showResizeOverlay();
  showToast(`${dimensionsSelect.options[dimensionsSelect.selectedIndex].text} canvas selected`);
});

document.getElementById('deleteElement').addEventListener('click', () => {
  if (!selectedElement) return;
  selectedElement.remove();
  selectElement(null);
  showToast('Element removed');
});

document.getElementById('deleteImage').addEventListener('click', () => {
  if (!selectedElement || selectedElement.dataset.type !== 'image') return;
  selectedElement.remove();
  selectElement(null);
  showToast('Image removed');
});

document.getElementById('deleteShape').addEventListener('click', () => {
  if (!selectedElement || selectedElement.dataset.type !== 'shape') return;
  selectedElement.remove();
  selectElement(null);
  showToast('Shape removed');
});

document.querySelectorAll('.draw-swatch').forEach((swatch) => swatch.addEventListener('click', () => {
  drawColor.value = swatch.dataset.drawColor;
  document.querySelectorAll('.draw-swatch').forEach((item) => item.classList.toggle('active', item === swatch));
}));
drawColor.addEventListener('input', () => document.querySelectorAll('.draw-swatch').forEach((item) => item.classList.remove('active')));
brushSize.addEventListener('input', () => { brushSizeValue.value = `${brushSize.value}px`; });
document.getElementById('clearDrawing').addEventListener('click', () => {
  if (!drawContext) return;
  const rect = drawLayer.getBoundingClientRect();
  drawContext.clearRect(0, 0, rect.width, rect.height);
  showToast('Drawing cleared');
});

exportBtn.addEventListener('click', () => {
  selectElement(null);
  showToast('Opening print dialog — choose “Save as PDF”');
  setTimeout(() => window.print(), 450);
});

newFlyerBtn.addEventListener('click', () => {
  if (!confirm('Start a fresh flyer? Your current canvas will be cleared.')) return;
  document.querySelectorAll('.flyer-element').forEach((element) => element.remove());
  const rect = drawLayer.getBoundingClientRect();
  drawContext.clearRect(0, 0, rect.width, rect.height);
  canvas.style.background = '#f8f4eb';
  setToolMode('select');
  shapePicker.hidden = true;
  shapeToolBtn.classList.remove('active');
  selectElement(null);
  showToast('Fresh canvas ready');
});

document.addEventListener('keydown', (event) => {
  const activeElement = document.activeElement;
  const isTyping = activeElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName) || activeElement.isContentEditable);
  if (isTyping) return;
  if (event.key.toLowerCase() === 'v') setToolMode('select');
  if (event.key.toLowerCase() === 'r') resizeToolBtn.click();
  if (event.key.toLowerCase() === 't') addTextBtn.click();
  if (event.key.toLowerCase() === 'i') addImageBtn.click();
  if (event.key.toLowerCase() === 'd') toggleDrawMode();
  if (event.key.toLowerCase() === 'e') toggleEraseMode();
  if (event.key.toLowerCase() === 's') { shapePicker.hidden = false; shapeToolBtn.classList.add('active'); }
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement && document.activeElement !== textContent && !document.activeElement?.isContentEditable) document.getElementById('deleteElement').click();
});
