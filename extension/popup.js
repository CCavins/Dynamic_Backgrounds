(() => {
  const rulesApi = globalThis.BGExtensionRules;
  if (!rulesApi) return;

  const enabledInput = document.getElementById("enabled");
  const enabledLabel = document.getElementById("enabled-label");
  const mosaicTheme = document.getElementById("mosaic-theme");
  const anyOutput = document.getElementById("any-output");
  const rulesRoot = document.getElementById("rules");
  const addRule = document.getElementById("add-rule");
  const template = document.getElementById("rule-template");

  let persistTimer = 0;

  function setEnabledLabel() {
    enabledLabel.textContent = enabledInput.checked ? "On" : "Off";
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
    return {
      enabled: enabledInput.checked,
      mosaicTheme: mosaicTheme.value,
      anyOutputIframeHtml: anyOutput.value,
      rules: rows,
    };
  }

  function persist() {
    return rulesApi.saveSettings(collectSettings());
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
  anyOutput.addEventListener("input", schedulePersist);
  addRule.addEventListener("click", () => {
    addRuleRow({});
  });

  rulesApi.loadSettings().then((settings) => {
    enabledInput.checked = settings.enabled;
    setEnabledLabel();
    mosaicTheme.value = settings.mosaicTheme;
    anyOutput.value = settings.anyOutputIframeHtml;
    rulesRoot.replaceChildren();
    if (settings.rules.length === 0) {
      addRuleRow({});
      return;
    }
    settings.rules.forEach(addRuleRow);
  });
})();
