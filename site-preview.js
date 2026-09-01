(function () {
    const SAMPLE_DIR = "samples/patriots/";
    const CSV_URL = SAMPLE_DIR + "captures.csv";
    const MESSAGE_CYCLE_MS = 5600;
    const LIVE_LEAVE_MS = 450;
    const MAX_LIVE = 1;

    const messageApi = globalThis.BGMessageThemes;
    const mosaicApi = globalThis.BGMosaicThemes;
    const rules = globalThis.BGExtensionRules;

    if (!messageApi || !mosaicApi) return;

    const style = document.createElement("style");
    style.textContent = [
        rewriteThemeCss(messageApi.STYLE, "#dyn-message-theme", ".dyn-message-theme"),
        rewriteThemeCss(mosaicApi.STYLE, "#dyn-mosaic-theme", ".dyn-mosaic-theme"),
    ].join("\n");
    document.head.appendChild(style);

    if (messageApi.FONTS) {
        const fonts = document.createElement("link");
        fonts.rel = "stylesheet";
        fonts.href = messageApi.FONTS;
        document.head.appendChild(fonts);
    }

    function rewriteThemeCss(css, fromId, toClass) {
        return String(css || "")
            .split(fromId)
            .join(toClass)
            .replace(/(\d*\.?\d+)vh\b/g, "$1cqh")
            .replace(/(\d*\.?\d+)vw\b/g, "$1cqw");
    }

    function parseCsv(text) {
        const rows = [];
        let row = [];
        let field = "";
        let inQuotes = false;
        for (let i = 0; i < text.length; i += 1) {
            const ch = text[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (text[i + 1] === '"') {
                        field += '"';
                        i += 1;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    field += ch;
                }
            } else if (ch === '"') {
                inQuotes = true;
            } else if (ch === ",") {
                row.push(field);
                field = "";
            } else if (ch === "\n" || ch === "\r") {
                if (ch === "\r" && text[i + 1] === "\n") i += 1;
                row.push(field);
                field = "";
                if (row.some((cell) => cell)) rows.push(row);
                row = [];
            } else {
                field += ch;
            }
        }
        if (field || row.length) {
            row.push(field);
            if (row.some((cell) => cell)) rows.push(row);
        }
        return rows;
    }

    function shuffle(list) {
        const out = list.slice();
        for (let i = out.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = out[i];
            out[i] = out[j];
            out[j] = tmp;
        }
        return out;
    }

    function settingsFor(id, kind) {
        const meta =
            rules && kind === "mosaic" && rules.mosaicThemeMetaAll
                ? rules.mosaicThemeMetaAll()[id]
                : rules && rules.messageThemeMetaAll
                  ? rules.messageThemeMetaAll()[id]
                  : rules && rules.MESSAGE_THEME_META
                    ? rules.MESSAGE_THEME_META[id]
                    : null;
        const defaults = (meta && meta.defaults) || {};
        const out = {
            primary: defaults.primary || "#d52265",
            secondary: defaults.secondary || "#fec651",
            background: defaults.background,
            motion: defaults.motion,
            revealMs: defaults.revealMs || 1000,
        };
        if (kind === "mosaic") {
            out.scale = defaults.scale != null ? defaults.scale : 1;
            out.frame = defaults.frame;
            out.photoStyle = defaults.photoStyle || "bw";
        }
        if (defaults.photoStyle) out.photoStyle = defaults.photoStyle;
        return out;
    }

    function injectGalleryPackCss() {
        const source = document.getElementById("dyn-custom-theme-style");
        let node = document.getElementById("dyn-gallery-pack-style");
        if (!node) {
            node = document.createElement("style");
            node.id = "dyn-gallery-pack-style";
            document.head.appendChild(node);
        }
        if (!source || !source.textContent) {
            node.textContent = "";
            return;
        }
        let css = source.textContent;
        css = rewriteThemeCss(css, "#dyn-message-theme", ".dyn-message-theme");
        css = rewriteThemeCss(css, "#dyn-mosaic-theme", ".dyn-mosaic-theme");
        node.textContent = css;
    }

    async function ensureGalleryThemes() {
        const customApi = globalThis.BGCustomThemes;
        if (customApi && typeof customApi.whenReady === "function") {
            await customApi.whenReady();
        }
        injectGalleryPackCss();
        if (customApi && typeof customApi.onChange === "function") {
            customApi.onChange(() => injectGalleryPackCss());
        }
    }

    function captureAt(captures, index) {
        const row = captures[((index % captures.length) + captures.length) % captures.length];
        return row || { src: "", name: "", message: "" };
    }

    function needsWebGL(id) {
        return id === "cubes" || id === "cubes-brand" || id === "depthfield";
    }

    let webglPromise = null;
    function ensureWebGL() {
        if (globalThis.THREE && globalThis.BGTileField) return Promise.resolve();
        if (webglPromise) return webglPromise;
        webglPromise = (async () => {
            const load = (src) =>
                new Promise((resolve, reject) => {
                    if (document.querySelector('script[src="' + src + '"]')) {
                        resolve();
                        return;
                    }
                    const el = document.createElement("script");
                    el.src = src;
                    el.onload = () => resolve();
                    el.onerror = () => reject(new Error("Failed to load " + src));
                    document.head.appendChild(el);
                });
            if (!globalThis.THREE) await load("extension/vendor/three.min.js");
            if (!globalThis.THREE.RoundedBoxGeometry) await load("extension/vendor/RoundedBoxGeometry.js");
            if (!globalThis.BGTileField) await load("extension/vendor/tile-field.js");
        })().catch((err) => {
            webglPromise = null;
            throw err;
        });
        return webglPromise;
    }

    function unmountTile(tile) {
        if (!tile || !tile.mounted) return;
        if (tile.cycleTimer) {
            clearInterval(tile.cycleTimer);
            tile.cycleTimer = 0;
        }
        if (tile.mosaicTimer) {
            clearInterval(tile.mosaicTimer);
            tile.mosaicTimer = 0;
        }
        if (tile.ro) {
            tile.ro.disconnect();
            tile.ro = null;
        }
        const def = tile.def;
        if (def && def.unmount) {
            try {
                def.unmount(tile.root, tile.state);
            } catch {
                /* already gone */
            }
        }
        tile.root.replaceChildren();
        tile.root.className = tile.kind === "mosaic" ? "dyn-mosaic-theme" : "dyn-message-theme";
        tile.root.removeAttribute("data-theme");
        tile.root.removeAttribute("data-engine");
        tile.state = null;
        tile.def = null;
        tile.mounted = false;
        tile.card.classList.remove("is-live");
        if (tile.poster) tile.poster.hidden = false;
    }

    function mountMessage(tile, captures) {
        const def = messageApi.themes[tile.id];
        if (!def) return;
        tile.def = def;
        tile.root.dataset.theme = tile.id;
        const settings = settingsFor(tile.id, "message");
        tile.settings = settings;
        const state = def.mount(tile.root, settings);
        tile.state = state;
        if (def.applySettings) def.applySettings(tile.root, state, settings);
        const first = captureAt(captures, tile.row);
        def.show(tile.root, first, state, settings);
        if (typeof ResizeObserver !== "undefined" && messageApi.ensureFitStage) {
            tile.ro = new ResizeObserver(() => {
                messageApi.ensureFitStage(tile.root);
            });
            tile.ro.observe(tile.root);
        }
        tile.cycleTimer = setInterval(() => {
            if (!tile.mounted || !captures.length) return;
            tile.row += 1;
            const next = captureAt(captures, tile.row);
            const go = () => def.show(tile.root, next, tile.state, settings);
            if (def.hide) {
                Promise.resolve(def.hide(tile.root, tile.state)).then(go).catch(go);
            } else {
                go();
            }
        }, MESSAGE_CYCLE_MS);
        tile.mounted = true;
        tile.card.classList.add("is-live");
        if (tile.poster) tile.poster.hidden = true;
    }

    function mountMosaic(tile, photos) {
        const def = mosaicApi.themes[tile.id];
        if (!def) return;
        tile.def = def;
        tile.root.dataset.theme = tile.id;
        const engine = (def && def.engine) || tile.id;
        if (engine) tile.root.dataset.engine = engine;
        else tile.root.removeAttribute("data-engine");
        const pool = shuffle(photos);
        const api = {
            nextUrl() {
                return pool[Math.floor(Math.random() * pool.length)] || "";
            },
            isRetiring() {
                return false;
            },
            hasIncoming() {
                return false;
            },
        };
        const settings = settingsFor(tile.id, "mosaic");
        tile.settings = settings;
        tile.state = def.mount(tile.root, pool, api, settings) || {};
        if (def.applySettings) def.applySettings(tile.root, tile.state, settings);
        if (def.tick) {
            tile.mosaicTimer = setInterval(() => {
                if (!tile.mounted) return;
                def.tick(tile.root, pool, tile.state, api);
            }, def.interval || 2400);
        }
        tile.mounted = true;
        tile.card.classList.add("is-live");
        if (tile.poster) tile.poster.hidden = true;
    }

    function buildPoster(tile) {
        const stage = tile.card.querySelector(".theme-stage");
        if (!stage) return;
        const poster = document.createElement("div");
        poster.className = "theme-poster";
        poster.setAttribute("aria-hidden", "true");
        const hint = document.createElement("div");
        hint.className = "theme-poster-hint";
        hint.textContent = "Hover to preview";
        poster.appendChild(hint);
        stage.insertBefore(poster, tile.root);
        tile.poster = poster;
    }

    function bindTiles(captures) {
        const photos = captures.map((row) => row.src).filter(Boolean);
        const tiles = [...document.querySelectorAll(".theme-card[data-kind][data-theme]")]
            .map((card, index) => {
                const kind = card.getAttribute("data-kind");
                const id = card.getAttribute("data-theme");
                const root = card.querySelector(
                    kind === "mosaic" ? ".dyn-mosaic-theme" : ".dyn-message-theme"
                );
                return {
                    card,
                    kind,
                    id,
                    root,
                    row: index,
                    mounted: false,
                    def: null,
                    state: null,
                    settings: null,
                    cycleTimer: 0,
                    mosaicTimer: 0,
                    ro: null,
                    poster: null,
                    leaveTimer: 0,
                    wantLive: false,
                };
            })
            .filter((tile) => tile.root);

        let liveCount = 0;

        function stopLive(tile) {
            if (tile.leaveTimer) {
                clearTimeout(tile.leaveTimer);
                tile.leaveTimer = 0;
            }
            if (!tile.mounted) return;
            unmountTile(tile);
            liveCount = Math.max(0, liveCount - 1);
        }

        function stopAllLive() {
            tiles.forEach((tile) => {
                tile.wantLive = false;
                stopLive(tile);
            });
        }

        async function startLive(tile) {
            if (document.hidden || tile.mounted) return;
            while (liveCount >= MAX_LIVE) {
                const other = tiles.find((item) => item.mounted && item !== tile);
                if (!other) break;
                other.wantLive = false;
                stopLive(other);
            }
            if (needsWebGL(tile.id)) {
                try {
                    await ensureWebGL();
                } catch {
                    return;
                }
            }
            if (!tile.wantLive || document.hidden || tile.mounted) return;
            if (tile.kind === "mosaic") mountMosaic(tile, photos);
            else mountMessage(tile, captures);
            if (tile.mounted) liveCount += 1;
        }

        function requestLive(tile) {
            tile.wantLive = true;
            if (tile.leaveTimer) {
                clearTimeout(tile.leaveTimer);
                tile.leaveTimer = 0;
            }
            startLive(tile);
        }

        function releaseLive(tile) {
            tile.wantLive = false;
            if (tile.leaveTimer) clearTimeout(tile.leaveTimer);
            tile.leaveTimer = setTimeout(() => {
                tile.leaveTimer = 0;
                if (!tile.wantLive) stopLive(tile);
            }, LIVE_LEAVE_MS);
        }

        tiles.forEach((tile) => {
            buildPoster(tile);
            tile.card.addEventListener("pointerenter", () => requestLive(tile));
            tile.card.addEventListener("pointerleave", () => releaseLive(tile));
            tile.card.addEventListener("focusin", () => requestLive(tile));
            tile.card.addEventListener("focusout", (event) => {
                if (!tile.card.contains(event.relatedTarget)) releaseLive(tile);
            });
            if (!tile.card.hasAttribute("tabindex")) tile.card.tabIndex = 0;
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) stopAllLive();
        });

        window.addEventListener("pagehide", stopAllLive);
    }

    async function startGallery(captures) {
        await ensureGalleryThemes();
        bindTiles(captures);
    }

    fetch(CSV_URL)
        .then((res) => res.text())
        .then((text) => {
            const rows = parseCsv(text);
            const header = rows.shift() || [];
            const fileIdx = header.indexOf("captures");
            const nameIdx = header.indexOf("name");
            const msgIdx = header.indexOf("message");
            const captures = rows
                .map((row) => ({
                    src: SAMPLE_DIR + (row[fileIdx] || "").trim(),
                    name: (row[nameIdx] || "").trim(),
                    message: (row[msgIdx] || "").trim(),
                }))
                .filter((row) => row.src && row.src !== SAMPLE_DIR);
            return startGallery(captures);
        })
        .catch(() => startGallery([]));
})();
