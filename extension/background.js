/**
 * Service worker: registers sideloaded theme engines via chrome.userScripts
 * so Import packs… (JSON + engine.js) works on Vixi without editing the manifest.
 */
const SIDELOAD_ID = "dyn-bg-sideload";
const OUTPUT_TAB_MATCHES = ["*://*.thefamousgroup.com/*", "*://*.vixisuite.com/*"];
const MATCHES = OUTPUT_TAB_MATCHES;

function userScriptsEnableHint() {
  const match = String(navigator.userAgent || "").match(/(Chrome|Chromium)\/(\d+)/i);
  const version = match ? Number(match[2]) : 0;
  if (version >= 138) {
    return "Open chrome://extensions → Dynamic Themes → details → turn on Allow User Scripts, then reload the output page.";
  }
  return "Open chrome://extensions → turn on Developer mode, then reload the output page.";
}

async function isUserScriptsAvailable() {
  try {
    if (!chrome.userScripts || typeof chrome.userScripts.getScripts !== "function") {
      return false;
    }
    await chrome.userScripts.getScripts();
    return true;
  } catch {
    return false;
  }
}

async function loadCustomEngines() {
  const stored = await chrome.storage.local.get({ customEngines: {} });
  const raw = stored.customEngines && typeof stored.customEngines === "object" ? stored.customEngines : {};
  return Object.keys(raw)
    .map((id) => raw[id])
    .filter((rec) => rec && rec.id && rec.source && rec.kind);
}

function buildScriptSources(engines) {
  const js = [{ file: "engines/api.js" }];
  engines.forEach((rec) => {
    js.push({ code: String(rec.source) });
  });
  js.push({ file: "sideload-host.js" });
  return js;
}

async function syncSideloadEngines() {
  if (!(await isUserScriptsAvailable())) {
    return { ok: false, reason: "disabled", hint: userScriptsEnableHint(), count: 0 };
  }

  try {
    if (typeof chrome.userScripts.configureWorld === "function") {
      await chrome.userScripts.configureWorld({ messaging: true });
    }
  } catch {
    /* older Chrome */
  }

  const engines = await loadCustomEngines();
  try {
    const existing = await chrome.userScripts.getScripts({ ids: [SIDELOAD_ID] });
    if (existing && existing.length) {
      await chrome.userScripts.unregister({ ids: [SIDELOAD_ID] });
    }
  } catch {
    /* nothing registered yet */
  }

  if (!engines.length) {
    return { ok: true, count: 0, hint: "" };
  }

  const js = buildScriptSources(engines);
  await chrome.userScripts.register([
    {
      id: SIDELOAD_ID,
      matches: MATCHES,
      js,
      // Start before content_scripts (document_idle) so the host is ready to mount.
      runAt: "document_start",
      world: "USER_SCRIPT",
    },
  ]);

  // Hot-inject into already-open matching tabs (Chrome 135+).
  if (typeof chrome.userScripts.execute === "function") {
    try {
      const tabs = await chrome.tabs.query({ url: MATCHES });
      for (const tab of tabs) {
        if (!tab || tab.id == null) continue;
        try {
          await chrome.userScripts.execute({
            target: { tabId: tab.id },
            js,
            world: "USER_SCRIPT",
            injectImmediately: true,
          });
        } catch {
          /* tab may not allow injection yet */
        }
      }
    } catch {
      /* tabs.query may fail on some builds */
    }
  }

  return { ok: true, count: engines.length, hint: "" };
}

chrome.runtime.onInstalled.addListener((details) => {
  syncSideloadEngines()
    .then(async (result) => {
      if (details.reason === "install") {
        await chrome.storage.local.set({ showSetup: true, setupComplete: false });
        chrome.tabs.create({ url: chrome.runtime.getURL("setup.html") }).catch(() => {});
        return;
      }
      // On update, only reopen setup if User Scripts still blocked.
      if (details.reason === "update" && result && result.ok === false && result.reason === "disabled") {
        const stored = await chrome.storage.local.get({ setupComplete: false });
        if (!stored.setupComplete) {
          chrome.tabs.create({ url: chrome.runtime.getURL("setup.html") }).catch(() => {});
        }
      }
    })
    .catch(() => {
      if (details.reason === "install") {
        chrome.tabs.create({ url: chrome.runtime.getURL("setup.html") }).catch(() => {});
      }
    });
});

function pushSettingsToTabs(settings) {
  if (!settings) return;
  chrome.tabs.query({ url: OUTPUT_TAB_MATCHES }, (tabs) => {
    (tabs || []).forEach((tab) => {
      if (tab && tab.id != null) {
        chrome.tabs
          .sendMessage(tab.id, { type: "dyn-bg-apply-settings", settings })
          .catch(() => {});
      }
    });
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.customEngines) {
    syncSideloadEngines().catch(() => {});
  }
  if (changes.mosaicThemeSettings || changes.messageThemeSettings || changes.leaderboardThemeSettings) {
    chrome.storage.local.get(null, (stored) => {
      if (stored && typeof stored === "object") pushSettingsToTabs(stored);
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object") return;
  if (message.type === "dyn-bg-push-settings") {
    const settings = message.settings;
    if (!settings) {
      sendResponse({ ok: false });
      return;
    }
    pushSettingsToTabs(settings);
    sendResponse({ ok: true });
    return true;
  }
  if (message.type === "dyn-bg-sync-sideload") {
    syncSideloadEngines()
      .then((result) => sendResponse(result))
      .catch((err) =>
        sendResponse({
          ok: false,
          reason: "error",
          hint: String((err && err.message) || err || "sync failed"),
          count: 0,
        })
      );
    return true;
  }
  if (message.type === "dyn-bg-user-scripts-status") {
    isUserScriptsAvailable()
      .then((available) =>
        sendResponse({
          available,
          hint: userScriptsEnableHint(),
        })
      )
      .catch(() =>
        sendResponse({
          available: false,
          hint: userScriptsEnableHint(),
        })
      );
    return true;
  }
});

syncSideloadEngines().catch(() => {});
