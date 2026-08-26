(function () {
    const params = new URLSearchParams(location.search);
    const isPreview = params.has('preview');
    let framed = false;
    try {
        framed = window.self !== window.top;
    } catch {
        framed = true;
    }
    const isEmbed = params.has('embed') || framed;

    if (isPreview) document.documentElement.classList.add('preview');
    if (isEmbed) document.documentElement.classList.add('embed');

    function encodeConfig(data) {
        const bytes = new TextEncoder().encode(JSON.stringify(data));
        let binary = '';
        bytes.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }

    function readConfig() {
        const raw = params.get('cfg');
        if (!raw) return null;
        try {
            const padded = raw.replace(/-/g, '+').replace(/_/g, '/');
            const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
            const binary = atob(padded + pad);
            const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
            const data = JSON.parse(new TextDecoder().decode(bytes));
            return data && typeof data === 'object' ? data : null;
        } catch {
            return null;
        }
    }

    function rawData(storageKey) {
        const fromUrl = readConfig();
        if (fromUrl) return fromUrl;
        if (isEmbed) return null;
        try {
            return JSON.parse(localStorage.getItem(storageKey) || 'null');
        } catch {
            return null;
        }
    }

    function iframeSnippet(settings, title) {
        const url = new URL(location.href);
        url.search = '';
        url.hash = '';
        url.searchParams.set('embed', '1');
        url.searchParams.set('cfg', encodeConfig(settings));
        const safeTitle = String(title || document.title || 'Background').replace(/"/g, '&quot;');
        return `<iframe\n  src="${url.href}"\n  style="position:fixed;inset:0;width:100%;height:100%;border:0;z-index:-1"\n  title="${safeTitle}"\n></iframe>`;
    }

    function bindCopyButton(button, getSettings, title) {
        if (!button) return;
        const label = button.textContent;
        button.addEventListener('click', async () => {
            try {
                const settings = typeof getSettings === 'function' ? getSettings() : getSettings;
                await navigator.clipboard.writeText(iframeSnippet(settings, title));
                button.textContent = 'COPIED';
            } catch {
                button.textContent = 'COPY FAILED';
            }
            setTimeout(() => {
                button.textContent = label;
            }, 1400);
        });
    }

    window.BGEmbed = {
        isPreview,
        isEmbed,
        shouldPersist: !isPreview && !isEmbed,
        readConfig,
        encodeConfig,
        rawData,
        iframeSnippet,
        bindCopyButton
    };
})();
