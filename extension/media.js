/**
 * Shared media asset helpers for uploaded backgrounds / theme wallpapers.
 * Stores data URLs in chrome.storage.local under dynMediaAssets.
 */
(function (root) {
  const STORE_KEY = "dynMediaAssets";
  const ITEM_PREFIX = "dynMediaAsset:";
  const MAX_BYTES = 3.5 * 1024 * 1024;
  const MAX_FOLDER_BYTES = 64 * 1024 * 1024;
  const MAX_IMAGE_EDGE = 1600;
  const IMAGE_QUALITY = 0.84;
  const BG_FITS = ["cover", "contain", "fill", "center"];

  // Stable formats Chromium can usually paint in <img> / <video>.
  // Folder scanning also uses MEDIA_EXTENSIONS below.
  const MEDIA_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".avif",
    ".svg",
    ".mp4",
    ".webm",
    ".mov",
    ".m4v",
    ".ogv",
    ".ogg",
  ];

  const FORMAT_HELP =
    "Images: JPEG, PNG, WebP, GIF, BMP, AVIF, SVG. " +
    "Video: MP4, WebM, MOV, M4V, Ogg/OGV.";

  function extensionAlive() {
    try {
      return Boolean(chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  function storageGet(keys) {
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve({});
        return;
      }
      try {
        chrome.storage.local.get(keys, (stored) => {
          if (chrome.runtime.lastError) resolve({});
          else resolve(stored || {});
        });
      } catch {
        resolve({});
      }
    });
  }

  function storageSet(patch) {
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve(false);
        return;
      }
      try {
        chrome.storage.local.set(patch, () => resolve(!chrome.runtime.lastError));
      } catch {
        resolve(false);
      }
    });
  }

  function storageRemove(keys) {
    return new Promise((resolve) => {
      if (!extensionAlive()) {
        resolve(false);
        return;
      }
      try {
        chrome.storage.local.remove(keys, () => resolve(!chrome.runtime.lastError));
      } catch {
        resolve(false);
      }
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function itemKey(id) {
    return ITEM_PREFIX + id;
  }

  function formatMediaRecord(id, item) {
    if (!item || !item.dataUrl) return null;
    return {
      id,
      mime: String(item.mime || ""),
      dataUrl: String(item.dataUrl || ""),
      name: String(item.name || ""),
      bytes: Number(item.bytes) || estimateDataUrlBytes(item.dataUrl),
    };
  }

  function estimateDataUrlBytes(dataUrl) {
    const raw = String(dataUrl || "");
    const comma = raw.indexOf(",");
    if (comma < 0) return raw.length;
    const b64 = raw.slice(comma + 1);
    return Math.floor((b64.length * 3) / 4);
  }

  function guessMimeFromName(name) {
    const lower = String(name || "").toLowerCase();
    if (/\.png$/i.test(lower)) return "image/png";
    if (/\.webp$/i.test(lower)) return "image/webp";
    if (/\.gif$/i.test(lower)) return "image/gif";
    if (/\.jpe?g$/i.test(lower)) return "image/jpeg";
    if (/\.bmp$/i.test(lower)) return "image/bmp";
    if (/\.avif$/i.test(lower)) return "image/avif";
    if (/\.svg$/i.test(lower)) return "image/svg+xml";
    if (/\.mp4$/i.test(lower)) return "video/mp4";
    if (/\.webm$/i.test(lower)) return "video/webm";
    if (/\.mov$/i.test(lower)) return "video/quicktime";
    if (/\.m4v$/i.test(lower)) return "video/x-m4v";
    if (/\.ogv$/i.test(lower)) return "video/ogg";
    if (/\.ogg$/i.test(lower)) return "video/ogg";
    return "";
  }

  function isAllowedMime(mime, fileName) {
    const m = String(mime || "").toLowerCase() || guessMimeFromName(fileName);
    if (!m) return false;
    if (m.startsWith("video/")) return true;
    return (
      m === "image/jpeg" ||
      m === "image/jpg" ||
      m === "image/png" ||
      m === "image/webp" ||
      m === "image/gif" ||
      m === "image/bmp" ||
      m === "image/avif" ||
      m === "image/svg+xml"
    );
  }

  function isPassthroughImage(mime) {
    const m = String(mime || "").toLowerCase();
    return m === "image/gif" || m === "image/svg+xml" || m === "image/avif";
  }

  function normalizeFit(value) {
    const next = String(value || "cover").toLowerCase();
    return BG_FITS.includes(next) ? next : "cover";
  }

  function fitCss(fit) {
    const mode = normalizeFit(fit);
    if (mode === "contain") return { objectFit: "contain", objectPosition: "center" };
    if (mode === "fill") return { objectFit: "fill", objectPosition: "center" };
    if (mode === "center") return { objectFit: "none", objectPosition: "center" };
    return { objectFit: "cover", objectPosition: "center" };
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read that file."));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode that image."));
      img.src = src;
    });
  }

  async function compressRasterImage(file, opts) {
    const options = opts && typeof opts === "object" ? opts : {};
    const fromFolder = Boolean(options.fromFolder);
    const maxBytes = Number(options.maxBytes) > 0 ? Number(options.maxBytes) : MAX_BYTES;
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const w = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
    const h = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process that image.");
    ctx.drawImage(img, 0, 0, w, h);
    const outMime = file.type === "image/png" ? "image/png" : "image/jpeg";
    const out = canvas.toDataURL(outMime, IMAGE_QUALITY);
    if (!fromFolder && estimateDataUrlBytes(out) > MAX_BYTES) {
      throw new Error("Image is still too large after compression. Try a smaller file.");
    }
    if (fromFolder && estimateDataUrlBytes(out) > maxBytes) {
      throw new Error("Image is still too large after compression (max about 64 MB).");
    }
    return {
      mime: outMime,
      dataUrl: out,
      name: String(file.name || "image").slice(0, 80),
      bytes: estimateDataUrlBytes(out),
    };
  }

  async function ingestFile(file, opts) {
    if (!file) throw new Error("No file selected.");
    const options = opts && typeof opts === "object" ? opts : {};
    const fromFolder = Boolean(options.fromFolder);
    const maxBytes = fromFolder
      ? Number(options.maxBytes) > 0
        ? Number(options.maxBytes)
        : MAX_FOLDER_BYTES
      : MAX_BYTES;
    let mime = String(file.type || "").toLowerCase();
    if (!mime) mime = guessMimeFromName(file.name) || "application/octet-stream";
    if (!isAllowedMime(mime, file.name)) {
      throw new Error("Unsupported type. " + FORMAT_HELP);
    }
    if (isPassthroughImage(mime) || mime.startsWith("video/")) {
      if (file.size > maxBytes) {
        throw new Error(
          fromFolder
            ? "That file is too large (folder max about 64 MB)."
            : "That file is too large (upload max about 3.5 MB)."
        );
      }
      const dataUrl = await readFileAsDataUrl(file);
      return {
        mime,
        dataUrl,
        name: String(file.name || "media").slice(0, 80),
        bytes: estimateDataUrlBytes(dataUrl),
        source: fromFolder ? "folder" : "upload",
      };
    }
    if (mime.startsWith("image/")) {
      if (file.size > (fromFolder ? maxBytes : MAX_BYTES * 4)) {
        throw new Error(
          fromFolder
            ? "That image is too large (folder max about 64 MB)."
            : "That image is too large to import."
        );
      }
      const asset = await compressRasterImage(file, { fromFolder, maxBytes });
      asset.source = fromFolder ? "folder" : "upload";
      return asset;
    }
    throw new Error("Unsupported type. " + FORMAT_HELP);
  }

  const memoryStore = Object.create(null);

  async function loadAll() {
    if (extensionAlive()) {
      const stored = await storageGet({ [STORE_KEY]: {} });
      const map = stored[STORE_KEY];
      return map && typeof map === "object" ? { ...map } : {};
    }
    return { ...memoryStore };
  }

  async function readStoredItem(id) {
    if (!id) return null;
    if (memoryStore[id] && memoryStore[id].dataUrl) return memoryStore[id];
    if (!extensionAlive()) return null;
    const key = itemKey(id);
    const stored = await storageGet({ [key]: null, [STORE_KEY]: {} });
    if (stored[key] && stored[key].dataUrl) {
      memoryStore[id] = stored[key];
      return stored[key];
    }
    const legacy = stored[STORE_KEY];
    const item = legacy && typeof legacy === "object" ? legacy[id] : null;
    if (item && item.dataUrl) {
      memoryStore[id] = item;
      // Migrate off the monolithic map so refresh reads a single stable key.
      await storageSet({ [key]: item });
      return item;
    }
    return null;
  }

  async function getMedia(id, opts) {
    if (!id) return null;
    const retries = opts && Number.isFinite(opts.retries) ? Math.max(1, opts.retries) : 4;
    for (let attempt = 0; attempt < retries; attempt += 1) {
      const item = await readStoredItem(id);
      const out = formatMediaRecord(id, item);
      if (out) return out;
      if (attempt < retries - 1) await sleep(60 * (attempt + 1));
    }
    return null;
  }

  async function putMedia(id, asset) {
    if (!id || !asset || !asset.dataUrl) return false;
    const entry = {
      mime: String(asset.mime || "application/octet-stream"),
      dataUrl: String(asset.dataUrl),
      name: String(asset.name || "").slice(0, 80),
      bytes: Number(asset.bytes) || estimateDataUrlBytes(asset.dataUrl),
      updatedAt: Date.now(),
    };
    memoryStore[id] = entry;
    if (!extensionAlive()) return true;
    const key = itemKey(id);
    if (!(await storageSet({ [key]: entry }))) return false;
    // Keep the legacy index for older builds; ignore failure if the blob alone fits.
    const all = await loadAll();
    all[id] = entry;
    await storageSet({ [STORE_KEY]: all });
    return true;
  }

  async function removeMedia(id) {
    if (!id) return false;
    delete memoryStore[id];
    if (!extensionAlive()) return true;
    await storageRemove(itemKey(id));
    const all = await loadAll();
    if (!all[id]) return true;
    delete all[id];
    return storageSet({ [STORE_KEY]: all });
  }

  function isVideoMime(mime) {
    return String(mime || "").toLowerCase().startsWith("video/");
  }

  function isGifMime(mime) {
    return String(mime || "").toLowerCase() === "image/gif";
  }

  root.BGMediaStore = {
    STORE_KEY,
    MAX_BYTES,
    MAX_FOLDER_BYTES,
    MEDIA_EXTENSIONS,
    FORMAT_HELP,
    BG_FITS,
    normalizeFit,
    fitCss,
    ingestFile,
    getMedia,
    putMedia,
    removeMedia,
    loadAll,
    isVideoMime,
    isGifMime,
    isAllowedMime,
    guessMimeFromName,
    estimateDataUrlBytes,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
