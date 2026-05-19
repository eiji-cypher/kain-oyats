/* ===== SCENE MANAGER ===== */
window.SceneManager = {
  scene: null,
  renderer: null,
  clock: null,
  activeTool: null,
  ghostMesh: null,
  raycaster: null,
  mouse: null,
  floorMesh: null,
  gridHelper: null,
  composer: null,
  frameId: null,
  loader: null,
  toolRotation: 0,
  constructionSlots: [],
  hoveredSlot: null,
  trashMeshes: [],
  navGrid: [], // 0 = walkable, 1 = blocked
  rainParticles: null,
  staffDoorHinge: null,
  staffDoorOpen: false,
  _prevStaffDoorOpen: false,
  securityCameraMeshes: [],
  surveillanceCameraPositions: [], 
  fullSign: null,
  achievementPosters: [],
  wallMeshes: [],
  trophyCaseMesh: null,
  zones: [
    // Dining area: center of room, away from counter and kitchen
    { name: 'Dining Area', xMin: -7, xMax: 7, zMin: -4, zMax: 3, allowedTools: ['pc'], color: 0xf5c842 },
  ],
  serverRackMesh: null,
  
  // Centralized Asset Cleanup
  disposeObject(obj) {
    if (!obj) return;
    obj.traverse(node => {
      if (node.isMesh) {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach(m => this.disposeMaterial(m));
          } else {
            this.disposeMaterial(node.material);
          }
        }
      }
    });
  },
  disposeMaterial(mat) {
    if (mat.map) mat.map.dispose();
    if (mat.lightMap) mat.lightMap.dispose();
    if (mat.bumpMap) mat.bumpMap.dispose();
    if (mat.normalMap) mat.normalMap.dispose();
    if (mat.specularMap) mat.specularMap.dispose();
    if (mat.envMap) mat.envMap.dispose();
    mat.dispose();
  },

  init() {
    if (this.renderer) return;

    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });

    this.scene = new THREE.Scene();
    // NO FOG — clear warm carinderia interior
    this.scene.fog = null;

    this.loadingManager = new THREE.LoadingManager();
    this.loadingManager.onProgress = (url, loaded, total) => {
      const pct = Math.floor((loaded / total) * 100);
      const bar = document.getElementById('preload-bar');
      const txt = document.getElementById('preload-text');
      if (bar) bar.style.width = pct + '%';
      if (txt) txt.textContent = 'LOADING... ' + pct + '%';
    };
    this.loadingManager.onLoad = () => {
      const txt = document.getElementById('preload-text');
      if (txt) txt.textContent = 'READY!';
    };

    this.loader = new (THREE.GLTFLoader || window.GLTFLoader)(this.loadingManager);
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.resetTrackingArrays();
    this.initNavGrid();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0xf0dfc0);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.composer = null;

    window.addEventListener('resize', () => this.onResize());
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('click', (e) => this.onCanvasClick(e));

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR' && this.activeTool) { this.toolRotation += Math.PI / 4; showToast('Rotated', 'info'); }
      if (e.code === 'Escape') { setTool(null); }
      if (e.code === 'KeyE') { this.interactInPerson(); }
    });

    this.animate();
  },

  resetTrackingArrays() {
    this.wallMeshes = [];
    this.achievementPosters = [];
    this.securityCameraMeshes = [];
    this.trashMeshes = [];
    this.constructionSlots = [];
  },

  rebuildFullScene() {
    this.resetScene();
    this.preloadEssentialAssets();
    this.buildRoom();
    this.buildRoomStaticElements();
    this.addConstructionSlots();
    this.addDynamicSceneElements();
    this.rebuildStateObjects();

    this.updateVisualTheme();
    this.updateWeatherVisuals(GameState.weather);
    if (GameState.upgrades.pancitCooker) document.getElementById('btn-pancit')?.classList.remove('hidden');
    GameState.trash.forEach(t => this.spawnTrashVisual(t));
  },

  preloadEssentialAssets() {
    // Preload common textures/models here to prevent popping
    const texLoader = new THREE.TextureLoader(this.loadingManager);
    // Example: this.assets.noiseTex = texLoader.load('path/to/texture.jpg');
    
    // Add any GLB models here as well:
    // this.loader.load('models/pc_high.glb', (gltf) => { this.assets.pcHigh = gltf.scene; });
  },

  rebuildStateObjects() {
    const savedPCs = [...GameState.pcs];
    const savedStaff = [...GameState.staff];
    GameState.pcs = [];
    GameState.staff = [];
    
    savedPCs.forEach(p => this.placePCAt(p.x, p.z, p.quality, p.broken, p.rotation, p.type, p.underMaintenance));
    savedStaff.forEach(s => StaffSystem.restoreStaff(s));
  },

  resetScene() {
    if (!this.scene) return;
    const toRemove = this.scene.children.filter(obj => !obj.isLight);
    toRemove.forEach(obj => {
      obj.traverse(node => {
        if (node.isMesh) {
          if (node.geometry) node.geometry.dispose();
          if (node.material) {
            if (Array.isArray(node.material)) node.material.forEach(m => { if(m.map) m.map.dispose(); m.dispose(); });
            else { if(node.material.map) node.material.map.dispose(); node.material.dispose(); }
          }
        }
      });
      this.scene.remove(obj);
    });
    this.constructionSlots = [];
    this.trashMeshes = [];
    this.wallMeshes = [];
    this.securityCameraMeshes = [];
    this.trophyCaseMesh = null;
    this.serverRackMesh = null;
    this.fullSign = null;
    this.achievementPosters = [];
    this.initNavGrid();
    // Re-block static table in nav grid as it's not re-added during resetScene
    for(let x = 2; x <= 12; x++) {
      for(let z = 12; z <= 15; z++) this.updateNavGrid(x, z, false);
    }
  },

  buildRoom() {
    // ── Warm terracotta tile floor ──
    const floorTex = this.createCanvasTexture((ctx, size) => {
      const tile = size / 8;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? '#c8845a' : '#b5724c';
          ctx.fillRect(col * tile, row * tile, tile, tile);
          ctx.strokeStyle = 'rgba(60,30,10,0.35)';
          ctx.lineWidth = 2;
          ctx.strokeRect(col * tile + 1, row * tile + 1, tile - 2, tile - 2);
        }
      }
    });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xd4956a, map: floorTex, roughness: 0.92, metalness: 0.0 });
    this.floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.receiveShadow = true;
    this.floorMesh.name = 'floor';
    this.scene.add(this.floorMesh);

    // ── Walls — muted warm cream, NO emissive, low roughness ──
    // Using MeshLambertMaterial to avoid over-bright specular highlights
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xe8d5b0 });

    const wallBack  = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 0.3), wallMat);
    wallBack.position.set(0, 2, -9);
    wallBack.receiveShadow = true;
    this.scene.add(wallBack);

    const wallLeft  = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 18), wallMat);
    wallLeft.position.set(-9, 2, 0);
    wallLeft.receiveShadow = true;
    this.scene.add(wallLeft);
    this.wallMeshes.push(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 18), wallMat);
    wallRight.position.set(9, 2, 0);
    wallRight.receiveShadow = true;
    this.scene.add(wallRight);
    this.wallMeshes.push(wallRight);

    // Front wall with door opening — two side panels, no center (door gap)
    const frontMat = new THREE.MeshLambertMaterial({ color: 0xe8d5b0 });
    const frontLeft  = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4, 0.3), frontMat);
    frontLeft.position.set(-5.75, 2, 9);
    frontLeft.receiveShadow = true;
    this.scene.add(frontLeft);

    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4, 0.3), frontMat);
    frontRight.position.set(5.75, 2, 9);
    frontRight.receiveShadow = true;
    this.scene.add(frontRight);

    // Door header above opening
    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 0.3), frontMat);
    doorHeader.position.set(0, 3.6, 9);
    this.scene.add(doorHeader);

    // Door frame (wooden)
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x6b3a1f });
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.35), frameMat);
    frameL.position.set(-2.4, 1.6, 9); this.scene.add(frameL);
    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.35), frameMat);
    frameR.position.set(2.4, 1.6, 9); this.scene.add(frameR);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(5, 0.18, 0.35), frameMat);
    frameTop.position.set(0, 3.2, 9); this.scene.add(frameTop);

    // ── FRONT COUNTER near entrance (z = 5.5) ──
    const counterBodyMat = new THREE.MeshLambertMaterial({ color: 0x7a4f2e });
    const counterTopMat  = new THREE.MeshLambertMaterial({ color: 0xc49a5a });

    const counterBody = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, 1.2), counterBodyMat);
    counterBody.position.set(0, 0.45, 5.5);
    counterBody.castShadow = true;
    this.scene.add(counterBody);

    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 1.3), counterTopMat);
    counterTop.position.set(0, 0.95, 5.5);
    counterTop.castShadow = true;
    this.scene.add(counterTop);

    // Stainless food trays on counter
    const trayMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.75, roughness: 0.25 });
    const foodColors = [0xc0392b, 0xe67e22, 0x27ae60, 0xf39c12, 0x8e44ad];
    [-5.5, -3, -0.5, 2, 4.5].forEach((x, i) => {
      const tray = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.07, 0.65), trayMat);
      tray.position.set(x, 1.03, 5.45);
      this.scene.add(tray);
      const food = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.5),
        new THREE.MeshLambertMaterial({ color: foodColors[i % foodColors.length] }));
      food.position.set(x, 1.08, 5.45);
      this.scene.add(food);
    });

    // Rice cooker on counter
    const rcMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.3, roughness: 0.6 });
    const rc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.38, 12), rcMat);
    rc.position.set(6.2, 1.19, 5.4); this.scene.add(rc);
    const rcLid = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.06, 12), rcMat);
    rcLid.position.set(6.2, 1.41, 5.4); this.scene.add(rcLid);

    // ── Entrance sign above door ──
    const signTex = this.createCanvasTexture((ctx, size) => {
      ctx.fillStyle = '#8b1a1a';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ffd37a';
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(GameState.cafeName || 'KANTO KAIN', size / 2, size / 2 + 10);
      ctx.font = '30px sans-serif';
      ctx.fillStyle = '#ffe8b0';
      ctx.fillText('Lutong Bahay • Merienda', size / 2, size / 2 + 55);
    }, 512);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 1.0),
      new THREE.MeshLambertMaterial({ map: signTex })
    );
    sign.position.set(0, 3.55, 8.84);
    this.scene.add(sign);
    this.fullSign = sign;

    // ── Washing area (back left corner) ──
    const sinkMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, metalness: 0.55, roughness: 0.4 });
    const sink = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 0.85), sinkMat);
    sink.position.set(-7.2, 0.425, -7.8);
    this.scene.add(sink);
    const basin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.6), sinkMat);
    basin.position.set(-7.2, 0.88, -7.8);
    this.scene.add(basin);

    // ── Manager desk (back right, always present) ──
    const deskMat = new THREE.MeshLambertMaterial({ color: 0x5c3d1e });
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 0.9), deskMat);
    desk.position.set(7, 0.375, -7.2);
    desk.castShadow = true;
    this.scene.add(desk);

    // ── Electric fan (corner) ──
    const fanMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    const fanPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.9, 8), fanMat);
    fanPole.position.set(-7.8, 0.45, 7.5);
    this.scene.add(fanPole);
    const fanHead = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.07, 16),
      new THREE.MeshLambertMaterial({ color: 0x555555, transparent: true, opacity: 0.65 }));
    fanHead.rotation.x = Math.PI / 2;
    fanHead.position.set(-7.8, 0.95, 7.5);
    this.scene.add(fanHead);

    // ── Nav grid: block counter row and walls ──
    for (let x = -9; x <= 9; x++) this.updateNavGrid(x, 5, false);  // counter
    for (let z = -9; z <= 9; z++) this.updateNavGrid(-9, z, false); // left wall
    for (let z = -9; z <= 9; z++) this.updateNavGrid(9, z, false);  // right wall
    for (let x = -9; x <= 9; x++) this.updateNavGrid(x, -9, false); // back wall
    // Door opening is walkable (x -2 to 2, z 9)
    for (let x = -2; x <= 2; x++) this.updateNavGrid(x, 9, true);
  },

  initNavGrid() {
    // 30x30 world mapped to 60x60 grid for high-fidelity collision
    this.navGrid = Array.from({length: 61}, () => new Int8Array(61).fill(0));
  },

  updateNavGrid(worldX, worldZ, walkable, radius = 1) {
    // Convert world (-15 to 15) to grid (0 to 60)
    const gx = Math.round((worldX + 15) * 2);
    const gz = Math.round((worldZ + 15) * 2);
    
    for(let i = -radius; i <= radius; i++) {
      for(let j = -radius; j <= radius; j++) {
        const nx = gx + i, nz = gz + j;
        if (nx >= 0 && nx <= 60 && nz >= 0 && nz <= 60) {
          this.navGrid[nx][nz] = walkable ? 0 : 1;
        }
      }
    }
  },

  getPath(startPos, endPos) {
    const start = { x: Math.round((startPos.x + 15) * 2), z: Math.round((startPos.z + 15) * 2) };
    const end = { x: Math.round((endPos.x + 15) * 2), z: Math.round((endPos.z + 15) * 2) };

    // A* Lite Implementation
    const queue = [[start]];
    const visited = new Set();
    visited.add(`${start.x},${start.z}`);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current.x === end.x && current.z === end.z) {
        return path.map(p => new THREE.Vector3(p.x - 15, 0.65, p.z - 15));
      }

      const neighbors = [
        { x: current.x + 1, z: current.z }, { x: current.x - 1, z: current.z },
        { x: current.x, z: current.z + 1 }, { x: current.x, z: current.z - 1 }
      ];

      for (const n of neighbors) {
        if (n.x >= 0 && n.x <= 30 && n.z >= 0 && n.z <= 30) {
          if (!visited.has(`${n.x},${n.z}`) && (this.navGrid[n.x][n.z] === 0 || (n.x === end.x && n.z === end.z))) {
            visited.add(`${n.x},${n.z}`);
            queue.push([...path, n]);
          }
        }
      }
      if (queue.length > 500) break; // Safety break for unreachable targets
    }
    return [new THREE.Vector3(endPos.x, 0.65, endPos.z)]; // Fallback to direct line if pathfinding fails
  },

  buildRoomStaticElements() {
    this.buildLighting();
    this.decorateCarinderiaScene();
    this.addParticles();
  },

  addNeonStrip(pos, rot, color) {
    const geo = new THREE.BoxGeometry(28, 0.1, 0.05);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.rotation.copy(rot);
    this.scene.add(mesh);

    const light = new THREE.PointLight(color, 0.4, 12);
    light.position.copy(pos);
    this.scene.add(light);
  },

  createCanvasTexture(drawFn, size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  },

  decorateCarinderiaScene() {
    const existing = this.scene.getObjectByName('carinderia_decor');
    if (existing) this.scene.remove(existing);
    const decor = new THREE.Group();
    decor.name = 'carinderia_decor';
    this.ceilingFanBlades = [];

    // ── Menu board on back wall ──
    const menuTex = this.createCanvasTexture((ctx, size) => {
      ctx.fillStyle = '#1a0a00';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#f5c842';
      ctx.font = 'bold 52px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MENU NGAYON', size / 2, 58);
      ctx.fillStyle = '#ffe8b0';
      ctx.font = '24px sans-serif';
      const items = ['Adobo ₱55','Sinigang ₱65','Sisig ₱60','Pancit ₱45',
                     'Tapsilog ₱55','Halo-Halo ₱40','Lechon Kawali ₱80','Tinola ₱55'];
      items.forEach((item, i) => ctx.fillText(item, size / 2, 108 + i * 50));
    });
    const menuBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 2.8),
      new THREE.MeshLambertMaterial({ map: menuTex })
    );
    menuBoard.position.set(0, 2.4, -8.84);
    decor.add(menuBoard);

    // ── Jeepney-inspired color stripe (low on wall, not emissive) ──
    const stripe1 = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.22, 0.04),
      new THREE.MeshLambertMaterial({ color: 0xb71c1c })
    );
    stripe1.position.set(0, 0.55, -8.83);
    decor.add(stripe1);
    const stripe2 = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.12, 0.04),
      new THREE.MeshLambertMaterial({ color: 0xf9a825 })
    );
    stripe2.position.set(0, 0.8, -8.83);
    decor.add(stripe2);

    // ── Paintings on walls (loaded from /paintings/) ──
    this._loadPaintings(decor);

    // ── Ceiling fan ──
    const fanGroup = new THREE.Group();
    fanGroup.position.set(0, 3.75, -1);
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.14, 10),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
    );
    hub.rotation.x = Math.PI / 2;
    fanGroup.add(hub);
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.88, 0.04, 0.16),
        new THREE.MeshLambertMaterial({ color: 0xc49a5a })
      );
      blade.position.x = 0.48;
      blade.rotation.z = i * (Math.PI / 2);
      blade.userData.speed = 1.4;
      fanGroup.add(blade);
      this.ceilingFanBlades.push(blade);
    }
    decor.add(fanGroup);

    // ── Steam particles above kitchen ──
    const steamGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      sp[i*3]   = -2 + Math.random() * 4;
      sp[i*3+1] = 1 + Math.random() * 1.5;
      sp[i*3+2] = -6 + Math.random() * 2;
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.steamParticles = new THREE.Points(steamGeo,
      new THREE.PointsMaterial({ color: 0xfff0db, size: 0.07, transparent: true, opacity: 0.22, depthWrite: false })
    );
    this.steamParticles.name = 'steamParticles';
    decor.add(this.steamParticles);

    // ── Rainy street outside view ──
    const outsideTex = this.createCanvasTexture((ctx, size) => {
      const g = ctx.createLinearGradient(0, 0, 0, size);
      g.addColorStop(0, '#1a2a3a'); g.addColorStop(1, '#0d1520');
      ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#2a3a4a';
      for (let i = 0; i < 8; i++) {
        const bw = 20 + Math.random() * 30, bh = 60 + Math.random() * 120;
        const bx = Math.random() * (size - bw), by = size * 0.3 + Math.random() * (size * 0.5);
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#f5c842'; ctx.fillRect(bx + 4, by + 10, bw - 8, 4);
        ctx.fillStyle = '#2a3a4a';
      }
      ctx.strokeStyle = 'rgba(150,200,255,0.25)'; ctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        const rx = Math.random() * size, ry = Math.random() * size;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + 2, ry + 14); ctx.stroke();
      }
    });
    const outside = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 7),
      new THREE.MeshLambertMaterial({ map: outsideTex })
    );
    outside.position.set(0, 2.2, -11);
    decor.add(outside);

    this.scene.add(decor);
  },

  // Paintings on RIGHT wall only (x = +8.82), facing inward
  _loadPaintings(decor) {
    const loader = new THREE.TextureLoader();
    const slots = [
      { pos: new THREE.Vector3(8.82, 2.4, -5),  rotY: -Math.PI / 2 },
      { pos: new THREE.Vector3(8.82, 2.4, -2),  rotY: -Math.PI / 2 },
      { pos: new THREE.Vector3(8.82, 2.4,  1),  rotY: -Math.PI / 2 },
      { pos: new THREE.Vector3(8.82, 2.4,  4),  rotY: -Math.PI / 2 },
      { pos: new THREE.Vector3(8.82, 2.4,  7),  rotY: -Math.PI / 2 },
    ];
    slots.forEach((slot, i) => {
      const frameMat = new THREE.MeshLambertMaterial({ color: 0x5c3d1e });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.15, 0.06), frameMat);
      frame.position.copy(slot.pos);
      frame.rotation.y = slot.rotY;
      decor.add(frame);

      const canvasMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.3, 0.9),
        new THREE.MeshLambertMaterial({ color: 0xddccaa })
      );
      canvasMesh.position.copy(slot.pos);
      canvasMesh.position.x -= 0.04; // offset inward from wall
      canvasMesh.rotation.y = slot.rotY;
      decor.add(canvasMesh);

      const idx = String(i + 1).padStart(2, '0');
      loader.load(
        'paintings/painting_' + idx + '.jpg',
        (tex) => { canvasMesh.material.map = tex; canvasMesh.material.needsUpdate = true; },
        undefined,
        () => {}
      );
    });
  },

  addDynamicSceneElements() {
    if (GameState.upgrades.serverRack    && !this.scene.getObjectByName('server_rack'))    this.addServerRack();
    if (GameState.upgrades.coffeeMachine && !this.scene.getObjectByName('coffee_machine')) this.addCoffeeStation();
    if (GameState.upgrades.snackbar      && !this.scene.getObjectByName('snack_bar'))      this.addSnackBar();
    if (GameState.upgrades.neon          && !this.scene.getObjectByName('neon_signs'))     this.addNeonSigns();
    if (GameState.upgrades.lighting      && !this.scene.getObjectByName('led_lights'))     this.addLEDLights();
    if (GameState.upgrades.pisonetMode   && !this.scene.getObjectByName('merienda_corner'))this.addMeriendaCorner();
    if (GameState.upgrades.staffLounge   && !this.scene.getObjectByName('staff_lounge'))   this.addStaffLounge();
    if (GameState.upgrades.deliveryBox   && !this.scene.getObjectByName('delivery_box'))   this.addDeliveryBox();
    if (GameState.upgrades.securityCameras && !this.scene.getObjectByName('security_cam')) this.addSecurityCamera();

    // Room expansions
    const rooms = GameState.upgrades.expansionRooms || [];
    if (rooms.includes('dining_ext')     && !this.scene.getObjectByName('dining_ext'))     this.addDiningExtension();
    if (rooms.includes('kitchen_ext')    && !this.scene.getObjectByName('kitchen_ext'))    this.addKitchenExtension();
    if (rooms.includes('accountant_room')&& !this.scene.getObjectByName('accountant_room'))this.addAccountantRoom();
    if (rooms.includes('vip_room')       && !this.scene.getObjectByName('vip_room'))       this.addVIPRoom();

    // Level-gated
    if (GameState.level >= 2  && !this.scene.getObjectByName('manager_office')) this.addManagerOffice();
    if (GameState.level >= 15 && !this.scene.getObjectByName('trophy_case'))    this.addTrophyCase();

    this.updateHallOfFame();
  },

  addServerRack() {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.4), new THREE.MeshLambertMaterial({ color: 0x5c3d1e }));
    shelf.position.set(-6, 0.9, -8.6);
    shelf.name = 'server_rack';
    shelf.castShadow = true;
    this.scene.add(shelf);
    // Shelves
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.35), new THREE.MeshLambertMaterial({ color: 0x8b6340 }));
      s.position.set(-6, 0.3 + i * 0.55, -8.6);
      this.scene.add(s);
    }
    showToast('Inventory Ledger installed!', 'success');
  },

  addCoffeeStation() {
    if (this.scene.getObjectByName('coffee_machine')) return;
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.6), new THREE.MeshLambertMaterial({ color: 0x7a4f2e }));
    stand.position.set(5.5, 0.5, 4.2);
    stand.name = 'coffee_machine';
    stand.castShadow = true;
    this.scene.add(stand);
    const dispenser = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.55, 10), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5, roughness: 0.4 }));
    dispenser.position.set(5.5, 1.28, 4.2);
    this.scene.add(dispenser);
    // Warm glow light
    const light = new THREE.PointLight(0xff9944, 0.3, 3);
    light.position.set(5.5, 1.6, 4.2);
    this.scene.add(light);
  },

  addSnackBar() {
    const g = new THREE.Group();
    g.name = 'snack_bar';
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 0.7), new THREE.MeshLambertMaterial({ color: 0x8b6340 }));
    counter.position.set(-4, 0.425, 4.5);
    counter.castShadow = true;
    g.add(counter);
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.06, 0.75), new THREE.MeshLambertMaterial({ color: 0xc49a5a }));
    top.position.set(-4, 0.88, 4.5);
    g.add(top);
    // Snack items on counter
    ['#e74c3c','#f39c12','#27ae60'].forEach((col, i) => {
      const item = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.25), new THREE.MeshLambertMaterial({ color: parseInt(col.replace('#','0x')) }));
      item.position.set(-4.6 + i * 0.6, 1.03, 4.5);
      g.add(item);
    });
    this.scene.add(g);
    showToast('Snack Bar built!', 'success');
  },

  addNeonSigns() {
    const g = new THREE.Group();
    g.name = 'neon_signs';
    // Neon sign above counter
    const signTex = this.createCanvasTexture((ctx, size) => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#ff6a3d';
      ctx.lineWidth = 8;
      ctx.font = 'bold 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff6a3d';
      ctx.shadowColor = '#ff6a3d';
      ctx.shadowBlur = 20;
      ctx.fillText('OPEN', size/2, size/2 + 28);
    }, 256);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.7), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(-3, 2.8, 8.8);
    g.add(sign);
    const neonLight = new THREE.PointLight(0xff6a3d, 0.5, 5);
    neonLight.position.set(-3, 2.8, 8.5);
    g.add(neonLight);
    this.scene.add(g);
    showToast('Neon Signs installed!', 'success');
  },

  addLEDLights() {
    const g = new THREE.Group();
    g.name = 'led_lights';
    // LED strip along ceiling perimeter
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xfff5cc });
    [[-8.5, 3.8, 0, 0, 0, 0], [8.5, 3.8, 0, 0, 0, 0], [0, 3.8, -8.5, 0, Math.PI/2, 0], [0, 3.8, 8.5, 0, Math.PI/2, 0]].forEach(([x,y,z,rx,ry,rz]) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 17), stripMat);
      strip.position.set(x, y, z);
      strip.rotation.set(rx, ry, rz);
      g.add(strip);
    });
    // Extra warm fill lights
    [-6, 0, 6].forEach(x => {
      const pt = new THREE.PointLight(0xfff5cc, 0.18, 8);
      pt.position.set(x, 3.6, 0);
      g.add(pt);
    });
    this.scene.add(g);
    showToast('LED Lighting installed!', 'success');
  },

  addMeriendaCorner() {
    const g = new THREE.Group();
    g.name = 'merienda_corner';
    // Small corner table with snacks
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 1.0), new THREE.MeshLambertMaterial({ color: 0x8b6340 }));
    table.position.set(-7.5, 0.375, 3.5);
    table.castShadow = true;
    g.add(table);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.1), new THREE.MeshLambertMaterial({ color: 0xc49a5a }));
    top.position.set(-7.5, 0.78, 3.5);
    g.add(top);
    // Snack display
    const display = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.3), new THREE.MeshStandardMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6 }));
    display.position.set(-7.5, 1.07, 3.5);
    g.add(display);
    // Sign
    const signTex = this.createCanvasTexture((ctx, size) => {
      ctx.fillStyle = '#8b1a1a';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ffd37a';
      ctx.font = 'bold 60px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MERIENDA', size/2, size/2 - 10);
      ctx.font = '30px sans-serif';
      ctx.fillText('Snacks & Kakanin', size/2, size/2 + 40);
    }, 256);
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshLambertMaterial({ map: signTex }));
    signMesh.position.set(-7.5, 1.6, 3.2);
    g.add(signMesh);
    this.scene.add(g);
    // Block nav around merienda corner
    this.updateNavGrid(-7.5, 3.5, false, 2);
    showToast('Merienda Corner built!', 'success');
  },

  addStaffLounge() {
    const g = new THREE.Group();
    g.name = 'staff_lounge';
    // Sofa
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.8), new THREE.MeshLambertMaterial({ color: 0x4a3728 }));
    sofa.position.set(6.5, 0.25, -5.5);
    sofa.castShadow = true;
    g.add(sofa);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.15), new THREE.MeshLambertMaterial({ color: 0x4a3728 }));
    sofaBack.position.set(6.5, 0.55, -5.9);
    g.add(sofaBack);
    // Small table
    const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.45, 12), new THREE.MeshLambertMaterial({ color: 0x6b3a1f }));
    tbl.position.set(6.5, 0.225, -4.8);
    g.add(tbl);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x2c1a0e }));
    sign.position.set(6.5, 1.5, -6.1);
    g.add(sign);
    this.scene.add(g);
    showToast('Staff Lounge built!', 'success');
  },

  addDeliveryBox() {
    const g = new THREE.Group();
    g.name = 'delivery_box';
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshLambertMaterial({ color: 0xf39c12 }));
    box.position.set(3, 0.4, 8.2);
    box.castShadow = true;
    g.add(box);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 0.85), new THREE.MeshLambertMaterial({ color: 0xe67e22 }));
    lid.position.set(3, 0.85, 8.2);
    g.add(lid);
    this.scene.add(g);
    showToast('Delivery Service ready!', 'success');
  },

  addSecurityCamera() {
    const g = new THREE.Group();
    g.name = 'security_cam';
    [[8.5, 3.5, 8.5], [-8.5, 3.5, 8.5], [8.5, 3.5, -8.5]].forEach(([x,y,z]) => {
      const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.25, 8), new THREE.MeshLambertMaterial({ color: 0x222222 }));
      cam.position.set(x, y, z);
      cam.rotation.z = Math.PI / 2;
      g.add(cam);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 }));
      lens.position.set(x + 0.15, y, z);
      g.add(lens);
    });
    this.scene.add(g);
    showToast('Security Cameras installed!', 'success');
  },

  addManagerOffice() {
    if (this.scene.getObjectByName('manager_office')) return;
    const g = new THREE.Group();
    g.name = 'manager_office';
    const divider = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.8, 0.12), new THREE.MeshLambertMaterial({ color: 0x8b6340 }));
    divider.position.set(5.5, 0.9, -6);
    divider.castShadow = true;
    g.add(divider);
    // Office sign
    const signTex = this.createCanvasTexture((ctx, size) => {
      ctx.fillStyle = '#1a0a00';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ffd37a';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MANAGER', size/2, size/2 - 10);
      ctx.font = '28px sans-serif';
      ctx.fillText('OFFICE', size/2, size/2 + 36);
    }, 256);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), new THREE.MeshLambertMaterial({ map: signTex }));
    sign.position.set(5.5, 1.95, -5.94);
    g.add(sign);
    this.scene.add(g);
  },

  addDiningExtension() {
    const g = new THREE.Group();
    g.name = 'dining_ext';
    // Extended floor area marker
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshLambertMaterial({ color: 0xc07850 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.01, -7);
    g.add(floor);
    // Add 8 more construction slots in the extended area
    const zone = { name: 'Dining Extension', xMin: -3, xMax: 3, zMin: -9, zMax: -5, allowedTools: ['pc'], color: 0x00c8ff };
    if (!this.zones.find(z => z.name === 'Dining Extension')) {
      this.zones.push(zone);
      this.addConstructionSlots();
    }
    this.scene.add(g);
    showToast('Dining Extension built! +8 table slots!', 'success');
  },

  addKitchenExtension() {
    const g = new THREE.Group();
    g.name = 'kitchen_ext';
    // Extra kitchen counter
    const counter = new THREE.Mesh(new THREE.BoxGeometry(4, 0.9, 1.0), new THREE.MeshLambertMaterial({ color: 0x7a4f2e }));
    counter.position.set(-3, 0.45, -7.5);
    counter.castShadow = true;
    g.add(counter);
    const top = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.06, 1.1), new THREE.MeshLambertMaterial({ color: 0xc49a5a }));
    top.position.set(-3, 0.93, -7.5);
    g.add(top);
    // Wok
    const wok = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 }));
    wok.position.set(-3, 1.03, -7.5);
    g.add(wok);
    this.scene.add(g);
    showToast('Kitchen Extension built!', 'success');
  },

  addAccountantRoom() {
    const g = new THREE.Group();
    g.name = 'accountant_room';
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 0.8), new THREE.MeshLambertMaterial({ color: 0x5c3d1e }));
    desk.position.set(-6.5, 0.375, -6);
    desk.castShadow = true;
    g.add(desk);
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.06), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    monitor.position.set(-6.5, 0.95, -6.1);
    g.add(monitor);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), new THREE.MeshBasicMaterial({ color: 0x00c8ff }));
    screen.position.set(-6.5, 0.95, -6.07);
    g.add(screen);
    const signTex = this.createCanvasTexture((ctx, size) => {
      ctx.fillStyle = '#0a1a0a';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#7cff9d';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ACCOUNTANT', size/2, size/2 - 10);
      ctx.font = '26px sans-serif';
      ctx.fillText('OFFICE', size/2, size/2 + 36);
    }, 256);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), new THREE.MeshLambertMaterial({ map: signTex }));
    sign.position.set(-6.5, 1.6, -5.7);
    g.add(sign);
    this.scene.add(g);
    showToast('Accountant Office built!', 'success');
  },

  addVIPRoom() {
    const g = new THREE.Group();
    g.name = 'vip_room';
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(5, 4), new THREE.MeshLambertMaterial({ color: 0x8b0000 }));
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(5, 0.02, -5);
    g.add(carpet);
    const velvetRope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), new THREE.MeshLambertMaterial({ color: 0xffd700 }));
    velvetRope.position.set(2.6, 0.6, -3);
    g.add(velvetRope);
    const signTex = this.createCanvasTexture((ctx, size) => {
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 60px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VIP', size/2, size/2 - 10);
      ctx.font = '28px sans-serif';
      ctx.fillText('DINING ROOM', size/2, size/2 + 40);
    }, 256);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.6), new THREE.MeshLambertMaterial({ map: signTex }));
    sign.position.set(5, 2.2, -2.8);
    g.add(sign);
    const vipLight = new THREE.PointLight(0xffd700, 0.4, 6);
    vipLight.position.set(5, 3, -5);
    g.add(vipLight);
    this.scene.add(g);
    showToast('VIP Dining Room built!', 'success');
  },

  addTrophyCase() {
    if (this.scene.getObjectByName('trophy_case')) return;
    const g = new THREE.Group();
    g.name = 'trophy_case';
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 0.5), new THREE.MeshLambertMaterial({ color: 0x5c3d1e }));
    base.position.set(7.5, 0.75, -8);
    base.castShadow = true;
    g.add(base);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 0.4), new THREE.MeshStandardMaterial({ color: 0xaaddff, transparent: true, opacity: 0.25, metalness: 0.1 }));
    glass.position.set(7.5, 0.75, -7.8);
    g.add(glass);
    this.scene.add(g);
    this.trophyCaseMesh = g;
  },

  updateVisualTheme() {
    // Warm carinderia floor tones
    const floorColors = [0xd4956a, 0xc07850, 0xb8956a, 0xa07848, 0xc8a070];
    const floorIdx = GameState.upgrades.floorPattern || 0;
    if (this.floorMesh && this.floorMesh.material) {
      this.floorMesh.material.color.setHex(floorColors[floorIdx] || 0xd4956a);
      this.floorMesh.material.needsUpdate = true;
    }
  },

  updateDayNightCycle() {
    if (!this.ambientLight || !this.sunLight) return;
    const hour = GameState.hour + (GameState.minute / 60);
    const isDay = hour >= 6 && hour < 18;
    const isRush = (hour >= 11 && hour <= 13) || (hour >= 18 && hour <= 20);
    const isNight = !isDay;
    const skyColor = new THREE.Color(isDay ? 0xd2b08a : 0x0a1020);
    this.renderer.setClearColor(skyColor);
    this.ambientLight.color.setHex(isDay ? 0xffd6a4 : 0x8ca8ff);
    this.ambientLight.intensity = isNight ? 0.35 : 0.45;
    this.sunLight.color.setHex(isDay ? 0xffe1bf : 0x9dc7ff);
    this.sunLight.intensity = isNight ? 0.15 : (isRush ? 0.55 : 0.45);
  },

  addRain() {
    const count = 1500;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = -16 - Math.random() * 10;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x88ccff, size: 0.06, transparent: true, opacity: 0.4 });
    this.rainParticles = new THREE.Points(geo, mat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  },

  updateWeatherVisuals(weather) {
    if (this.rainParticles) this.rainParticles.visible = (weather === 'rain');
    // No fog — just adjust floor roughness and ambient light for rain feel
    if (this.floorMesh?.material) {
      this.floorMesh.material.roughness = weather === 'rain' ? 0.7 : 0.95;
      this.floorMesh.material.needsUpdate = true;
    }
    if (this.ambientLight) this.ambientLight.intensity = weather === 'rain' ? 0.38 : 0.55;
  },

  updateHallOfFame() {
    // Remove old posters cleanly
    this.achievementPosters.forEach(p => {
      if (p.userData.light) this.scene.remove(p.userData.light);
      this.scene.remove(p);
    });
    this.achievementPosters = [];

    const unlockedIds = Object.keys(GameState.achievements).filter(id => GameState.achievements[id]?.unlocked);
    // Place on LEFT wall (x = -8.7) — inside the 18x18 room, not outside
    unlockedIds.slice(0, 6).forEach((id, index) => {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (!ach) return;
      const y = 2.8 - Math.floor(index / 3) * 1.4;
      const z = -4 + (index % 3) * 2.8;
      const poster = this.createPosterMesh(ach);
      poster.position.set(-8.7, y, z);
      poster.rotation.y = Math.PI / 2;
      this.scene.add(poster);
      this.achievementPosters.push(poster);
    });
  },

  createPosterMesh(ach) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Background and frame
    ctx.fillStyle = ach.isGolden ? '#201800' : '#0a1020';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = ach.isGolden ? '#ffd700' : '#00c8ff';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 120);

    ctx.textAlign = 'center';
    ctx.fillStyle = ach.isGolden ? '#ffd700' : '#fff';
    ctx.font = '50px serif';
    ctx.fillText(ach.icon, 128, 60);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(ach.name.toUpperCase(), 128, 100);

    const tex = new THREE.CanvasTexture(canvas);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshLambertMaterial({ map: tex }));
    return mesh;
  },

  updateFullSign(isFull) {
    if (!this.fullSign) return;
    this.fullSign.material.color.setHex(isFull ? 0xff0000 : 0x220000);
    // Optional: Add a small point light here if you want it to cast a red glow
  },

  buildLighting() {
    this.scene.children.filter(obj => obj.isLight).forEach(l => this.scene.remove(l));

    // Soft warm ambient — no wall blowout
    this.ambientLight = new THREE.AmbientLight(0xfff0d0, 0.55);
    this.scene.add(this.ambientLight);

    // Single soft directional — casts gentle shadows
    this.sunLight = new THREE.DirectionalLight(0xffe8c0, 0.35);
    this.sunLight.position.set(8, 14, 10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.left   = -12;
    this.sunLight.shadow.camera.right  =  12;
    this.sunLight.shadow.camera.top    =  12;
    this.sunLight.shadow.camera.bottom = -12;
    this.sunLight.shadow.bias = -0.002;
    this.scene.add(this.sunLight);

    // Warm fill from camera side
    const fill = new THREE.DirectionalLight(0xffd8a0, 0.2);
    fill.position.set(18, 22, 18);
    this.scene.add(fill);

    // Counter fluorescent glow
    const counterLight = new THREE.PointLight(0xffdd88, 0.4, 8, 2);
    counterLight.position.set(0, 2.2, 5.5);
    this.scene.add(counterLight);

    // Dining area overhead — two soft warm points
    [-3, 3].forEach(x => {
      const pt = new THREE.PointLight(0xfff0cc, 0.22, 10, 2);
      pt.position.set(x, 3.4, 0);
      this.scene.add(pt);
    });
  },

  addParticles() {
    // Warm dust motes — tiny warm specks floating in the air
    const count = 120;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i*3]   = (Math.random() - 0.5) * 16;
      positions[i*3+1] = Math.random() * 3.5;
      positions[i*3+2] = (Math.random() - 0.5) * 16;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffcc88, size: 0.025, transparent: true, opacity: 0.28, depthWrite: false });
    const particles = new THREE.Points(geo, mat);
    particles.name = 'particles';
    this.scene.add(particles);
  },

  addConstructionSlots() {
    this.constructionSlots.forEach(s => this.scene.remove(s.mesh));
    this.constructionSlots = [];

    this.zones.forEach(zone => {
      // 2-unit spacing so tables + chairs don't overlap
      for (let x = zone.xMin + 1; x <= zone.xMax - 1; x += 2.5) {
        for (let z = zone.zMin + 1; z <= zone.zMax - 1; z += 2.5) {
          const geo = new THREE.BoxGeometry(1, 0.08, 1);
          const mat = new THREE.MeshBasicMaterial({
            color: zone.color, transparent: true, opacity: 0.18, depthWrite: false
          });
          const slot = new THREE.Mesh(geo, mat);
          slot.position.set(
            Math.round(x * 2) / 2,  // snap to 0.5 grid
            0.04,
            Math.round(z * 2) / 2
          );
          slot.name = 'construction_slot';
          slot.userData = { zone: zone.name, allowedTools: zone.allowedTools };
          this.scene.add(slot);
          this.constructionSlots.push({ mesh: slot, occupied: false });
        }
      }
    });
  },

  spawnTrash(pos) {
    const trashData = { id: Date.now() + Math.random(), x: pos.x, y: pos.y, z: pos.z };
    GameState.trash.push(trashData);
    this.spawnTrashVisual(trashData);
  },

  spawnTrashVisual(data) {
    const trashGeo = new THREE.DodecahedronGeometry(0.1, 0);
    const trashMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const mesh = new THREE.Mesh(trashGeo, trashMat);
    mesh.position.set(data.x, data.y, data.z);
    mesh.userData = { trashId: data.id };
    mesh.rotation.set(Math.random(), Math.random(), Math.random());
    this.scene.add(mesh);
    this.trashMeshes.push(mesh);
  },

  cleanTrash(id) {
    const dataIdx = GameState.trash.findIndex(t => t.id === id);
    if (dataIdx !== -1) GameState.trash.splice(dataIdx, 1);

    const meshIdx = this.trashMeshes.findIndex(m => m.userData.trashId === id);
    if (meshIdx !== -1) {
      this.scene.remove(this.trashMeshes[meshIdx]);
      this.trashMeshes.splice(meshIdx, 1);
      showToast('🧹 Cleaned up trash', 'success');
      GameState.addReputation(1);
    }
  },

  cleanRandomTrash() {
    if (GameState.trash.length > 0) {
      this.cleanTrash(GameState.trash[0].id);
    }
  },

  // Auto-find next free dining slot and place a table there
  buyTable() {
    const cost = 150;
    if (GameState.cash < cost) { showToast('Not enough money! Need ₱' + cost, 'warn'); return; }
    const freeSlot = this.constructionSlots.find(s => !s.occupied && s.mesh.userData.allowedTools.includes('pc'));
    if (!freeSlot) { showToast('⛔ No more space! Buy a room expansion.', 'warn'); return; }
    GameState.addCash(-cost, '-₱' + cost);
    if (window.SoundManager) window.SoundManager.play('purchase');
    this.placePCAt(freeSlot.mesh.position.x, freeSlot.mesh.position.z, GameState.upgrades.pcQuality);
    freeSlot.occupied = true;
    freeSlot.mesh.visible = false;
    GameState.addXP(10);
    showToast('🪑 Table added!', 'success');
    checkAchievements();
    if (window.Tutorial && Tutorial.active) Tutorial.onFlag('pc_placed');
  },

  placePCAt(x, z, quality = 0, broken = false, rotation = null, type = 'pc', maintenance = false) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation !== null ? rotation : 0;

    // ── Dining table (brown wood) ──
    const tableMat = new THREE.MeshLambertMaterial({ color: broken ? 0x442200 : 0x6b3a1f });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.9), tableMat);
    tableTop.position.y = 0.72;
    tableTop.castShadow = true;
    group.add(tableTop);

    // Table legs
    const legMat = new THREE.MeshLambertMaterial({ color: 0x5a3018 });
    [[-0.55, -0.38], [0.55, -0.38], [-0.55, 0.38], [0.55, 0.38]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), legMat);
      leg.position.set(lx, 0.35, lz);
      group.add(leg);
    });

    // ── Monoblock chairs — aligned around table ──
    const chairMat = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
    const chairPositions = [
      { x: 0,     z:  0.75, ry: 0 },          // front
      { x: 0,     z: -0.75, ry: Math.PI },     // back
      { x: -0.75, z:  0,    ry:  Math.PI / 2 }, // left
      { x:  0.75, z:  0,    ry: -Math.PI / 2 }, // right
    ];
    chairPositions.forEach(cp => {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.44), chairMat);
      seat.position.set(cp.x, 0.44, cp.z);
      group.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.42, 0.04), chairMat);
      back.position.set(cp.x, 0.68, cp.z - Math.sin(cp.ry) * 0.2 - Math.cos(cp.ry) * 0.2);
      back.rotation.y = cp.ry;
      group.add(back);
      // Chair legs
      [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([clx, clz]) => {
        const cleg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 0.03), chairMat);
        cleg.position.set(cp.x + clx, 0.21, cp.z + clz);
        group.add(cleg);
      });
    });

    // Plate & condiments on table
    const plateMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 12), plateMat);
    plate.position.set(0, 0.76, 0);
    group.add(plate);

    this.scene.add(group);

    // Block nav grid around table
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++)
        this.updateNavGrid(x + dx, z + dz, false);

    // Mark slot occupied
    const slot = this.constructionSlots.find(s =>
      Math.abs(s.mesh.position.x - x) < 0.5 &&
      Math.abs(s.mesh.position.z - z) < 0.5
    );
    if (slot) { slot.occupied = true; slot.mesh.visible = false; }

    const pcObj = {
      group,
      mesh: tableTop,
      screen: null,
      light: null,
      quality,
      broken,
      underMaintenance: maintenance,
      occupied: false,
      isVIP: false,
      type: 'pc',
      id: GameState.pcs.length
    };
    GameState.pcs.push(pcObj);
    return pcObj;
  },

  // Stub kept for compatibility — does nothing visual now
  updatePC(pc) {},

  showGhost(x, z, colorHex = 0x00c8ff) {
    if (!this.ghostMesh) {
      const geo = new THREE.BoxGeometry(0.9, 0.5, 0.6);
      const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.45 });
      this.ghostMesh = new THREE.Mesh(geo, mat);
      this.scene.add(this.ghostMesh);
    }
    this.ghostMesh.position.set(x, 0.6, z);
    this.ghostMesh.material.color.setHex(colorHex);
    this.ghostMesh.rotation.y = this.toolRotation;
    this.ghostMesh.visible = true;
  },

  hideGhost() {
    if (this.ghostMesh) this.ghostMesh.visible = false;
  },

  tryBuyPC(slot) {
    const cost = 150;
    const existing = GameState.pcs.find(p =>
      Math.abs(p.group.position.x - slot.mesh.position.x) < 0.5 &&
      Math.abs(p.group.position.z - slot.mesh.position.z) < 0.5
    );
    if (existing || slot.occupied) { showToast('🚫 Spot already occupied!', 'warn'); return; }
    if (!slot.mesh.userData.allowedTools.includes('pc')) { showToast('🚫 Cannot place here!', 'warn'); return; }
    if (GameState.cash < cost) { showToast('Not enough money! Need ₱' + cost, 'warn'); return; }
    GameState.addCash(-cost, '-₱' + cost);
    if (window.SoundManager) window.SoundManager.play('purchase');
    this.placePCAt(slot.mesh.position.x, slot.mesh.position.z, GameState.upgrades.pcQuality);
    slot.occupied = true;
    slot.mesh.visible = false;
    GameState.addXP(10);
    showToast('🪑 Table placed!', 'success');
    if (window.Tutorial && Tutorial.active) Tutorial.onFlag('pc_placed');
    checkAchievements();
  },

  interactInPerson() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), CameraSystem.camera);
    const interactRange = 4.5;
    
    // Check Customers
    const custMeshes = GameState.customers.map(c => c.mesh);
    const custHits = this.raycaster.intersectObjects(custMeshes, true);
    if (custHits.length > 0 && custHits[0].distance <= interactRange) {
      let cObj = custHits[0].object;
      let customer = null;
      while (cObj && !customer) {
        customer = GameState.customers.find(c => c.mesh === cObj);
        cObj = cObj.parent;
      }
      if (customer) {
        this.interactWithCustomer(customer);
        return;
      }
    }

    // Check PCs
    const pcGroups = GameState.pcs.map(p => p.group);
    const hits = this.raycaster.intersectObjects(pcGroups, true);
    if (hits.length > 0 && hits[0].distance <= interactRange) {
      let obj = hits[0].object;
      let pc = null;
      while (obj && !pc) {
        pc = GameState.pcs.find(p => p.group === obj);
        obj = obj.parent;
      }
      if (pc) { 
        if (pc.broken) VirusGame.trigger(pc); 
        else showToast('🪑 Table is clean and ready.', 'info');
      }
    }
  },

  interactWithCustomerByIndex(idx) {
    const customer = GameState.customers[idx];
    if (customer) this.interactWithCustomer(customer);
  },

  interactWithCustomer(c) {
    if (c.state === 'queued') {
      // Assign customer to a PC via Reception modal
      openModal('reception', c);

    } else if (c.state === 'ordering') {
      // Player manually takes the order — speeds up ordering timer to 0
      if (c.orderTimer > 0) {
        c.orderTimer = 0;
        showToast('\uD83D\uDCCB Order taken! Nice service, Boss!', 'success');
        addEventLog('\uD83D\uDCCB You took the order manually!');
        if (window.SoundManager) SoundManager.play('ping');
        // Bonus XP for manual service
        GameState.addXP(5);
        GameState.satisfaction = Math.min(100, (GameState.satisfaction || 50) + 3);
      }

    } else if (c.state === 'eating') {
      // Show customer info while eating
      const dish = c.orderedDish;
      if (dish) {
        showToast(dish.icon + ' ' + dish.name + ' \u2014 enjoying their meal!', 'info');
      }

    } else if (c.state === 'waiting_to_pay') {
      // Manually process payment
      CustomerSystem.checkout(c);
      showToast('\uD83D\uDCB0 Payment collected! Thank you!', 'success');
      addEventLog('\uD83D\uDCB0 You collected payment manually!');
      if (window.SoundManager) SoundManager.play('coin');

    } else if (c.state === 'active') {
      if (c.requests.includes('snack'))  CustomerSystem.fulfillSnack(c);
      else if (c.requests.includes('coffee')) CustomerSystem.fulfillCoffee(c);
      else if (c.pc && c.pc.broken) VirusGame.trigger(c.pc);
    }
  },

  onMouseMove(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Cursor hint: pointer when hovering over an interactable customer
    if (!this.activeTool && CameraSystem.camera) {
      this.raycaster.setFromCamera(this.mouse, CameraSystem.camera);
      const custMeshes = GameState.customers.map(c => c.mesh).filter(Boolean);
      const custHits = this.raycaster.intersectObjects(custMeshes, true);
      if (custHits.length > 0) {
        // Find the customer
        let obj = custHits[0].object;
        let found = null;
        while (obj && !found) {
          found = GameState.customers.find(c => c.mesh === obj);
          obj = obj.parent;
        }
        if (found && ['queued','ordering','waiting_to_pay'].includes(found.state)) {
          document.getElementById('game-canvas').style.cursor = 'pointer';
          return;
        }
      }
      document.getElementById('game-canvas').style.cursor = '';
    }

    if (!this.activeTool) return;
    this.raycaster.setFromCamera(this.mouse, CameraSystem.camera);
    
    if (this.activeTool === 'sell') {
      const pcGroups = GameState.pcs.map(p => p.group);
      const hits = this.raycaster.intersectObjects(pcGroups, true);
      if (hits.length > 0) {
        let obj = hits[0].object;
        let pc = null;
        while (obj && !pc) {
          pc = GameState.pcs.find(p => p.group === obj);
          obj = obj.parent;
        }
        if (pc) {
          this.showGhost(pc.group.position.x, pc.group.position.z, 0xff2d78);
          return;
        }
      }
      this.hideGhost();
      return;
    }

    // Get floor position for snapping
    const hits = this.raycaster.intersectObject(this.floorMesh);
    if (hits.length) {
      const p = hits[0].point;
      const sx = Math.round(p.x), sz = Math.round(p.z);
      
      // Find nearest slot to snapped point
      const slot = this.constructionSlots.find(s => 
        Math.abs(s.mesh.position.x - sx) < 0.5 && 
        Math.abs(s.mesh.position.z - sz) < 0.5
      );

      let isValid = false;
      if (slot) {
        this.hoveredSlot = slot.mesh;
        const toolAllowed = slot.mesh.userData.allowedTools.includes(this.activeTool);
        isValid = !slot.occupied && toolAllowed;
      } else {
        this.hoveredSlot = null;
      }

      this.showGhost(sx, sz, isValid ? 0x00c8ff : 0xff2d78); // Blue if valid, Pink/Red if invalid
    } else {
      this.hideGhost();
    }
  },

  sellDevice(pc) {
    if (pc.occupied) {
      showToast("⚠️ Cannot sell while occupied!", "warn");
      return;
    }

    const costs = { pc: 150 };
    const refund = Math.floor((costs[pc.type] || 150) * 0.5);

    // 1. Remove from scene
    this.scene.remove(pc.group);
    this.disposeObject(pc.group);

    // 2. Free construction slot
    const slot = this.constructionSlots.find(s =>
      Math.abs(s.mesh.position.x - pc.group.position.x) < 0.1 && 
      Math.abs(s.mesh.position.z - pc.group.position.z) < 0.1
    );
    if (slot) {
      slot.occupied = false;
      slot.mesh.visible = true; // Construction slot becomes available again
    }

    // 3. Update nav grid and GameState
    this.updateNavGrid(pc.group.position.x, pc.group.position.z, true, (pc.type === 'vr' ? 2 : 1));
    GameState.pcs = GameState.pcs.filter(p => p !== pc);
    GameState.addCash(refund, `+₱${refund} sold`);
    showToast(`💰 Sold ${pc.type.toUpperCase()} for ₱${refund}`, "success");
  },

  onCanvasClick(e) {
    if (e.target.id !== 'game-canvas') return;
    
    console.log('onCanvasClick: activeTool =', this.activeTool, 'Tutorial.active =', Tutorial.active, 'Tutorial.stepIdx =', Tutorial.stepIdx, 'waitFlag =', Tutorial.STEPS[Tutorial.stepIdx]?.waitFlag);
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, CameraSystem.camera);

    // Priority 1: Handle non-placement interactions (Trash, Customers, Existing PCs)
    if (!this.activeTool) {
      const trashHits = this.raycaster.intersectObjects(this.trashMeshes);
      if (trashHits.length > 0) {
        const id = trashHits[0].object.userData.trashId;
        this.cleanTrash(id);
        return;
      }

      // Check for clicking customers to perform station tasks
      const custMeshes = GameState.customers.map(c => c.mesh);
      const custHits = this.raycaster.intersectObjects(custMeshes, true);
      if (custHits.length > 0) {
        let obj = custHits[0].object;
        let customer = null;
        while (obj && !customer) {
          customer = GameState.customers.find(c => c.mesh === obj);
          obj = obj.parent;
        }
        if (customer) {
          this.interactWithCustomer(customer);
          return;
        }
      }

      // Check for clicking PCs
      const pcMeshes = GameState.pcs.map(p => p.mesh);
      const hits = this.raycaster.intersectObjects(pcMeshes);
      
      if (hits.length > 0) {
        const pc = GameState.pcs.find(p => p.mesh === hits[0].object);
        if (pc && pc.broken) VirusGame.trigger(pc);
      }
      return;
    }

    // Priority 2: Handle Placement (Tutorial or Manual)
    const isPlacementTool = ['pc'].includes(this.activeTool);
    const isTutorialPlacement = Tutorial.active && Tutorial.STEPS[Tutorial.stepIdx]?.waitFlag === 'pc_placed';

    if (isPlacementTool || isTutorialPlacement) {
      // Use snapping logic to find the slot even if the user clicks slightly off-center
      const hits = this.raycaster.intersectObject(this.floorMesh);
      if (hits.length) {
        const p = hits[0].point;
        const sx = Math.round(p.x), sz = Math.round(p.z);
        const slot = this.constructionSlots.find(s => 
          Math.abs(s.mesh.position.x - sx) < 0.5 && 
          Math.abs(s.mesh.position.z - sz) < 0.5
        );

        if (!slot) {
          showToast('🚫 Cannot build here!', 'warn');
          return;
        }

        this.tryBuyPC(slot);
        this.hideGhost();
        setTool(null);
        checkAchievements();
        return;
      }
      // If in tutorial placement mode, don't allow other clicks to fall through
      if (isTutorialPlacement) return;
    }

    if (this.activeTool === 'sell') {
      const pcGroups = GameState.pcs.map(p => p.group);
      const pcHits = this.raycaster.intersectObjects(pcGroups, true);
      if (pcHits.length > 0) {
        let obj = pcHits[0].object;
        let pc = null;
        while (obj && !pc) {
          pc = GameState.pcs.find(p => p.group === obj);
          obj = obj.parent;
        }
        if (pc) {
          this.sellDevice(pc);
          this.hideGhost(); // Hide ghost after selling
          setTool(null);
          return;
        }
      }
    }

    if (this.activeTool === 'repair') {
      const pcGroups = GameState.pcs.map(p => p.group);
      const pcHits = this.raycaster.intersectObjects(pcGroups, true);
      if (pcHits.length > 0) {
        let obj = pcHits[0].object;
        let pc = null;
        while (obj && !pc) {
          pc = GameState.pcs.find(p => p.group === obj);
          obj = obj.parent;
        }
        if (pc && pc.broken) VirusGame.trigger(pc); // Trigger malfunction minigame
        this.hideGhost();
        setTool(null);
        return; // Return after repair interaction
      }
    }
  },

  animate() {
    this.frameId = requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.033);

    // Animate particles
    const particles = this.scene.getObjectByName('particles');
    if (particles) {
      const pos = particles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += delta * 0.05;
        if (pos[i] > 4.5) pos[i] = 0;
      }
      particles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.ceilingFanBlades?.length) {
      this.ceilingFanBlades.forEach(blade => {
        blade.rotation.z += delta * (blade.userData.speed || 0.8);
      });
    }

    if (this.steamParticles) {
      const pos = this.steamParticles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] += delta * (0.18 + (i % 9) * 0.01);
        pos[i] += Math.sin(Date.now() * 0.0008 + i) * delta * 0.04;
        if (pos[i + 1] > 4.6) {
          pos[i + 1] = 0.9 + Math.random() * 1.4;
        }
      }
      this.steamParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Update construction slot visuals and zone highlighting
    this.constructionSlots.forEach(slot => {
      if (slot.occupied) {
        slot.mesh.visible = false;
        return;
      }
      
      let opacity = 0.02;
      const tool = this.activeTool;
      const isAllowed = tool && slot.mesh.userData.allowedTools.includes(tool);

      if (isAllowed) {
        // Make VR and PS zones more distinct with specialized pulse patterns
        const isSpecialZone = slot.mesh.userData.allowedTools.includes('vr') || slot.mesh.userData.allowedTools.includes('ps');
        const pulseSpeed = isSpecialZone ? 0.008 : 0.005;
        const pulseRange = isSpecialZone ? 0.3 : 0.15;
        const baseOpacity = isSpecialZone ? 0.4 : 0.2;

        if (this.hoveredSlot === slot.mesh) {
          opacity = 0.8; // Hover glow
        } else {
          opacity = baseOpacity + Math.sin(Date.now() * pulseSpeed) * pulseRange;
        }
      }
      
      slot.mesh.material.opacity = opacity;
      slot.mesh.visible = true;
    });

    if (CameraSystem.camera) {
      if (window.CustomerSystem) CustomerSystem.update(delta);
      if (window.StaffSystem) StaffSystem.update(delta);
      CameraSystem.update(delta);

      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, CameraSystem.camera);
      }
    }
  },

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
    if (CameraSystem.camera) {
      CameraSystem.camera.aspect = window.innerWidth / window.innerHeight;
      CameraSystem.camera.updateProjectionMatrix();
    }
  }
};

function setTool(tool) {
  SceneManager.activeTool = tool;
  SceneManager.toolRotation = 0;
  document.querySelectorAll('.sb-btn').forEach(b => b.classList.remove('active'));
  if (tool === 'pc')     document.getElementById('btn-add-pc')?.classList.add('active');
  if (tool === 'repair') document.getElementById('btn-repair')?.classList.add('active');
  if (tool === 'sell')   document.getElementById('btn-sell')?.classList.add('active');

  const cancelBtn = document.getElementById('btn-cancel-tool');
  if (cancelBtn) cancelBtn.classList.toggle('hidden', !tool);

  if (!tool) SceneManager.hideGhost();
  if (tool && Tutorial.active) Tutorial.onFlag('tool_' + tool + '_selected');
}
