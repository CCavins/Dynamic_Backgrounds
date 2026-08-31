/**
 * External backgrounds folder via File System Access API.
 * Persists a directory handle in IndexedDB so local users can add
 * images / GIFs / videos without reloading the extension.
 */
(function (root) {
  const DB_NAME = "dynBgFolder";
  const DB_VERSION = 1;
  const HANDLE_KEY = "directory";
  const META_KEY = "dynBgFolderMeta";
  const MEDIA_EXT = /\.(jpe?g|png|webp|gif|bmp|avif|svg|mp4|webm|mov|m4v|ogv|ogg)$/i;

  function extensionAlive() {
    try {
      return Boolean(chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  function supported() {
    return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error || new Error("Could not open folder storage."));
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("handles")) {
          db.createObjectStore("handles");
        }
      };
      req.onsuccess = () => resolve(req.result);
    });
  }

  async function idbGet(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("handles", "readonly").objectStore("handles").get(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result || null);
    });
  }

  async function idbSet(key, value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("handles", "readwrite");
      tx.objectStore("handles").put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbDelete(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("handles", "readwrite");
      tx.objectStore("handles").delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
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

  async function saveMeta(patch) {
    const stored = await storageGet({ [META_KEY]: {} });
    const next = { ...(stored[META_KEY] || {}), ...patch };
    await storageSet({ [META_KEY]: next });
    return next;
  }

  async function getMeta() {
    const stored = await storageGet({ [META_KEY]: {} });
    const meta = stored[META_KEY] || {};
    return {
      name: String(meta.name || ""),
      selectedFile: String(meta.selectedFile || ""),
    };
  }

  async function getHandle() {
    try {
      return await idbGet(HANDLE_KEY);
    } catch {
      return null;
    }
  }

  async function queryPermission(handle, mode) {
    if (!handle || typeof handle.queryPermission !== "function") return "prompt";
    try {
      return await handle.queryPermission({ mode: mode || "read" });
    } catch {
      return "prompt";
    }
  }

  async function requestPermission(handle, mode) {
    if (!handle || typeof handle.requestPermission !== "function") return "denied";
    try {
      return await handle.requestPermission({ mode: mode || "read" });
    } catch {
      return "denied";
    }
  }

  async function ensurePermission(handle) {
    if (!handle) return { ok: false, state: "prompt", handle: null };
    let state = await queryPermission(handle, "read");
    if (state === "granted") return { ok: true, state, handle };
    state = await requestPermission(handle, "read");
    return { ok: state === "granted", state, handle };
  }

  async function pickFolder() {
    if (!supported()) {
      throw new Error("This Chrome build cannot pick a folder. Use a recent Chrome.");
    }
    const handle = await window.showDirectoryPicker({
      id: "dyn-bg-folder",
      mode: "read",
      startIn: "pictures",
    });
    await idbSet(HANDLE_KEY, handle);
    await saveMeta({ name: handle.name || "Backgrounds" });
    const perm = await ensurePermission(handle);
    if (!perm.ok) throw new Error("Folder permission was not granted.");
    return { handle, name: handle.name || "Backgrounds" };
  }

  async function forgetFolder() {
    try {
      await idbDelete(HANDLE_KEY);
    } catch {
      /* ignore */
    }
    await saveMeta({ name: "", selectedFile: "" });
    return true;
  }

  async function restoreFolder() {
    const handle = await getHandle();
    const meta = await getMeta();
    if (!handle) {
      return {
        handle: null,
        name: meta.name || "",
        permission: "prompt",
        needsGesture: false,
        selectedFile: meta.selectedFile || "",
      };
    }
    const state = await queryPermission(handle, "read");
    const granted = state === "granted";
    return {
      handle,
      name: handle.name || meta.name || "Backgrounds",
      permission: state,
      needsGesture: !granted,
      selectedFile: meta.selectedFile || "",
    };
  }

  function guessMime(name, file) {
    if (file && file.type) return file.type;
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
    if (/\.ogv$/i.test(lower) || /\.ogg$/i.test(lower)) return "video/ogg";
    return "application/octet-stream";
  }

  function isMediaEntry(name, entry) {
    if (!name || !entry) return false;
    if (entry.kind && entry.kind !== "file") return false;
    return MEDIA_EXT.test(name);
  }

  function formatBytes(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10 * 1024 ? 1 : 0) + " KB";
    return (n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0) + " MB";
  }

  async function listMediaFiles(handle) {
    if (!handle) return [];
    const out = [];
    for await (const [name, entry] of handle.entries()) {
      if (!isMediaEntry(name, entry)) continue;
      let size = 0;
      try {
        const file = await entry.getFile();
        size = Number(file && file.size) || 0;
      } catch {
        size = 0;
      }
      out.push({
        name,
        size,
        sizeLabel: formatBytes(size),
        mime: guessMime(name, null),
      });
    }
    out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    return out;
  }

  async function readFile(handle, fileName) {
    if (!handle || !fileName) throw new Error("No file selected.");
    const entry = await handle.getFileHandle(fileName);
    const file = await entry.getFile();
    if (!file) throw new Error("Could not read that file.");
    if (!file.type) {
      const mime = guessMime(fileName, file);
      return new File([file], file.name || fileName, {
        type: mime,
        lastModified: file.lastModified,
      });
    }
    return file;
  }

  async function setSelectedFile(fileName) {
    return saveMeta({ selectedFile: String(fileName || "") });
  }

  root.BGFolder = {
    META_KEY,
    supported,
    pickFolder,
    forgetFolder,
    restoreFolder,
    ensurePermission,
    listMediaFiles,
    readFile,
    getMeta,
    saveMeta,
    setSelectedFile,
    formatBytes,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
