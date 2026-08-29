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
  const anyOutput = document.getElementById("any-output");
  const rulesRoot = document.getElementById("rules");
  const addRule = document.getElementById("add-rule");
  const template = document.getElementById("rule-template");
  const customList = document.getElementById("custom-themes");
  const importInput = document.getElementById("import-theme");
  const importStatus = document.getElementById("import-status");

  let persistTimer = 0;
  let cachedSettings = null;
  let lastMessageTheme = "off";

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
    [...select.options].forEach((opt) => {
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

  function fillMosaicThemeOptions() {
    const current = mosaicTheme.value;
    mosaicTheme.replaceChildren();
    addThemeOption(mosaicTheme, "off", "Off");
    const meta = rulesApi.mosaicThemeMetaAll ? rulesApi.mosaicThemeMetaAll() : rulesApi.MOSAIC_THEME_META || {};
    Object.keys(meta).forEach((id) => {
      addThemeOption(mosaicTheme, id, meta[id].custom ? (meta[id].label || id) + " (imported)" : meta[id].label || id);
    });
    if ([...mosaicTheme.options].some((opt) => opt.value === current)) mosaicTheme.value = current;
    enhanceSelect(mosaicTheme);
  }

  function fillMessageThemeOptions() {
    const current = messageTheme.value;
    const meta = rulesApi.messageThemeMetaAll ? rulesApi.messageThemeMetaAll() : rulesApi.MESSAGE_THEME_META || {};
    messageTheme.replaceChildren();
    addThemeOption(messageTheme, "off", "Off");
    Object.keys(meta).forEach((id) => {
      addThemeOption(messageTheme, id, meta[id].custom ? (meta[id].label || id) + " (imported)" : meta[id].label || id);
    });
    if ([...messageTheme.options].some((opt) => opt.value === current)) messageTheme.value = current;
    enhanceSelect(messageTheme);
  }

  function renderCustomList(packs) {
    if (!customList) return;
    customList.replaceChildren();
    if (!packs.length) {
      const empty = document.createElement("p");
      empty.className = "help";
      empty.textContent = "No imported themes yet.";
      customList.appendChild(empty);
      return;
    }
    packs.forEach((pack) => {
      const row = document.createElement("div");
      row.className = "custom-theme-row";
      const name = document.createElement("span");
      name.textContent =
        pack.label +
        " · " +
        pack.kind +
        (pack.engine ? " · has engine" : "");
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
        if (messageTheme.value === pack.id) messageTheme.value = "off";
        if (mosaicTheme.value === pack.id) mosaicTheme.value = "off";
        fillMosaicThemeOptions();
        fillMessageThemeOptions();
        syncSelectUI(mosaicTheme);
        syncSelectUI(messageTheme);
        renderCustomList(next);
        persist();
        if (importStatus) importStatus.textContent = "Removed " + pack.label + ".";
      });
      row.appendChild(name);
      row.appendChild(remove);
      customList.appendChild(row);
    });
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

  function themeSettingsFor(id) {
    const stored = cachedSettings && cachedSettings.messageThemeSettings;
    return rulesApi.normalizeOneThemeSettings(id, stored && stored[id]);
  }

  function renderThemeSettings(id) {
    messageThemeSettings.replaceChildren();
    const allMeta = rulesApi.messageThemeMetaAll ? rulesApi.messageThemeMetaAll() : rulesApi.MESSAGE_THEME_META || {};
    const meta = allMeta[id];
    if (!meta) {
      messageThemeSettings.hidden = true;
      return;
    }

    const values = themeSettingsFor(id);
    const labels = meta.labels || {};
    messageThemeSettings.appendChild(colorRow("primary", labels.primary || "Primary", values.primary));
    messageThemeSettings.appendChild(colorRow("secondary", labels.secondary || "Secondary", values.secondary));
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

    messageThemeSettings.querySelectorAll(".theme-color").forEach((colorInput) => {
      const key = colorInput.dataset.key;
      const hexInput = messageThemeSettings.querySelector(`.theme-hex[data-key="${key}"]`);
      colorInput.addEventListener("input", () => {
        if (hexInput) hexInput.value = colorInput.value;
        schedulePersist();
      });
    });
    messageThemeSettings.querySelectorAll(".theme-hex").forEach((hexInput) => {
      const key = hexInput.dataset.key;
      const colorInput = messageThemeSettings.querySelector(`.theme-color[data-key="${key}"]`);
      hexInput.addEventListener("input", () => {
        const v = hexInput.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(v) && colorInput) {
          colorInput.value = v.toLowerCase();
        }
        schedulePersist();
      });
    });
    messageThemeSettings.querySelectorAll(".theme-motion").forEach((input) => {
      input.addEventListener("change", persist);
      enhanceSelect(input);
    });

    messageThemeSettings.hidden = false;
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

  function stashCurrentThemeForm() {
    if (!cachedSettings) cachedSettings = {};
    cachedSettings.messageThemeSettings = { ...(cachedSettings.messageThemeSettings || {}) };
    if (lastMessageTheme !== "off") {
      cachedSettings.messageThemeSettings[lastMessageTheme] = readThemeForm(lastMessageTheme);
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
    const themeSettings = { ...((cachedSettings && cachedSettings.messageThemeSettings) || {}) };
    if (theme !== "off") themeSettings[theme] = readThemeForm(theme);
    return {
      enabled: enabledInput.checked,
      stageAspect: readStageAspect(),
      mosaicShowBackground: Boolean(mosaicShowBackground && mosaicShowBackground.checked),
      mosaicShowQr: Boolean(mosaicShowQr && mosaicShowQr.checked),
      mosaicShowLogo: Boolean(mosaicShowLogo && mosaicShowLogo.checked),
      messageShowBackground: Boolean(messageShowBackground && messageShowBackground.checked),
      messageShowQr: Boolean(messageShowQr && messageShowQr.checked),
      messageShowLogo: Boolean(messageShowLogo && messageShowLogo.checked),
      mosaicTheme: mosaicTheme.value,
      messageTheme: theme,
      messageThemeSettings: themeSettings,
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
  mosaicTheme.addEventListener("change", persist);
  function readStageAspect() {
    if (!stageAspect || stageAspect.value === "auto") return "auto";
    if (stageAspect.value !== "custom") return stageAspect.value;
    const raw =
      String((stageRatioW && stageRatioW.value) || "").trim() +
      ":" +
      String((stageRatioH && stageRatioH.value) || "").trim();
    const next = rulesApi.normalizeStageAspect(raw);
    if (next !== "auto") return next;
    return (cachedSettings && cachedSettings.stageAspect) || "16:9";
  }

  function fillRatioFields(mode) {
    if (!stageRatioW || !stageRatioH) return;
    const parsed = rulesApi.parseStageAspect ? rulesApi.parseStageAspect(mode) : null;
    if (!parsed || parsed.mode === "auto") {
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
    const preset = rulesApi.presetForAspect ? rulesApi.presetForAspect(next) : next;
    stageAspect.value = preset === "auto" ? "auto" : preset;
    if (![...stageAspect.options].some((opt) => opt.value === stageAspect.value)) {
      stageAspect.value = "custom";
    }
    const custom = stageAspect.value === "custom";
    fillRatioFields(next === "auto" ? "16:9" : next);
    showCustomRatioFields(custom);
    syncSelectUI(stageAspect);
  }

  if (stageAspect) {
    enhanceSelect(stageAspect);
    stageAspect.addEventListener("change", () => {
      const custom = stageAspect.value === "custom";
      if (custom) {
        const seed =
          cachedSettings && cachedSettings.stageAspect && cachedSettings.stageAspect !== "auto"
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

  if (importInput && customApi) {
    importInput.addEventListener("change", async () => {
      const files = [...(importInput.files || [])];
      importInput.value = "";
      if (!files.length) return;
      const jsonFiles = files.filter((file) => /\.json$/i.test(file.name));
      const jsFiles = files.filter((file) => /\.js$/i.test(file.name));
      if (jsonFiles.length !== 1) {
        if (importStatus) {
          importStatus.textContent = "Select one theme.json and an optional engine.js.";
        }
        return;
      }
      if (jsFiles.length > 1) {
        if (importStatus) importStatus.textContent = "Select at most one engine.js.";
        return;
      }
      try {
        if (jsFiles[0]) {
          const seen = rulesApi.loadCustomEngineWarningSeen
            ? await rulesApi.loadCustomEngineWarningSeen()
            : false;
          if (!seen) {
            const ok = window.confirm(
              "This pack includes JavaScript that will run on matching output pages. Only import engines you wrote or trust."
            );
            if (!ok) return;
            if (rulesApi.saveCustomEngineWarningSeen) {
              await rulesApi.saveCustomEngineWarningSeen();
            }
          }
        }
        const pack = await customApi.importPack(
          await jsonFiles[0].text(),
          jsFiles[0] ? await jsFiles[0].text() : ""
        );
        fillMosaicThemeOptions();
        fillMessageThemeOptions();
        if (pack.kind === "message") {
          messageTheme.value = pack.id;
          lastMessageTheme = pack.id;
          renderThemeSettings(pack.id);
        } else {
          mosaicTheme.value = pack.id;
        }
        syncSelectUI(mosaicTheme);
        syncSelectUI(messageTheme);
        persist();
        const packs = await rulesApi.loadCustomThemes();
        renderCustomList(packs);
        if (importStatus) {
          importStatus.textContent =
            "Imported " + pack.label + (pack.engine ? " with engine." : ".");
        }
      } catch (err) {
        if (importStatus) importStatus.textContent = err && err.message ? err.message : "Import failed.";
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
      syncStageAspectUI(settings.stageAspect || "auto");
    }
    if (mosaicShowBackground) mosaicShowBackground.checked = Boolean(settings.mosaicShowBackground);
    if (mosaicShowQr) mosaicShowQr.checked = Boolean(settings.mosaicShowQr);
    if (mosaicShowLogo) mosaicShowLogo.checked = Boolean(settings.mosaicShowLogo);
    if (messageShowBackground) messageShowBackground.checked = Boolean(settings.messageShowBackground);
    if (messageShowQr) messageShowQr.checked = Boolean(settings.messageShowQr);
    if (messageShowLogo) messageShowLogo.checked = Boolean(settings.messageShowLogo);
    lastMessageTheme = settings.messageTheme;
    syncSelectUI(mosaicTheme);
    syncSelectUI(messageTheme);
    renderThemeSettings(settings.messageTheme);
    anyOutput.value = settings.anyOutputIframeHtml;
    rulesRoot.replaceChildren();
    if (settings.rules.length === 0) addRuleRow({});
    else settings.rules.forEach(addRuleRow);
    renderCustomList(packs);
  });
})();
