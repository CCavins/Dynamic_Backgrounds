(() => {
  const rulesApi = globalThis.BGExtensionRules;
  const customApi = globalThis.BGCustomThemes;
  if (!rulesApi) return;

  const enabledInput = document.getElementById("enabled");
  const enabledLabel = document.getElementById("enabled-label");
  const mosaicTheme = document.getElementById("mosaic-theme");
  const messageTheme = document.getElementById("message-theme");
  const stageAspect = document.getElementById("stage-aspect");
  const stageRatioRow = document.getElementById("stage-ratio-row");
  const stageRatioW = document.getElementById("stage-ratio-w");
  const stageRatioH = document.getElementById("stage-ratio-h");
  const mosaicShowBackground = document.getElementById("mosaic-show-background");
  const mosaicShowQr = document.getElementById("mosaic-show-qr");
  const mosaicShowLogo = document.getElementById("mosaic-show-logo");
  const messageShowBackground = document.getElementById("message-show-background");
  const messageShowQr = document.getElementById("message-show-qr");
  const messageShowLogo = document.getElementById("message-show-logo");
  const messageThemeSettings = document.getElementById("message-theme-settings");
  const mosaicThemeSettings = document.getElementById("mosaic-theme-settings");
  const anyOutput = document.getElementById("any-output");
  const rulesRoot = document.getElementById("rules");
  const addRule = document.getElementById("add-rule");
  const template = document.getElementById("rule-template");
  const customList = document.getElementById("custom-themes");
  const customThemeCount = document.getElementById("custom-theme-count");
  const importInput = document.getElementById("import-theme");
  const importStatus = document.getElementById("import-status");

  let persistTimer = 0;
  let cachedSettings = null;
  let lastMessageTheme = "off";
  let lastMosaicTheme = "off";

  function isChristmasPack(id, label) {
    return /xmas|christmas/i.test(String(id || "") + " " + String(label || ""));
  }

  function setImportStatus(message, tone) {
    if (!importStatus) return;
    importStatus.textContent = message || "";
    importStatus.classList.remove("is-ok", "is-error", "is-warn");
    if (tone) importStatus.classList.add(tone);
  }

  function themeSelectGroup(id, meta) {
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

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".v2-select")) closeAllSelects();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllSelects();
  });

  function setEnabledLabel() {
    enabledLabel.textContent = enabledInput.checked ? "On" : "Off";
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

  function scaleRow(label, value) {
    const pct = Math.round((Number(value) || 1) * 100);
    const row = document.createElement("label");
    row.className = "setting-row scale";
    row.innerHTML =
      `<span>${label}</span>` +
      `<input type="range" class="theme-scale" min="70" max="150" step="1" value="${pct}">` +
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

  function renderThemeSettings(id) {
    messageThemeSettings.replaceChildren();
    const allMeta = rulesApi.messageThemeMetaAll ? rulesApi.messageThemeMetaAll() : rulesApi.MESSAGE_THEME_META || {};
    const meta = allMeta[id];
    if (!meta || !meta.defaults) {
      messageThemeSettings.hidden = true;
      return;
    }

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

    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "reset-theme v2-btn v2-btn-secondary";
    reset.textContent = "Reset theme colors";
    reset.addEventListener("click", () => {
      if (!cachedSettings) cachedSettings = {};
      cachedSettings.messageThemeSettings = { ...(cachedSettings.messageThemeSettings || {}) };
      cachedSettings.messageThemeSettings[id] = rulesApi.normalizeOneThemeSettings(id, {});
      renderThemeSettings(id);
      persist();
    });
    messageThemeSettings.appendChild(reset);

    bindColorInputs(messageThemeSettings, schedulePersist);
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

    bindColorInputs(mosaicThemeSettings, schedulePersist);
    mosaicThemeSettings.querySelectorAll(".theme-scale").forEach((input) => {
      const valueEl = mosaicThemeSettings.querySelector(".theme-scale-value");
      input.addEventListener("input", () => {
        if (valueEl) valueEl.textContent = input.value + "%";
        schedulePersist();
      });
    });

    mosaicThemeSettings.hidden = false;
  }

  function readThemeForm(id) {
    if (!id || id === "off") return {};
    const get = (sel) => messageThemeSettings.querySelector(sel);
    const raw = {
      primary: get('.theme-hex[data-key="primary"]')?.value,
      secondary: get('.theme-hex[data-key="secondary"]')?.value,
    };
    const bg = get('.theme-hex[data-key="background"]');
    const motion = get(".theme-motion");
    if (bg) raw.background = bg.value;
    if (motion) raw.motion = motion.value;
    return rulesApi.normalizeOneThemeSettings(id, raw);
  }

  function readMosaicForm(id) {
    if (!id || id === "off" || !mosaicThemeSettings) return {};
    const storeId = mosaicStoreId(id) || id;
    const get = (sel) => mosaicThemeSettings.querySelector(sel);
    const raw = {};
    const primary = get('.theme-hex[data-key="primary"]');
    const secondary = get('.theme-hex[data-key="secondary"]');
    const bg = get('.theme-hex[data-key="background"]');
    const scale = get(".theme-scale");
    if (primary) raw.primary = primary.value;
    if (secondary) raw.secondary = secondary.value;
    if (bg) raw.background = bg.value;
    if (scale) raw.scale = Number(scale.value) / 100;
    return rulesApi.normalizeOneThemeSettings(storeId, raw);
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
    const themeSettings = { ...((cachedSettings && cachedSettings.messageThemeSettings) || {}) };
    if (theme !== "off") themeSettings[theme] = readThemeForm(theme);
    const mosaicSettings = { ...((cachedSettings && cachedSettings.mosaicThemeSettings) || {}) };
    if (mosaicId !== "off") {
      const storeId = mosaicStoreId(mosaicId) || mosaicId;
      mosaicSettings[storeId] = readMosaicForm(mosaicId);
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
      messageThemeSettings: themeSettings,
      mosaicThemeSettings: mosaicSettings,
      anyOutputIframeHtml: anyOutput.value,
      rules: rows,
    };
  }

  function persist() {
    return rulesApi.saveSettings(collectSettings()).then(() => {
      cachedSettings = rulesApi.normalizeSettings(collectSettings());
    });
  }

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
    persist();
  });
  anyOutput.addEventListener("input", schedulePersist);
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

    const used = new Set();
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
      if (match) used.add(match.name);
      jobs.push({
        raw,
        pack,
        jsonName: name,
        engineSource: match ? match.text : "",
        engineName: match ? match.name : "",
      });
    }

    engines.forEach((item) => {
      if (!used.has(item.name)) {
        notes.push("Unused engine " + item.name + " (no matching theme .json in this selection).");
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
            const pack = await customApi.importPack(job.raw, job.engineSource);
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
        setImportStatus(
          message,
          failed.length && !okCount ? "is-error" : failed.length ? "is-warn" : "is-ok"
        );
      } catch (err) {
        setImportStatus(err && err.message ? err.message : "Import failed.", "is-error");
      }
    });
  }

  Promise.all([
    rulesApi.loadCustomThemes ? rulesApi.loadCustomThemes() : Promise.resolve([]),
    rulesApi.loadSettings(),
  ]).then(([packs, settings]) => {
    if (rulesApi.applyCustomThemeMeta) rulesApi.applyCustomThemeMeta(packs);
    if (customApi && customApi.registerPacks) customApi.registerPacks(packs);
    fillMosaicThemeOptions();
    fillMessageThemeOptions();
    cachedSettings = settings;
    enabledInput.checked = settings.enabled;
    setEnabledLabel();
    mosaicTheme.value = settings.mosaicTheme;
    messageTheme.value = settings.messageTheme;
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
    syncSelectUI(mosaicTheme);
    syncSelectUI(messageTheme);
    renderThemeSettings(settings.messageTheme);
    renderMosaicThemeSettings(settings.mosaicTheme);
    anyOutput.value = settings.anyOutputIframeHtml;
    rulesRoot.replaceChildren();
    if (settings.rules.length === 0) addRuleRow({});
    else settings.rules.forEach(addRuleRow);
    renderCustomList(packs);
  });
})();
