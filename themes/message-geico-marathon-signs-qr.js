(function () {
  var THEME = "message-geico-marathon-signs";
  var STORAGE = "geico-signs-sidebar-qr";
  var row = null;
  var nameNode = null;
  var statusNode = null;

  try { localStorage.removeItem("geico-signs-qr"); } catch (err) {}
  window.__GEICO_SIGNS_QR = "";

  function outputScreen() {
    return document.body.classList.contains("preview-view") || /^\/v\//.test(location.pathname);
  }

  function signsOn() {
    var root = document.querySelector("#dyn-message-theme");
    if (root && root.dataset.theme === THEME) return true;
    var live = document.getElementById("live-message-theme");
    if (live && live.value === THEME && document.body.classList.contains("is-output-source")) return true;
    var picked = document.getElementById("theme-select");
    return Boolean(picked && picked.value === THEME && !document.body.classList.contains("is-output-source"));
  }

  function savedCode() {
    if (/^\/v\//.test(location.pathname)) return "";
    return new URLSearchParams(location.search).get("saved") || "";
  }

  function sidebarUrl() {
    if (window.__GEICO_SIGNS_QR) return window.__GEICO_SIGNS_QR;
    try { return localStorage.getItem(STORAGE) || ""; } catch (err) { return ""; }
  }

  function apply(url) {
    window.__GEICO_SIGNS_QR = url || "";
    document.querySelectorAll('[data-theme="' + THEME + '"] [data-footer-qr] img').forEach(function (img) {
      if (!url) img.removeAttribute("src");
      else if (img.getAttribute("src") !== url) img.src = url;
    });
    if (nameNode) {
      var label = url ? "QR image" : "No file";
      if (nameNode.textContent !== label) nameNode.textContent = label;
    }
  }

  function setStatus(text) {
    if (statusNode && statusNode.textContent !== text) statusNode.textContent = text;
  }

  function rememberSaved(url, type) {
    if (!window.__SAVED_OUTPUT) window.__SAVED_OUTPUT = {};
    if (!window.__SAVED_OUTPUT.backgrounds) window.__SAVED_OUTPUT.backgrounds = {};
    if (url) window.__SAVED_OUTPUT.backgrounds.qr = { url: url, fit: "contain", contentType: type || "image/png" };
    else delete window.__SAVED_OUTPUT.backgrounds.qr;
  }

  function rememberLocal(blob) {
    var objectUrl = URL.createObjectURL(blob);
    apply(objectUrl);
    setStatus("QR is on the board.");
    var reader = new FileReader();
    reader.onload = function () {
      var url = String(reader.result || "");
      if (url.indexOf("data:image") !== 0) return;
      try {
        localStorage.setItem(STORAGE, url);
        apply(url);
        URL.revokeObjectURL(objectUrl);
        setStatus("Saved with these sidebar settings.");
      } catch (err) {
        setStatus("QR is on the board for this visit.");
      }
    };
    reader.readAsDataURL(blob);
  }

  async function saveToOutput(file) {
    var code = savedCode();
    if (!code) return false;
    var form = new FormData();
    if (file) form.set("file", file);
    else form.set("clear", "1");
    setStatus(file ? "Uploading QR…" : "Removing QR…");
    var response = await fetch("/api/studio/outputs/" + encodeURIComponent(code) + "/background?kind=qr", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      body: form,
    });
    if (!response.ok) throw new Error(await response.text());
    var data = await response.json();
    rememberSaved(data.url || "", file && file.type);
    apply(data.url || "");
    setStatus(data.url ? "QR saved with this output." : "QR removed.");
    return true;
  }

  function onFile(input) {
    var chosen = input.files && input.files[0];
    if (!chosen) return;
    var blob = chosen.slice(0, chosen.size, chosen.type || "image/png");
    input.value = "";
    if (savedCode()) {
      saveToOutput(new File([blob], chosen.name || "qr.png", { type: blob.type })).catch(function (err) {
        setStatus(err && err.message ? err.message : "Could not upload that QR image.");
      });
      return;
    }
    rememberLocal(blob);
  }

  function buildRow() {
    var root = document.createElement("div");
    root.className = "setting-row media";
    root.id = "geico-signs-qr";
    root.innerHTML = [
      '<div class="media-head"><span>Footer QR</span><span class="media-file-name" data-qr-name>No file</span></div>',
      '<div class="media-actions">',
      '<label class="dock-btn">Choose file…<input type="file" accept="image/*,.svg" hidden></label>',
      '<button type="button" class="dock-btn dock-btn-ghost" data-qr-clear>Clear</button>',
      "</div>",
      '<p class="media-status" data-qr-status role="status"></p>',
    ].join("");
    nameNode = root.querySelector("[data-qr-name]");
    statusNode = root.querySelector("[data-qr-status]");
    root.querySelector("input").addEventListener("change", function (event) {
      onFile(event.currentTarget);
    });
    root.querySelector("[data-qr-clear]").addEventListener("click", function () {
      try { localStorage.removeItem(STORAGE); } catch (err) {}
      window.__GEICO_SIGNS_QR = "";
      if (savedCode()) {
        saveToOutput(null).catch(function (err) {
          setStatus(err && err.message ? err.message : "Could not remove that QR image.");
        });
        return;
      }
      apply("");
      setStatus("QR removed.");
    });
    return root;
  }

  function host() {
    if (document.body.classList.contains("is-output-source")) return document.getElementById("live-message-settings");
    return document.getElementById("settings-fields");
  }

  var placing = false;

  function place() {
    if (placing || outputScreen()) return;
    placing = true;
    try {
      if (!signsOn()) {
        if (row && row.parentElement) row.remove();
        apply("");
        return;
      }
      var box = host();
      if (!box) return;
      if (!row) row = buildRow();
      if (row.parentElement !== box) box.appendChild(row);
      var saved = window.__SAVED_OUTPUT && window.__SAVED_OUTPUT.backgrounds && window.__SAVED_OUTPUT.backgrounds.qr;
      apply((saved && saved.url) || sidebarUrl());
    } finally {
      placing = false;
    }
  }

  function watch(el) {
    if (!el || !window.MutationObserver || el.dataset.qrWatch) return;
    el.dataset.qrWatch = "1";
    new MutationObserver(function () { place(); }).observe(el, { childList: true });
  }

  function boot() {
    watch(document.getElementById("settings-fields"));
    watch(document.getElementById("live-message-settings"));
    watch(document.getElementById("dyn-message-theme"));
    place();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
