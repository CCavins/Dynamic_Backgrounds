fetch("extension/manifest.json")
    .then((res) => res.json())
    .then((manifest) => {
        const el = document.getElementById("ext-version");
        if (el && manifest && manifest.version) el.textContent = manifest.version;
    })
    .catch(() => {});

document.querySelectorAll(".theme-card[data-theme]").forEach((card) => {
    const id = card.getAttribute("data-theme");
    const meta = card.querySelector(".meta");
    if (!id || !meta || meta.querySelector(".theme-fullscreen")) return;
    const link = document.createElement("a");
    link.className = "theme-fullscreen";
    link.href = "themes/preview.html?theme=" + encodeURIComponent(id);
    link.textContent = "Full screen";
    link.addEventListener("pointerenter", (event) => event.stopPropagation());
    link.addEventListener("focus", (event) => event.stopPropagation());
    meta.appendChild(link);
});
