(function (root) {
  const registry = new Map();

  function define(def) {
    if (!def || typeof def !== "object") {
      throw new Error("BGThemeEngines.define requires an object.");
    }
    const id = String(def.id || "").trim();
    const kind = String(def.kind || "").trim();
    if (!/^[a-z][a-z0-9-]{1,40}$/.test(id)) {
      throw new Error("Engine id must be lowercase letters, numbers, and dashes.");
    }
    if (kind !== "message" && kind !== "mosaic") {
      throw new Error('Engine kind must be "message" or "mosaic".');
    }
    if (typeof def.mount !== "function") {
      throw new Error("Engine must provide mount().");
    }
    registry.set(id, def);
    return def;
  }

  function get(id) {
    return registry.get(String(id || "")) || null;
  }

  function has(id) {
    return registry.has(String(id || ""));
  }

  function list() {
    return [...registry.values()];
  }

  function unregister(id) {
    return registry.delete(String(id || ""));
  }

  root.BGThemeEngines = {
    define,
    get,
    has,
    list,
    unregister,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
