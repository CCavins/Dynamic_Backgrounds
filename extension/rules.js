(function (root) {
  const STORAGE_KEYS = {
    enabled: "enabled",
    anyOutputIframeHtml: "anyOutputIframeHtml",
    rules: "rules",
  };

  const DEFAULTS = {
    enabled: true,
    anyOutputIframeHtml: "",
    rules: [],
  };

  function envKey(hostname) {
    const match = String(hostname || "").toLowerCase().match(/vixisuite(?:-[a-z0-9]+)?/);
    return match ? match[0] : String(hostname || "").toLowerCase();
  }

  function extractIds(urlString) {
    try {
      const url = new URL(urlString);
      const ids = new Set();
      const shortId = url.pathname.match(/\/go\/o\/([^/]+)/);
      if (shortId && shortId[1]) ids.add(decodeURIComponent(shortId[1]));
      const outputId = url.pathname.match(/\/go\/output\/([^/]+)/);
      if (outputId && outputId[1]) ids.add(decodeURIComponent(outputId[1]));
      const sid = url.searchParams.get("sid");
      if (sid) ids.add(sid);
      return {
        hostname: url.hostname.toLowerCase(),
        env: envKey(url.hostname),
        ids,
      };
    } catch {
      return null;
    }
  }

  function isOutputPage(urlString) {
    try {
      const url = new URL(urlString);
      if (!/vixisuite/i.test(url.hostname)) return false;
      return /\/go\/output(?:\/|$)/.test(url.pathname) || /\/go\/o\//.test(url.pathname);
    } catch {
      return false;
    }
  }

  function urlsMatch(pageUrl, ruleUrl) {
    const page = extractIds(pageUrl);
    const rule = extractIds(ruleUrl);
    if (!page || !rule) return false;
    if (page.env !== rule.env) return false;
    if (page.ids.size === 0 || rule.ids.size === 0) return false;
    for (const id of page.ids) {
      if (rule.ids.has(id)) return true;
    }
    return false;
  }

  function parseIframeSrc(htmlOrUrl) {
    const raw = String(htmlOrUrl || "").trim();
    if (!raw) return "";
    const quoted = raw.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
    if (quoted) return quoted[1].trim();
    const unquoted = raw.match(/<iframe\b[^>]*\bsrc\s*=\s*([^\s>]+)/i);
    if (unquoted) return unquoted[1].replace(/["']/g, "").trim();
    if (/^https?:\/\//i.test(raw)) return raw;
    return "";
  }

  function normalizeSettings(value) {
    const next = value || {};
    const rules = Array.isArray(next.rules) ? next.rules : [];
    return {
      enabled: next.enabled !== false,
      anyOutputIframeHtml: String(next.anyOutputIframeHtml || ""),
      rules: rules
        .map((rule) => ({
          outputUrl: String(rule && rule.outputUrl ? rule.outputUrl : "").trim(),
          iframeHtml: String(rule && rule.iframeHtml ? rule.iframeHtml : "").trim(),
        }))
        .filter((rule) => rule.outputUrl || rule.iframeHtml),
    };
  }

  function resolveIframeSrc(settings, pageUrl) {
    const state = normalizeSettings(settings);
    if (!state.enabled) return "";

    for (const rule of state.rules) {
      if (!rule.outputUrl || !rule.iframeHtml) continue;
      if (!urlsMatch(pageUrl, rule.outputUrl)) continue;
      const src = parseIframeSrc(rule.iframeHtml);
      if (src) return src;
    }

    if (isOutputPage(pageUrl)) {
      return parseIframeSrc(state.anyOutputIframeHtml);
    }

    return "";
  }

  function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(DEFAULTS, (stored) => {
        resolve(normalizeSettings(stored));
      });
    });
  }

  function saveSettings(settings) {
    const next = normalizeSettings(settings);
    return new Promise((resolve) => {
      chrome.storage.local.set(next, resolve);
    });
  }

  root.BGExtensionRules = {
    STORAGE_KEYS,
    DEFAULTS,
    envKey,
    extractIds,
    isOutputPage,
    urlsMatch,
    parseIframeSrc,
    normalizeSettings,
    resolveIframeSrc,
    loadSettings,
    saveSettings,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
