(() => {
  const rules = globalThis.BGExtensionRules;
  const themeApi = globalThis.BGLeaderboardThemes;
  const handoff = globalThis.BGThemeHandoff;
  if (!rules || !themeApi || !handoff) return;
  if (!rules.isOutputPage(location.href)) return;

  const OVERLAY_ID = "dyn-leaderboard-theme";
  const STYLE_ID = "dyn-leaderboard-theme-style";

  let applyTimer = 0;
  let mountedTheme = "";
  let active = null;
  let lastKey = "";
  let lastSettingsKey = "";
  let lastThemeSettings = null;
  let applying = false;
  let cachedSettings = null;
  let overlayStable = false;
  const DEBOUNCE_ARM_MS = 0;
  const DEBOUNCE_STABLE_MS = 320;
  const DEBOUNCE_IDLE_MS = 140;

  function lbThemeArmed(settings) {
    const s = settings || cachedSettings;
    if (!s || s.enabled === false) return false;
    return rules.normalizeLeaderboardTheme(s.leaderboardTheme) !== "off";
  }

  function armPendingCover() {
    const html = document.documentElement;
    if (html.classList.contains("dyn-lb-pending")) return;
    ensureStyle();
    if (handoff.ensureCoverStyle) handoff.ensureCoverStyle();
    html.classList.add("dyn-lb-pending", "dyn-cover-leaderboard");
  }

  function clearPendingCover() {
    document.documentElement.classList.remove("dyn-lb-pending");
  }

  function maybeArmCover(settings) {
    if (!lbThemeArmed(settings)) return;
    if (!rules.pageLooksLikeLeaderboardOverlay || !rules.pageLooksLikeLeaderboardOverlay()) return;
    armPendingCover();
  }

  rules.loadSettings().then((s) => {
    cachedSettings = s;
    maybeArmCover(s);
  });

  function captureKey(capture) {
    if (!capture || !capture.leaders || !capture.leaders.length) return "";
    return (
      (capture.header || "") +
      "\n" +
      capture.leaders
        .map((l) => {
          const av = l.avatar;
          const avKey = av
            ? `${av.src}|${av.sprite ? av.bgPosition + "|" + av.bgSize : "img"}`
            : l.avatarSrc || "";
          return `${l.rank}|${l.name}|${l.score}|${avKey}`;
        })
        .join("\n")
    );
  }

  function settingsKey(theme, themeSettings) {
    if (!theme || theme === "off" || !themeSettings) return theme || "off";
    return (
      theme +
      "|" +
      [themeSettings.primary, themeSettings.secondary, themeSettings.showHeader, themeSettings.avatarBorder, themeSettings.revealMs]
        .map((v) => String(v == null ? "" : v))
        .join("|")
    );
  }

  function ensureStyle() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    if (style.textContent !== themeApi.STYLE) style.textContent = themeApi.STYLE;
  }

  function ensureOverlay() {
    ensureStyle();
    const host = rules.findOverlayHost && rules.findOverlayHost();
    if (!host) return null;
    let root = document.getElementById(OVERLAY_ID);
    if (!root) {
      root = document.createElement("div");
      root.id = OVERLAY_ID;
      root.setAttribute("aria-hidden", "true");
      host.appendChild(root);
    } else if (root.parentElement !== host) {
      host.appendChild(root);
    }
    return root;
  }

  function unmountTheme() {
    const root = document.getElementById(OVERLAY_ID);
    if (active && root && typeof active.def.unmount === "function") {
      try {
        active.def.unmount(root, active.state);
      } catch {
        /* ignore */
      }
    }
    active = null;
    mountedTheme = "";
    if (root) {
      root.classList.remove("on", "off", "dyn-awaiting-show");
      root.replaceChildren();
      root.removeAttribute("data-theme");
    }
  }

  async function mountTheme(id, themeSettings) {
    const def = themeApi.themes[id];
    if (!def) return false;
    if (active || document.getElementById(OVERLAY_ID)) unmountTheme();
    const root = ensureOverlay();
    if (!root) return false;
    root.dataset.theme = id;
    const mounted = def.mount(root, themeSettings);
    const state = mounted && typeof mounted.then === "function" ? await mounted : mounted || {};
    if (typeof def.applySettings === "function") {
      def.applySettings(root, state, themeSettings);
    }
    active = { id, def, state };
    mountedTheme = id;
    lastSettingsKey = settingsKey(id, themeSettings);
    lastThemeSettings = themeSettings;
    root.classList.add("dyn-awaiting-show");
    return true;
  }

  function teardownHard() {
    overlayStable = false;
    unmountTheme();
    document.documentElement.classList.remove("dyn-leaderboard-on", "dyn-cover-leaderboard");
    clearPendingCover();
    if (rules.clearLeaderboardNativeMarks) rules.clearLeaderboardNativeMarks();
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
    handoff.clearMode("leaderboard");
  }

  async function teardownSoft() {
    overlayStable = false;
    const root = document.getElementById(OVERLAY_ID);
    if (active && root && typeof active.def.hide === "function") {
      try {
        await active.def.hide(root, active.state, lastThemeSettings);
      } catch {
        /* ignore */
      }
    }
    unmountTheme();
    document.documentElement.classList.remove("dyn-leaderboard-on", "dyn-cover-leaderboard");
    clearPendingCover();
    if (rules.clearLeaderboardNativeMarks) rules.clearLeaderboardNativeMarks();
  }

  handoff.register("leaderboard", {
    hide() {
      const root = document.getElementById(OVERLAY_ID);
      if (!active || !root || typeof active.def.hide !== "function") return Promise.resolve();
      return active.def.hide(root, active.state, lastThemeSettings);
    },
    teardown: teardownSoft,
    standDown: teardownHard,
  });

  function shouldRun(settings) {
    if (!settings || settings.enabled === false) return false;
    const theme = rules.normalizeLeaderboardTheme(settings.leaderboardTheme);
    if (theme === "off") return false;
    return Boolean(
      rules.pageLooksLikeLeaderboardOverlay && rules.pageLooksLikeLeaderboardOverlay()
    );
  }

  function shouldStandDown(settings) {
    if (rules.pageLooksLikeResultBarPolling && rules.pageLooksLikeResultBarPolling()) {
      return true;
    }
    const lb =
      rules.pageLooksLikeLeaderboardOverlay && rules.pageLooksLikeLeaderboardOverlay();
    if (!lb) return true;
    if (!settings || settings.enabled === false) return true;
    return rules.normalizeLeaderboardTheme(settings.leaderboardTheme) === "off";
  }

  async function present(capture, theme, themeSettings) {
    const root = document.getElementById(OVERLAY_ID);
    if (!root || !active) return;
    if (typeof active.def.applySettings === "function") {
      active.def.applySettings(root, active.state, themeSettings);
    }
    const alreadyOn = root.classList.contains("on");
    if (alreadyOn && typeof active.def.refresh === "function") {
      active.def.refresh(root, capture, active.state, themeSettings);
    } else if (typeof active.def.show === "function") {
      await active.def.show(root, capture, active.state, themeSettings);
    } else {
      root.classList.remove("dyn-awaiting-show");
      root.classList.add("on");
    }
    document.documentElement.classList.add("dyn-leaderboard-on", "dyn-cover-leaderboard");
    clearPendingCover();
    lastKey = captureKey(capture);
    lastSettingsKey = settingsKey(theme, themeSettings);
    lastThemeSettings = themeSettings;
  }

  async function apply() {
    if (applying) return;
    applying = true;
    try {
      const settings = await rules.loadSettings();
      cachedSettings = settings;

      if (shouldStandDown(settings)) {
        clearPendingCover();
        handoff.applyCovers(settings);
        const needsTear =
          Boolean(document.getElementById(OVERLAY_ID)) ||
          handoff.currentMode() === "leaderboard" ||
          document.documentElement.classList.contains("dyn-leaderboard-on");
        if (needsTear) await teardownSoft();
        handoff.clearMode("leaderboard");
        handoff.applyCovers(settings);
        return;
      }

      if (!shouldRun(settings)) {
        handoff.applyCovers(settings);
        if (document.getElementById(OVERLAY_ID)) await teardownSoft();
        return;
      }

      maybeArmCover(settings);

      const theme = rules.normalizeLeaderboardTheme(settings.leaderboardTheme);
      const themeSettings = rules.resolveLeaderboardThemeSettings(settings, theme);
      const capture = rules.leaderboardCapture();
      if (!capture.leaders || !capture.leaders.length) {
        overlayStable = false;
        handoff.applyCovers(settings);
        scheduleApply(DEBOUNCE_IDLE_MS);
        return;
      }

      const key = captureKey(capture);
      const sk = settingsKey(theme, themeSettings);
      const liveRoot = document.getElementById(OVERLAY_ID);
      const isStable =
        Boolean(active) &&
        mountedTheme === theme &&
        liveRoot &&
        liveRoot.classList.contains("on") &&
        key === lastKey &&
        sk === lastSettingsKey;

      if (isStable) {
        overlayStable = true;
        return;
      }

      if (mountedTheme !== theme || !active) {
        overlayStable = false;
        lastKey = "";
        await handoff.activate("leaderboard", {
          async prepare() {
            armPendingCover();
            document.documentElement.classList.add("dyn-leaderboard-on", "dyn-cover-leaderboard");
            await mountTheme(theme, themeSettings);
          },
          async reveal() {
            await present(capture, theme, themeSettings);
            overlayStable = true;
            handoff.applyCovers(settings);
          },
        });
        return;
      }

      handoff.applyCovers(settings);
      if (key !== lastKey || sk !== lastSettingsKey) {
        await present(capture, theme, themeSettings);
        overlayStable = true;
      }
    } finally {
      applying = false;
    }
  }

  function scheduleApply(delay) {
    const wait =
      delay == null
        ? overlayStable
          ? DEBOUNCE_STABLE_MS
          : DEBOUNCE_IDLE_MS
        : Math.max(0, Number(delay) || 0);
    if (applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      applyTimer = 0;
      apply().catch(() => {});
    }, wait);
  }

  function recoverAfterBackground() {
    overlayStable = false;
    lastKey = "";
    scheduleApply(DEBOUNCE_ARM_MS);
  }

  const HOST_ID = handoff.HOST_ID || "dyn-theme-host";

  function observerIsRelevant(records) {
    return records.some((record) => {
      const target = record.target;
      if (!target) return true;
      if (target === document.documentElement && record.type === "attributes" && record.attributeName === "class") {
        return false;
      }
      if (target.id === OVERLAY_ID || target.id === HOST_ID || target.id === STYLE_ID) return false;
      if (typeof target.closest === "function" && target.closest("#" + OVERLAY_ID + ", #" + HOST_ID)) {
        return false;
      }
      return true;
    });
  }

  const observer = new MutationObserver((records) => {
    if (!observerIsRelevant(records)) return;
    if (rules.pageLooksLikeLeaderboardOverlay && rules.pageLooksLikeLeaderboardOverlay()) {
      if (cachedSettings) {
        maybeArmCover(cachedSettings);
        scheduleApply(overlayStable ? DEBOUNCE_STABLE_MS : DEBOUNCE_ARM_MS);
      } else {
        rules.loadSettings().then((s) => {
          cachedSettings = s;
          maybeArmCover(s);
          scheduleApply(DEBOUNCE_ARM_MS);
        });
      }
      return;
    }
    overlayStable = false;
    scheduleApply(DEBOUNCE_IDLE_MS);
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["src", "srcset", "class", "style", "hidden", "aria-hidden"],
  });

  window.addEventListener("resize", () => {
    const root = document.getElementById(OVERLAY_ID);
    if (root && themeApi.layoutStage) themeApi.layoutStage(root);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    if (!rules.pageLooksLikeLeaderboardOverlay || !rules.pageLooksLikeLeaderboardOverlay()) return;
    if (!lbThemeArmed(cachedSettings)) return;
    recoverAfterBackground();
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    recoverAfterBackground();
  });

  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (
        changes.leaderboardTheme ||
        changes.leaderboardThemeSettings ||
        changes.enabled
      ) {
        lastKey = "";
        if (changes.leaderboardTheme || changes.enabled) {
          rules.loadSettings().then((s) => {
            cachedSettings = s;
            maybeArmCover(s);
          });
        }
        scheduleApply(0);
      }
    });
  }

  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (!message || message.type !== "dyn-bg-apply-settings") return;
      lastKey = "";
      scheduleApply(0);
    });
  }

  scheduleApply(0);
})();
