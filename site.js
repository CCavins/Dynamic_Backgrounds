fetch("extension/manifest.json")
    .then((res) => res.json())
    .then((manifest) => {
        const el = document.getElementById("ext-version");
        if (el && manifest && manifest.version) el.textContent = manifest.version;
    })
    .catch(() => {});
