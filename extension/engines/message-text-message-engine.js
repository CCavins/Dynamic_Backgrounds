/**
 * Dynamic Themes theme engine
 * id: message-text-message-engine
 * kind: message
 * builtin theme id: text-message
 *
 * Large guest photo on the left; oversized iPhone chat on the right.
 * Back-to-back Vixi messages keep prior bubbles and shift the thread up.
 *
 * Self-contained CSS (not in message-themes.js). Ships via engines.json.
 */
(function () {
  const THEME_ID = "text-message";
  const ENGINE_ID = "message-text-message-engine";
  const STYLE_ATTR = "data-text-message-engine";
  const MAX_HISTORY = 8;
  const FONT =
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  const MARKUP =
    '<div class="tm-stage">' +
    '<div class="tm-hero">' +
    '<div class="tm-hero-frame"><img class="tm-hero-img well" data-photo alt=""></div>' +
    "</div>" +
    '<div class="tm-phone-wrap">' +
    '<div class="tm-phone">' +
    '<div class="tm-chassis">' +
    '<div class="tm-btn tm-btn-vol-up"></div>' +
    '<div class="tm-btn tm-btn-vol-down"></div>' +
    '<div class="tm-btn tm-btn-power"></div>' +
    '<div class="tm-screen">' +
    '<div class="tm-wallpaper"></div>' +
    '<div class="tm-island"></div>' +
    '<header class="tm-nav">' +
    '<div class="tm-nav-title">' +
    '<span class="tm-nav-label">Messages</span>' +
    "</div>" +
    "</header>" +
    '<div class="tm-thread" data-tm-thread></div>' +
    '<div class="tm-composer" aria-hidden="true">' +
    '<div class="tm-composer-plus"></div>' +
    '<div class="tm-composer-field">Message</div>' +
    '<div class="tm-composer-mic"></div>' +
    "</div>" +
    '<div class="tm-home"></div>' +
    "</div></div></div></div></div>";

  const CSS_SRC = `
#dyn-message-theme[data-theme="text-message"]{
  --tm-bubble:#e9e9eb;
  --tm-bubble-text:#111;
  --tm-name:#8e8e93;
  --tm-screen:#000;
  --tm-phone: var(--primary, #3f3f46);
  --tm-accent: var(--secondary, #0a84ff);
  background:
    radial-gradient(70% 60% at 18% 42%, color-mix(in srgb, var(--tm-accent) 22%, transparent), transparent 70%),
    radial-gradient(55% 50% at 78% 55%, color-mix(in srgb, var(--tm-phone) 28%, transparent), transparent 68%),
    var(--background, #07090f);
  color:#f5f5f7;
  font-family:${FONT};
}
#dyn-message-theme[data-theme="text-message"] .dyn-fit-stage,
#dyn-message-theme[data-theme="text-message"] .tm-stage{
  position:absolute;inset:0;container-type:size;
}
#dyn-message-theme[data-theme="text-message"] .tm-stage{
  display:flex;align-items:center;justify-content:center;gap:2.2cqw;
  padding:4.5cqh 4cqw 6cqh;box-sizing:border-box;
}
#dyn-message-theme[data-theme="text-message"] .tm-hero{
  flex:0 0 auto;width:auto;max-width:none;height:auto;
  display:flex;align-items:center;justify-content:center;
  opacity:0;transform:translate3d(-2cqw,1.2cqh,0) scale(.96);
  transition:opacity .55s cubic-bezier(.22,.8,.2,1), transform .7s cubic-bezier(.22,.8,.2,1);
}
#dyn-message-theme[data-theme="text-message"].on .tm-hero{
  opacity:1;transform:none;
}
#dyn-message-theme[data-theme="text-message"] .tm-hero-frame{
  width:min(36cqw, 48cqh);aspect-ratio:3/4;border-radius:2.8cqh;overflow:hidden;
  background:#12141c;
  box-shadow:
    0 2.4cqh 6cqh rgba(0,0,0,.45),
    0 0 0 1px rgba(255,255,255,.08);
  transform-origin:center center;
  transition:transform .55s cubic-bezier(.22,.8,.2,1), box-shadow .55s ease;
}
#dyn-message-theme[data-theme="text-message"] .tm-hero-frame.is-pulse{
  animation:tm-hero-pulse .7s cubic-bezier(.22,.8,.2,1);
}
#dyn-message-theme[data-theme="text-message"] .tm-hero-img{
  width:100%;height:100%;object-fit:cover;display:block;
  transform:scale(1.02);transition:opacity .45s ease, transform .7s cubic-bezier(.22,.8,.2,1);
}
#dyn-message-theme[data-theme="text-message"].on .tm-hero-img{transform:none;}
#dyn-message-theme[data-theme="text-message"].no-photo .tm-hero{opacity:.28;}

#dyn-message-theme[data-theme="text-message"] .tm-phone-wrap{
  flex:0 0 auto;height:auto;display:flex;align-items:center;justify-content:center;
  perspective:1400px;opacity:0;transform:translate3d(2cqw,1.4cqh,0) scale(.94);
  transition:opacity .6s cubic-bezier(.22,.8,.2,1) .05s, transform .75s cubic-bezier(.22,.8,.2,1);
}
#dyn-message-theme[data-theme="text-message"].on .tm-phone-wrap{
  opacity:1;transform:none;
}
#dyn-message-theme[data-theme="text-message"] .tm-phone{
  height:min(88cqh, 920px);aspect-ratio:9/19.5;
  transform:rotateY(-12deg) rotateX(4deg) rotateZ(-1deg);
  transform-style:preserve-3d;
  filter:drop-shadow(0 2.8cqh 5.5cqh rgba(0,0,0,.55));
  will-change:transform;
}
#dyn-message-theme[data-theme="text-message"] .tm-phone.is-buzz{
  animation:tm-buzz .48s cubic-bezier(.36,.07,.19,.97);
}
#dyn-message-theme[data-theme="text-message"] .tm-chassis{
  position:relative;height:100%;width:100%;padding:1.2%;box-sizing:border-box;
  border-radius:clamp(18px, 3.4cqw, 34px);
  background:linear-gradient(
    180deg,
    color-mix(in srgb, var(--tm-phone) 72%, #fff) 0%,
    var(--tm-phone) 42%,
    color-mix(in srgb, var(--tm-phone) 55%, #000) 100%
  );
  outline:1px solid color-mix(in srgb, var(--tm-phone) 40%, rgba(255,255,255,.2));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.18),
    inset 0 -2px 6px rgba(0,0,0,.35);
}
#dyn-message-theme[data-theme="text-message"] .tm-btn{
  position:absolute;width:1.4%;border-radius:999px;
  background:color-mix(in srgb, var(--tm-phone) 55%, #8a8a93);
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.35);
}
#dyn-message-theme[data-theme="text-message"] .tm-btn-vol-up{left:-1.1%;top:18%;height:6.5%;}
#dyn-message-theme[data-theme="text-message"] .tm-btn-vol-down{left:-1.1%;top:27%;height:10%;}
#dyn-message-theme[data-theme="text-message"] .tm-btn-power{right:-1.1%;top:22%;height:11%;}

#dyn-message-theme[data-theme="text-message"] .tm-screen{
  position:relative;width:100%;height:100%;
  border-radius:clamp(14px, 2.7cqw, 28px);overflow:hidden;
  background:var(--tm-screen);outline:2px solid #000;
  display:flex;flex-direction:column;
}
#dyn-message-theme[data-theme="text-message"] .tm-wallpaper{
  position:absolute;inset:0;z-index:0;overflow:hidden;
  background:
    linear-gradient(180deg,#1c1c1e 0%,#000 100%);
}
#dyn-message-theme[data-theme="text-message"] .tm-wallpaper.has-media{
  background:#0b0b0d;
}
#dyn-message-theme[data-theme="text-message"] .tm-wallpaper img,
#dyn-message-theme[data-theme="text-message"] .tm-wallpaper video{
  position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover;object-position:center;display:block;
}
#dyn-message-theme[data-theme="text-message"] .tm-island{
  position:absolute;left:50%;top:2.4%;transform:translateX(-50%);
  width:34%;height:3.6%;border-radius:999px;background:#000;z-index:8;
  box-shadow:inset 0 1px 1px rgba(255,255,255,.08);
}
#dyn-message-theme[data-theme="text-message"] .tm-nav{
  position:relative;z-index:2;flex:0 0 auto;
  display:flex;align-items:center;justify-content:center;
  padding:7.5% 4% 2.2%;
  background:linear-gradient(180deg,rgba(28,28,30,.96),rgba(28,28,30,.82));
  border-bottom:1px solid rgba(255,255,255,.08);
  backdrop-filter:blur(12px);
}
#dyn-message-theme[data-theme="text-message"] .tm-nav-title{
  text-align:center;min-width:0;max-width:86%;
}
#dyn-message-theme[data-theme="text-message"] .tm-nav-label{
  display:block;font-size:clamp(12px,2.7cqh,17px);font-weight:600;color:#f5f5f7;
  letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}

#dyn-message-theme[data-theme="text-message"] .tm-thread{
  position:relative;z-index:2;flex:1 1 auto;min-height:0;
  overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;
  gap:1.6%;padding:2.5% 4% 1.5%;
}
#dyn-message-theme[data-theme="text-message"] .tm-row{
  display:flex;align-items:flex-end;gap:2.4%;
  opacity:0;transform:translate3d(0,18px,0) scale(.96);
  animation:tm-bubble-in .48s cubic-bezier(.22,.8,.2,1) forwards;
}
#dyn-message-theme[data-theme="text-message"] .tm-avatar{
  flex:0 0 auto;width:9.5%;aspect-ratio:1;border-radius:50%;overflow:hidden;
  background:#2c2c2e;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);
}
#dyn-message-theme[data-theme="text-message"] .tm-avatar img{
  width:100%;height:100%;object-fit:cover;display:block;
}
#dyn-message-theme[data-theme="text-message"] .tm-col{
  flex:1 1 auto;min-width:0;max-width:78%;
}
#dyn-message-theme[data-theme="text-message"] .tm-sender{
  margin:0 0 .35em .55em;font-size:clamp(11px,1.85cqh,14px);
  color:var(--tm-name);font-weight:500;letter-spacing:.01em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
#dyn-message-theme[data-theme="text-message"] .tm-bubble{
  display:inline-block;max-width:100%;
  padding:.62em .95em .7em;
  border-radius:1.15em 1.15em 1.15em .35em;
  background:var(--tm-bubble);color:var(--tm-bubble-text);
  font-size:clamp(13px,2.45cqh,19px);line-height:1.3;font-weight:400;
  box-shadow:0 1px 0 rgba(0,0,0,.04);
  word-wrap:break-word;overflow-wrap:anywhere;
}
#dyn-message-theme[data-theme="text-message"] .tm-bubble:empty::before{
  content:"📷 Photo";opacity:.55;
}

#dyn-message-theme[data-theme="text-message"] .tm-composer{
  position:relative;z-index:2;flex:0 0 auto;
  display:flex;align-items:center;gap:2.2%;
  padding:1.8% 3.5% 5.8%;
  background:linear-gradient(180deg,rgba(28,28,30,.55),rgba(28,28,30,.92));
  border-top:1px solid rgba(255,255,255,.06);
}
#dyn-message-theme[data-theme="text-message"] .tm-composer-plus,
#dyn-message-theme[data-theme="text-message"] .tm-composer-mic{
  width:7.5%;aspect-ratio:1;border-radius:50%;background:#3a3a3c;
}
#dyn-message-theme[data-theme="text-message"] .tm-composer-field{
  flex:1 1 auto;min-width:0;height:2.2em;border-radius:999px;
  background:#2c2c2e;color:#8e8e93;font-size:clamp(9px,1.5cqh,12px);
  display:flex;align-items:center;padding:0 .9em;
}
#dyn-message-theme[data-theme="text-message"] .tm-home{
  position:absolute;left:50%;bottom:1.8%;transform:translateX(-50%);
  width:34%;height:0.7%;border-radius:999px;background:rgba(255,255,255,.28);z-index:6;
}

#dyn-message-theme[data-theme="text-message"].off .tm-hero,
#dyn-message-theme[data-theme="text-message"].off .tm-phone-wrap{
  opacity:0;transition:opacity .28s ease, transform .28s ease;
}
#dyn-message-theme[data-theme="text-message"].off .tm-hero{
  transform:translate3d(-2cqw,1cqh,0) scale(.98);
}
#dyn-message-theme[data-theme="text-message"].off .tm-phone-wrap{
  transform:translate3d(2cqw,1.5cqh,0) scale(.97);
}

#dyn-message-theme.dyn-portrait[data-theme="text-message"] .tm-stage{
  flex-direction:column;gap:2cqh;padding:5cqh 6cqw 4cqh;
}
#dyn-message-theme.dyn-portrait[data-theme="text-message"] .tm-hero{
  flex:0 0 auto;width:100%;height:auto;max-height:34%;
  justify-content:center;
}
#dyn-message-theme.dyn-portrait[data-theme="text-message"] .tm-hero-frame{
  width:min(42cqw, 34cqh);aspect-ratio:1;border-radius:2.2cqh;
}
#dyn-message-theme.dyn-portrait[data-theme="text-message"] .tm-phone-wrap{
  flex:0 0 auto;width:100%;justify-content:center;
}
#dyn-message-theme.dyn-portrait[data-theme="text-message"] .tm-phone{
  height:min(58cqh, 100%);
  transform:rotateY(-8deg) rotateX(3deg);
}

@keyframes tm-bubble-in{
  from{opacity:0;transform:translate3d(0,18px,0) scale(.96);}
  to{opacity:1;transform:none;}
}
@keyframes tm-buzz{
  0%,100%{transform:rotateY(-12deg) rotateX(4deg) rotateZ(-1deg) translate3d(0,0,0);}
  15%{transform:rotateY(-12deg) rotateX(4deg) rotateZ(-1deg) translate3d(-5px,2px,0);}
  30%{transform:rotateY(-12deg) rotateX(4deg) rotateZ(-1deg) translate3d(6px,-2px,0);}
  45%{transform:rotateY(-12deg) rotateX(4deg) rotateZ(-1deg) translate3d(-4px,3px,0);}
  60%{transform:rotateY(-12deg) rotateX(4deg) rotateZ(-1deg) translate3d(4px,-1px,0);}
  75%{transform:rotateY(-12deg) rotateX(4deg) rotateZ(-1deg) translate3d(-2px,1px,0);}
}
@keyframes tm-hero-pulse{
  0%{transform:scale(1);}
  35%{transform:scale(1.035);}
  100%{transform:scale(1);}
}
#dyn-message-theme.dyn-portrait[data-theme="text-message"] .tm-phone.is-buzz{
  animation-name:tm-buzz-portrait;
}
@keyframes tm-buzz-portrait{
  0%,100%{transform:rotateY(-8deg) rotateX(3deg) translate3d(0,0,0);}
  20%{transform:rotateY(-8deg) rotateX(3deg) translate3d(-4px,2px,0);}
  40%{transform:rotateY(-8deg) rotateX(3deg) translate3d(5px,-2px,0);}
  60%{transform:rotateY(-8deg) rotateX(3deg) translate3d(-3px,2px,0);}
  80%{transform:rotateY(-8deg) rotateX(3deg) translate3d(3px,-1px,0);}
}
`.trim();

  function ensureStyle() {
    let style = document.querySelector("style[" + STYLE_ATTR + "]");
    if (!style) {
      style = document.createElement("style");
      style.setAttribute(STYLE_ATTR, "");
      document.documentElement.appendChild(style);
    }
    const dual =
      CSS_SRC +
      "\n" +
      CSS_SRC.split("#dyn-message-theme").join(".dyn-message-theme");
    if (style.textContent !== dual) style.textContent = dual;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function captureKey(capture) {
    if (!capture) return "";
    return String(capture.src || "") + "\n" + String(capture.message || "") + "\n" + String(capture.name || "");
  }

  function escapeText(value) {
    return String(value || "");
  }

  function buildRow(entry) {
    const row = document.createElement("div");
    row.className = "tm-row";
    const avatar = document.createElement("div");
    avatar.className = "tm-avatar";
    if (entry.src) {
      const img = document.createElement("img");
      img.alt = "";
      img.src = entry.src;
      avatar.appendChild(img);
    }
    const col = document.createElement("div");
    col.className = "tm-col";
    if (entry.name) {
      const sender = document.createElement("div");
      sender.className = "tm-sender";
      sender.textContent = escapeText(entry.name);
      col.appendChild(sender);
    }
    const bubble = document.createElement("div");
    bubble.className = "tm-bubble";
    bubble.textContent = escapeText(entry.message);
    col.appendChild(bubble);
    row.appendChild(avatar);
    row.appendChild(col);
    return row;
  }

  function trimThread(thread) {
    while (thread.children.length > MAX_HISTORY) {
      thread.removeChild(thread.firstChild);
    }
  }

  function buzzPhone(state) {
    if (!state || !state.phone) return;
    state.phone.classList.remove("is-buzz");
    void state.phone.offsetWidth;
    state.phone.classList.add("is-buzz");
    clearTimeout(state.buzzTimer);
    state.buzzTimer = setTimeout(() => {
      if (state.phone) state.phone.classList.remove("is-buzz");
    }, 520);
  }

  function pulseHero(state) {
    if (!state || !state.heroFrame) return;
    state.heroFrame.classList.remove("is-pulse");
    void state.heroFrame.offsetWidth;
    state.heroFrame.classList.add("is-pulse");
    clearTimeout(state.pulseTimer);
    state.pulseTimer = setTimeout(() => {
      if (state.heroFrame) state.heroFrame.classList.remove("is-pulse");
    }, 720);
  }

  function clearHistory(state) {
    if (state && state.thread) state.thread.replaceChildren();
    if (state) {
      state.history = [];
      state.lastKey = "";
    }
  }

  async function applyWallpaper(state, mediaId) {
    const layer = state && state.wallpaper;
    if (!layer) return;
    const id = String(mediaId || "").trim();
    if (!id) {
      layer.replaceChildren();
      layer.classList.remove("has-media");
      state.wallpaperId = "";
      return;
    }
    if (state.wallpaperId === id && layer.querySelector("img, video")) return;
    const store = globalThis.BGMediaStore;
    if (!store || typeof store.getMedia !== "function") return;
    const asset = await store.getMedia(id);
    if (!asset || !asset.dataUrl) {
      layer.replaceChildren();
      layer.classList.remove("has-media");
      state.wallpaperId = "";
      return;
    }
    const wantVideo = store.isVideoMime && store.isVideoMime(asset.mime);
    layer.replaceChildren();
    const node = document.createElement(wantVideo ? "video" : "img");
    if (wantVideo) {
      node.autoplay = true;
      node.loop = true;
      node.muted = true;
      node.playsInline = true;
      node.setAttribute("playsinline", "");
    }
    node.alt = "";
    node.src = asset.dataUrl;
    layer.appendChild(node);
    layer.classList.add("has-media");
    state.wallpaperId = id;
    if (wantVideo && typeof node.play === "function") {
      const play = node.play();
      if (play && typeof play.catch === "function") play.catch(() => {});
    }
  }

  if (!globalThis.BGThemeEngines || typeof globalThis.BGThemeEngines.define !== "function") {
    throw new Error("BGThemeEngines is not loaded before message-text-message-engine.js");
  }

  ensureStyle();

  globalThis.BGThemeEngines.define({
    id: ENGINE_ID,
    kind: "message",
    builtin: {
      id: THEME_ID,
      label: "Text Message",
    },

    mount(themeRoot, settings) {
      ensureStyle();
      const helpers = globalThis.BGMessageThemes || {};
      const stage = helpers.ensureFitStage ? helpers.ensureFitStage(themeRoot) : themeRoot;
      const existing = stage.querySelector(".tm-stage");
      if (!existing || existing.querySelector(".tm-nav-back, .tm-nav-face")) {
        stage.innerHTML = MARKUP;
      }
      themeRoot.dataset.engine = ENGINE_ID;
      const state = {
        hero: stage.querySelector(".tm-hero-img"),
        heroFrame: stage.querySelector(".tm-hero-frame"),
        phone: stage.querySelector(".tm-phone"),
        wallpaper: stage.querySelector(".tm-wallpaper"),
        thread: stage.querySelector("[data-tm-thread]"),
        history: [],
        lastKey: "",
        wallpaperId: "",
        buzzTimer: 0,
        pulseTimer: 0,
        idleTimer: 0,
        hardHide: false,
      };
      if (typeof this.applySettings === "function") {
        this.applySettings(themeRoot, state, settings);
      }
      return state;
    },

    applySettings(themeRoot, state, settings) {
      const helpers = globalThis.BGMessageThemes || {};
      if (helpers.applyVars) helpers.applyVars(themeRoot, settings);
      const phone = (settings && settings.primary) || "#3f3f46";
      const accent = (settings && settings.secondary) || "#0a84ff";
      themeRoot.style.setProperty("--tm-phone", phone);
      themeRoot.style.setProperty("--tm-accent", accent);
      applyWallpaper(state, settings && settings.wallpaper).catch(() => {});
    },

    async show(themeRoot, capture, state, settings) {
      ensureStyle();
      const helpers = globalThis.BGMessageThemes || {};
      const fresh = !themeRoot.classList.contains("on");
      if (fresh) {
        clearHistory(state);
        themeRoot.classList.remove("off", "idle", "held");
      }
      const key = captureKey(capture);
      if (key && key === state.lastKey && themeRoot.classList.contains("on")) {
        return;
      }

      const entry = {
        src: (capture && capture.src) || "",
        message: (capture && capture.message) || "",
        name: (capture && capture.name) || "",
        key,
      };

      if (state.hero) {
        if (entry.src) state.hero.src = entry.src;
        else state.hero.removeAttribute("src");
      }

      themeRoot.classList.toggle("no-photo", !entry.src);
      themeRoot.classList.toggle("no-copy", !entry.message && !entry.name);
      themeRoot.classList.toggle("no-name", !entry.name);

      if (state.thread && key) {
        const row = buildRow(entry);
        state.thread.appendChild(row);
        state.history.push(entry);
        state.lastKey = key;
        trimThread(state.thread);
      }

      if (!fresh) {
        buzzPhone(state);
        pulseHero(state);
      }

      const images = [state.hero].filter(Boolean);
      if (helpers.finishShow) await helpers.finishShow(themeRoot, images);
      else {
        await wait(40);
        themeRoot.classList.add("on");
      }

      if (fresh) {
        // First entrance: light buzz after the phone lands.
        clearTimeout(state.buzzTimer);
        state.buzzTimer = setTimeout(() => buzzPhone(state), 420);
      }
    },

    hide(themeRoot, state) {
      // Keep the chat up between back-to-back captures. Hard leave is unmount.
      if (themeRoot.classList.contains("on") && !themeRoot.classList.contains("is-parked")) {
        return Promise.resolve();
      }
      const helpers = globalThis.BGMessageThemes || {};
      if (helpers.hideTheme) return helpers.hideTheme(themeRoot, state, 280);
      themeRoot.classList.add("off");
      return wait(280).then(() => {
        themeRoot.classList.remove("on", "off");
        clearHistory(state);
      });
    },

    unmount(themeRoot, state) {
      clearTimeout(state && state.buzzTimer);
      clearTimeout(state && state.pulseTimer);
      clearTimeout(state && state.idleTimer);
      clearHistory(state);
      if (themeRoot && themeRoot.removeAttribute) themeRoot.removeAttribute("data-engine");
    },
  });
})();
