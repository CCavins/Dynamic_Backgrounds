(() => {
  const rulesApi = globalThis.BGExtensionRules;
  const customApi = globalThis.BGCustomThemes;
  if (!rulesApi) return;

  const enabledInput = document.getElementById("enabled");
  const enabledLabel = document.getElementById("enabled-label");
  const mosaicTheme = document.getElementById("mosaic-theme");
  const messageTheme = document.getElementById("message-theme");
  const leaderboardTheme = document.getElementById("leaderboard-theme");
  const stageAspect = document.getElementById("stage-aspect");
  const stageRatioRow = document.getElementById("stage-ratio-row");
  const stageRatioW = document.getElementById("stage-ratio-w");
  const stageRatioH = document.getElementById("stage-ratio-h");
  const mosaicShowBackground = document.getElementById("mosaic-show-background");
  const mosaicShowQr = document.getElementById("mosaic-show-qr");
  const mosaicShowLogo = document.getElementById("mosaic-show-logo");
  const mosaicChromeToggles = document.getElementById("mosaic-chrome-toggles");
  const messageShowBackground = document.getElementById("message-show-background");
  const messageShowQr = document.getElementById("message-show-qr");
  const messageShowLogo = document.getElementById("message-show-logo");
  const messageChromeToggles = document.getElementById("message-chrome-toggles");
  const messageThemeSettings = document.getElementById("message-theme-settings");
  const mosaicThemeSettings = document.getElementById("mosaic-theme-settings");
  const leaderboardThemeSettings = document.getElementById("leaderboard-theme-settings");
  const extVersionEl = document.getElementById("ext-version");
  const anyOutput = document.getElementById("any-output");
  const bgMode = document.getElementById("bg-mode");
  const bgFit = document.getElementById("bg-fit");
  const bgMediaFile = document.getElementById("bg-media-file");
  const bgMediaClear = document.getElementById("bg-media-clear");
  const bgMediaName = document.getElementById("bg-media-name");
  const bgMediaStatus = document.getElementById("bg-media-status");
  const bgMediaUploadWrap = document.getElementById("bg-media-upload-wrap");
  const bgFolderName = document.getElementById("bg-folder-name");
  const bgFolderStatus = document.getElementById("bg-folder-status");
  const bgFolderPick = document.getElementById("bg-folder-pick");
  const bgFolderAllow = document.getElementById("bg-folder-allow");
  const bgFolderRescan = document.getElementById("bg-folder-rescan");
  const bgFolderForget = document.getElementById("bg-folder-forget");
  const bgFolderListWrap = document.getElementById("bg-folder-list-wrap");
  const bgFolderList = document.getElementById("bg-folder-list");
  const bgFolderUse = document.getElementById("bg-folder-use");
  const rulesRoot = document.getElementById("rules");
  const addRule = document.getElementById("add-rule");
  const template = document.getElementById("rule-template");
  const customList = document.getElementById("custom-themes");
  const customThemeCount = document.getElementById("custom-theme-count");
  const importInput = document.getElementById("import-theme");
  const importStatus = document.getElementById("import-status");
  const sideloadStatus = document.getElementById("sideload-status");
  const sideloadActions = document.getElementById("sideload-actions");
  const sideloadOpenDetails = document.getElementById("sideload-open-details");
  const sideloadRecheck = document.getElementById("sideload-recheck");
  const setupCallout = document.getElementById("setup-callout");
  const mediaApi = globalThis.BGMediaStore;
  const folderApi = globalThis.BGFolder;
  const BG_MEDIA_ID = "bg-any-output";
  const WALLPAPER_PREFIX = "theme-wallpaper:";

  let persistTimer = 0;
  let cachedSettings = null;
  let lastMessageTheme = "off";
  let lastMosaicTheme = "off";
  let lastLeaderboardTheme = "off";
  let folderHandle = null;
  let folderSelectedFile = "";

  function isChristmasPack(id, label) {
    return /xmas|christmas/i.test(String(id || "") + " " + String(label || ""));
  }

  function setImportStatus(message, tone) {
    if (!importStatus) return;
    importStatus.textContent = message || "";
    importStatus.classList.remove("is-ok", "is-error", "is-warn");
    if (tone) importStatus.classList.add(tone);
  }

  function queryUserScriptsStatus() {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: "dyn-bg-user-scripts-status" }, (result) => {
          if (chrome.runtime.lastError) {
            resolve({
              available: false,
              hint:
                chrome.runtime.lastError.message ||
                "Open chrome://extensions → Dynamic Backgrounds → details → Allow User Scripts.",
            });
            return;
          }
          resolve(result || { available: false, hint: "" });
        });
      } catch (err) {
        resolve({
          available: false,
          hint: String((err && err.message) || err || "Could not check User Scripts."),
        });
      }
    });
  }

  async function refreshSideloadStatus() {
    if (!sideloadStatus) return;
    const status = await queryUserScriptsStatus();
    sideloadStatus.classList.remove("is-ok", "is-error");
    if (status && status.available) {
      if (setupCallout) setupCallout.hidden = true;
      sideloadStatus.classList.add("is-ok");
      sideloadStatus.textContent =
        "User Scripts are on — imported engine packs can run on output pages.";
      if (sideloadActions) sideloadActions.hidden = true;
      try {
        chrome.storage.local.set({ setupComplete: true, showSetup: false });
      } catch {
        /* ignore */
      }
      return;
    }
    if (setupCallout) setupCallout.hidden = false;
    sideloadStatus.classList.add("is-error");
    sideloadStatus.textContent =
      (status && status.hint) ||
      "Allow User Scripts is off. Engine packs will show a black screen until you enable it.";
    if (sideloadActions) sideloadActions.hidden = false;
  }

  if (sideloadOpenDetails) {
    sideloadOpenDetails.addEventListener("click", () => {
      const url = "chrome://extensions/?id=" + chrome.runtime.id;
      chrome.tabs.create({ url }).catch(() => {
        chrome.tabs.create({ url: "chrome://extensions/" });
      });
    });
  }
  if (sideloadRecheck) {
    sideloadRecheck.addEventListener("click", async () => {
      if (customApi && customApi.requestSideloadSync) {
        await customApi.requestSideloadSync();
      }
      await refreshSideloadStatus();
    });
  }
  refreshSideloadStatus();

  function setMediaStatus(el, message, tone) {
    if (!el) return;
    el.textContent = message || "";
    el.classList.remove("is-ok", "is-error");
    if (tone) el.classList.add(tone);
  }

  function wallpaperIdForTheme(themeId) {
    return WALLPAPER_PREFIX + String(themeId || "");
  }

  async function refreshMediaName(nameEl, mediaId, emptyLabel) {
    if (!nameEl) return;
    if (!mediaId || !mediaApi) {
      nameEl.textContent = emptyLabel || "No file";
      return;
    }
    const asset = await mediaApi.getMedia(mediaId);
    nameEl.textContent = asset && asset.name ? asset.name : emptyLabel || "No file";
  }

  async function handleMediaUpload(file, mediaId, nameEl, statusEl, opts) {
    if (!mediaApi) {
      setMediaStatus(statusEl, "Media uploads are unavailable.", "is-error");
      return null;
    }
    try {
      setMediaStatus(statusEl, "Importing…");
      const asset = await mediaApi.ingestFile(file, opts);
      const ok = await mediaApi.putMedia(mediaId, asset);
      if (!ok) throw new Error("Could not save that file. Try a smaller one.");
      await refreshMediaName(nameEl, mediaId, nameEl === bgMediaName ? "none" : "No file");
      setMediaStatus(statusEl, "Saved.", "is-ok");
      return mediaId;
    } catch (err) {
      setMediaStatus(statusEl, err && err.message ? err.message : "Import failed.", "is-error");
      return null;
    }
  }

  function setFolderUi(state) {
    const hasFolder = Boolean(state && state.handle);
    const needsGesture = Boolean(state && state.needsGesture);
    if (bgFolderName) {
      bgFolderName.textContent = hasFolder
        ? state.name || "Backgrounds"
        : folderApi && folderApi.supported && !folderApi.supported()
          ? "Not supported"
          : "No folder";
    }
    if (bgFolderPick) {
      bgFolderPick.textContent = hasFolder ? "Change folder…" : "Choose folder…";
    }
    if (bgFolderAllow) bgFolderAllow.hidden = !(hasFolder && needsGesture);
    if (bgFolderRescan) bgFolderRescan.hidden = !(hasFolder && !needsGesture);
    if (bgFolderForget) bgFolderForget.hidden = !hasFolder;
    if (bgFolderListWrap) bgFolderListWrap.hidden = !(hasFolder && !needsGesture);
    if (bgMediaUploadWrap) bgMediaUploadWrap.hidden = hasFolder;
  }

  function fillFolderList(files, selectedName) {
    if (!bgFolderList) return;
    bgFolderList.replaceChildren();
    (files || []).forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.name;
      opt.textContent = item.name + (item.sizeLabel ? "  ·  " + item.sizeLabel : "");
      if (selectedName && item.name === selectedName) opt.selected = true;
      bgFolderList.appendChild(opt);
    });
    if (!bgFolderList.value && bgFolderList.options.length) {
      bgFolderList.selectedIndex = 0;
    }
  }

  async function refreshFolderList() {
    if (!folderApi || !folderHandle) {
      fillFolderList([]);
      return [];
    }
    const files = await folderApi.listMediaFiles(folderHandle);
    fillFolderList(files, folderSelectedFile);
    if (bgFolderListWrap) bgFolderListWrap.hidden = false;
    return files;
  }

  async function initBackgroundFolder() {
    if (!folderApi) {
      setFolderUi(null);
      setMediaStatus(bgFolderStatus, "Folder helper unavailable.", "is-error");
      return;
    }
    if (!folderApi.supported()) {
      setFolderUi(null);
      setMediaStatus(
        bgFolderStatus,
        "Folder picking needs a recent Chrome build.",
        "is-error"
      );
      if (bgFolderPick) bgFolderPick.disabled = true;
      return;
    }
    try {
      const restored = await folderApi.restoreFolder();
      folderHandle = restored.handle || null;
      folderSelectedFile = restored.selectedFile || "";
      setFolderUi(restored);
      if (folderHandle && !restored.needsGesture) {
        const files = await refreshFolderList();
        setMediaStatus(
          bgFolderStatus,
          files.length ? files.length + " media file(s)." : "Folder is empty — add images or videos, then Rescan."
        );
        if (folderSelectedFile && mediaApi) {
          const cached = await mediaApi.getMedia(BG_MEDIA_ID, { retries: 2 });
          if (!cached || !cached.dataUrl) {
            await useFolderFile(folderSelectedFile);
          }
        }
      } else if (folderHandle && restored.needsGesture) {
        setMediaStatus(bgFolderStatus, "Click Allow access to use this folder again.");
      } else {
        setMediaStatus(bgFolderStatus, "");
      }
    } catch (err) {
      setFolderUi(null);
      setMediaStatus(
        bgFolderStatus,
        err && err.message ? err.message : "Could not restore folder.",
        "is-error"
      );
    }
  }

  async function useFolderFile(fileName) {
    if (!folderApi || !folderHandle || !fileName) return;
    try {
      setMediaStatus(bgFolderStatus, "Loading " + fileName + "…");
      const file = await folderApi.readFile(folderHandle, fileName);
      if (!cachedSettings) cachedSettings = {};
      const saved = await handleMediaUpload(file, BG_MEDIA_ID, bgMediaName, bgMediaStatus, {
        fromFolder: true,
      });
      if (!saved) {
        setMediaStatus(bgFolderStatus, "Could not apply that file.", "is-error");
        return;
      }
      folderSelectedFile = fileName;
      await folderApi.setSelectedFile(fileName);
      cachedSettings.bgMediaId = saved;
      if (bgMode && (bgMode.value === "link" || bgMode.value === "vixi")) {
        bgMode.value = "media";
        if (typeof syncSelectUI === "function") syncSelectUI(bgMode);
      }
      setMediaStatus(bgFolderStatus, "Using " + fileName + ".", "is-ok");
      persist();
    } catch (err) {
      setMediaStatus(
        bgFolderStatus,
        err && err.message ? err.message : "Could not read that file.",
        "is-error"
      );
    }
  }

  function themeSelectGroup(id, meta) {
    if (meta && meta.bundled) return "Built-in";
    if (meta && meta.custom) {
      return isChristmasPack(id, meta.label) ? "Christmas" : "Imported";
    }
    return "Built-in";
  }

  function addOptGroup(select, label, items) {
    if (!items.length) return;
    items.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
    const group = document.createElement("optgroup");
    group.label = label;
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.label;
      group.appendChild(option);
    });
    select.appendChild(group);
  }

  const CHEVRON =
    '<svg class="v2-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9.5 12 15l5.5-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CHECK =
    '<svg class="v2-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function closeAllSelects(except) {
    document.querySelectorAll(".v2-select.is-open").forEach((el) => {
      if (el !== except) el.classList.remove("is-open");
    });
  }

  function syncSelectUI(select) {
    const wrap = select.closest(".v2-select");
    if (!wrap) return;
    const valueEl = wrap.querySelector(".v2-select-value");
    const selected = select.options[select.selectedIndex];
    if (valueEl) valueEl.textContent = selected ? selected.textContent : "";
    wrap.querySelectorAll(".v2-select-option").forEach((btn) => {
      btn.classList.toggle("is-selected", btn.dataset.value === select.value);
    });
  }

  function rebuildSelectMenu(select) {
    const wrap = select.closest(".v2-select");
    if (!wrap) return;
    const menu = wrap.querySelector(".v2-select-menu");
    menu.replaceChildren();

    function addOptionBtn(opt) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "v2-select-option";
      btn.dataset.value = opt.value;
      btn.innerHTML = `<span>${opt.textContent}</span>${CHECK}`;
      if (opt.value === select.value) btn.classList.add("is-selected");
      btn.addEventListener("click", () => {
        select.value = opt.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        wrap.classList.remove("is-open");
        syncSelectUI(select);
      });
      menu.appendChild(btn);
    }

    [...select.children].forEach((child) => {
      if (child.tagName === "OPTGROUP") {
        const head = document.createElement("div");
        head.className = "v2-select-group";
        head.textContent = child.label || "";
        menu.appendChild(head);
        [...child.children].forEach(addOptionBtn);
        return;
      }
      if (child.tagName === "OPTION") addOptionBtn(child);
    });
    syncSelectUI(select);
  }

  function enhanceSelect(select) {
    if (!select) return;
    if (select.closest(".v2-select")) {
      rebuildSelectMenu(select);
      return;
    }
    const labelSpan = select.parentElement && select.parentElement.querySelector(":scope > span");
    const label = (select.dataset.label || (labelSpan && labelSpan.textContent) || "").replace(/:$/, "");
    const wrap = document.createElement("div");
    wrap.className = "v2-select";
    select.before(wrap);
    wrap.appendChild(select);
    select.tabIndex = -1;
    select.classList.add("v2-select-native");

    const field = document.createElement("button");
    field.type = "button";
    field.className = "v2-select-field";
    field.innerHTML =
      (label ? `<span class="v2-select-label">${label}:</span>` : "") +
      `<span class="v2-select-value"></span>${CHEVRON}`;
    const menu = document.createElement("div");
    menu.className = "v2-select-menu";
    wrap.appendChild(field);
    wrap.appendChild(menu);
    field.addEventListener("click", (event) => {
      event.preventDefault();
      const open = wrap.classList.contains("is-open");
      closeAllSelects();
      wrap.classList.toggle("is-open", !open);
    });
    rebuildSelectMenu(select);
    select.addEventListener("change", () => syncSelectUI(select));
  }

  function closeInfoPopovers(except) {
    document.querySelectorAll(".info-btn[aria-expanded='true']").forEach((btn) => {
      if (btn === except) return;
      btn.setAttribute("aria-expanded", "false");
      const id = btn.getAttribute("aria-controls");
      const pop = id && document.getElementById(id);
      if (pop) pop.hidden = true;
    });
  }

  document.querySelectorAll(".info-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const open = btn.getAttribute("aria-expanded") === "true";
      closeInfoPopovers();
      if (open) return;
      btn.setAttribute("aria-expanded", "true");
      const id = btn.getAttribute("aria-controls");
      const pop = id && document.getElementById(id);
      if (pop) pop.hidden = false;
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".v2-select")) closeAllSelects();
    if (!event.target.closest(".info-btn")) closeInfoPopovers();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllSelects();
      closeInfoPopovers();
    }
  });

  function setEnabledLabel() {
    enabledLabel.textContent = enabledInput.checked ? "On" : "Off";
  }

  function syncChromeToggles() {
    if (mosaicChromeToggles) {
      mosaicChromeToggles.hidden = !mosaicTheme || mosaicTheme.value === "off";
    }
    if (messageChromeToggles) {
      messageChromeToggles.hidden = !messageTheme || messageTheme.value === "off";
    }
  }

  function addThemeOption(select, id, label) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = label;
    select.appendChild(option);
  }

  function fillThemeSelect(select, meta) {
    const current = select.value;
    select.replaceChildren();
    addThemeOption(select, "off", "Off");
    const groups = { "Built-in": [], Christmas: [], Imported: [] };
    Object.keys(meta || {}).forEach((id) => {
      const entry = meta[id] || {};
      if (entry.hidden) return;
      const label = entry.label || id;
      const group = themeSelectGroup(id, entry);
      groups[group].push({ id, label });
    });
    addOptGroup(select, "Built-in", groups["Built-in"]);
    addOptGroup(select, "Christmas", groups.Christmas);
    addOptGroup(select, "Imported", groups.Imported);
    if ([...select.options].some((opt) => opt.value === current)) select.value = current;
    enhanceSelect(select);
  }

  function fillMosaicThemeOptions() {
    const meta = rulesApi.mosaicThemeMetaAll
      ? rulesApi.mosaicThemeMetaAll()
      : rulesApi.MOSAIC_THEME_META || {};
    fillThemeSelect(mosaicTheme, meta);
  }

  function fillMessageThemeOptions() {
    const meta = rulesApi.messageThemeMetaAll
      ? rulesApi.messageThemeMetaAll()
      : rulesApi.MESSAGE_THEME_META || {};
    fillThemeSelect(messageTheme, meta);
  }

  function fillLeaderboardThemeOptions() {
    if (!leaderboardTheme) return;
    const meta = rulesApi.leaderboardThemeMetaAll
      ? rulesApi.leaderboardThemeMetaAll()
      : rulesApi.LEADERBOARD_THEME_META || {};
    const current = leaderboardTheme.value;
    leaderboardTheme.replaceChildren();
    addThemeOption(leaderboardTheme, "off", "Vixi (default)");
    Object.keys(meta || {}).forEach((id) => {
      const entry = meta[id] || {};
      addThemeOption(leaderboardTheme, id, entry.label || id);
    });
    if ([...leaderboardTheme.options].some((opt) => opt.value === current)) {
      leaderboardTheme.value = current;
    }
    enhanceSelect(leaderboardTheme);
  }

  function packSortKey(pack) {
    return String(pack.label || pack.id || "").toLowerCase();
  }

  function formatImportStamp(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function appendCustomThemeRow(parent, pack) {
    const row = document.createElement("div");
    row.className = "custom-theme-row";

    const main = document.createElement("div");
    main.className = "custom-theme-main";

    const title = document.createElement("div");
    title.className = "custom-theme-title";
    title.textContent = pack.label || pack.id;

    const meta = document.createElement("div");
    meta.className = "custom-theme-meta";
    const badges = document.createElement("div");
    badges.className = "custom-theme-badges";

    const kindBadge = document.createElement("span");
    kindBadge.className = "theme-badge";
    kindBadge.textContent = pack.kind === "message" ? "Message" : "Mosaic";
    badges.appendChild(kindBadge);

    if (pack.engine) {
      const eng = document.createElement("span");
      eng.className = "theme-badge theme-badge-engine";
      eng.textContent = "Engine";
      badges.appendChild(eng);
    }

    if (pack.fontId || pack.fontFile || (pack.fontFaces && pack.fontFaces.length)) {
      const faces =
        customApi && customApi.getPackFontFaces
          ? customApi.getPackFontFaces(pack)
          : pack.fontFaces && pack.fontFaces.length
            ? pack.fontFaces
            : [{ fontFile: pack.fontFile, fontFamily: pack.fontFamily, fontId: pack.fontId }];
      const families = faces
        .map((face) => face.fontFamily || face.fontFile || "")
        .filter(Boolean);
      const font = document.createElement("span");
      font.className = "theme-badge theme-badge-font";
      if (families.length > 1) {
        font.textContent = "Fonts · " + families.length;
        font.title = families.join(", ");
      } else {
        font.textContent = families[0] ? "Font · " + families[0] : "Font";
        font.title = faces.map((face) => face.fontFile || face.fontId || "").filter(Boolean).join(", ");
      }
      badges.appendChild(font);
    }

    const idLine = document.createElement("code");
    idLine.className = "custom-theme-id";
    idLine.textContent = pack.id;

    meta.appendChild(badges);
    meta.appendChild(idLine);

    const stampIso = pack.updatedAt || pack.importedAt;
    const stampText = formatImportStamp(stampIso);
    if (stampText) {
      const stamp = document.createElement("div");
      stamp.className = "custom-theme-stamp";
      const replaced =
        pack.importedAt &&
        pack.updatedAt &&
        pack.importedAt !== pack.updatedAt;
      stamp.textContent = (replaced ? "Updated " : "Imported ") + stampText;
      meta.appendChild(stamp);
    }

    main.appendChild(title);
    main.appendChild(meta);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "v2-btn v2-btn-destructive";
    remove.textContent = "Remove";
    remove.addEventListener("click", async () => {
      if (!customApi) return;
      const ok = window.confirm(
        'Remove "' + pack.label + '"?\n\nThis cannot be undone. You can import the theme again later.'
      );
      if (!ok) return;
      const next = await customApi.removePack(pack.id);
      if (messageTheme.value === pack.id) {
        messageTheme.value = "off";
        lastMessageTheme = "off";
        renderThemeSettings("off");
      }
      if (mosaicTheme.value === pack.id) mosaicTheme.value = "off";
      fillMosaicThemeOptions();
      fillMessageThemeOptions();
      syncSelectUI(mosaicTheme);
      syncSelectUI(messageTheme);
      syncChromeToggles();
      renderCustomList(next);
      persist();
      setImportStatus("Removed " + pack.label + ".", "is-warn");
    });

    row.appendChild(main);
    row.appendChild(remove);
    parent.appendChild(row);
  }

  function appendPackSection(parent, title, packs) {
    if (!packs.length) return;
    const section = document.createElement("div");
    section.className = "custom-theme-group";
    const heading = document.createElement("h3");
    heading.className = "custom-theme-group-title";
    heading.textContent = title + " · " + packs.length;
    section.appendChild(heading);
    packs
      .slice()
      .sort((a, b) => packSortKey(a).localeCompare(packSortKey(b)))
      .forEach((pack) => appendCustomThemeRow(section, pack));
    parent.appendChild(section);
  }

  function renderCustomList(packs) {
    if (!customList) return;
    customList.replaceChildren();
    const list = packs || [];
    if (customThemeCount) {
      if (list.length) {
        customThemeCount.hidden = false;
        customThemeCount.textContent = String(list.length);
      } else {
        customThemeCount.hidden = true;
        customThemeCount.textContent = "";
      }
    }
    if (!list.length) {
      const empty = document.createElement("p");
      empty.className = "help custom-theme-empty";
      empty.textContent = "No imported themes yet. Use Import pack… above.";
      customList.appendChild(empty);
      return;
    }
    appendPackSection(
      customList,
      "Mosaic",
      list.filter((p) => p.kind === "mosaic")
    );
    appendPackSection(
      customList,
      "Message",
      list.filter((p) => p.kind === "message")
    );
  }

  function colorRow(key, label, value) {
    const row = document.createElement("label");
    row.className = "setting-row";
    row.innerHTML =
      `<span>${label}</span>` +
      `<input type="text" class="theme-hex" data-key="${key}" maxlength="7" spellcheck="false" value="${value}">` +
      `<input type="color" class="theme-color" data-key="${key}" value="${value}">`;
    return row;
  }

  function selectRow(key, label, value, options) {
    const row = document.createElement("label");
    row.className = "setting-row select";
    const opts = (options || [])
      .map(
        (option) =>
          `<option value="${option.value}">${option.label || option.value}</option>`
      )
      .join("");
    row.innerHTML =
      `<span>${label}</span>` +
      `<select class="theme-select" data-key="${key}">${opts}</select>`;
    const select = row.querySelector("select");
    if (select) select.value = value || (options[0] && options[0].value) || "";
    return row;
  }

  function motionRow(value) {
    const row = document.createElement("label");
    row.className = "setting-row select";
    row.innerHTML =
      `<select class="theme-motion" data-key="motion" data-label="Motion">` +
        `<option value="slow">Slow — wander</option>` +
        `<option value="drift">Drift — across the field</option>` +
        `<option value="fizz">Fizz — rise from below</option>` +
      `</select>`;
    row.querySelector("select").value = value;
    return row;
  }

  function toggleRow(key, label, value) {
    const row = document.createElement("label");
    row.className = "setting-row toggle";
    row.innerHTML =
      `<span>${label}</span>` +
      `<input type="checkbox" class="theme-toggle" data-key="${key}"${value ? " checked" : ""}>`;
    return row;
  }

  function appendExtraThemeSettings(container, meta, values) {
    const skip = new Set(["primary", "secondary", "background", "panel", "scale", "motion", "wallpaper", "revealMs"]);
    const labels = (meta && meta.labels) || {};
    const defaults = (meta && meta.defaults) || {};
    const selects = (meta && meta.selects) || {};
    Object.keys(defaults).forEach((key) => {
      if (skip.has(key)) return;
      if (selects[key] && selects[key].length) {
        container.appendChild(
          selectRow(key, labels[key] || key, values[key] || defaults[key], selects[key])
        );
      } else if (typeof defaults[key] === "boolean") {
        container.appendChild(toggleRow(key, labels[key] || key, Boolean(values[key])));
      } else if (/^#[0-9a-fA-F]{6}$/.test(defaults[key])) {
        container.appendChild(colorRow(key, labels[key] || key, values[key] || defaults[key]));
      }
    });
  }

  function bindSelectInputs(container, onChange) {
    container.querySelectorAll(".theme-select").forEach((input) => {
      input.addEventListener("change", onChange);
      enhanceSelect(input);
    });
  }

  function readSelectSettings(container, raw) {
    container.querySelectorAll(".theme-select").forEach((input) => {
      raw[input.dataset.key] = input.value;
    });
  }

  function bindToggleInputs(container, onChange) {
    container.querySelectorAll(".theme-toggle").forEach((input) => {
      input.addEventListener("change", onChange);
    });
  }

  function readToggleSettings(container, raw) {
    container.querySelectorAll(".theme-toggle").forEach((input) => {
      raw[input.dataset.key] = input.checked;
    });
  }

  function readHexSettings(container, raw) {
    container.querySelectorAll(".theme-hex").forEach((input) => {
      if (input.dataset.key) raw[input.dataset.key] = input.value;
    });
  }

  function scaleRow(label, value) {
    const pct = Math.max(90, Math.min(150, Math.round((Number(value) || 1) * 100)));
    const row = document.createElement("label");
    row.className = "setting-row scale";
    row.innerHTML =
      `<span>${label}</span>` +
      `<input type="range" class="theme-scale" min="90" max="150" step="1" value="${pct}">` +
      `<span class="theme-scale-value">${pct}%</span>`;
    return row;
  }

  function mosaicStoreId(id) {
    if (!id || id === "off") return "";
    return rulesApi.mosaicSettingsBaseId ? rulesApi.mosaicSettingsBaseId(id) : id;
  }

  function mosaicMetaFor(id) {
    const allMeta = rulesApi.mosaicThemeMetaAll
      ? rulesApi.mosaicThemeMetaAll()
      : rulesApi.MOSAIC_THEME_META || {};
    const storeId = mosaicStoreId(id) || id;
    return allMeta[id] && allMeta[id].defaults ? allMeta[id] : allMeta[storeId] || allMeta[id];
  }

  function themeSettingsFor(id) {
    const stored = cachedSettings && cachedSettings.messageThemeSettings;
    return rulesApi.normalizeOneThemeSettings(id, stored && stored[id]);
  }

  function mosaicSettingsFor(id) {
    const storeId = mosaicStoreId(id) || id;
    const stored = cachedSettings && cachedSettings.mosaicThemeSettings;
    return rulesApi.normalizeOneThemeSettings(storeId, stored && (stored[id] || stored[storeId]));
  }

  function leaderboardSettingsFor(id) {
    const stored = cachedSettings && cachedSettings.leaderboardThemeSettings;
    return rulesApi.normalizeOneThemeSettings(id, stored && stored[id]);
  }

  function bindColorInputs(root, onInput) {
    root.querySelectorAll(".theme-color").forEach((colorInput) => {
      const key = colorInput.dataset.key;
      const hexInput = root.querySelector(`.theme-hex[data-key="${key}"]`);
      colorInput.addEventListener("input", () => {
        if (hexInput) hexInput.value = colorInput.value;
        onInput();
      });
    });
    root.querySelectorAll(".theme-hex").forEach((hexInput) => {
      const key = hexInput.dataset.key;
      const colorInput = root.querySelector(`.theme-color[data-key="${key}"]`);
      hexInput.addEventListener("input", () => {
        const v = hexInput.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(v) && colorInput) {
          colorInput.value = v.toLowerCase();
        }
        onInput();
      });
    });
  }

  function mediaRow(themeId, label, mediaId) {
    const wrap = document.createElement("div");
    wrap.className = "media-row setting-row";
    wrap.dataset.setting = "wallpaper";
    const head = document.createElement("div");
    head.className = "media-row-head";
    const title = document.createElement("span");
    title.textContent = label || "Wallpaper";
    const nameEl = document.createElement("span");
    nameEl.className = "media-file-name";
    nameEl.textContent = "No file";
    head.appendChild(title);
    head.appendChild(nameEl);
    const actions = document.createElement("div");
    actions.className = "media-row-actions";
    const uploadLabel = document.createElement("label");
    uploadLabel.className = "v2-btn v2-btn-secondary media-upload-btn";
    uploadLabel.textContent = "Choose file…";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*,.gif";
    input.hidden = true;
    uploadLabel.appendChild(input);
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "v2-btn v2-btn-secondary";
    clearBtn.textContent = "Clear";
    actions.appendChild(uploadLabel);
    actions.appendChild(clearBtn);
    const status = document.createElement("p");
    status.className = "media-status";
    status.setAttribute("role", "status");
    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.className = "theme-wallpaper";
    hidden.value = mediaId || "";
    wrap.appendChild(head);
    wrap.appendChild(actions);
    wrap.appendChild(status);
    wrap.appendChild(hidden);
    refreshMediaName(nameEl, mediaId, "No file");
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      input.value = "";
      if (!file) return;
      const id = wallpaperIdForTheme(themeId);
      const saved = await handleMediaUpload(file, id, nameEl, status);
      if (saved) {
        hidden.value = saved;
        persist();
      }
    });
    clearBtn.addEventListener("click", async () => {
      const id = hidden.value || wallpaperIdForTheme(themeId);
      if (mediaApi && id) await mediaApi.removeMedia(id);
      hidden.value = "";
      nameEl.textContent = "No file";
      setMediaStatus(status, "Cleared.");
      persist();
    });
    return wrap;
  }

  function themeSettingsTitle() {
    const title = document.createElement("p");
    title.className = "theme-settings-title";
    title.textContent = "Theme settings";
    return title;
  }

  function renderThemeSettings(id) {
    messageThemeSettings.replaceChildren();
    const allMeta = rulesApi.messageThemeMetaAll ? rulesApi.messageThemeMetaAll() : rulesApi.MESSAGE_THEME_META || {};
    const meta = allMeta[id];
    if (!meta || !meta.defaults) {
      messageThemeSettings.hidden = true;
      return;
    }

    messageThemeSettings.appendChild(themeSettingsTitle());
    const values = themeSettingsFor(id);
    const labels = meta.labels || {};
    if (meta.defaults.primary) {
      messageThemeSettings.appendChild(colorRow("primary", labels.primary || "Primary", values.primary));
    }
    if (meta.defaults.secondary) {
      messageThemeSettings.appendChild(colorRow("secondary", labels.secondary || "Secondary", values.secondary));
    }
    if (meta.defaults.background) {
      messageThemeSettings.appendChild(
        colorRow("background", labels.background || "Background", values.background)
      );
    }
    if (meta.defaults.motion) {
      messageThemeSettings.appendChild(motionRow(values.motion));
    }
    if (Object.prototype.hasOwnProperty.call(meta.defaults, "wallpaper")) {
      messageThemeSettings.appendChild(
        mediaRow(id, labels.wallpaper || "Chat wallpaper", values.wallpaper || "")
      );
    }
    appendExtraThemeSettings(messageThemeSettings, meta, values);

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "reset-theme v2-btn v2-btn-secondary";
    reset.textContent = "Reset theme colors";
    reset.addEventListener("click", async () => {
      if (!cachedSettings) cachedSettings = {};
      const prev = (cachedSettings.messageThemeSettings && cachedSettings.messageThemeSettings[id]) || {};
      if (prev.wallpaper && mediaApi) await mediaApi.removeMedia(prev.wallpaper);
      cachedSettings.messageThemeSettings = { ...(cachedSettings.messageThemeSettings || {}) };
      cachedSettings.messageThemeSettings[id] = rulesApi.normalizeOneThemeSettings(id, {});
      renderThemeSettings(id);
      persist();
    });
    messageThemeSettings.appendChild(reset);

    bindColorInputs(messageThemeSettings, persist);
    bindToggleInputs(messageThemeSettings, persist);
    bindSelectInputs(messageThemeSettings, persist);
    messageThemeSettings.querySelectorAll(".theme-motion").forEach((input) => {
      input.addEventListener("change", persist);
      enhanceSelect(input);
    });

    messageThemeSettings.hidden = false;
  }

  function renderMosaicThemeSettings(id) {
    if (!mosaicThemeSettings) return;
    mosaicThemeSettings.replaceChildren();
    if (!id || id === "off") {
      mosaicThemeSettings.hidden = true;
      return;
    }
    const meta = mosaicMetaFor(id);
    const storeId = mosaicStoreId(id) || id;
    if (!meta || !meta.defaults || (rulesApi.themeHasMosaicControls && !rulesApi.themeHasMosaicControls(meta))) {
      mosaicThemeSettings.hidden = true;
      return;
    }

    const values = mosaicSettingsFor(id);
    const labels = meta.labels || {};
    mosaicThemeSettings.appendChild(themeSettingsTitle());
    if (meta.defaults.scale != null) {
      mosaicThemeSettings.appendChild(scaleRow(labels.scale || "Photo size", values.scale));
    }
    if (meta.defaults.primary) {
      mosaicThemeSettings.appendChild(colorRow("primary", labels.primary || "Primary", values.primary));
    }
    if (meta.defaults.secondary) {
      mosaicThemeSettings.appendChild(colorRow("secondary", labels.secondary || "Secondary", values.secondary));
    }
    if (meta.defaults.background) {
      mosaicThemeSettings.appendChild(
        colorRow("background", labels.background || "Background", values.background)
      );
    }
    appendExtraThemeSettings(mosaicThemeSettings, meta, values);

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "reset-theme v2-btn v2-btn-secondary";
    reset.textContent = "Reset theme";
    reset.addEventListener("click", () => {
      if (!cachedSettings) cachedSettings = {};
      cachedSettings.mosaicThemeSettings = { ...(cachedSettings.mosaicThemeSettings || {}) };
      cachedSettings.mosaicThemeSettings[storeId] = rulesApi.normalizeOneThemeSettings(storeId, {});
      renderMosaicThemeSettings(id);
      persist();
    });
    mosaicThemeSettings.appendChild(reset);

    bindColorInputs(mosaicThemeSettings, persist);
    bindToggleInputs(mosaicThemeSettings, persist);
    bindSelectInputs(mosaicThemeSettings, persist);
    mosaicThemeSettings.querySelectorAll(".theme-scale").forEach((input) => {
      const valueEl = mosaicThemeSettings.querySelector(".theme-scale-value");
      input.addEventListener("input", () => {
        if (valueEl) valueEl.textContent = input.value + "%";
        schedulePersist();
      });
    });

    mosaicThemeSettings.hidden = false;
  }

  function renderLeaderboardThemeSettings(id) {
    if (!leaderboardThemeSettings) return;
    leaderboardThemeSettings.replaceChildren();
    if (!id || id === "off") {
      leaderboardThemeSettings.hidden = true;
      return;
    }
    const meta = rulesApi.leaderboardThemeMetaAll
      ? rulesApi.leaderboardThemeMetaAll()[id]
      : (rulesApi.LEADERBOARD_THEME_META || {})[id];
    if (!meta || !meta.defaults) {
      leaderboardThemeSettings.hidden = true;
      return;
    }
    leaderboardThemeSettings.appendChild(themeSettingsTitle());
    const values = leaderboardSettingsFor(id);
    const labels = meta.labels || {};
    if (meta.defaults.primary) {
      leaderboardThemeSettings.appendChild(
        colorRow("primary", labels.primary || "Accent", values.primary)
      );
    }
    if (meta.defaults.secondary) {
      leaderboardThemeSettings.appendChild(
        colorRow("secondary", labels.secondary || "Highlight", values.secondary)
      );
    }
    if (meta.defaults.panel) {
      leaderboardThemeSettings.appendChild(
        colorRow("panel", labels.panel || "Boxes", values.panel)
      );
    }
    if (meta.defaults.background) {
      leaderboardThemeSettings.appendChild(
        colorRow("background", labels.background || "Background", values.background)
      );
    }
    appendExtraThemeSettings(leaderboardThemeSettings, meta, values);
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "reset-theme v2-btn v2-btn-secondary";
    reset.textContent = "Reset theme colors";
    reset.addEventListener("click", () => {
      if (!cachedSettings) cachedSettings = {};
      cachedSettings.leaderboardThemeSettings = {
        ...(cachedSettings.leaderboardThemeSettings || {}),
      };
      cachedSettings.leaderboardThemeSettings[id] = rulesApi.normalizeOneThemeSettings(id, {});
      renderLeaderboardThemeSettings(id);
      persist();
    });
    leaderboardThemeSettings.appendChild(reset);
    bindColorInputs(leaderboardThemeSettings, persist);
    bindToggleInputs(leaderboardThemeSettings, persist);
    bindSelectInputs(leaderboardThemeSettings, persist);
    leaderboardThemeSettings.hidden = false;
  }

  function readThemeForm(id) {
    if (!id || id === "off") return {};
    const raw = {};
    readHexSettings(messageThemeSettings, raw);
    readSelectSettings(messageThemeSettings, raw);
    const motion = messageThemeSettings.querySelector(".theme-motion");
    const wallpaper = messageThemeSettings.querySelector(".theme-wallpaper");
    if (motion) raw.motion = motion.value;
    if (wallpaper) raw.wallpaper = wallpaper.value;
    readToggleSettings(messageThemeSettings, raw);
    return rulesApi.normalizeOneThemeSettings(id, raw);
  }

  function readMosaicForm(id) {
    if (!id || id === "off" || !mosaicThemeSettings) return {};
    const storeId = mosaicStoreId(id) || id;
    const raw = {};
    readHexSettings(mosaicThemeSettings, raw);
    readSelectSettings(mosaicThemeSettings, raw);
    const scale = mosaicThemeSettings.querySelector(".theme-scale");
    if (scale) raw.scale = Number(scale.value) / 100;
    readToggleSettings(mosaicThemeSettings, raw);
    return rulesApi.normalizeOneThemeSettings(storeId, raw);
  }

  function readLeaderboardForm(id) {
    if (!id || id === "off" || !leaderboardThemeSettings) return {};
    const raw = {};
    readHexSettings(leaderboardThemeSettings, raw);
    readSelectSettings(leaderboardThemeSettings, raw);
    readToggleSettings(leaderboardThemeSettings, raw);
    return rulesApi.normalizeOneThemeSettings(id, raw);
  }

  function stashCurrentThemeForm() {
    if (!cachedSettings) cachedSettings = {};
    cachedSettings.messageThemeSettings = { ...(cachedSettings.messageThemeSettings || {}) };
    if (lastMessageTheme !== "off") {
      cachedSettings.messageThemeSettings[lastMessageTheme] = readThemeForm(lastMessageTheme);
    }
  }

  function stashCurrentMosaicForm() {
    if (!cachedSettings) cachedSettings = {};
    cachedSettings.mosaicThemeSettings = { ...(cachedSettings.mosaicThemeSettings || {}) };
    if (lastMosaicTheme !== "off") {
      const storeId = mosaicStoreId(lastMosaicTheme) || lastMosaicTheme;
      cachedSettings.mosaicThemeSettings[storeId] = readMosaicForm(lastMosaicTheme);
    }
  }

  function stashCurrentLeaderboardForm() {
    if (!cachedSettings) cachedSettings = {};
    cachedSettings.leaderboardThemeSettings = {
      ...(cachedSettings.leaderboardThemeSettings || {}),
    };
    if (lastLeaderboardTheme !== "off") {
      cachedSettings.leaderboardThemeSettings[lastLeaderboardTheme] =
        readLeaderboardForm(lastLeaderboardTheme);
    }
  }

  function addRuleRow(rule) {
    const node = template.content.firstElementChild.cloneNode(true);
    const outputUrl = node.querySelector(".output-url");
    const iframeHtml = node.querySelector(".iframe-html");
    outputUrl.value = rule && rule.outputUrl ? rule.outputUrl : "";
    iframeHtml.value = rule && rule.iframeHtml ? rule.iframeHtml : "";
    node.querySelector(".remove-rule").addEventListener("click", () => {
      node.remove();
      persist();
    });
    outputUrl.addEventListener("input", schedulePersist);
    iframeHtml.addEventListener("input", schedulePersist);
    rulesRoot.appendChild(node);
  }

  function collectSettings() {
    const rows = [...rulesRoot.querySelectorAll(".rule")].map((node) => ({
      outputUrl: node.querySelector(".output-url").value.trim(),
      iframeHtml: node.querySelector(".iframe-html").value.trim(),
    }));
    const theme = messageTheme.value;
    const mosaicId = mosaicTheme.value;
    const leaderboardId = leaderboardTheme ? leaderboardTheme.value : "off";
    const themeSettings = { ...((cachedSettings && cachedSettings.messageThemeSettings) || {}) };
    if (theme !== "off") themeSettings[theme] = readThemeForm(theme);
    const mosaicSettings = { ...((cachedSettings && cachedSettings.mosaicThemeSettings) || {}) };
    if (mosaicId !== "off") {
      const storeId = mosaicStoreId(mosaicId) || mosaicId;
      mosaicSettings[storeId] = readMosaicForm(mosaicId);
    }
    const leaderboardSettings = {
      ...((cachedSettings && cachedSettings.leaderboardThemeSettings) || {}),
    };
    if (leaderboardId !== "off") {
      leaderboardSettings[leaderboardId] = readLeaderboardForm(leaderboardId);
    }
    return {
      enabled: enabledInput.checked,
      stageAspect: readStageAspect(),
      mosaicShowBackground: Boolean(mosaicShowBackground && mosaicShowBackground.checked),
      mosaicShowQr: Boolean(mosaicShowQr && mosaicShowQr.checked),
      mosaicShowLogo: Boolean(mosaicShowLogo && mosaicShowLogo.checked),
      messageShowBackground: Boolean(messageShowBackground && messageShowBackground.checked),
      messageShowQr: Boolean(messageShowQr && messageShowQr.checked),
      messageShowLogo: Boolean(messageShowLogo && messageShowLogo.checked),
      mosaicTheme: mosaicId,
      messageTheme: theme,
      leaderboardTheme: leaderboardId,
      messageThemeSettings: themeSettings,
      mosaicThemeSettings: mosaicSettings,
      leaderboardThemeSettings: leaderboardSettings,
      anyOutputIframeHtml: anyOutput ? anyOutput.value : "",
      bgMode: bgMode ? bgMode.value : "auto",
      bgMediaId: cachedSettings && cachedSettings.bgMediaId ? cachedSettings.bgMediaId : "",
      bgFit: bgFit ? bgFit.value : "cover",
      rules: rows,
    };
  }

  function persist() {
    return rulesApi.saveSettings(collectSettings()).then(() => {
      cachedSettings = rulesApi.normalizeSettings(collectSettings());
      pushSettingsToOutputTabs(cachedSettings);
    });
  }

  function pushSettingsToOutputTabs(settings) {
    if (!settings) return;
    if (chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage({ type: "dyn-bg-push-settings", settings });
      } catch {
        /* popup closing */
      }
    }
    if (chrome.tabs && chrome.tabs.query) {
      try {
        chrome.tabs.query(
          { url: ["*://*.thefamousgroup.com/*", "*://*.vixisuite.com/*"] },
          (tabs) => {
            (tabs || []).forEach((tab) => {
              if (tab && tab.id != null) {
                chrome.tabs
                  .sendMessage(tab.id, { type: "dyn-bg-apply-settings", settings })
                  .catch(() => {});
              }
            });
          }
        );
      } catch {
        /* no tab access */
      }
    }
  }

  function flushPersist() {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = 0;
    }
    return persist();
  }

  window.addEventListener("pagehide", () => {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = 0;
      rulesApi.saveSettings(collectSettings());
    }
  });

  function schedulePersist() {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = 0;
      persist();
    }, 120);
  }

  enabledInput.addEventListener("change", () => {
    setEnabledLabel();
    persist();
  });
  mosaicTheme.addEventListener("change", () => {
    stashCurrentMosaicForm();
    lastMosaicTheme = mosaicTheme.value;
    renderMosaicThemeSettings(mosaicTheme.value);
    syncChromeToggles();
    persist();
  });
  function readStageAspect() {
    if (!stageAspect) return "vixi";
    if (stageAspect.value === "auto" || stageAspect.value === "vixi") return stageAspect.value;
    if (stageAspect.value !== "custom") return stageAspect.value;
    const raw =
      String((stageRatioW && stageRatioW.value) || "").trim() +
      ":" +
      String((stageRatioH && stageRatioH.value) || "").trim();
    const next = rulesApi.normalizeStageAspect(raw);
    if (next !== "vixi" && next !== "auto") return next;
    return (cachedSettings && cachedSettings.stageAspect) || "16:9";
  }

  function fillRatioFields(mode) {
    if (!stageRatioW || !stageRatioH) return;
    const parsed = rulesApi.parseStageAspect ? rulesApi.parseStageAspect(mode) : null;
    if (!parsed || parsed.mode === "auto" || parsed.mode === "vixi") {
      stageRatioW.value = "16";
      stageRatioH.value = "9";
      return;
    }
    stageRatioW.value = String(parsed.aw);
    stageRatioH.value = String(parsed.ah);
  }

  function showCustomRatioFields(show) {
    if (stageRatioRow) stageRatioRow.hidden = !show;
  }

  function syncStageAspectUI(mode) {
    if (!stageAspect) return;
    const next = rulesApi.normalizeStageAspect(mode);
    if (next === "vixi" || next === "auto") {
      stageAspect.value = next;
      fillRatioFields("16:9");
      showCustomRatioFields(false);
      syncSelectUI(stageAspect);
      return;
    }
    const preset = rulesApi.presetForAspect ? rulesApi.presetForAspect(next) : next;
    stageAspect.value = preset;
    if (![...stageAspect.options].some((opt) => opt.value === stageAspect.value)) {
      stageAspect.value = "custom";
    }
    const custom = stageAspect.value === "custom";
    fillRatioFields(next);
    showCustomRatioFields(custom);
    syncSelectUI(stageAspect);
  }

  if (stageAspect) {
    enhanceSelect(stageAspect);
    stageAspect.addEventListener("change", () => {
      const custom = stageAspect.value === "custom";
      if (custom) {
        const seed =
          cachedSettings &&
          cachedSettings.stageAspect &&
          cachedSettings.stageAspect !== "auto" &&
          cachedSettings.stageAspect !== "vixi"
            ? cachedSettings.stageAspect
            : "16:9";
        fillRatioFields(seed);
      }
      showCustomRatioFields(custom);
      persist();
    });
  }
  if (stageRatioW) {
    stageRatioW.addEventListener("input", schedulePersist);
  }
  if (stageRatioH) {
    stageRatioH.addEventListener("input", schedulePersist);
  }
  [
    mosaicShowBackground,
    mosaicShowQr,
    mosaicShowLogo,
    messageShowBackground,
    messageShowQr,
    messageShowLogo,
  ].forEach((input) => {
    if (input) input.addEventListener("change", persist);
  });
  messageTheme.addEventListener("change", () => {
    stashCurrentThemeForm();
    lastMessageTheme = messageTheme.value;
    renderThemeSettings(messageTheme.value);
    syncChromeToggles();
    persist();
  });
  if (leaderboardTheme) {
    leaderboardTheme.addEventListener("change", () => {
      stashCurrentLeaderboardForm();
      lastLeaderboardTheme = leaderboardTheme.value;
      renderLeaderboardThemeSettings(leaderboardTheme.value);
      persist();
    });
  }
  anyOutput.addEventListener("input", schedulePersist);
  if (bgMode) {
    enhanceSelect(bgMode);
    bgMode.addEventListener("change", persist);
  }
  if (bgFit) {
    enhanceSelect(bgFit);
    bgFit.addEventListener("change", persist);
  }
  if (bgMediaFile) {
    bgMediaFile.addEventListener("change", async () => {
      const file = bgMediaFile.files && bgMediaFile.files[0];
      bgMediaFile.value = "";
      if (!file) return;
      if (!cachedSettings) cachedSettings = {};
      const saved = await handleMediaUpload(file, BG_MEDIA_ID, bgMediaName, bgMediaStatus);
      if (saved) {
        cachedSettings.bgMediaId = saved;
        if (bgMode && (bgMode.value === "link" || bgMode.value === "vixi")) {
          bgMode.value = "media";
          if (typeof syncSelectUI === "function") syncSelectUI(bgMode);
        }
        persist();
      }
    });
  }
  if (bgMediaClear) {
    bgMediaClear.addEventListener("click", async () => {
      if (mediaApi) await mediaApi.removeMedia(BG_MEDIA_ID);
      if (!cachedSettings) cachedSettings = {};
      cachedSettings.bgMediaId = "";
      if (bgMediaName) bgMediaName.textContent = "none";
      setMediaStatus(bgMediaStatus, "Cleared.");
      folderSelectedFile = "";
      if (folderApi) await folderApi.setSelectedFile("");
      if (folderHandle) {
        try {
          await refreshFolderList();
        } catch {
          /* ignore */
        }
      }
      persist();
    });
  }

  if (bgFolderPick) {
    bgFolderPick.addEventListener("click", async () => {
      if (!folderApi) return;
      try {
        setMediaStatus(bgFolderStatus, "Pick a folder…");
        const picked = await folderApi.pickFolder();
        folderHandle = picked.handle;
        setFolderUi({
          handle: folderHandle,
          name: picked.name,
          needsGesture: false,
        });
        const files = await refreshFolderList();
        setMediaStatus(
          bgFolderStatus,
          files.length
            ? files.length + " media file(s). Select one and Use selected."
            : "Folder linked. Add images or videos, then Rescan.",
          "is-ok"
        );
      } catch (err) {
        if (err && err.name === "AbortError") {
          setMediaStatus(bgFolderStatus, "Folder pick canceled.");
          return;
        }
        setMediaStatus(
          bgFolderStatus,
          err && err.message ? err.message : "Could not open that folder.",
          "is-error"
        );
      }
    });
  }

  if (bgFolderAllow) {
    bgFolderAllow.addEventListener("click", async () => {
      if (!folderApi || !folderHandle) return;
      try {
        const perm = await folderApi.ensurePermission(folderHandle);
        if (!perm.ok) {
          setMediaStatus(bgFolderStatus, "Permission denied for that folder.", "is-error");
          return;
        }
        setFolderUi({
          handle: folderHandle,
          name: folderHandle.name || "Backgrounds",
          needsGesture: false,
        });
        const files = await refreshFolderList();
        setMediaStatus(
          bgFolderStatus,
          files.length ? files.length + " media file(s)." : "Folder is empty.",
          "is-ok"
        );
      } catch (err) {
        setMediaStatus(
          bgFolderStatus,
          err && err.message ? err.message : "Could not get access.",
          "is-error"
        );
      }
    });
  }

  if (bgFolderRescan) {
    bgFolderRescan.addEventListener("click", async () => {
      if (!folderHandle || !folderApi) return;
      try {
        // Re-check permission in case Chrome revoked it while the popup stayed open.
        const perm = await folderApi.ensurePermission(folderHandle);
        if (!perm.ok) {
          setFolderUi({
            handle: folderHandle,
            name: folderHandle.name || "Backgrounds",
            needsGesture: true,
          });
          setMediaStatus(bgFolderStatus, "Click Allow access to use this folder again.");
          return;
        }
        setMediaStatus(bgFolderStatus, "Scanning…");
        const files = await refreshFolderList();
        setMediaStatus(
          bgFolderStatus,
          files.length ? files.length + " media file(s)." : "No media files found.",
          "is-ok"
        );
      } catch (err) {
        setMediaStatus(
          bgFolderStatus,
          err && err.message ? err.message : "Rescan failed.",
          "is-error"
        );
      }
    });
  }

  if (bgFolderForget) {
    bgFolderForget.addEventListener("click", async () => {
      if (!folderApi) return;
      const folderLabel =
        (folderHandle && folderHandle.name) ||
        (bgFolderName && bgFolderName.textContent) ||
        "this folder";
      const ok = window.confirm(
        "Forget \"" +
          folderLabel +
          "\"?\n\nThe popup will stop listing that folder. Your current active background media is not removed."
      );
      if (!ok) return;
      await folderApi.forgetFolder();
      folderHandle = null;
      folderSelectedFile = "";
      fillFolderList([]);
      setFolderUi(null);
      setMediaStatus(bgFolderStatus, "Folder forgotten. Active media is unchanged.");
    });
  }

  if (bgFolderUse) {
    bgFolderUse.addEventListener("click", async () => {
      const name = bgFolderList && bgFolderList.value;
      if (!name) {
        setMediaStatus(bgFolderStatus, "Select a file first.", "is-error");
        return;
      }
      await useFolderFile(name);
    });
  }

  if (bgFolderList) {
    bgFolderList.addEventListener("dblclick", async () => {
      if (bgFolderList.value) await useFolderFile(bgFolderList.value);
    });
  }

  addRule.addEventListener("click", () => {
    addRuleRow({});
  });

  function fileBaseName(file) {
    return String(file && file.name ? file.name : "").replace(/^.*[/\\]/, "");
  }

  function findEngineForPack(pack, engines) {
    if (!pack || !pack.engine || !engines.length) return null;
    const engineFile = String(pack.engineFile || "").toLowerCase();
    const engineId = String(pack.engine || "").toLowerCase();
    const idEngineName = String(pack.id || "").toLowerCase() + "-engine.js";
    const byFile = engineFile
      ? engines.find((item) => item.name.toLowerCase() === engineFile)
      : null;
    if (byFile) return byFile;
    const byId = engines.find((item) => String(item.meta.id || "").toLowerCase() === engineId);
    if (byId) return byId;
    return (
      engines.find((item) => item.name.toLowerCase() === idEngineName) ||
      engines.find((item) => item.name.toLowerCase().replace(/\.js$/, "") === engineId) ||
      null
    );
  }

  async function planThemeImports(files) {
    const jsonFiles = files.filter((file) => /\.json$/i.test(file.name));
    const jsFiles = files.filter((file) => /\.js$/i.test(file.name));
    const fontFiles = files.filter((file) => /\.(woff2|woff|ttf|otf)$/i.test(file.name));
    if (!jsonFiles.length) {
      throw new Error("Select at least one theme .json file.");
    }

    const engines = [];
    const notes = [];
    for (const file of jsFiles) {
      const name = fileBaseName(file);
      if (/snow-particles/i.test(name)) {
        notes.push("Skipped " + name + " (helper — not an importable engine).");
        continue;
      }
      const text = await file.text();
      try {
        const meta = customApi.peekEngineMeta(text);
        engines.push({ file, text, meta, name });
      } catch (err) {
        notes.push(
          "Skipped " + name + " (" + ((err && err.message) || "not a theme engine") + ")."
        );
      }
    }

    const fonts = [];
    for (const file of fontFiles) {
      try {
        const asset = await customApi.ingestFontFile(file);
        fonts.push({ file, asset, name: asset.name });
      } catch (err) {
        notes.push(
          "Skipped " +
            fileBaseName(file) +
            " (" +
            ((err && err.message) || "not a usable font") +
            ")."
        );
      }
    }

    function findFontsForPack(pack) {
      const faces =
        customApi.getPackFontFaces ? customApi.getPackFontFaces(pack) : [];
      const matched = [];
      const missing = [];
      faces.forEach((face) => {
        const want = String(face.fontFile || "").toLowerCase();
        if (!want) return;
        const hit = fonts.find((item) => item.name.toLowerCase() === want);
        if (hit) matched.push(hit);
        else missing.push(face.fontFile);
      });
      return { matched, missing };
    }

    const usedEngines = new Set();
    const usedFonts = new Set();
    const jobs = [];
    const errors = [];
    for (const file of jsonFiles) {
      const name = fileBaseName(file);
      let raw = "";
      let pack = null;
      try {
        raw = await file.text();
        pack = customApi.parsePack(raw);
      } catch (err) {
        errors.push(name + ": " + ((err && err.message) || "invalid theme"));
        continue;
      }
      const match = findEngineForPack(pack, engines);
      if (match) usedEngines.add(match.name);
      const fontPlan = findFontsForPack(pack);
      fontPlan.matched.forEach((item) => usedFonts.add(item.name));
      fontPlan.missing.forEach((fontName) => {
        notes.push(
          name +
            ': fontFile "' +
            fontName +
            '" not in this selection (will reuse a stored copy if one exists).'
        );
      });
      jobs.push({
        raw,
        pack,
        jsonName: name,
        engineSource: match ? match.text : "",
        engineName: match ? match.name : "",
        fontAssets: fontPlan.matched.map((item) => item.asset),
      });
    }

    engines.forEach((item) => {
      if (!usedEngines.has(item.name)) {
        notes.push("Unused engine " + item.name + " (no matching theme .json in this selection).");
      }
    });
    fonts.forEach((item) => {
      if (!usedFonts.has(item.name)) {
        notes.push("Unused font " + item.name + " (no theme fontFile matched it).");
      }
    });

    return { jobs, errors, notes };
  }

  if (importInput && customApi) {
    importInput.addEventListener("change", async () => {
      const files = [...(importInput.files || [])];
      importInput.value = "";
      if (!files.length) return;
      let plan;
      try {
        plan = await planThemeImports(files);
      } catch (err) {
        setImportStatus(err && err.message ? err.message : "Import failed.", "is-error");
        return;
      }

      if (!plan.jobs.length) {
        setImportStatus(
          (plan.errors[0] || "No valid theme packs in that selection.") +
            (plan.notes.length ? " " + plan.notes[0] : ""),
          "is-error"
        );
        return;
      }

      const needsEngineConfirm = plan.jobs.some((job) => job.engineSource);
      if (needsEngineConfirm) {
        const seen = rulesApi.loadCustomEngineWarningSeen
          ? await rulesApi.loadCustomEngineWarningSeen()
          : false;
        if (!seen) {
          const ok = window.confirm(
            "One or more packs include JavaScript that will run on matching output pages. Only import engines you wrote or trust."
          );
          if (!ok) return;
          if (rulesApi.saveCustomEngineWarningSeen) {
            await rulesApi.saveCustomEngineWarningSeen();
          }
        }
      }

      try {
        const existing = rulesApi.loadCustomThemes ? await rulesApi.loadCustomThemes() : [];
        const existingIds = new Set(existing.map((item) => item.id));
        const imported = [];
        const replaced = [];
        const failed = plan.errors.slice();

        for (const job of plan.jobs) {
          try {
            const pack = await customApi.importPack(job.raw, job.engineSource, job.fontAssets);
            if (existingIds.has(pack.id)) replaced.push(pack);
            else imported.push(pack);
            existingIds.add(pack.id);
          } catch (err) {
            failed.push(
              job.jsonName + ": " + ((err && err.message) || "import failed")
            );
          }
        }

        fillMosaicThemeOptions();
        fillMessageThemeOptions();
        const last = replaced[replaced.length - 1] || imported[imported.length - 1] || null;
        if (last) {
          if (last.kind === "message") {
            messageTheme.value = last.id;
            lastMessageTheme = last.id;
            renderThemeSettings(last.id);
          } else {
            mosaicTheme.value = last.id;
            lastMosaicTheme = last.id;
            renderMosaicThemeSettings(last.id);
          }
        }
        syncSelectUI(mosaicTheme);
        syncSelectUI(messageTheme);
        syncChromeToggles();
        persist();
        const packs = await rulesApi.loadCustomThemes();
        renderCustomList(packs);

        const parts = [];
        if (imported.length) parts.push("Imported " + imported.length);
        if (replaced.length) parts.push("replaced " + replaced.length);
        if (failed.length) parts.push(failed.length + " failed");
        let message = parts.join(", ") + ".";
        if (imported.length + replaced.length === 1 && last) {
          message =
            (replaced.length ? "Replaced " : "Imported ") +
            last.label +
            (last.engine ? " (with engine)" : "") +
            ".";
        }
        const extras = plan.notes.concat(failed).slice(0, 3);
        if (extras.length) message += " " + extras.join(" ");

        const okCount = imported.length + replaced.length;
        const hadEngine = plan.jobs.some((job) => job.engineSource);
        let tone = failed.length && !okCount ? "is-error" : failed.length ? "is-warn" : "is-ok";
        if (hadEngine && okCount) {
          let sync = { ok: false };
          try {
            sync = customApi.requestSideloadSync
              ? await customApi.requestSideloadSync()
              : await new Promise((resolve) => {
                  chrome.runtime.sendMessage({ type: "dyn-bg-sync-sideload" }, (result) => {
                    resolve(result || { ok: false });
                  });
                });
          } catch {
            sync = { ok: false };
          }
          if (!sync || sync.ok === false) {
            tone = "is-warn";
            message +=
              " " +
              (sync && sync.hint
                ? sync.hint
                : "Enable Allow User Scripts on the extension details page, then reload the output tab.");
          } else {
            message += " Engine registered — hard-refresh the output tab if it was already open.";
          }
        }

        setImportStatus(message, tone);
        refreshSideloadStatus();
      } catch (err) {
        setImportStatus(err && err.message ? err.message : "Import failed.", "is-error");
      }
    });
  }

  if (extVersionEl && chrome.runtime && chrome.runtime.getManifest) {
    extVersionEl.textContent = "v" + chrome.runtime.getManifest().version;
  }

  const packsReady =
    customApi && typeof customApi.loadAndRegister === "function"
      ? customApi.loadAndRegister()
      : rulesApi.loadCustomThemes
        ? rulesApi.loadCustomThemes()
        : Promise.resolve([]);
  Promise.all([packsReady, packsReady.then(() => rulesApi.loadSettings())]).then(([packs, settings]) => {
    fillMosaicThemeOptions();
    fillMessageThemeOptions();
    fillLeaderboardThemeOptions();
    cachedSettings = settings;
    enabledInput.checked = settings.enabled;
    setEnabledLabel();
    mosaicTheme.value = settings.mosaicTheme;
    messageTheme.value = settings.messageTheme;
    if (leaderboardTheme) leaderboardTheme.value = settings.leaderboardTheme || "off";
    if (stageAspect) {
      enhanceSelect(stageAspect);
      syncStageAspectUI(settings.stageAspect || "vixi");
    }
    if (mosaicShowBackground) mosaicShowBackground.checked = Boolean(settings.mosaicShowBackground);
    if (mosaicShowQr) mosaicShowQr.checked = Boolean(settings.mosaicShowQr);
    if (mosaicShowLogo) mosaicShowLogo.checked = Boolean(settings.mosaicShowLogo);
    if (messageShowBackground) messageShowBackground.checked = Boolean(settings.messageShowBackground);
    if (messageShowQr) messageShowQr.checked = Boolean(settings.messageShowQr);
    if (messageShowLogo) messageShowLogo.checked = Boolean(settings.messageShowLogo);
    lastMessageTheme = settings.messageTheme;
    lastMosaicTheme = settings.mosaicTheme;
    lastLeaderboardTheme = settings.leaderboardTheme || "off";
    syncSelectUI(mosaicTheme);
    syncSelectUI(messageTheme);
    if (leaderboardTheme) syncSelectUI(leaderboardTheme);
    renderThemeSettings(settings.messageTheme);
    renderMosaicThemeSettings(settings.mosaicTheme);
    renderLeaderboardThemeSettings(settings.leaderboardTheme || "off");
    syncChromeToggles();
    if (anyOutput) anyOutput.value = settings.anyOutputIframeHtml || "";
    if (bgMode) {
      bgMode.value = settings.bgMode || "auto";
      syncSelectUI(bgMode);
    }
    if (bgFit) {
      bgFit.value = settings.bgFit || "cover";
      syncSelectUI(bgFit);
    }
    cachedSettings.bgMediaId = settings.bgMediaId || "";
    refreshMediaName(bgMediaName, settings.bgMediaId || "", "none");
    initBackgroundFolder();
    rulesRoot.replaceChildren();
    if (settings.rules.length === 0) addRuleRow({});
    else settings.rules.forEach(addRuleRow);
    renderCustomList((packs || []).filter((pack) => pack && !pack.bundled));
  });
})();
