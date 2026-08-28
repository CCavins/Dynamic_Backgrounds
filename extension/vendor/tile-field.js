(function (root) {
  const THREE = root.THREE;
  if (!THREE || !THREE.RoundedBoxGeometry) {
    root.BGTileField = {
      mount() {
        return { stopped: true };
      },
      tick() {},
      unmount() {},
    };
    return;
  }

  const SIDE_FACES = [0, 1, 4, 5];
  const ALL_FACES = [0, 1, 2, 3, 4, 5];
  const FACE_BASIS_LOCAL = [
    { u: new THREE.Vector3(0, 0, -1), v: new THREE.Vector3(0, 1, 0), n: new THREE.Vector3(1, 0, 0) },
    { u: new THREE.Vector3(0, 0, 1), v: new THREE.Vector3(0, 1, 0), n: new THREE.Vector3(-1, 0, 0) },
    { u: new THREE.Vector3(1, 0, 0), v: new THREE.Vector3(0, 0, -1), n: new THREE.Vector3(0, 1, 0) },
    { u: new THREE.Vector3(1, 0, 0), v: new THREE.Vector3(0, 0, 1), n: new THREE.Vector3(0, -1, 0) },
    { u: new THREE.Vector3(1, 0, 0), v: new THREE.Vector3(0, 1, 0), n: new THREE.Vector3(0, 0, 1) },
    { u: new THREE.Vector3(-1, 0, 0), v: new THREE.Vector3(0, 1, 0), n: new THREE.Vector3(0, 0, -1) },
  ];

  const SHOWCASE_MAX_FEATURED = 3;
  const SHOWCASE_APPROACH_S = 1.35;
  const SHOWCASE_RETREAT_S = 1.2;
  const SHOWCASE_HOLD_S = 7;
  const MAX_TILES = 55;
  const CUBE_SIZE = 0.72;
  const MIN_GAP = 0.42;
  const PLENTY_IMAGES = 6;
  const FACE_FILL_PER_TICK = 40;
  const FADE_MS = 900;
  const MAX_TEX_SIZE = 512;
  const MAX_ACTIVE_FADES = 18;
  const DWELL_MS = 4000;

  function seededNoise(i, salt) {
    const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function smoothstep(t) {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  }

  function uniqueUrls(pool) {
    const out = [];
    const seen = new Set();
    (pool || []).forEach((src) => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      out.push(src);
    });
    return out;
  }

  function makeCoverSquareCanvas(img, maxSize) {
    const srcW = img.width || img.naturalWidth || 1;
    const srcH = img.height || img.naturalHeight || 1;
    const out = Math.max(1, Math.min(maxSize, Math.max(srcW, srcH)));
    const scale = Math.max(out / srcW, out / srcH);
    const dw = srcW * scale;
    const dh = srcH * scale;
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, out, out);
    ctx.drawImage(img, (out - dw) / 2, (out - dh) / 2, dw, dh);
    // Vixi's <img> tags already cached these files without CORS. A tainted
    // canvas throws in texSubImage2D every frame; skip rather than upload.
    try {
      ctx.getImageData(0, 0, 1, 1);
    } catch {
      return null;
    }
    return canvas;
  }

  function loadImageFromBlob(url) {
    const abs = (() => {
      try {
        return new URL(url, location.href).href;
      } catch {
        return url;
      }
    })();
    return fetch(abs, { mode: "cors", credentials: "omit", cache: "reload" })
      .then((res) => {
        if (!res.ok) throw new Error("fetch");
        return res.blob();
      })
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const obj = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
              URL.revokeObjectURL(obj);
              resolve(img);
            };
            img.onerror = () => {
              URL.revokeObjectURL(obj);
              reject(new Error("blob"));
            };
            img.src = obj;
          })
      );
  }

  function createScene(host, pool, preset) {
    const activePreset = preset === "depth" ? "depth" : "showcase";
    const cubeColor = new THREE.Color(0x10131c);
    const images = [];
    let nextImageId = 1;
    let coverageTimer = 0;
    let showcaseSwapTimer = 0;
    let retireGate = 0;
    let poolSeeded = false;
    let stopped = false;
    const tiles = [];

    const _faceN = new THREE.Vector3();
    const _faceU = new THREE.Vector3();
    const _faceV = new THREE.Vector3();
    const _desiredUp = new THREE.Vector3();
    const _screenUp = new THREE.Vector3();
    const _viewDir = new THREE.Vector3();
    const _worldPos = new THREE.Vector3();
    const _spinAxis = new THREE.Vector3();
    const _tmpQuat = new THREE.Quaternion();
    const tmpEuler = new THREE.Euler();

    const placeholder = document.createElement("canvas");
    placeholder.width = 4;
    placeholder.height = 4;
    const pctx = placeholder.getContext("2d");
    pctx.fillStyle = "#10131c";
    pctx.fillRect(0, 0, 4, 4);

    const canvas = document.createElement("canvas");
    host.appendChild(canvas);
    const vignette = document.createElement("div");
    vignette.className = "dyn-cube-vignette";
    host.appendChild(vignette);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: window.devicePixelRatio < 1.5,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      return {
        stopped: true,
        syncPool() {},
        dispose() {
          if (canvas.parentNode) canvas.remove();
          if (vignette.parentNode) vignette.remove();
        },
      };
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050506);
    scene.fog = new THREE.FogExp2(0x050506, 0.018);

    const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 100);
    camera.position.set(activePreset === "showcase" ? 0.15 : 2.8, activePreset === "showcase" ? 0.35 : 1.6, 10.5);

    const pmrem = new THREE.PMREMGenerator(renderer);
    function buildGlowEnvironment() {
      const width = 256;
      const height = 128;
      const data = new Uint8Array(width * height * 4);
      for (let y = 0; y < height; y++) {
        const v = y / (height - 1);
        for (let x = 0; x < width; x++) {
          const u = x / (width - 1);
          const wave = 0.5 + 0.5 * Math.sin(u * Math.PI * 2 + v * 1.2);
          const i = (y * width + x) * 4;
          data[i] = Math.floor(12 + wave * 40 + (1 - v) * 30);
          data[i + 1] = Math.floor(14 + wave * 35 + v * 20);
          data[i + 2] = Math.floor(22 + (1 - v) * 55 + wave * 45);
          data[i + 3] = 255;
        }
      }
      const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.needsUpdate = true;
      texture.colorSpace = THREE.SRGBColorSpace;
      const envMap = pmrem.fromEquirectangular(texture).texture;
      texture.dispose();
      return envMap;
    }
    scene.environment = buildGlowEnvironment();
    scene.environmentIntensity = 0.95;
    pmrem.dispose();

    const keyLight = new THREE.DirectionalLight(0xa8c4ff, 2.8);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x5ef0d0, 1.6);
    rimLight.position.set(-6, 3, -4);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight(0x4a5a80, 0.65));

    const group = new THREE.Group();
    scene.add(group);

    const geometry = new THREE.RoundedBoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, 1, 0.08);
    orientCubeFaceUVs(geometry);

    function makeBaseMaterial() {
      return new THREE.MeshStandardMaterial({
        color: cubeColor.clone(),
        metalness: 0.85,
        roughness: 0.34,
        envMapIntensity: 0.85,
      });
    }
    const sharedBaseMaterial = makeBaseMaterial();
    const sharedBgMaterial = makeBaseMaterial();
    sharedBgMaterial.color.multiplyScalar(0.55);
    sharedBgMaterial.envMapIntensity = 0.35;
    sharedBgMaterial.roughness = 0.55;
    sharedBgMaterial.metalness = 0.7;

    function makeImageMaterial(texture) {
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        color: cubeColor.clone(),
        metalness: 0.4,
        roughness: 0.4,
        envMapIntensity: 0.65,
        transparent: false,
        opacity: 1,
        depthWrite: true,
      });
      mat.userData.imageMix = { value: 0 };
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uImageMix = mat.userData.imageMix;
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
uniform float uImageMix;`
          )
          .replace(
            "#include <map_fragment>",
            `
#ifdef USE_MAP
	if (uImageMix > 0.001) {
		vec4 sampledDiffuseColor = texture2D( map, vMapUv );
		float imgA = clamp(sampledDiffuseColor.a * uImageMix, 0.0, 1.0);
		diffuseColor = vec4(mix(diffuseColor.rgb, sampledDiffuseColor.rgb, imgA), 1.0);
	}
#endif
`
          );
      };
      mat.customProgramCacheKey = () => "image-over-cube-std-v2";
      return mat;
    }

    function orientCubeFaceUVs(geom) {
      const pos = geom.attributes.position;
      const uv = geom.attributes.uv;
      if (!pos || !uv) return;
      const vertCount = pos.count;
      const perFace = Math.floor(vertCount / 6);
      if (perFace < 3) return;
      geom.clearGroups();
      for (let face = 0; face < 6; face++) geom.addGroup(face * perFace, perFace, face);
      const faceAxes = {
        0: { uAxis: "z", uSign: -1, vAxis: "y", vSign: 1 },
        1: { uAxis: "z", uSign: 1, vAxis: "y", vSign: 1 },
        2: { uAxis: "x", uSign: 1, vAxis: "z", vSign: -1 },
        3: { uAxis: "x", uSign: 1, vAxis: "z", vSign: 1 },
        4: { uAxis: "x", uSign: 1, vAxis: "y", vSign: 1 },
        5: { uAxis: "x", uSign: -1, vAxis: "y", vSign: 1 },
      };
      const axisGetter = {
        x: (i) => pos.getX(i),
        y: (i) => pos.getY(i),
        z: (i) => pos.getZ(i),
      };
      for (const face of ALL_FACES) {
        const axes = faceAxes[face];
        const start = face * perFace;
        const end = start + perFace;
        let uMin = Infinity;
        let uMax = -Infinity;
        let vMin = Infinity;
        let vMax = -Infinity;
        for (let i = start; i < end; i++) {
          const u = axisGetter[axes.uAxis](i) * axes.uSign;
          const v = axisGetter[axes.vAxis](i) * axes.vSign;
          if (u < uMin) uMin = u;
          if (u > uMax) uMax = u;
          if (v < vMin) vMin = v;
          if (v > vMax) vMax = v;
        }
        const uSpan = Math.max(1e-6, uMax - uMin);
        const vSpan = Math.max(1e-6, vMax - vMin);
        for (let i = start; i < end; i++) {
          const u = (axisGetter[axes.uAxis](i) * axes.uSign - uMin) / uSpan;
          const v = (axisGetter[axes.vAxis](i) * axes.vSign - vMin) / vSpan;
          uv.setXY(i, u, v);
        }
      }
      uv.needsUpdate = true;
    }

    function boundingRadius(scale) {
      return (CUBE_SIZE * scale * Math.sqrt(3)) / 2;
    }
    function minCenterDistance(scaleA, scaleB) {
      return boundingRadius(scaleA) + boundingRadius(scaleB) + MIN_GAP;
    }
    function separateTargets(list, iterations) {
      const scratch = new THREE.Vector3();
      for (let iter = 0; iter < (iterations || 36); iter++) {
        let moved = false;
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i];
            const b = list[j];
            scratch.subVectors(b.position, a.position);
            let dist = scratch.length();
            const minDist = minCenterDistance(a.scale, b.scale);
            if (dist < 1e-6) {
              scratch.set(seededNoise(i + j, 31) - 0.5, seededNoise(i + j, 32) - 0.5, seededNoise(i + j, 33) - 0.5);
              if (scratch.lengthSq() < 1e-8) scratch.set(1, 0, 0);
              dist = 0;
            }
            if (dist < minDist) {
              const push = (minDist - Math.max(dist, 1e-6)) * 0.55;
              scratch.normalize().multiplyScalar(push);
              a.position.sub(scratch);
              b.position.add(scratch);
              moved = true;
            }
          }
        }
        if (!moved) break;
      }
      return list;
    }

    function viewSize() {
      return {
        w: host.clientWidth || host.getBoundingClientRect().width || 1280,
        h: host.clientHeight || host.getBoundingClientRect().height || 720,
      };
    }

    function isPortraitView() {
      const { w, h } = viewSize();
      return h > w;
    }

    function cameraRest() {
      return isPortraitView() ? { x: 0, y: 0.18, z: 10.5 } : { x: 0.15, y: 0.35, z: 10.5 };
    }

    function lookAtRest() {
      return isPortraitView() ? { x: 0, y: 0.12, z: 0 } : { x: 0, y: 0.22, z: 0 };
    }

    function frustumHalfExtentsAtZ(z, margin) {
      const { w, h } = viewSize();
      const aspect = Math.max(0.38, Math.min(2.8, w / Math.max(1, h)));
      const dist = Math.max(3.5, 10.5 - z);
      const m = margin == null ? 0.94 : margin;
      const halfH = Math.tan((38 * Math.PI) / 360) * dist * m;
      const halfW = halfH * aspect;
      return { halfW, halfH };
    }

    function lookCenterAtZ(z) {
      const cam = cameraRest();
      const look = lookAtRest();
      const t = (cam.z - z) / cam.z;
      return {
        x: cam.x + (look.x - cam.x) * t,
        y: cam.y + (look.y - cam.y) * t,
      };
    }

    function showcaseGrid() {
      return isPortraitView() ? { cols: 5, rows: 11 } : { cols: 9, rows: 6 };
    }

    function showcasePresentScale() {
      return isPortraitView() ? 0.9 : 1.15;
    }

    function showcasePresentSlots() {
      const portrait = isPortraitView();
      const zMid = portrait ? 5.25 : 5.85;
      const zSide = portrait ? 5.05 : 5.55;
      const { halfW, halfH } = frustumHalfExtentsAtZ(zMid, portrait ? 0.74 : 0.7);
      const center = lookCenterAtZ(zMid);
      if (portrait) {
        const spread = Math.max(0.95, halfH * 0.7);
        return [
          new THREE.Vector3(center.x + 0.03, center.y + spread, zSide),
          new THREE.Vector3(center.x, center.y + 0.06, zMid + 0.2),
          new THREE.Vector3(center.x - 0.03, center.y - spread, zSide),
        ];
      }
      const spread = Math.max(1.35, halfW * 0.76);
      return [
        new THREE.Vector3(center.x - spread, center.y - 0.05, zSide),
        new THREE.Vector3(center.x, center.y + 0.18, zMid),
        new THREE.Vector3(center.x + spread, center.y - 0.05, zSide),
      ];
    }

    function buildShowcaseTargets(i) {
      const { cols, rows } = showcaseGrid();
      const col = i % cols;
      const row = Math.floor(i / cols);
      const portrait = isPortraitView();
      const z = 2.2 + seededNoise(i, 43) * 1.35;
      const { halfW, halfH } = frustumHalfExtentsAtZ(z, portrait ? 0.86 : 0.96);
      const center = lookCenterAtZ(z);
      const stagger = row % 2 === 1 ? (portrait ? 0.1 : 0.3) : 0;
      const edge = portrait ? 0.08 : 0.03;
      const u = THREE.MathUtils.clamp(
        (col + 0.5 + stagger + (seededNoise(i, 41) - 0.5) * (portrait ? 0.28 : 0.5)) / cols,
        edge,
        1 - edge
      );
      const v = THREE.MathUtils.clamp(
        (row + 0.5 + (seededNoise(i, 42) - 0.5) * (portrait ? 0.32 : 0.5)) / rows,
        0.03,
        0.97
      );
      const scale = portrait
        ? THREE.MathUtils.clamp(0.4 + seededNoise(i, 47) * 0.1, 0.36, 0.52)
        : THREE.MathUtils.clamp(0.5 + seededNoise(i, 47) * 0.14, 0.46, 0.66);
      const pad = boundingRadius(scale) * (portrait ? 0.48 : 0.35);
      const maxX = Math.max(0.2, halfW - pad);
      const maxY = Math.max(0.2, halfH - pad);
      const x = center.x + (u - 0.5) * 2 * maxX;
      const y = center.y + (v - 0.5) * 2 * maxY;
      return {
        position: new THREE.Vector3(x, y, z),
        rotation: new THREE.Euler(
          (seededNoise(i, 44) - 0.5) * 0.08,
          (seededNoise(i, 45) - 0.5) * 0.35,
          (seededNoise(i, 46) - 0.5) * 0.06
        ),
        scale,
        layer: "bg",
        interior: col > 0 && col < cols - 1 && row > 0 && row < rows - 1,
      };
    }

    function buildDepthTargets(i, count) {
      const fgCount = Math.max(1, Math.ceil(count * 0.6));
      if (i < fgCount) {
        const cols = Math.ceil(Math.sqrt(fgCount * 1.45));
        const rows = Math.ceil(fgCount / cols);
        const col = i % cols;
        const row = Math.floor(i / cols);
        const spacing = minCenterDistance(0.9, 0.9) * 1.08;
        return {
          position: new THREE.Vector3(
            (col - (cols - 1) / 2) * spacing,
            (row - (rows - 1) / 2) * spacing * 0.92,
            2.4 + (seededNoise(i, 50) - 0.5) * 0.85
          ),
          rotation: new THREE.Euler(
            (seededNoise(i, 51) - 0.5) * 0.12,
            (seededNoise(i, 52) - 0.5) * 0.35,
            (seededNoise(i, 53) - 0.5) * 0.08
          ),
          scale: 0.88 + seededNoise(i, 54) * 0.1,
          layer: "fg",
        };
      }
      const bi = i - fgCount;
      const bgCount = Math.max(1, count - fgCount);
      const cols = Math.ceil(Math.sqrt(bgCount * 1.6));
      const rows = Math.ceil(bgCount / cols);
      const col = bi % cols;
      const row = Math.floor(bi / cols);
      const spacing = minCenterDistance(0.55, 0.55) * 1.15;
      return {
        position: new THREE.Vector3(
          (col - (cols - 1) / 2) * spacing * 1.15,
          (row - (rows - 1) / 2) * spacing,
          -3.2 + (seededNoise(i, 55) - 0.5) * 1.2
        ),
        rotation: new THREE.Euler(0, (seededNoise(i, 56) - 0.5) * 0.5, 0),
        scale: 0.48 + seededNoise(i, 57) * 0.12,
        layer: "bg",
      };
    }

    function buildAllTargets() {
      const targets = [];
      for (let i = 0; i < MAX_TILES; i++) {
        targets.push(activePreset === "depth" ? buildDepthTargets(i, MAX_TILES) : buildShowcaseTargets(i));
      }
      if (activePreset === "depth") {
        separateTargets(targets.filter((t) => t.layer === "fg"), 28);
        separateTargets(targets.filter((t) => t.layer === "bg"), 28);
        return targets;
      }
      separateTargets(targets, 2);
      const portrait = isPortraitView();
      for (const t of targets) {
        const { halfW, halfH } = frustumHalfExtentsAtZ(t.position.z, portrait ? 0.86 : 0.96);
        const center = lookCenterAtZ(t.position.z);
        const pad = boundingRadius(t.scale) * (portrait ? 0.46 : 0.32);
        const maxX = Math.max(0.15, halfW - pad);
        const maxY = Math.max(0.15, halfH - pad);
        t.position.x = THREE.MathUtils.clamp(t.position.x, center.x - maxX, center.x + maxX);
        t.position.y = THREE.MathUtils.clamp(t.position.y, center.y - maxY, center.y + maxY);
      }
      return targets;
    }

    function applySpinForPreset(tile) {
      const dir = seededNoise(tile.index, 22) > 0.5 ? 1 : -1;
      if (activePreset === "showcase") {
        tile.spin.set(0, dir * 0.32, 0);
      } else {
        tile.spin.set(
          (seededNoise(tile.index, 21) - 0.5) * 0.05,
          dir * (0.28 + seededNoise(tile.index, 24) * 0.2),
          (seededNoise(tile.index, 23) - 0.5) * 0.04
        );
      }
    }

    function emptyFaceMaterial(tile) {
      return tile.layer === "bg" && activePreset === "depth" ? sharedBgMaterial : sharedBaseMaterial;
    }

    function syncTileLayerMaterials(tile) {
      for (let f = 0; f < 6; f++) {
        const slot = tile.faceSlots[f];
        if (slot.state === "empty" || !slot.material) {
          tile.mesh.material[f] = emptyFaceMaterial(tile);
        } else if (slot.material) {
          if (tile.layer === "bg" && activePreset === "depth") {
            slot.material.color.copy(cubeColor).multiplyScalar(0.65);
            slot.material.envMapIntensity = 0.35;
            slot.material.roughness = 0.5;
          } else {
            slot.material.color.copy(cubeColor);
            slot.material.envMapIntensity = 0.65;
            slot.material.roughness = 0.4;
          }
        }
      }
    }

    const initialTargets = buildAllTargets();
    for (let i = 0; i < MAX_TILES; i++) {
      const materials = [
        sharedBaseMaterial,
        sharedBaseMaterial,
        sharedBaseMaterial,
        sharedBaseMaterial,
        sharedBaseMaterial,
        sharedBaseMaterial,
      ];
      const mesh = new THREE.Mesh(geometry, materials);
      const target = initialTargets[i];
      mesh.position.copy(target.position);
      mesh.rotation.copy(target.rotation);
      mesh.scale.setScalar(target.scale);
      group.add(mesh);
      const faceSlots = Array.from({ length: 6 }, () => ({
        imageId: null,
        material: null,
        faceTexture: null,
        faceTextureImageId: null,
        fade: 0,
        state: "empty",
        holdUntil: 0,
        pendingImage: null,
      }));
      const tile = {
        mesh,
        index: i,
        layer: target.layer || "fg",
        interior: Boolean(target.interior),
        role: "idle",
        roleT: 0,
        roleDuration: 0.4 + Math.random() * 5.5,
        presentSlot: null,
        presentAnchor: new THREE.Vector3(),
        phase: seededNoise(i, 20) * Math.PI * 2,
        spin: new THREE.Vector3(0, 0.32, 0),
        home: {
          position: target.position.clone(),
          rotation: target.rotation.clone(),
          scale: target.scale,
        },
        current: {
          position: target.position.clone(),
          rotation: target.rotation.clone(),
          scale: target.scale,
        },
        target: {
          position: target.position.clone(),
          rotation: target.rotation.clone(),
          scale: target.scale,
        },
        faceSlots,
      };
      applySpinForPreset(tile);
      tiles.push(tile);
    }

    function paintTexture(image, el) {
      const texture = image.texture;
      if (!texture) return;
      const canvas = makeCoverSquareCanvas(el, MAX_TEX_SIZE);
      if (!canvas) return;
      texture.image = canvas;
      texture.needsUpdate = true;
      tiles.forEach((tile) => {
        tile.faceSlots.forEach((slot) => {
          if (slot.imageId !== image.id || !slot.faceTexture) return;
          slot.faceTexture.image = canvas;
          slot.faceTexture.needsUpdate = true;
          if (slot.material) {
            slot.material.map = slot.faceTexture;
            slot.material.needsUpdate = true;
          }
        });
      });
    }

    function loadTextureSource(url) {
      return loadImageFromBlob(url);
    }

    function ensureImageTexture(image) {
      if (image.texture) return image.texture;
      const texture = new THREE.Texture();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.flipY = true;
      image.texture = texture;
      loadTextureSource(image.url).then((el) => paintTexture(image, el)).catch(() => {});
      return texture;
    }

    function computeUprightTextureRotation(tile, faceIndex) {
      const basis = FACE_BASIS_LOCAL[faceIndex];
      tile.mesh.updateMatrixWorld(true);
      tile.mesh.getWorldQuaternion(_tmpQuat);
      _faceN.copy(basis.n).applyQuaternion(_tmpQuat).normalize();
      _faceU.copy(basis.u).applyQuaternion(_tmpQuat).normalize();
      _faceV.copy(basis.v).applyQuaternion(_tmpQuat).normalize();
      camera.updateMatrixWorld(true);
      _screenUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
      _desiredUp.copy(_screenUp).addScaledVector(_faceN, -_screenUp.dot(_faceN));
      if (_desiredUp.lengthSq() < 1e-8) {
        tile.mesh.getWorldPosition(_worldPos);
        _viewDir.subVectors(camera.position, _worldPos).normalize();
        _desiredUp.crossVectors(_faceN, _viewDir).cross(_faceN);
        if (_desiredUp.lengthSq() < 1e-8) {
          _desiredUp.set(0, 0, -1).applyQuaternion(_tmpQuat);
          _desiredUp.addScaledVector(_faceN, -_desiredUp.dot(_faceN));
        }
      }
      _desiredUp.normalize();
      const cos = THREE.MathUtils.clamp(_desiredUp.dot(_faceV), -1, 1);
      const sin = _desiredUp.dot(_faceU);
      return -Math.atan2(sin, cos);
    }

    function ensureSlotFaceTexture(slot, image, baseTexture, rotation) {
      if (slot.faceTexture && slot.faceTextureImageId !== image.id) {
        slot.faceTexture.dispose();
        slot.faceTexture = null;
      }
      if (!slot.faceTexture) {
        slot.faceTexture = new THREE.Texture();
        slot.faceTexture.colorSpace = THREE.SRGBColorSpace;
        slot.faceTexture.wrapS = THREE.ClampToEdgeWrapping;
        slot.faceTexture.wrapT = THREE.ClampToEdgeWrapping;
        slot.faceTexture.center.set(0.5, 0.5);
        slot.faceTexture.generateMipmaps = true;
        slot.faceTexture.minFilter = THREE.LinearMipmapLinearFilter;
        slot.faceTexture.magFilter = THREE.LinearFilter;
        slot.faceTexture.anisotropy = baseTexture.anisotropy;
        slot.faceTexture.flipY = true;
        slot.faceTextureImageId = image.id;
      }
      slot.faceTexture.image = baseTexture.image || placeholder;
      slot.faceTexture.rotation = rotation;
      slot.faceTexture.needsUpdate = true;
      return slot.faceTexture;
    }

    function applyTextureToSlot(tile, faceIndex, image, fadeIn) {
      const slot = tile.faceSlots[faceIndex];
      const baseTexture = ensureImageTexture(image);
      const rotation = computeUprightTextureRotation(tile, faceIndex);
      const texture = ensureSlotFaceTexture(slot, image, baseTexture, rotation);
      if (slot.material && slot.material.userData.imageMix) slot.material.userData.imageMix.value = 0;
      if (!slot.material) slot.material = makeImageMaterial(texture);
      else {
        slot.material.map = texture;
        slot.material.needsUpdate = true;
      }
      const mat = slot.material;
      if (tile.layer === "bg" && activePreset === "depth") {
        mat.color.copy(cubeColor).multiplyScalar(0.65);
        mat.envMapIntensity = 0.35;
        mat.roughness = 0.5;
      } else {
        mat.color.copy(cubeColor);
        mat.envMapIntensity = 0.65;
        mat.roughness = 0.4;
      }
      slot.imageId = image.id;
      slot.pendingImage = null;
      tile.mesh.material[faceIndex] = mat;
      if (fadeIn) {
        slot.fade = 0;
        mat.userData.imageMix.value = 0;
        slot.state = "fadingIn";
        slot.holdUntil = 0;
      } else {
        slot.fade = 1;
        mat.userData.imageMix.value = 1;
        slot.state = "holding";
        slot.holdUntil = performance.now() + DWELL_MS * (0.25 + Math.random() * 0.9);
      }
    }

    function imagesOnTile(tile, excludeFace) {
      const ids = new Set();
      for (let f = 0; f < 6; f++) {
        if (f === excludeFace) continue;
        const slot = tile.faceSlots[f];
        if (slot.imageId != null) ids.add(slot.imageId);
        if (slot.pendingImage && slot.pendingImage.id != null) ids.add(slot.pendingImage.id);
      }
      return ids;
    }

    function countImageUsage() {
      const counts = new Map();
      images.forEach((img) => counts.set(img.id, 0));
      tiles.forEach((tile) => {
        tile.faceSlots.forEach((slot) => {
          if (slot.imageId != null && counts.has(slot.imageId)) {
            counts.set(slot.imageId, counts.get(slot.imageId) + 1);
          }
          if (slot.pendingImage && counts.has(slot.pendingImage.id)) {
            counts.set(slot.pendingImage.id, counts.get(slot.pendingImage.id) + 1);
          }
        });
      });
      return counts;
    }

    function liveImages() {
      return images.filter((img) => !img.retiring);
    }

    function imageById(id) {
      if (id == null) return null;
      for (let i = 0; i < images.length; i += 1) {
        if (images[i].id === id) return images[i];
      }
      return null;
    }

    function markImageUsed(img) {
      if (!img) return;
      img.uses = (img.uses || 0) + 1;
      if (img.fresh && (img.uses >= 8 || (img.addedAt && performance.now() - img.addedAt > 20000))) {
        img.fresh = false;
      }
    }

    function pickImageForTile(tile, excludeFace, alsoExcludeId, usage) {
      const pool = liveImages();
      if (!pool.length) return null;
      if (pool.length === 1) return pool[0];
      const onTile = imagesOnTile(tile, excludeFace);
      if (alsoExcludeId != null) onTile.add(alsoExcludeId);
      const counts = usage || countImageUsage();
      let candidates = pool.filter((img) => !onTile.has(img.id));
      if (!candidates.length) {
        candidates = pool.filter((img) => img.id !== alsoExcludeId);
        if (!candidates.length) candidates = pool.slice();
      }
      let best = candidates[0];
      let bestScore = Infinity;
      candidates.forEach((img) => {
        const score = (counts.get(img.id) || 0) + Math.random() * 0.35 - (img.fresh ? 1.35 : 0);
        if (score < bestScore) {
          bestScore = score;
          best = img;
        }
      });
      counts.set(best.id, (counts.get(best.id) || 0) + 1);
      markImageUsed(best);
      return best;
    }

    function beginFaceCycle(tile, faceIndex, image) {
      if (!image) return;
      const slot = tile.faceSlots[faceIndex];
      if (slot.state === "empty" || !slot.material) {
        applyTextureToSlot(tile, faceIndex, image, true);
        return;
      }
      if (slot.state === "holding" || slot.state === "fadingIn") {
        slot.pendingImage = image;
        slot.state = "fadingOut";
      }
    }

    function ensureFaceCoverage(force) {
      const live = liveImages();
      if (!live.length) return;
      const refs = [];
      tiles.forEach((tile) => {
        for (let f = 0; f < 6; f++) refs.push({ tile, face: f, slot: tile.faceSlots[f] });
      });
      const empties = refs.filter((r) => r.slot.state === "empty");
      if (!empties.length) return;
      const busy = refs.length - empties.length;
      const targetFilled = live.length >= 3 ? refs.length : Math.max(1, Math.floor(refs.length * 0.9));
      let need = targetFilled - busy;
      if (!force && need <= 0) return;
      if (force) need = Math.max(need, empties.length);
      const usage = countImageUsage();
      const cap = force ? FACE_FILL_PER_TICK : 8;
      const fillCount = Math.min(need, empties.length, cap);
      for (let i = 0; i < fillCount; i++) {
        const image = pickImageForTile(empties[i].tile, empties[i].face, null, usage);
        if (image) beginFaceCycle(empties[i].tile, empties[i].face, image);
      }
    }

    function clearFaceToEmpty(tile, faceIndex) {
      const slot = tile.faceSlots[faceIndex];
      slot.imageId = null;
      slot.pendingImage = null;
      slot.fade = 0;
      slot.state = "empty";
      slot.holdUntil = 0;
      if (slot.material && slot.material.userData.imageMix) slot.material.userData.imageMix.value = 0;
      tile.mesh.material[faceIndex] = emptyFaceMaterial(tile);
    }

    function updateFaceTransitions(dt, now) {
      const fadeSpeed = 1000 / FADE_MS;
      let activeFades = 0;
      retireGate += dt;
      let retireAllowed = 0;
      while (retireGate >= 0.07) {
        retireGate -= 0.07;
        retireAllowed += 1;
      }
      const live = liveImages();
      tiles.forEach((tile) => {
        tile.faceSlots.forEach((slot) => {
          if (slot.state === "fadingIn" || slot.state === "fadingOut") activeFades += 1;
        });
      });
      tiles.forEach((tile) => {
        tile.faceSlots.forEach((slot, f) => {
          if (slot.state === "fadingIn") {
            slot.fade = Math.min(1, slot.fade + dt * fadeSpeed);
            if (slot.material) slot.material.userData.imageMix.value = smoothstep(slot.fade);
            if (slot.fade >= 1) {
              slot.state = "holding";
              const shown = imageById(slot.imageId);
              slot.holdUntil =
                now + DWELL_MS * (shown && shown.retiring ? 0.12 : 0.55 + Math.random() * 0.7);
              activeFades -= 1;
            }
          } else if (slot.state === "holding") {
            const shown = imageById(slot.imageId);
            const dropFace = !live.length || Boolean(shown && shown.retiring);
            const due = now >= slot.holdUntil;
            if (!dropFace && !due) return;
            if (dropFace && (retireAllowed <= 0 || activeFades >= 12)) return;
            if (!dropFace && activeFades >= MAX_ACTIVE_FADES) return;
            const next = dropFace && !live.length ? null : pickImageForTile(tile, f, slot.imageId);
            if (!dropFace && !next) return;
            slot.pendingImage = next;
            slot.state = "fadingOut";
            activeFades += 1;
            if (dropFace) retireAllowed -= 1;
          } else if (slot.state === "fadingOut") {
            if (slot.pendingImage && slot.pendingImage.retiring) {
              slot.pendingImage = live.length ? pickImageForTile(tile, f, slot.imageId) : null;
            }
            slot.fade = Math.max(0, slot.fade - dt * fadeSpeed);
            if (slot.material) slot.material.userData.imageMix.value = smoothstep(slot.fade);
            if (slot.fade <= 0) {
              const next =
                slot.pendingImage && !slot.pendingImage.retiring
                  ? slot.pendingImage
                  : pickImageForTile(tile, f, slot.imageId);
              if (next) applyTextureToSlot(tile, f, next, true);
              else clearFaceToEmpty(tile, f);
            }
          }
        });
      });
    }

    function assignShowcasePresentAnchor(tile, slotIndex) {
      const slots = showcasePresentSlots();
      const slot = slots[slotIndex % slots.length];
      tile.presentAnchor.set(
        slot.x + (seededNoise(tile.index, 70) - 0.5) * 0.08,
        slot.y + (seededNoise(tile.index, 71) - 0.5) * 0.06,
        slot.z + (seededNoise(tile.index, 72) - 0.5) * 0.06
      );
    }

    function updateShowcase(dt, t) {
      const usedSlots = new Set();
      const readyIdle = [];
      const presenting = [];
      let approaching = null;
      let retreating = null;
      tiles.forEach((tile) => {
        tile.roleT += dt;
        if (tile.role === "approach") approaching = tile;
        else if (tile.role === "retreat") retreating = tile;
        else if (tile.role === "present") {
          presenting.push(tile);
          if (tile.presentSlot != null) usedSlots.add(tile.presentSlot);
        } else if (tile.role === "idle" && tile.roleT >= tile.roleDuration) {
          readyIdle.push(tile);
        }
        if (tile.presentSlot != null && tile.role !== "idle") usedSlots.add(tile.presentSlot);
      });
      if (approaching && approaching.roleT >= approaching.roleDuration) {
        approaching.role = "present";
        approaching.roleT = 0;
        approaching.roleDuration = Infinity;
        presenting.push(approaching);
        approaching = null;
      }
      if (retreating && retreating.roleT >= retreating.roleDuration) {
        retreating.role = "idle";
        retreating.roleT = 0;
        retreating.roleDuration = 1.2 + Math.random() * 4.5;
        retreating.presentSlot = null;
        retreating = null;
      }
      if (!approaching && !retreating) {
        if (presenting.length < SHOWCASE_MAX_FEATURED) {
          showcaseSwapTimer = 0;
          if (readyIdle.length) {
            const interiorIdle = readyIdle.filter((item) => item.interior);
            const pool = interiorIdle.length ? interiorIdle : readyIdle;
            const tile = pool[Math.floor(Math.random() * pool.length)];
            let slotIndex = 0;
            while (usedSlots.has(slotIndex) && slotIndex < SHOWCASE_MAX_FEATURED) slotIndex += 1;
            if (slotIndex < SHOWCASE_MAX_FEATURED) {
              tile.role = "approach";
              tile.roleT = 0;
              tile.roleDuration = SHOWCASE_APPROACH_S;
              tile.presentSlot = slotIndex;
              assignShowcasePresentAnchor(tile, slotIndex);
            }
          }
        } else {
          showcaseSwapTimer += dt;
          if (showcaseSwapTimer >= SHOWCASE_HOLD_S) {
            showcaseSwapTimer = 0;
            const oldest = presenting.slice().sort((a, b) => b.roleT - a.roleT)[0];
            if (oldest) {
              oldest.role = "retreat";
              oldest.roleT = 0;
              oldest.roleDuration = SHOWCASE_RETREAT_S;
            }
          }
        }
      }
      tiles.forEach((tile) => {
        if (tile.role === "idle") {
          tile.target.position.copy(tile.home.position);
          tile.target.rotation.copy(tile.home.rotation);
          tile.target.scale = tile.home.scale;
          return;
        }
        if (tile.role === "approach") {
          const u = smoothstep(Math.min(1, tile.roleT / SHOWCASE_APPROACH_S));
          tile.target.position.lerpVectors(tile.home.position, tile.presentAnchor, u);
          tile.target.scale = THREE.MathUtils.lerp(tile.home.scale, showcasePresentScale(), u);
          tile.target.rotation.set(
            THREE.MathUtils.lerp(tile.home.rotation.x, 0.04, u),
            THREE.MathUtils.lerp(tile.home.rotation.y, 0, u),
            THREE.MathUtils.lerp(tile.home.rotation.z, 0, u)
          );
          return;
        }
        if (tile.role === "present") {
          tile.target.position.set(
            tile.presentAnchor.x + Math.sin(t * 0.7 + tile.phase) * 0.03,
            tile.presentAnchor.y + Math.cos(t * 0.55 + tile.phase) * 0.04,
            tile.presentAnchor.z
          );
          tile.target.scale = showcasePresentScale();
          tile.target.rotation.set(0.04, 0, 0);
          return;
        }
        if (tile.role === "retreat") {
          const u = smoothstep(Math.min(1, tile.roleT / SHOWCASE_RETREAT_S));
          tile.target.position.lerpVectors(tile.presentAnchor, tile.home.position, u);
          tile.target.scale = THREE.MathUtils.lerp(showcasePresentScale(), tile.home.scale, u);
          tile.target.rotation.x = THREE.MathUtils.lerp(0.04, tile.home.rotation.x, u);
          tile.target.rotation.y = THREE.MathUtils.lerp(0, tile.home.rotation.y, u);
          tile.target.rotation.z = THREE.MathUtils.lerp(0, tile.home.rotation.z, u);
        }
      });
    }

    function relayoutShowcase() {
      const targets = buildAllTargets();
      tiles.forEach((tile, i) => {
        const next = targets[i];
        if (!next) return;
        tile.layer = next.layer || "bg";
        tile.interior = Boolean(next.interior);
        tile.home.position.copy(next.position);
        tile.home.rotation.copy(next.rotation);
        tile.home.scale = next.scale;
        tile.target.position.copy(next.position);
        tile.target.rotation.copy(next.rotation);
        tile.target.scale = next.scale;
        tile.role = "idle";
        tile.roleT = 0;
        tile.roleDuration = 0.4 + Math.random() * 5.5;
        tile.presentSlot = null;
        applySpinForPreset(tile);
      });
    }

    function resize() {
      const { w, h } = viewSize();
      const width = Math.max(2, Math.floor(w));
      const height = Math.max(2, Math.floor(h));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (activePreset === "showcase") relayoutShowcase();
    }

    function pruneRetiredImages() {
      const used = new Set();
      tiles.forEach((tile) => {
        tile.faceSlots.forEach((slot) => {
          if (slot.imageId != null) used.add(slot.imageId);
          if (slot.pendingImage && slot.pendingImage.id != null) used.add(slot.pendingImage.id);
        });
      });
      for (let i = images.length - 1; i >= 0; i -= 1) {
        const img = images[i];
        if (!img.retiring || used.has(img.id)) continue;
        if (img.texture) img.texture.dispose();
        images.splice(i, 1);
      }
    }

    function syncPool(nextPool) {
      const urls = uniqueUrls(nextPool);
      const want = new Set(urls);
      const now = performance.now();
      images.forEach((img) => {
        img.retiring = !want.has(img.url);
      });
      const have = new Set(images.map((img) => img.url));
      urls.forEach((url) => {
        if (have.has(url)) return;
        images.push({
          id: nextImageId++,
          url,
          name: url,
          retiring: false,
          fresh: poolSeeded,
          addedAt: now,
          uses: 0,
        });
      });
      const force = !poolSeeded;
      poolSeeded = true;
      if (liveImages().length) ensureFaceCoverage(force);
      pruneRetiredImages();
    }

    syncPool(pool);
    resize();

    const clock = new THREE.Clock();
    function frame() {
      if (stopped) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const now = performance.now();
      updateFaceTransitions(dt, now);
      coverageTimer += dt;
      if (coverageTimer >= (images.length >= PLENTY_IMAGES ? 0.45 : 1.25)) {
        coverageTimer = 0;
        ensureFaceCoverage(images.length >= PLENTY_IMAGES);
      }
      if (activePreset === "showcase") updateShowcase(dt, t);
      const breathe = Math.sin(t * 0.35) * 0.04;
      if (activePreset === "showcase") {
        const cam = cameraRest();
        group.rotation.set(0, 0, 0);
        group.position.set(0, 0, 0);
        camera.position.x = cam.x + Math.sin(t * 0.08) * (isPortraitView() ? 0.04 : 0.12);
        camera.position.y = cam.y + Math.sin(t * 0.11) * (isPortraitView() ? 0.05 : 0.08);
        camera.position.z = cam.z;
      } else {
        group.rotation.y = Math.sin(t * 0.12) * 0.1;
        group.rotation.x = Math.sin(t * 0.16) * 0.05 + breathe * 0.6;
        group.position.y = Math.sin(t * 0.35) * 0.1;
        camera.position.x = 2.8 + Math.sin(t * 0.12) * 0.35;
        camera.position.y = 1.6 + Math.sin(t * 0.17) * 0.15;
        camera.position.z = 10.5;
      }
      if (activePreset === "showcase") {
        const look = lookAtRest();
        camera.lookAt(look.x, look.y, look.z);
      } else camera.lookAt(0, 0, 0);
      const settle = 1 - Math.exp(-dt * 2.4);
      const wobbleScale = activePreset === "showcase" ? 1.15 : 0.55;
      const baseSpinMul = activePreset === "depth" ? 0.45 : 1;
      tiles.forEach((tile) => {
        tile.current.position.lerp(tile.target.position, settle);
        tile.current.scale += (tile.target.scale - tile.current.scale) * settle;
        tile.current.rotation.x += (tile.target.rotation.x - tile.current.rotation.x) * settle;
        tile.current.rotation.y += (tile.target.rotation.y - tile.current.rotation.y) * settle;
        tile.current.rotation.z += (tile.target.rotation.z - tile.current.rotation.z) * settle;
        let localWobble = wobbleScale;
        if (activePreset === "depth" && tile.layer === "fg") localWobble = 0.7;
        if (activePreset === "depth" && tile.layer === "bg") localWobble = 0.35;
        if (activePreset === "showcase" && tile.role === "present") localWobble = 0.25;
        if (activePreset === "showcase" && tile.role === "idle") localWobble = 1.35;
        if (activePreset === "showcase" && (tile.role === "approach" || tile.role === "retreat")) {
          localWobble = 0.45;
        }
        const ox = Math.sin(t * 0.7 + tile.phase) * 0.02 * localWobble;
        const oy = Math.cos(t * 0.55 + tile.phase * 1.3) * 0.025 * localWobble;
        const oz = Math.sin(t * 0.4 + tile.phase * 0.7) * 0.015 * localWobble;
        tile.mesh.position.set(
          tile.current.position.x + ox,
          tile.current.position.y + oy,
          tile.current.position.z + oz
        );
        tile.mesh.scale.setScalar(tile.current.scale);
        let spinMul = baseSpinMul;
        if (activePreset === "showcase") spinMul = tile.role === "present" ? 1.05 : 0;
        if (spinMul === 0 && activePreset === "showcase") {
          tile.mesh.rotation.copy(tile.current.rotation);
        } else {
          tmpEuler.set(
            tile.current.rotation.x + t * tile.spin.x * spinMul,
            tile.current.rotation.y + t * tile.spin.y * spinMul,
            tile.current.rotation.z + t * tile.spin.z * spinMul
          );
          tile.mesh.rotation.copy(tmpEuler);
        }
      });
      try {
        renderer.render(scene, camera);
      } catch {
        images.forEach((img) => {
          if (img.texture) img.texture.needsUpdate = false;
        });
        tiles.forEach((tile) => {
          tile.faceSlots.forEach((slot) => {
            if (slot.faceTexture) slot.faceTexture.needsUpdate = false;
          });
        });
      }
    }
    renderer.setAnimationLoop(frame);

    let ro = null;
    let resizeTimer = 0;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 100);
      });
      ro.observe(host);
    }

    return {
      stopped: false,
      syncPool,
      dispose() {
        stopped = true;
        renderer.setAnimationLoop(null);
        if (ro) ro.disconnect();
        images.forEach((img) => {
          if (img.texture) img.texture.dispose();
        });
        tiles.forEach((tile) => {
          tile.faceSlots.forEach((slot) => {
            if (slot.faceTexture) slot.faceTexture.dispose();
            if (slot.material && slot.material !== sharedBaseMaterial && slot.material !== sharedBgMaterial) {
              slot.material.dispose();
            }
          });
        });
        geometry.dispose();
        sharedBaseMaterial.dispose();
        sharedBgMaterial.dispose();
        renderer.dispose();
        if (canvas.parentNode) canvas.remove();
        if (vignette.parentNode) vignette.remove();
      },
    };
  }

  root.BGTileField = {
    mount(host, pool) {
      try {
        const theme = host && host.dataset ? host.dataset.theme : "";
        const preset = theme === "depthfield" ? "depth" : "showcase";
        return { field: createScene(host, pool, preset) };
      } catch {
        return { stopped: true };
      }
    },
    tick(root, pool, state) {
      if (state && state.field && state.field.syncPool) state.field.syncPool(pool);
    },
    unmount(root, state) {
      if (state && state.field && state.field.dispose) state.field.dispose();
    },
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
