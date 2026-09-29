/* DrinkDock interactive 3D viewer. Same model code as the product renders. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export async function mountViewer(host, opts = {}) {
  const SCREEN_URL = opts.screen || 'img/product/screen-ui.png';
  try { await document.fonts.load('800 100px Archivo', 'A1 $0123456789'); } catch (e) {}
  const W = () => host.clientWidth, H = () => host.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  // ---------- textures ----------
  function canvasTex(w, h, draw, srgb = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8; return t;
  }
  const LOGO = (g, x, y, s, body, band) => { // can mark, s = height
    const k = s / 30;
    g.fillStyle = body; g.beginPath(); g.roundRect(x + 4 * k, y + 0.6 * k, 14 * k, 3.4 * k, 1.7 * k); g.fill();
    g.beginPath(); g.roundRect(x + 1.5 * k, y + 3 * k, 19 * k, 26 * k, 4.5 * k); g.fill();
    g.fillStyle = band; g.fillRect(x + 1.5 * k, y + 15.2 * k, 19 * k, 4.4 * k);
  };
  const wordmark = canvasTex(1400, 240, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    LOGO(g, 40, 30, 180, '#EEF1F3', '#F2A20C');
    g.fillStyle = '#EEF1F3'; g.textBaseline = 'middle';
    g.font = '800 170px Archivo'; g.fontStretch = 'condensed';
    g.fillText('DrinkDock', 240, h / 2 + 8);
  });
  const screenTex = await new THREE.TextureLoader().loadAsync(SCREEN_URL); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
  const nfcTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#15171a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d9dee3'; g.lineWidth = 12; g.lineCap = 'round';
    [[40, 60], [70, 95], [100, 130]].forEach(([r]) => { g.beginPath(); g.arc(70, 128, r, -0.75, 0.75); g.stroke(); });
  });
  const grilleTex = canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = '#1b1e22'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0c0d0f'; for (let x = 24; x < w - 24; x += 16) g.fillRect(x, 30, 8, h - 60);
  });
  const glareTex = canvasTex(512, 1024, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const grd = g.createLinearGradient(0, 0, w, h * 0.55);
    grd.addColorStop(0.00, 'rgba(255,255,255,0)'); grd.addColorStop(0.30, 'rgba(255,255,255,0)');
    grd.addColorStop(0.40, 'rgba(255,255,255,0.10)'); grd.addColorStop(0.52, 'rgba(255,255,255,0.03)');
    grd.addColorStop(0.60, 'rgba(255,255,255,0.08)'); grd.addColorStop(0.66, 'rgba(255,255,255,0)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  });
  const CANS = [
    { base: '#D9A441', band: '#7A1F1F', word: 'LAGER' },
    { base: '#C9D3DA', band: '#1F3558', word: 'PILS' },
    { base: '#3E8E6A', band: '#F1E6C8', word: 'HAZY IPA' },
    { base: '#9CC84B', band: '#FFFFFF', word: 'LIME SELTZER' },
    { base: '#7FB7E6', band: '#FFFFFF', word: 'VODKA SODA' },
    { base: '#EEF2F4', band: '#138A8A', word: 'SPARKLING' },
    { base: '#C4583A', band: '#F6E7D0', word: 'DRY CIDER' },
    { base: '#E9C23A', band: '#1E5B3A', word: 'MARGARITA' },
    { base: '#2B2F6B', band: '#E9C23A', word: 'LIGHT' },
    { base: '#E57A9A', band: '#FFFFFF', word: 'ROSE SPRITZ' },
  ];
  const canTex = CANS.map(c => canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = c.base; g.fillRect(0, 0, w, h);
    g.fillStyle = c.band; g.fillRect(0, h * 0.58, w, h * 0.14);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, h * 0.1, w, h * 0.03);
    for (const cx of [w * 0.25, w * 0.75]) {
      g.fillStyle = c.band; g.beginPath(); g.arc(cx, h * 0.36, 58, 0, 7); g.fill();
      g.fillStyle = c.base; g.beginPath(); g.arc(cx, h * 0.36, 40, 0, 7); g.fill();
      g.fillStyle = c.band; g.font = '800 44px Archivo'; g.fontStretch = 'condensed'; g.textAlign = 'center';
      g.fillText(c.word, cx, h * 0.84);
    }
  }));

  // ---------- materials ----------
  const M = {
    shell: new THREE.MeshPhysicalMaterial({ color: 0x2b2e33, roughness: 0.42, metalness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.35 }),
    plinth: new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.8 }),
    gloss: new THREE.MeshPhysicalMaterial({ color: 0x0d0f11, roughness: 0.15, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }),
    alu: new THREE.MeshStandardMaterial({ color: 0xb9bec4, roughness: 0.28, metalness: 1 }),
    aluDark: new THREE.MeshStandardMaterial({ color: 0x6d737a, roughness: 0.35, metalness: 1 }),
    coil: new THREE.MeshStandardMaterial({ color: 0x4a5058, roughness: 0.4, metalness: 0.9 }),
    interior: new THREE.MeshStandardMaterial({ color: 0xe9eef2, roughness: 0.6, emissive: 0xf4f7fa, emissiveIntensity: 0.28 }),
    shelf: new THREE.MeshStandardMaterial({ color: 0xd4d9de, roughness: 0.3, metalness: 0.8 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.14, envMapIntensity: 3.2, clearcoat: 1, depthWrite: false }),
    amber: new THREE.MeshStandardMaterial({ color: 0xF2A20C, emissive: 0xF2A20C, emissiveIntensity: 2.2 }),
    amberDim: new THREE.MeshStandardMaterial({ color: 0xF2A20C, emissive: 0xF2A20C, emissiveIntensity: 0.9 }),
    ledWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.5 }),
    screen: new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }),
    black: new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 0.4 }),
    scanWin: new THREE.MeshPhysicalMaterial({ color: 0x101316, roughness: 0.05, clearcoat: 1, metalness: 0.2 }),
    nfc: new THREE.MeshStandardMaterial({ map: nfcTex, roughness: 0.35 }),
    grille: new THREE.MeshStandardMaterial({ map: grilleTex, roughness: 0.7, metalness: 0.2 }),
    word: new THREE.MeshBasicMaterial({ map: wordmark, transparent: true, toneMapped: false }),
    canTop: new THREE.MeshStandardMaterial({ color: 0xc7ccd1, roughness: 0.25, metalness: 1 }),
  };
  const canMats = canTex.map(t => new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.3, metalness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.2 }));

  function box(w, h, d, mat, r = 0) {
    const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 4, r) : new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m;
  }
  function at(m, x, y, z) { m.position.set(x, y, z); return m; }

  function makeCan(matIdx, tall) {
    const g = new THREE.Group();
    const hgt = tall ? 6.2 : 4.83, r = 1.3;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hgt - 0.6, 48, 1, true), canMats[matIdx]);
    body.position.y = hgt / 2; body.castShadow = true; g.add(body);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.86, r, 0.3, 48), M.canTop); top.position.y = hgt - 0.15; g.add(top);
    const bot = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.86, 0.3, 48), M.canTop); bot.position.y = 0.15; g.add(bot);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.05, 48), M.canTop); lid.position.y = hgt; g.add(lid);
    return g;
  }

  // ---------- kiosk ----------
  // spec: {W,H,D, cols:[{type:'cab',w,lanesX,lanesY}|{type:'col',w,screen:[w,h]}]}
  function makeKiosk(spec, opts = {}) {
    const { W, H, D } = spec, g = new THREE.Group();
    const front = D / 2;
    g.add(at(box(W - 2.5, 4, D - 3, M.plinth), 0, 2, -0.5));
    // header with wordmark and amber line
    const hdrH = 7;
    const GY0 = 10, GY1 = H - hdrH - 2.3, midH = GY1 - GY0, midY = (GY0 + GY1) / 2;
    g.add(at(box(W, 6, D, M.shell, 0.8), 0, 7, 0));                    // base block
    g.add(at(box(W, H - GY1, D, M.shell, 0.8), 0, GY1 + (H - GY1) / 2, 0)); // top block
    g.add(at(box(W - 1, midH + 1, 1, M.shell), 0, midY, -D / 2 + 0.5)); // back
    if (spec.cols[0].type === 'cab') g.add(at(box(1.6, midH + 1, D, M.shell, 0.5), -W / 2 + 0.8, midY, 0));
    if (spec.cols[spec.cols.length - 1].type === 'cab') g.add(at(box(1.6, midH + 1, D, M.shell, 0.5), W / 2 - 0.8, midY, 0));
    { let xx = -W / 2; for (const c of spec.cols) { if (c.type === 'col') g.add(at(box(c.w, midH + 1, D, M.shell, 0.5), xx + c.w / 2, midY, 0)); xx += c.w; } }
    g.add(at(box(W - 1.2, hdrH, 0.6, M.gloss, 0.25), 0, H - hdrH / 2 - 0.8, front + 0.05));
    const wmH = 3.2, wmW = wmH * 1400 / 240;
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(wmW, wmH), M.word);
    wm.position.set(-W / 2 + 2.2 + wmW / 2, H - hdrH / 2 - 0.8, front + 0.37); g.add(wm);
    g.add(at(box(W - 3, 0.22, 0.25, M.amber), 0, H - hdrH - 1.25, front + 0.2));
    // bottom grille
    const grl = new THREE.Mesh(new THREE.PlaneGeometry(W - 3, 4.2), M.grille); grl.position.set(0, 7, front + 0.02); g.add(grl);

    let x = -W / 2;
    let doorIndex = 0;
    for (const c of spec.cols) {
      const cx = x + c.w / 2;
      if (c.type === 'cab') {
        const isLast = c === spec.cols[spec.cols.length - 1];
        const gx0 = x + (c.first ? 1.6 : 0.2), gx1 = x + c.w - (isLast ? 1.6 : 0.2);
        const gy0 = GY0, gy1 = GY1;
        const gw = gx1 - gx0, gh = gy1 - gy0, gcx = (gx0 + gx1) / 2, gcy = (gy0 + gy1) / 2;
        // cut-away: interior box that sits in front of the shell face so the opening reads as recessed
        const depth = D - 3;
        const inter = new THREE.Group();
        const back = box(gw, gh, 0.3, M.interior); back.position.set(gcx, gcy, front - depth); inter.add(back);
        const left = box(0.3, gh, depth, M.interior); left.position.set(gx0, gcy, front - depth / 2); inter.add(left);
        const right = box(0.3, gh, depth, M.interior); right.position.set(gx1, gcy, front - depth / 2); inter.add(right);
        const topI = box(gw, 0.3, depth, M.interior); topI.position.set(gcx, gy1, front - depth / 2); inter.add(topI);
        // hide the shell inside the opening: a slightly larger box, pushed forward, forms the frame face
        g.add(inter);
        const rowH = gh / c.lanesY, laneW = gw / c.lanesX;
        for (let r = 0; r < c.lanesY; r++) {
          const y0 = gy0 + r * rowH;
          const sh = box(gw, 0.35, depth, M.shelf); sh.position.set(gcx, y0 + 0.18, front - depth / 2); g.add(sh);
          // price rail on the tray's front lip
          const rowLetter = String.fromCharCode(65 + (c.lanesY - 1 - r));
          const tags = [];
          const led = box(gw - 0.6, 0.12, 0.3, M.ledWhite); led.position.set(gcx, y0 + rowH - 0.35, front - 0.9); g.add(led);
          for (let l = 0; l < c.lanesX; l++) {
            const lx0 = gx0 + l * laneW, lcx = lx0 + laneW / 2;
            const idx = (doorIndex++ + (c.seed || 0)) % CANS.length;
            const tall = (idx % 3 === 2) && rowH > 8.2;
            const deep = Math.floor((depth - 3) / 2.75);
            // spiral coil
            const helixR = 1.62, pitch = 2.75, turns = deep + 0.5;
            const zStart = front - 1.2;
            class Helix extends THREE.Curve { getPoint(u, tgt = new THREE.Vector3()) { const a = u * turns * Math.PI * 2; return tgt.set(lcx + Math.cos(a) * helixR, y0 + 0.36 + helixR + Math.sin(a) * helixR, zStart - u * turns * pitch); } }
            const coil = new THREE.Mesh(new THREE.TubeGeometry(new Helix(), Math.round(turns * 48), 0.075, 8, false), M.coil);
            coil.castShadow = true; g.add(coil);
            for (let d = 0; d < deep; d++) {
              if (opts.gap === doorIndex - 1 && d === 0) continue;
              const cn = makeCan(idx, tall);
              cn.position.set(lcx, y0 + 0.36, zStart - 1.35 - d * pitch);
              cn.rotation.y = (l * 1.3 + d * 0.9 + r) % 6.28;
              g.add(cn);
            }
            tags.push(rowLetter + (l + 1) + '  $' + [7, 8, 9, 8, 9, 3, 8, 10, 6, 9][idx]);
          }
          const tagTex = canvasTex(256 * c.lanesX, 64, (gg, w, h) => {
            gg.fillStyle = '#e8ecef'; gg.fillRect(0, 0, w, h);
            gg.fillStyle = '#c9d0d6'; for (let i = 1; i < c.lanesX; i++) gg.fillRect(256 * i - 1, 8, 2, h - 16);
            gg.font = '800 38px Archivo'; gg.fontStretch = 'condensed'; gg.fillStyle = '#15181b'; gg.textAlign = 'center'; gg.textBaseline = 'middle';
            tags.forEach((s, i) => gg.fillText(s, 256 * i + 128, h / 2 + 2));
          });
          const lip = new THREE.Mesh(new THREE.PlaneGeometry(gw - 0.4, 0.95), new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.5 }));
          lip.position.set(gcx, y0 - 0.25, front - 0.2); g.add(lip);
        }
        // one glass window with an aluminum frame
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), M.glass); pane.position.set(gcx, gcy, front + 0.3); pane.renderOrder = 2; g.add(pane);
        const fz0 = front + 0.3;
        g.add(at(box(0.7, gh + 1.2, 0.5, M.alu), gx0 - 0.05, gcy, fz0));
        g.add(at(box(0.7, gh + 1.2, 0.5, M.alu), gx1 + 0.05, gcy, fz0));
        // soft diagonal glare across the glass
        const glare = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), new THREE.MeshBasicMaterial({ map: glareTex, transparent: true, depthWrite: false, toneMapped: false }));
        glare.position.set(gcx, gcy, front + 0.42); glare.renderOrder = 3; g.add(glare);
        // frame face around the glass: four bars flush with the front
        const fz = front + 0.08;
        g.add(at(box(gw + 1.2, 0.6, 0.4, M.aluDark), gcx, gy1 + 0.3, fz));
        g.add(at(box(gw + 1.2, 0.6, 0.4, M.aluDark), gcx, gy0 - 0.3, fz));
      } else {
        // guest column: satin face, screen, scanner, reader
        const face = box(c.w - 1.2, H - hdrH - 8.5, 0.5, M.gloss, 0.3);
        face.position.set(cx, 8.8 + (H - hdrH - 8.5) / 2 - 0.3, front + 0.1); g.add(face);
        const [sw, shh] = c.screen, scy = H - hdrH - 3.5 - shh / 2;
        g.add(at(box(sw + 0.9, shh + 0.9, 0.35, M.black, 0.35), cx, scy, front + 0.45));
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(sw, shh), M.screen); scr.position.set(cx, scy, front + 0.64); g.add(scr);
        const cover = new THREE.Mesh(new THREE.PlaneGeometry(sw + 0.8, shh + 0.8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, roughness: 0.02, clearcoat: 1, envMapIntensity: 2, depthWrite: false }));
        cover.position.set(cx, scy, front + 0.66); g.add(cover);
        // ID scanner: angled tray with window and amber light bar
        const sy = scy - shh / 2 - 4.2;
        const tray = box(c.w - 3.4, 2.6, 2.2, M.black, 0.4); tray.position.set(cx, sy, front + 1.2); tray.rotation.x = -0.35; g.add(tray);
        const win = box(c.w - 4.6, 1.2, 0.1, M.scanWin); win.position.set(cx, sy + 0.15, front + 2.35); win.rotation.x = -0.35; g.add(win);
        const bar = box(c.w - 4.6, 0.18, 0.1, M.amber); bar.position.set(cx, sy + 1.12, front + 2.0); bar.rotation.x = -0.35; g.add(bar);
        // contactless reader
        const ry = sy - 5.2;
        g.add(at(box(4.6, 4.6, 0.9, M.black, 0.6), cx, ry, front + 0.75));
        const nfc = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), M.nfc); nfc.position.set(cx, ry, front + 1.21); g.add(nfc);
        // pickup port: an open, lit bay where the drink is delivered
        const pw = c.w - 3.2, ph = 7.2, pd = 3.6, py = 17.5, pz = front + 0.35;
        g.add(at(box(pw + 1.4, ph + 1.4, 0.5, M.black, 0.4), cx, py, front + 0.2));
        g.add(at(box(pw, 0.5, pd, M.shell), cx, py - ph / 2, pz + pd / 2));
        g.add(at(box(pw, 0.5, pd, M.shell), cx, py + ph / 2, pz + pd / 2));
        g.add(at(box(0.5, ph, pd, M.shell), cx - pw / 2, py, pz + pd / 2));
        g.add(at(box(0.5, ph, pd, M.shell), cx + pw / 2, py, pz + pd / 2));
        const bayBack = new THREE.Mesh(new THREE.PlaneGeometry(pw - 0.4, ph - 0.4), new THREE.MeshStandardMaterial({ color: 0x2a2012, emissive: 0xF2A20C, emissiveIntensity: opts.dispensed ? 0.55 : 0.18, roughness: 0.6 }));
        bayBack.position.set(cx, py, pz + 0.05); g.add(bayBack);
        g.add(at(box(pw - 0.6, 0.12, 0.2, M.amber), cx, py + ph / 2 - 0.5, pz + pd - 0.3));
        if (opts.dispensed) { const cn = makeCan(3, false); cn.position.set(cx, py - ph / 2 + 0.25, pz + 1.7); cn.rotation.y = 0.6; g.add(cn); }
        const flap = new THREE.Mesh(new THREE.PlaneGeometry(pw - 0.2, ph * 0.55), new THREE.MeshPhysicalMaterial({ color: 0x111316, transparent: true, opacity: opts.dispensed ? 0.25 : 0.55, roughness: 0.1, clearcoat: 1, depthWrite: false }));
        flap.position.set(cx, py + ph / 2 - ph * 0.275, pz + pd - 0.05); flap.renderOrder = 2; g.add(flap);
        // key switch on the outer side
        if (c.side) {
          const ks = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 32), M.alu);
          ks.rotation.z = Math.PI / 2; ks.position.set((c.side > 0 ? W / 2 + 0.2 : -W / 2 - 0.2), sy + 2, front - 4); g.add(ks);
        }
      }
      x += c.w;
    }
    return g;
  }

  const SPECS = {
    one: { W: 36, H: 78, D: 30, cols: [{ type: 'cab', w: 25, lanesX: 4, lanesY: 6, first: true }, { type: 'col', w: 11, screen: [8.2, 12.76], side: 1 }] },
    duo: { W: 62, H: 80, D: 32, cols: [{ type: 'col', w: 11, screen: [8.2, 12.76], side: -1 }, { type: 'cab', w: 40, lanesX: 7, lanesY: 6, seed: 3 }, { type: 'col', w: 11, screen: [8.2, 12.76], side: 1 }] },
    compact: { W: 24, H: 72, D: 26, cols: [{ type: 'cab', w: 15, lanesX: 3, lanesY: 5, first: true, seed: 5 }, { type: 'col', w: 9, screen: [6.6, 10.27], side: 1 }] },
  };


  // ---------- staging ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.ShadowMaterial({ opacity: 0.3 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-70, 260, 150); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 8; key.shadow.bias = -0.0006;
  Object.assign(key.shadow.camera, { left: -90, right: 90, top: 120, bottom: -40, near: 10, far: 600 });
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe7ff, 0.55); fill.position.set(160, 90, 120); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffe2b8, 1.1); rim.position.set(80, 150, -200); scene.add(rim);
  const rimL = new THREE.DirectionalLight(0xdfe6f0, 0.9); rimL.position.set(-220, 120, -80); scene.add(rimL);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.35));
  const glow = new THREE.PointLight(0xf6f9ff, 1800, 70, 2); scene.add(glow);

  const cam = new THREE.PerspectiveCamera(22, W() / H(), 1, 3000);
  const controls = new OrbitControls(cam, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.enableZoom = false; controls.minPolarAngle = 0.35; controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.autoRotate = !opts.reduced; controls.autoRotateSpeed = 0.8;
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    controls.enableRotate = false; renderer.domElement.style.touchAction = 'pan-y';
  } else {
    renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; }, { once: true });
  }

  let current = null;
  function show(model) {
    if (current) { scene.remove(current); current.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    const spec = SPECS[model];
    current = makeKiosk(spec, { dispensed: true, gap: 13 });
    scene.add(current);
    glow.position.set(-4, 40, 6);
    const d = Math.max(spec.W * 3.4, spec.H * 3.2);
    cam.position.set(-d * 0.42, spec.H * 0.78, d * 0.9);
    controls.target.set(0, spec.H * 0.5, 0);
    controls.minDistance = d * 0.35; controls.maxDistance = d * 1.4;
    controls.update();
  }
  show(opts.model || 'one');
  function resize() { renderer.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(host);
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  renderer.setAnimationLoop(() => { if (!visible) return; controls.update(); renderer.render(scene, cam); });
  return { show };
}
