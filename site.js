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
    if (!id || !meta || meta.querySelector(".theme-actions")) return;
    const actions = document.createElement("div");
    actions.className = "theme-actions";
    const link = document.createElement("a");
    link.className = "theme-fullscreen";
    link.href = "themes/preview.html?theme=" + encodeURIComponent(id);
    link.textContent = "Full screen";
    link.addEventListener("pointerenter", (event) => event.stopPropagation());
    link.addEventListener("focus", (event) => event.stopPropagation());
    actions.appendChild(link);
    const pack = card.getAttribute("data-pack");
    if (pack) {
        const download = document.createElement("a");
        download.className = "theme-fullscreen";
        download.href = pack;
        download.setAttribute("download", pack.split("/").pop() || "theme.json");
        download.textContent = "Download";
        download.addEventListener("pointerenter", (event) => event.stopPropagation());
        download.addEventListener("focus", (event) => event.stopPropagation());
        actions.appendChild(download);
    }
    meta.appendChild(actions);
});
