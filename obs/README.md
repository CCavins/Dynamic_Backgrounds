# Dynamic Backgrounds for OBS

Themes a regular OBS **Browser Source** that is showing a Vixi output URL,
using the same message/mosaic themes as the Chrome extension. The theming
scripts run inside OBS. No Node helper, no extra apps besides the launcher.

## Why a launcher?

OBS can only inject JavaScript into Browser Sources through Chromium’s debug
port. That port is **off** unless OBS is started with:

```
--remote-debugging-port=9223 --remote-allow-origins=*
```

The Dock / Applications icon does not pass those flags. Safe Mode also
strips them (and disables this script). Always start OBS with
**Launch OBS Themed.app**.

## Install (one time)

1. OBS → Tools → Scripts → “+” → `obs/vixi-source.lua`
   (keep the `extension` folder next to `obs/`)
2. Drag **Launch OBS Themed.app** to your Dock if you want. Use it instead
   of the regular OBS icon.
3. In your scene: add a **Browser Source**, paste the Vixi output URL,
   set width/height to the canvas (e.g. 1920 × 1080). Leave “Shutdown source
   when not visible” off. The script sets that source to 60 FPS; you can
   also enable **Use custom frame rate** → 60 in the Browser Source
   properties. Settings → Advanced → **Enable browser source hardware
   acceleration** should stay on.
4. If you already added **Vixi Themed Output**, hide it (eye icon). It is
   settings-only now and no longer draws video — that was crashing OBS on quit.

## Every launch

1. If OBS is open: **OBS menu → Quit OBS**
2. If it asks about Safe Mode: **Run Normally** (never Safe Mode)
3. Open **Launch OBS Themed.app** (or `Launch OBS (Themed).command`)
4. Tools → Scripts → `vixi-source.lua` → pick Message theme and Mosaic theme

Script Log should show `connected to OBS debug port 9223` then `themed: <url>`.
The script panel also shows **Theming connection: OK**.

If you see `debug port 9223 is closed`, this session was started from the
regular OBS icon or Safe Mode. Quit and use the launcher.

## Theme controls

In Tools → Scripts (or on the hidden Vixi Themed Output source):

- **Theming enabled**
- **Message theme** — Off, LED Scoreboard, Neon Nightclub, Ultras Tifo,
  Holo Card, Broadcast TV, Liquid Glass, Parallax Drift
- **Mosaic theme** — Off, Card decks*, Spotlight, Coverflow, Fan*,
  Cascade, Orbit, Reels, Polaroid wall*, 3D flip wall*, Live mosaic*,
  Cube field*, Pedestals
- **Override theme colors** + primary/secondary

Changes apply live.

## Windows

Right-click the OBS shortcut → Properties → append to Target:

```
--remote-debugging-port=9223 --remote-allow-origins=*
```

## Alternative: Node injector

`injector.js` can theme a plain Browser Source from outside OBS if you
would rather not use the Lua script. Requires the same launch flags and
Node 22+ (`node obs/injector.js`). Settings live in `settings.json`.
