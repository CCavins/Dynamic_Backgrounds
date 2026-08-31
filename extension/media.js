/**
 * Shared media asset helpers for uploaded backgrounds / theme wallpapers.
 * Stores data URLs in chrome.storage.local under dynMediaAssets.
 */
(function (root) {
  const STORE_KEY = "dynMediaAssets";
  const MAX_BYTES = 3.5 * 1024 * 1024;
  const MAX_IMAGE_EDGE = 1600;
  const IMAGE_QUALITY = 0.84;
  const BG_FITS = ["cover", "contain", "fill", "center"];

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

  function estimateDataUrlBytes(dataUrl) {
    const raw = String(dataUrl || "");
    const comma = raw.indexOf(",");
    if (comma < 0) return raw.length;
    const b64 = raw.slice(comma + 1);
    return Math.floor((b64.length * 3) / 4);
  }

  function isAllowedMime(mime) {
    const m = String(mime || "").toLowerCase();
    return (
      m === "image/jpeg" ||
      m === "image/png" ||
      m === "image/webp" ||
      m === "image/gif" ||
      m === "image/jpg" ||
      m.startsWith("video/")
    );
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

  async function ingestFile(file, opts) {
    if (!file) throw new Error("No file selected.");
    const options = opts && typeof opts === "object" ? opts : {};
    const fromFolder = Boolean(options.fromFolder);
    // Folder picks skip the small chrome.storage comfort cap; still keep a
    // hard ceiling so a multi‑GB video does not freeze the popup.
    const maxBytes = fromFolder
      ? Number(options.maxBytes) > 0
        ? Number(options.maxBytes)
        : 64 * 1024 * 1024
      : MAX_BYTES;
    const mime = String(file.type || "").toLowerCase() || "application/octet-stream";
    if (!isAllowedMime(mime)) {
      throw new Error("Use an image, GIF, or video file.");
    }
    if (mime === "image/gif" || mime.startsWith("video/")) {
      if (file.size > maxBytes) {
        throw new Error(
          fromFolder
            ? "That file is too large (max about 64 MB from the folder)."
            : "That file is too large (max about 3.5 MB)."
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
        throw new Error("That image is too large to import.");
      }
      const asset = await compressRasterImage(file, { fromFolder, maxBytes });
      asset.source = fromFolder ? "folder" : "upload";
      return asset;
    }
    throw new Error("Unsupported media type.");
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
      throw new Error("Image is still too large after compression.");
    }
    return {
      mime: outMime,
      dataUrl: out,
      name: String(file.name || "image").slice(0, 80),
      bytes: estimateDataUrlBytes(out),
    };
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

  async function getMedia(id) {
    if (!id) return null;
    const all = await loadAll();
    const item = all[id] || memoryStore[id];
    if (!item || !item.dataUrl) return null;
    return {
      id,
      mime: String(item.mime || ""),
      dataUrl: String(item.dataUrl || ""),
      name: String(item.name || ""),
      bytes: Number(item.bytes) || estimateDataUrlBytes(item.dataUrl),
    };
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
    const all = await loadAll();
    all[id] = entry;
    return storageSet({ [STORE_KEY]: all });
  }

  async function removeMedia(id) {
    if (!id) return false;
    delete memoryStore[id];
    if (!extensionAlive()) return true;
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
    estimateDataUrlBytes,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
