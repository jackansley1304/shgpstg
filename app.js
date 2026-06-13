const DEFAULTS = {
  line1: "Srikakulam, Andhra Pradesh, India",
  line2: "8v7q+6jp,  Shanti Nagar Colony, Balaga, Srikakulam,",
  line3: "Andhra Pradesh 532001, India",
  lat: 18.31289,
  lon: 83.888937,
  tzLabel: "GMT +05:30",
};

const state = {
  photos: [],
  mapImage: null,
  mapName: "",
  logoImage: null,
  logoName: "",
  fontFamily: "",
  fontName: "",
  installPrompt: null,
  busy: false,
  previewImage: null,
  previewFrame: 0,
  cropRect: null,
  cropConfirmed: false,
  cropDrag: null,
};

const els = {
  photoInput: document.getElementById("photoInput"),
  mapInput: document.getElementById("mapInput"),
  logoInput: document.getElementById("logoInput"),
  fontInput: document.getElementById("fontInput"),
  previewCanvas: document.getElementById("previewCanvas"),
  previewWrap: document.getElementById("previewWrap"),
  cropOverlay: document.getElementById("cropOverlay"),
  cropBox: document.getElementById("cropBox"),
  emptyState: document.getElementById("emptyState"),
  processButton: document.getElementById("processButton"),
  clearButton: document.getElementById("clearButton"),
  progressFill: document.getElementById("progressFill"),
  photoCount: document.getElementById("photoCount"),
  assetStatus: document.getElementById("assetStatus"),
  statusText: document.getElementById("statusText"),
  resultList: document.getElementById("resultList"),
  resultTemplate: document.getElementById("resultTemplate"),
  installButton: document.getElementById("installButton"),
  dateInput: document.getElementById("dateInput"),
  timeInput: document.getElementById("timeInput"),
  incrementInput: document.getElementById("incrementInput"),
  tzInput: document.getElementById("tzInput"),
  line1Input: document.getElementById("line1Input"),
  line2Input: document.getElementById("line2Input"),
  line3Input: document.getElementById("line3Input"),
  latInput: document.getElementById("latInput"),
  lonInput: document.getElementById("lonInput"),
  cropEnableInput: document.getElementById("cropEnableInput"),
  cropAspectInput: document.getElementById("cropAspectInput"),
  cropDoneButton: document.getElementById("cropDoneButton"),
  cropResetButton: document.getElementById("cropResetButton"),
  opacityInput: document.getElementById("opacityInput"),
  opacityValue: document.getElementById("opacityValue"),
  qualityInput: document.getElementById("qualityInput"),
  qualityValue: document.getElementById("qualityValue"),
  maxEdgeInput: document.getElementById("maxEdgeInput"),
  gpsEnableInput: document.getElementById("gpsEnableInput"),
  gpsBgInput: document.getElementById("gpsBgInput"),
  gpsTextInput: document.getElementById("gpsTextInput"),
  logoHeightInput: document.getElementById("logoHeightInput"),
  gpsMarginInput: document.getElementById("gpsMarginInput"),
  gpsOffsetXInput: document.getElementById("gpsOffsetXInput"),
  gpsOffsetYInput: document.getElementById("gpsOffsetYInput"),
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function numberValue(input, fallback) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function alphaCss(value) {
  return `rgba(0, 0, 0, ${clamp(value, 0, 255) / 255})`;
}

function currentOptions() {
  const lat = numberValue(els.latInput, DEFAULTS.lat);
  const lon = numberValue(els.lonInput, DEFAULTS.lon);
  return {
    line1: els.line1Input.value.trim() || DEFAULTS.line1,
    line2: els.line2Input.value.trim() || DEFAULTS.line2,
    line3: els.line3Input.value.trim() || DEFAULTS.line3,
    lat,
    lon,
    latLonLine: `Lat ${formatCoord(lat)}\u00b0 Long ${formatCoord(lon)}\u00b0`,
    tzLabel: els.tzInput.value.trim() || DEFAULTS.tzLabel,
    incrementMinutes: Math.trunc(numberValue(els.incrementInput, 0)),
    cropEnabled: els.cropEnableInput.checked,
    cropAspect: els.cropAspectInput.value,
    opacity: Math.trunc(numberValue(els.opacityInput, 150)),
    quality: clamp(numberValue(els.qualityInput, 95) / 100, 0.7, 0.98),
    maxEdge: Math.trunc(clamp(numberValue(els.maxEdgeInput, 4096), 800, 9000)),
    gpsEnabled: els.gpsEnableInput.checked,
    gpsBg: els.gpsBgInput.checked,
    gpsText: els.gpsTextInput.value.trim() || "GPS Map Camera",
    logoHeight: Math.trunc(clamp(numberValue(els.logoHeightInput, 52), 16, 300)),
    gpsMargin: Math.trunc(clamp(numberValue(els.gpsMarginInput, 10), 0, 200)),
    gpsOffsetX: Math.trunc(clamp(numberValue(els.gpsOffsetXInput, 0), -2000, 2000)),
    gpsOffsetY: Math.trunc(clamp(numberValue(els.gpsOffsetYInput, 0), -2000, 2000)),
    fontFamily: state.fontFamily || "Inter, Arial, Helvetica, sans-serif",
  };
}

function formatCoord(value) {
  const rounded = Math.round(value * 1000000) / 1000000;
  return String(rounded);
}

function getBaseDate() {
  const dateValue = els.dateInput.value || "2025-01-29";
  const timeValue = els.timeInput.value || "12:18";
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0);
}

function dateForIndex(index, options) {
  const date = getBaseDate();
  date.setMinutes(date.getMinutes() + options.incrementMinutes * index);
  return date;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatStampDate(date, tzLabel) {
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = pad2(date.getFullYear() % 100);
  let hours = date.getHours();
  const minutes = pad2(date.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";
  hours %= 12;
  if (hours === 0) hours = 12;
  return `${day}/${month}/${year} ${pad2(hours)}:${minutes} ${ampm} ${tzLabel}`;
}

function outputName(date, usedNames) {
  let hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours %= 12;
  if (hours === 0) hours = 12;
  const base = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}_${pad2(hours)}${pad2(date.getMinutes())}${ampm}ByGPSMapCamera`;
  let name = `${base}.jpg`;
  let counter = 1;
  while (usedNames.has(name)) {
    name = `${base}_${String(counter).padStart(3, "0")}.jpg`;
    counter += 1;
  }
  usedNames.add(name);
  return name;
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not load ${file.name}`));
    };
    image.src = url;
  });
}

async function setPhotos(files) {
  state.photos = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
  state.previewImage = null;
  state.cropRect = null;
  state.cropConfirmed = false;
  updateCounts();
  clearResults();
  if (state.photos.length === 0) {
    clearPreview();
    return;
  }
  state.previewImage = await fileToImage(state.photos[0]);
  await renderPreview();
}

async function setImageAsset(file, keyImage, keyName) {
  if (!file) return;
  const image = await fileToImage(file);
  state[keyImage] = image;
  state[keyName] = file.name;
  updateCounts();
  await renderPreview();
}

async function setFont(file) {
  if (!file) return;
  const buffer = await file.arrayBuffer();
  const family = `StampUserFont${Date.now()}`;
  const font = new FontFace(family, buffer);
  await font.load();
  document.fonts.add(font);
  state.fontFamily = `${family}, Inter, Arial, Helvetica, sans-serif`;
  state.fontName = file.name;
  updateCounts();
  await renderPreview();
}

function updateCounts() {
  els.photoCount.textContent = `${state.photos.length} ${state.photos.length === 1 ? "photo" : "photos"}`;
  const mapText = state.mapName ? `Map: ${state.mapName}` : "No map";
  const logoText = state.logoName ? `Logo: ${state.logoName}` : "no logo";
  const fontText = state.fontName ? `Font: ${state.fontName}` : "system font";
  els.assetStatus.textContent = `${mapText}, ${logoText}, ${fontText}`;
}

function clearPreview() {
  const ctx = els.previewCanvas.getContext("2d");
  ctx.clearRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);
  els.previewCanvas.removeAttribute("width");
  els.previewCanvas.removeAttribute("height");
  els.emptyState.hidden = false;
  els.previewCanvas.parentElement.classList.remove("crop-active");
  els.cropOverlay.hidden = true;
  updateCropButtons();
}

function clearResults() {
  for (const link of els.resultList.querySelectorAll("a, img")) {
    const url = link.href || link.src;
    if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
  els.resultList.replaceChildren();
}

async function renderPreview() {
  if (!state.photos.length) {
    clearPreview();
    return;
  }
  const options = currentOptions();
  const image = state.previewImage || await fileToImage(state.photos[0]);
  state.previewImage = image;
  const date = dateForIndex(0, options);
  const isEditingCrop = options.cropEnabled && !state.cropConfirmed;
  const previewCanvas = isEditingCrop
    ? drawCropEditorPhoto(image, options)
    : drawStampedPhoto(image, options, date, true);
  const ctx = els.previewCanvas.getContext("2d");
  els.previewCanvas.width = previewCanvas.width;
  els.previewCanvas.height = previewCanvas.height;
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.drawImage(previewCanvas, 0, 0);
  els.emptyState.hidden = true;
  els.previewCanvas.parentElement.classList.toggle("crop-active", isEditingCrop);
  if (isEditingCrop) {
    ensureCropRect(image, options);
    requestAnimationFrame(() => updateCropOverlay());
  } else {
    els.cropOverlay.hidden = true;
  }
  updateCropButtons();
}

function drawCropEditorPhoto(image, options) {
  const sourceW = image.naturalWidth || image.width;
  const sourceH = image.naturalHeight || image.height;
  const maxEdge = Math.min(options.maxEdge, 1600);
  const scale = Math.min(1, maxEdge / Math.max(sourceW, sourceH));
  const W = Math.max(1, Math.round(sourceW * scale));
  const H = Math.max(1, Math.round(sourceH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, W, H);
  return canvas;
}

function drawStampedPhoto(image, options, date, previewOnly = false) {
  const sourceW = image.naturalWidth || image.width;
  const sourceH = image.naturalHeight || image.height;
  const crop = resolveCropRect(sourceW, sourceH, options);
  const maxEdge = previewOnly ? Math.min(options.maxEdge, 1600) : options.maxEdge;
  const scale = Math.min(1, maxEdge / Math.max(crop.sw, crop.sh));
  const W = Math.max(1, Math.round(crop.sw * scale));
  const H = Math.max(1, Math.round(crop.sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, W, H);

  const stampH = Math.trunc(clamp(H * 0.18, 120, 320));
  const pad = Math.trunc(clamp(stampH * 0.06, 8, 16));
  const mapSize = stampH - 2 * pad;
  const stampY0 = H - stampH;
  const mapX0 = pad;
  const mapY0 = stampY0 + pad;
  const panelX0 = mapX0 + mapSize + pad;
  const panelY0 = stampY0 + pad;
  const panelX1 = W - pad;
  const panelY1 = H - pad;
  const panelW = Math.max(10, panelX1 - panelX0);
  const panelH = Math.max(10, panelY1 - panelY0);

  ctx.fillStyle = alphaCss(options.opacity);
  ctx.fillRect(panelX0, panelY0, panelW, panelH);
  drawMapTile(ctx, state.mapImage, mapX0, mapY0, mapSize);

  const stampDate = formatStampDate(date, options.tzLabel);
  const textPadX = Math.trunc(clamp(stampH * 0.08, 10, 18));
  const textPadY = Math.trunc(clamp(stampH * 0.08, 10, 18));
  const textScale = computeFontScale(ctx, panelW, panelH, stampH, textPadX, textPadY, stampDate, options);
  const fonts = makeFonts(stampH, textScale, options.fontFamily);

  ctx.fillStyle = "#fff";
  ctx.textBaseline = "top";
  let x = panelX0 + textPadX;
  let y = panelY0 + textPadY;

  ctx.font = fonts.title;
  ctx.fillText(options.line1, x, y);
  y += Math.trunc(fonts.titleSize * 1.25);

  ctx.font = fonts.body;
  ctx.fillText(options.line2, x, y);
  y += Math.trunc(fonts.bodySize * 1.25);
  ctx.fillText(options.line3, x, y);
  y += Math.trunc(fonts.bodySize * 1.25);

  ctx.font = fonts.small;
  ctx.fillText(options.latLonLine, x, y);
  y += Math.trunc(fonts.smallSize * 1.35);
  ctx.fillText(stampDate, x, y);

  if (options.gpsEnabled) {
    drawGpsEntity(ctx, options, W, H, stampY0, pad);
  }

  return canvas;
}

function resolveCropRect(sourceW, sourceH, options) {
  if (!options.cropEnabled) {
    return { sx: 0, sy: 0, sw: sourceW, sh: sourceH };
  }

  const rect = normalizedCropFor(sourceW, sourceH, options);

  return {
    sx: rect.x * sourceW,
    sy: rect.y * sourceH,
    sw: rect.w * sourceW,
    sh: rect.h * sourceH,
  };
}

function cropAspectValue(value, fallback) {
  if (value === "free") return null;
  if (value === "1:1") return 1;
  if (value === "4:5") return 4 / 5;
  if (value === "3:4") return 3 / 4;
  if (value === "16:9") return 16 / 9;
  if (value === "9:16") return 9 / 16;
  return fallback;
}

function normalizedCropFor(sourceW, sourceH, options) {
  if (!state.cropRect) {
    return defaultCropRect(sourceW, sourceH, options);
  }
  return clampCropRect(state.cropRect);
}

function ensureCropRect(image, options) {
  const sourceW = image.naturalWidth || image.width;
  const sourceH = image.naturalHeight || image.height;
  if (!state.cropRect) {
    state.cropRect = defaultCropRect(sourceW, sourceH, options);
  } else {
    state.cropRect = clampCropRect(state.cropRect);
  }
  return state.cropRect;
}

function defaultCropRect(sourceW, sourceH, options) {
  const imageAspect = sourceW / sourceH;
  const desiredAspect = cropAspectValue(options.cropAspect, imageAspect);
  if (!desiredAspect) {
    return { x: 0.08, y: 0.08, w: 0.84, h: 0.84 };
  }

  let w = 1;
  let h = imageAspect / desiredAspect;
  if (h > 1) {
    h = 1;
    w = desiredAspect / imageAspect;
  }
  w *= 0.84;
  h *= 0.84;
  return clampCropRect({
    x: (1 - w) / 2,
    y: (1 - h) / 2,
    w,
    h,
  });
}

function clampCropRect(rect) {
  const minSize = 0.06;
  const w = clamp(rect.w, minSize, 1);
  const h = clamp(rect.h, minSize, 1);
  return {
    x: clamp(rect.x, 0, 1 - w),
    y: clamp(rect.y, 0, 1 - h),
    w,
    h,
  };
}

function makeFonts(stampH, scale, family) {
  const titleSize = Math.max(10, Math.trunc(Math.max(14, stampH * 0.16) * scale));
  const bodySize = Math.max(9, Math.trunc(Math.max(12, stampH * 0.12) * scale));
  const smallSize = Math.max(8, Math.trunc(Math.max(11, stampH * 0.11) * scale));
  return {
    titleSize,
    bodySize,
    smallSize,
    title: `700 ${titleSize}px ${family}`,
    body: `500 ${bodySize}px ${family}`,
    small: `500 ${smallSize}px ${family}`,
  };
}

function computeFontScale(ctx, panelW, panelH, stampH, padX, padY, stampDate, options) {
  const availableW = Math.max(10, panelW - 2 * padX);
  const availableH = Math.max(10, panelH - 2 * padY);
  let scale = 1;

  for (let i = 0; i < 60; i += 1) {
    const fonts = makeFonts(stampH, scale, options.fontFamily);
    let widthsOk = true;

    ctx.font = fonts.title;
    if (ctx.measureText(options.line1).width > availableW) widthsOk = false;

    ctx.font = fonts.body;
    for (const line of [options.line2, options.line3]) {
      if (ctx.measureText(line).width > availableW) widthsOk = false;
    }

    ctx.font = fonts.small;
    for (const line of [options.latLonLine, stampDate]) {
      if (ctx.measureText(line).width > availableW) widthsOk = false;
    }

    const totalH =
      Math.trunc(fonts.titleSize * 1.25) +
      Math.trunc(fonts.bodySize * 1.25) * 2 +
      Math.trunc(fonts.smallSize * 1.35) +
      Math.trunc(fonts.smallSize * 1.1);

    if (widthsOk && totalH <= availableH) return scale;
    scale *= 0.96;
    if (scale < 0.55) return scale;
  }

  return scale;
}

function drawMapTile(ctx, mapImage, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.clip();

  if (mapImage) {
    const mw = mapImage.naturalWidth || mapImage.width;
    const mh = mapImage.naturalHeight || mapImage.height;
    const side = Math.min(mw, mh);
    const sx = Math.floor((mw - side) / 2);
    const sy = Math.floor((mh - side) / 2);
    ctx.drawImage(mapImage, sx, sy, side, side, x, y, size, size);
  } else {
    const grd = ctx.createLinearGradient(x, y, x + size, y + size);
    grd.addColorStop(0, "#d5ded0");
    grd.addColorStop(0.5, "#e6dfc5");
    grd.addColorStop(1, "#c4d9e8");
    ctx.fillStyle = grd;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "rgba(47, 92, 83, 0.35)";
    ctx.lineWidth = Math.max(1, size / 70);
    for (let i = -size; i < size * 2; i += size / 5) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + size, y + size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + i, y + size);
      ctx.lineTo(x + i + size, y);
      ctx.stroke();
    }
    drawPin(ctx, x + size * 0.5, y + size * 0.46, size * 0.16);
  }

  ctx.restore();
}

function drawPin(ctx, cx, cy, radius) {
  ctx.save();
  ctx.fillStyle = "#c73642";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
  ctx.lineWidth = Math.max(1, radius * 0.12);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI * 0.12, Math.PI * 1.88);
  ctx.quadraticCurveTo(cx, cy + radius * 2.45, cx, cy + radius * 2.45);
  ctx.quadraticCurveTo(cx - radius * 0.95, cy + radius * 0.7, cx - radius * 0.88, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGpsEntity(ctx, options, W, H, stampY0, pad) {
  const logoH = Math.trunc(clamp(options.logoHeight, 16, 300));
  const fontSize = Math.trunc(clamp(logoH * 0.62, 10, 72));
  const family = options.fontFamily;
  const text = options.gpsText;
  const entityPad = Math.trunc(clamp(logoH * 0.22, 6, 16));
  const gap = Math.trunc(clamp(logoH * 0.18, 6, 16));
  const radius = Math.trunc(clamp(logoH * 0.25, 8, 18));

  ctx.save();
  ctx.font = `700 ${fontSize}px ${family}`;
  ctx.textBaseline = "middle";
  const metrics = ctx.measureText(text);
  const textW = Math.ceil(metrics.width);
  const textH = Math.ceil(fontSize * 1.2);
  let logoW = logoH;

  if (state.logoImage) {
    const lw = state.logoImage.naturalWidth || state.logoImage.width;
    const lh = state.logoImage.naturalHeight || state.logoImage.height;
    logoW = Math.max(16, Math.round(lw * (logoH / lh)));
  }

  const contentW = logoW + gap + textW;
  const contentH = Math.max(logoH, textH);
  const entityW = contentW + entityPad * 2;
  const entityH = contentH + entityPad * 2;
  let x = W - pad - entityW + options.gpsOffsetX;
  let y = Math.max(pad, stampY0 - options.gpsMargin - entityH) + options.gpsOffsetY;
  x = Math.trunc(clamp(x, 0, Math.max(0, W - entityW)));
  y = Math.trunc(clamp(y, 0, Math.max(0, H - entityH)));

  if (options.gpsBg) {
    ctx.fillStyle = alphaCss(options.opacity);
    roundedRect(ctx, x, y, entityW, entityH, radius);
    ctx.fill();
  }

  const logoX = x + entityPad;
  const logoY = y + entityPad + Math.round((contentH - logoH) / 2);
  if (state.logoImage) {
    ctx.drawImage(state.logoImage, logoX, logoY, logoW, logoH);
  } else {
    drawPin(ctx, logoX + logoW * 0.5, logoY + logoH * 0.38, logoH * 0.28);
  }

  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
  ctx.shadowBlur = 2;
  ctx.fillText(text, logoX + logoW + gap, y + entityPad + contentH / 2);
  ctx.restore();
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not export JPEG"));
    }, "image/jpeg", quality);
  });
}

async function processPhotos() {
  if (state.busy || state.photos.length === 0) return;
  state.busy = true;
  setBusy(true);
  clearResults();
  const options = currentOptions();
  const usedNames = new Set();

  try {
    for (let index = 0; index < state.photos.length; index += 1) {
      const file = state.photos[index];
      setStatus(`Processing ${index + 1} of ${state.photos.length}`);
      setProgress(index / state.photos.length);
      const image = await fileToImage(file);
      const date = dateForIndex(index, options);
      const canvas = drawStampedPhoto(image, options, date, false);
      const rawBlob = await canvasToJpegBlob(canvas, options.quality);
      const exifBlob = await addExifToJpeg(rawBlob, date, options.lat, options.lon);
      const name = outputName(date, usedNames);
      appendResult(exifBlob, name, canvas.width, canvas.height);
      if (index === 0) await renderPreview();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    setStatus(`Done: ${state.photos.length} ${state.photos.length === 1 ? "photo" : "photos"}`);
    setProgress(1);
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Processing failed");
  } finally {
    setBusy(false);
    state.busy = false;
  }
}

function setBusy(isBusy) {
  els.processButton.disabled = isBusy;
  els.clearButton.disabled = isBusy;
}

function setStatus(text) {
  els.statusText.textContent = text;
}

function setProgress(ratio) {
  els.progressFill.style.width = `${Math.round(clamp(ratio, 0, 1) * 100)}%`;
}

function appendResult(blob, name, width, height) {
  const item = els.resultTemplate.content.firstElementChild.cloneNode(true);
  const url = URL.createObjectURL(blob);
  const img = item.querySelector("img");
  const title = item.querySelector("h3");
  const meta = item.querySelector("p");
  const download = item.querySelector(".download-link");
  const shareButton = item.querySelector(".share-button");

  img.src = url;
  img.alt = name;
  title.textContent = name;
  meta.textContent = `${width} x ${height} px, ${formatBytes(blob.size)}`;
  download.href = url;
  download.download = name;

  const file = new File([blob], name, { type: "image/jpeg" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    shareButton.addEventListener("click", async () => {
      try {
        await navigator.share({ files: [file], title: name });
      } catch (error) {
        if (error.name !== "AbortError") setStatus("Share failed");
      }
    });
  } else {
    shareButton.hidden = true;
  }

  els.resultList.append(item);
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function addExifToJpeg(blob, date, lat, lon) {
  const source = new Uint8Array(await blob.arrayBuffer());
  if (source.length < 4 || source[0] !== 0xff || source[1] !== 0xd8) {
    return blob;
  }

  const exifPayload = buildExifPayload(date, lat, lon);
  const segmentLength = exifPayload.length + 2;
  if (segmentLength > 0xffff) return blob;

  const app1 = new Uint8Array(4 + exifPayload.length);
  app1[0] = 0xff;
  app1[1] = 0xe1;
  app1[2] = (segmentLength >> 8) & 0xff;
  app1[3] = segmentLength & 0xff;
  app1.set(exifPayload, 4);

  const out = new Uint8Array(2 + app1.length + source.length - 2);
  out[0] = 0xff;
  out[1] = 0xd8;
  out.set(app1, 2);
  out.set(source.subarray(2), 2 + app1.length);
  return new Blob([out], { type: "image/jpeg" });
}

function buildExifPayload(date, lat, lon) {
  const dateString = exifDate(date);
  const dateBytes = asciiBytes(`${dateString}\0`);
  const latDms = dmsFromDecimal(lat);
  const lonDms = dmsFromDecimal(lon);
  const latRef = lat >= 0 ? "N" : "S";
  const lonRef = lon >= 0 ? "E" : "W";

  const zerothOffset = 8;
  const zerothEntries = 3;
  const zerothSize = 2 + zerothEntries * 12 + 4;
  const dateTimeOffset = zerothOffset + zerothSize;
  const exifIfdOffset = dateTimeOffset + dateBytes.length;
  const exifEntries = 2;
  const exifSize = 2 + exifEntries * 12 + 4;
  const exifDateOriginalOffset = exifIfdOffset + exifSize;
  const exifDateDigitizedOffset = exifDateOriginalOffset + dateBytes.length;
  const gpsIfdOffset = exifDateDigitizedOffset + dateBytes.length;
  const gpsEntries = 4;
  const gpsSize = 2 + gpsEntries * 12 + 4;
  const gpsLatOffset = gpsIfdOffset + gpsSize;
  const gpsLonOffset = gpsLatOffset + 24;
  const tiffSize = gpsLonOffset + 24;

  const tiff = new Uint8Array(tiffSize);
  const view = new DataView(tiff.buffer);

  tiff[0] = 0x49;
  tiff[1] = 0x49;
  view.setUint16(2, 42, true);
  view.setUint32(4, zerothOffset, true);

  view.setUint16(zerothOffset, zerothEntries, true);
  writeIfdEntry(view, zerothOffset + 2, 0x0132, 2, dateBytes.length, dateTimeOffset);
  writeIfdEntry(view, zerothOffset + 14, 0x8769, 4, 1, exifIfdOffset);
  writeIfdEntry(view, zerothOffset + 26, 0x8825, 4, 1, gpsIfdOffset);
  view.setUint32(zerothOffset + 38, 0, true);
  tiff.set(dateBytes, dateTimeOffset);

  view.setUint16(exifIfdOffset, exifEntries, true);
  writeIfdEntry(view, exifIfdOffset + 2, 0x9003, 2, dateBytes.length, exifDateOriginalOffset);
  writeIfdEntry(view, exifIfdOffset + 14, 0x9004, 2, dateBytes.length, exifDateDigitizedOffset);
  view.setUint32(exifIfdOffset + 26, 0, true);
  tiff.set(dateBytes, exifDateOriginalOffset);
  tiff.set(dateBytes, exifDateDigitizedOffset);

  view.setUint16(gpsIfdOffset, gpsEntries, true);
  writeAsciiInline(tiff, view, gpsIfdOffset + 2, 0x0001, `${latRef}\0`);
  writeIfdEntry(view, gpsIfdOffset + 14, 0x0002, 5, 3, gpsLatOffset);
  writeAsciiInline(tiff, view, gpsIfdOffset + 26, 0x0003, `${lonRef}\0`);
  writeIfdEntry(view, gpsIfdOffset + 38, 0x0004, 5, 3, gpsLonOffset);
  view.setUint32(gpsIfdOffset + 50, 0, true);
  writeDmsRationals(view, gpsLatOffset, latDms);
  writeDmsRationals(view, gpsLonOffset, lonDms);

  const header = asciiBytes("Exif\0\0");
  const payload = new Uint8Array(header.length + tiff.length);
  payload.set(header, 0);
  payload.set(tiff, header.length);
  return payload;
}

function writeIfdEntry(view, offset, tag, type, count, valueOrOffset) {
  view.setUint16(offset, tag, true);
  view.setUint16(offset + 2, type, true);
  view.setUint32(offset + 4, count, true);
  view.setUint32(offset + 8, valueOrOffset, true);
}

function writeAsciiInline(bytes, view, offset, tag, text) {
  writeIfdEntry(view, offset, tag, 2, text.length, 0);
  const value = asciiBytes(text);
  bytes.set(value.slice(0, 4), offset + 8);
}

function writeDmsRationals(view, offset, dms) {
  for (let i = 0; i < dms.length; i += 1) {
    const [num, den] = dms[i];
    view.setUint32(offset + i * 8, num, true);
    view.setUint32(offset + i * 8 + 4, den, true);
  }
}

function dmsFromDecimal(decimal) {
  const absolute = Math.abs(decimal);
  const deg = Math.floor(absolute);
  const minutesFloat = (absolute - deg) * 60;
  const min = Math.floor(minutesFloat);
  const secFloat = (minutesFloat - min) * 60;
  return [
    [deg, 1],
    [min, 1],
    [Math.round(secFloat * 10000), 10000],
  ];
}

function exifDate(date) {
  return `${date.getFullYear()}:${pad2(date.getMonth() + 1)}:${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function asciiBytes(text) {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function resetAll() {
  state.photos = [];
  state.previewImage = null;
  state.cropRect = null;
  state.cropConfirmed = false;
  els.photoInput.value = "";
  clearResults();
  clearPreview();
  setProgress(0);
  setStatus("Ready");
  updateCounts();
}

function resetCrop() {
  state.cropRect = null;
  state.cropConfirmed = false;
  updateRangeOutputs();
  renderPreview().catch((error) => setStatus(error.message));
}

function toggleCropDone() {
  if (!els.cropEnableInput.checked || !state.previewImage) return;
  if (state.cropConfirmed) {
    state.cropConfirmed = false;
  } else {
    ensureCropRect(state.previewImage, currentOptions());
    state.cropConfirmed = true;
  }
  renderPreview().catch((error) => setStatus(error.message));
}

function updateCropButtons() {
  const hasCropPhoto = Boolean(state.previewImage && els.cropEnableInput.checked);
  els.cropDoneButton.disabled = !hasCropPhoto;
  els.cropResetButton.disabled = !hasCropPhoto;
  els.cropDoneButton.textContent = state.cropConfirmed ? "Edit Crop" : "Done Crop";
}

function updateRangeOutputs() {
  els.opacityValue.textContent = els.opacityInput.value;
  els.qualityValue.textContent = els.qualityInput.value;
}

function schedulePreview() {
  if (state.previewFrame) cancelAnimationFrame(state.previewFrame);
  state.previewFrame = requestAnimationFrame(() => {
    state.previewFrame = 0;
    renderPreview().catch((error) => setStatus(error.message));
  });
}

function updateCropOverlay() {
  const options = currentOptions();
  if (!options.cropEnabled || !state.previewImage || !state.cropRect) {
    els.cropOverlay.hidden = true;
    return;
  }

  const wrapRect = els.previewWrap.getBoundingClientRect();
  const canvasRect = els.previewCanvas.getBoundingClientRect();
  const left = canvasRect.left - wrapRect.left;
  const top = canvasRect.top - wrapRect.top;

  els.cropOverlay.hidden = false;
  els.cropOverlay.style.left = `${left}px`;
  els.cropOverlay.style.top = `${top}px`;
  els.cropOverlay.style.width = `${canvasRect.width}px`;
  els.cropOverlay.style.height = `${canvasRect.height}px`;

  const rect = clampCropRect(state.cropRect);
  els.cropBox.style.left = `${rect.x * canvasRect.width}px`;
  els.cropBox.style.top = `${rect.y * canvasRect.height}px`;
  els.cropBox.style.width = `${rect.w * canvasRect.width}px`;
  els.cropBox.style.height = `${rect.h * canvasRect.height}px`;
}

function startCropDrag(event) {
  const options = currentOptions();
  if (!options.cropEnabled || state.cropConfirmed || !state.previewImage || !state.cropRect) return;
  event.preventDefault();

  const overlayRect = els.cropOverlay.getBoundingClientRect();
  const sourceW = state.previewImage.naturalWidth || state.previewImage.width;
  const sourceH = state.previewImage.naturalHeight || state.previewImage.height;
  const imageAspect = sourceW / sourceH;
  const desiredAspect = cropAspectValue(options.cropAspect, imageAspect);
  const handle = event.target.dataset.handle || "move";

  state.cropDrag = {
    pointerId: event.pointerId,
    handle,
    startX: event.clientX,
    startY: event.clientY,
    startRect: { ...state.cropRect },
    overlayW: overlayRect.width,
    overlayH: overlayRect.height,
    aspect: desiredAspect ? desiredAspect / imageAspect : null,
  };
  els.cropBox.setPointerCapture?.(event.pointerId);
}

function moveCropDrag(event) {
  if (!state.cropDrag || state.cropDrag.pointerId !== event.pointerId) return;
  event.preventDefault();

  const drag = state.cropDrag;
  const dx = (event.clientX - drag.startX) / Math.max(1, drag.overlayW);
  const dy = (event.clientY - drag.startY) / Math.max(1, drag.overlayH);

  if (drag.handle === "move") {
    state.cropRect = clampCropRect({
      ...drag.startRect,
      x: drag.startRect.x + dx,
      y: drag.startRect.y + dy,
    });
  } else if (drag.aspect) {
    state.cropRect = resizeFixedAspectCrop(drag.startRect, drag.handle, dx, dy, drag.aspect);
  } else {
    state.cropRect = resizeFreeCrop(drag.startRect, drag.handle, dx, dy);
  }

  updateCropOverlay();
}

function endCropDrag(event) {
  if (!state.cropDrag || state.cropDrag.pointerId !== event.pointerId) return;
  state.cropDrag = null;
  els.cropBox.releasePointerCapture?.(event.pointerId);
  schedulePreview();
}

function resizeFreeCrop(start, handle, dx, dy) {
  const minSize = 0.06;
  let left = start.x;
  let top = start.y;
  let right = start.x + start.w;
  let bottom = start.y + start.h;

  if (handle.includes("w")) left = clamp(left + dx, 0, right - minSize);
  if (handle.includes("e")) right = clamp(right + dx, left + minSize, 1);
  if (handle.includes("n")) top = clamp(top + dy, 0, bottom - minSize);
  if (handle.includes("s")) bottom = clamp(bottom + dy, top + minSize, 1);

  return clampCropRect({
    x: left,
    y: top,
    w: right - left,
    h: bottom - top,
  });
}

function resizeFixedAspectCrop(start, handle, dx, dy, normAspect) {
  const minSize = 0.06;
  const anchorX = handle.includes("w") ? start.x + start.w : start.x;
  const anchorY = handle.includes("n") ? start.y + start.h : start.y;
  const dirX = handle.includes("w") ? -1 : 1;
  const dirY = handle.includes("n") ? -1 : 1;
  const pointerX = handle.includes("w") ? start.x + dx : start.x + start.w + dx;
  const pointerY = handle.includes("n") ? start.y + dy : start.y + start.h + dy;

  let w = Math.abs(pointerX - anchorX);
  let h = Math.abs(pointerY - anchorY);
  if (w / Math.max(h, 0.001) > normAspect) {
    w = h * normAspect;
  } else {
    h = w / normAspect;
  }

  const maxW = dirX > 0 ? 1 - anchorX : anchorX;
  const maxH = dirY > 0 ? 1 - anchorY : anchorY;
  if (w > maxW) {
    w = maxW;
    h = w / normAspect;
  }
  if (h > maxH) {
    h = maxH;
    w = h * normAspect;
  }

  w = clamp(w, minSize, maxW);
  h = clamp(h, minSize, maxH);

  return clampCropRect({
    x: dirX > 0 ? anchorX : anchorX - w,
    y: dirY > 0 ? anchorY : anchorY - h,
    w,
    h,
  });
}

function wireEvents() {
  els.photoInput.addEventListener("change", async (event) => {
    try {
      await setPhotos(event.target.files);
      setStatus(state.photos.length ? "Photos loaded" : "Ready");
    } catch (error) {
      setStatus(error.message);
    }
  });

  els.mapInput.addEventListener("change", async (event) => {
    try {
      await setImageAsset(event.target.files[0], "mapImage", "mapName");
      setStatus("Map loaded");
    } catch (error) {
      setStatus(error.message);
    }
  });

  els.logoInput.addEventListener("change", async (event) => {
    try {
      await setImageAsset(event.target.files[0], "logoImage", "logoName");
      setStatus("Logo loaded");
    } catch (error) {
      setStatus(error.message);
    }
  });

  els.fontInput.addEventListener("change", async (event) => {
    try {
      await setFont(event.target.files[0]);
      setStatus("Font loaded");
    } catch (error) {
      setStatus("Font failed");
    }
  });

  els.processButton.addEventListener("click", processPhotos);
  els.clearButton.addEventListener("click", resetAll);
  els.cropDoneButton.addEventListener("click", toggleCropDone);
  els.cropResetButton.addEventListener("click", resetCrop);
  els.cropBox.addEventListener("pointerdown", startCropDrag);
  els.cropBox.addEventListener("pointermove", moveCropDrag);
  els.cropBox.addEventListener("pointerup", endCropDrag);
  els.cropBox.addEventListener("pointercancel", endCropDrag);
  els.cropAspectInput.addEventListener("change", () => {
    state.cropRect = null;
    state.cropConfirmed = false;
    schedulePreview();
  });
  els.cropEnableInput.addEventListener("change", () => {
    if (els.cropEnableInput.checked) state.cropRect = null;
    state.cropConfirmed = false;
    updateCropButtons();
    schedulePreview();
  });
  window.addEventListener("resize", () => updateCropOverlay());

  for (const input of document.querySelectorAll(".settings input, .settings select")) {
    input.addEventListener("input", () => {
      updateRangeOutputs();
      schedulePreview();
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installPrompt = event;
    els.installButton.hidden = false;
  });

  els.installButton.addEventListener("click", async () => {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    els.installButton.hidden = true;
  });
}

function registerServiceWorker() {
  const canRegister =
    "serviceWorker" in navigator &&
    (location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1");

  if (!canRegister) return;
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

wireEvents();
updateCounts();
updateRangeOutputs();
updateCropButtons();
clearPreview();
registerServiceWorker();
