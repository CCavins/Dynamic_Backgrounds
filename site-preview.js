(function () {
    const SAMPLE_DIR = "samples/patriots/";
    const CSV_URL = SAMPLE_DIR + "captures.csv";
    const MESSAGE_CYCLE_MS = 5600;

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

    function settingsFor(id) {
        const meta = rules && rules.MESSAGE_THEME_META && rules.MESSAGE_THEME_META[id];
        const defaults = (meta && meta.defaults) || {};
        return {
            primary: defaults.primary || "#d52265",
            secondary: defaults.secondary || "#fec651",
            background: defaults.background,
            motion: defaults.motion,
            revealMs: defaults.revealMs || 1000,
        };
    }

    function captureAt(captures, index) {
        const row = captures[((index % captures.length) + captures.length) % captures.length];
        return row || { src: "", name: "", message: "" };
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
        tile.root.classList.remove("on", "off", "idle", "held", "no-copy", "ticks-live");
        tile.state = null;
        tile.mounted = false;
    }

    function mountMessage(tile, captures) {
        const def = messageApi.themes[tile.id];
        if (!def) return;
        tile.def = def;
        tile.root.dataset.theme = tile.id;
        const settings = settingsFor(tile.id);
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
    }

    function mountMosaic(tile, photos) {
        const def = mosaicApi.themes[tile.id];
        if (!def) return;
        tile.def = def;
        tile.root.dataset.theme = tile.id;
        const pool = shuffle(photos);
        const api = {
            nextUrl() {
                return pool[Math.floor(Math.random() * pool.length)] || "";
            },
        };
        tile.state = def.mount(tile.root, pool, api);
        if (def.tick) {
            tile.mosaicTimer = setInterval(() => {
                if (!tile.mounted) return;
                def.tick(tile.root, pool, tile.state, api);
            }, def.interval || 2400);
        }
        tile.mounted = true;
    }

    function bindTiles(captures) {
        const photos = captures.map((row) => row.src);
        const tiles = [...document.querySelectorAll(".theme-card[data-kind][data-theme]")].map((card, index) => {
            const kind = card.getAttribute("data-kind");
            const id = card.getAttribute("data-theme");
            const root = card.querySelector(kind === "mosaic" ? ".dyn-mosaic-theme" : ".dyn-message-theme");
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
            };
        }).filter((tile) => tile.root);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const tile = tiles.find((item) => item.card === entry.target);
                if (!tile) return;
                if (entry.isIntersecting) {
                    if (tile.mounted) return;
                    if (tile.kind === "mosaic") mountMosaic(tile, photos);
                    else mountMessage(tile, captures);
                } else {
                    unmountTile(tile);
                }
            });
        }, { rootMargin: "80px", threshold: 0.12 });

        tiles.forEach((tile) => observer.observe(tile.card));
    }

    fetch(CSV_URL)
        .then((res) => res.text())
        .then((text) => {
            const rows = parseCsv(text);
            const header = rows.shift() || [];
            const fileIdx = header.indexOf("captures");
            const nameIdx = header.indexOf("name");
            const msgIdx = header.indexOf("message");
            const captures = rows.map((row) => ({
                src: SAMPLE_DIR + (row[fileIdx] || "").trim(),
                name: (row[nameIdx] || "").trim(),
                message: (row[msgIdx] || "").trim(),
            })).filter((row) => row.src && row.src !== SAMPLE_DIR);
            bindTiles(captures);
        })
        .catch(() => bindTiles([]));
})();
