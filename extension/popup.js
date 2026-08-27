(() => {
  const rulesApi = globalThis.BGExtensionRules;
  if (!rulesApi) return;

  const enabledInput = document.getElementById("enabled");
  const enabledLabel = document.getElementById("enabled-label");
  const mosaicTheme = document.getElementById("mosaic-theme");
  const messageTheme = document.getElementById("message-theme");
  const messageThemeSettings = document.getElementById("message-theme-settings");
  const anyOutput = document.getElementById("any-output");
  const rulesRoot = document.getElementById("rules");
  const addRule = document.getElementById("add-rule");
  const template = document.getElementById("rule-template");

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

  function fillMessageThemeOptions() {
    const meta = rulesApi.MESSAGE_THEME_META || {};
    messageTheme.replaceChildren();
    const off = document.createElement("option");
    off.value = "off";
    off.textContent = "Off";
    messageTheme.appendChild(off);
    Object.keys(meta).forEach((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = meta[id].label || id;
      messageTheme.appendChild(option);
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
    const meta = rulesApi.MESSAGE_THEME_META && rulesApi.MESSAGE_THEME_META[id];
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

  fillMessageThemeOptions();
  enhanceSelect(mosaicTheme);
  enhanceSelect(messageTheme);

  rulesApi.loadSettings().then((settings) => {
    cachedSettings = settings;
    enabledInput.checked = settings.enabled;
    setEnabledLabel();
    mosaicTheme.value = settings.mosaicTheme;
    messageTheme.value = settings.messageTheme;
    lastMessageTheme = settings.messageTheme;
    syncSelectUI(mosaicTheme);
    syncSelectUI(messageTheme);
    renderThemeSettings(settings.messageTheme);
    anyOutput.value = settings.anyOutputIframeHtml;
    rulesRoot.replaceChildren();
    if (settings.rules.length === 0) {
      addRuleRow({});
      return;
    }
    settings.rules.forEach(addRuleRow);
  });
})();
