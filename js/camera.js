/* ===== CAMERA SYSTEM — Fixed Isometric Tycoon (Idle Restaurant Style) ===== */
window.CameraSystem = {
  camera: null,
  initialized: false,

  // Fixed isometric angle — never rotates, only zooms
  TARGET:      new THREE.Vector3(0, 0, -1),  // restaurant center
  FIXED_THETA: Math.PI * 0.28,               // fixed horizontal angle (~50deg)
  FIXED_PHI:   0.95,                         // fixed vertical tilt (~55deg)
  radius:      20,                           // current zoom distance
  targetRadius: 20,                          // lerp target
  MIN_RADIUS:  10,
  MAX_RADIUS:  32,

  _tempVec: null,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.3,
      200
    );
    this._tempVec = new THREE.Vector3();
    this._applyPosition();
    this._bindEvents();
  },

  _applyPosition() {
    const x = this.TARGET.x + this.radius * Math.sin(this.FIXED_THETA) * Math.sin(this.FIXED_PHI);
    const y = this.radius * Math.cos(this.FIXED_PHI);
    const z = this.TARGET.z + this.radius * Math.cos(this.FIXED_THETA) * Math.sin(this.FIXED_PHI);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.TARGET);
  },

  _bindEvents() {
    const canvas = document.getElementById('game-canvas');
    // Smooth scroll zoom only — no rotation, no drag
    canvas.addEventListener('wheel', (e) => {
      this.targetRadius = Math.max(
        this.MIN_RADIUS,
        Math.min(this.MAX_RADIUS, this.targetRadius + e.deltaY * 0.022)
      );
    }, { passive: true });

    // Touch pinch zoom
    let lastPinchDist = 0;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        this.targetRadius = Math.max(
          this.MIN_RADIUS,
          Math.min(this.MAX_RADIUS, this.targetRadius - (dist - lastPinchDist) * 0.05)
        );
        lastPinchDist = dist;
      }
    }, { passive: true });
  },

  // Kept for compatibility — does nothing in fixed-camera mode
  setMode(mode) {},

  update(delta) {
    if (!this.camera) return;
    // Smooth zoom interpolation
    this.radius += (this.targetRadius - this.radius) * 0.1;

    const x = this.TARGET.x + this.radius * Math.sin(this.FIXED_THETA) * Math.sin(this.FIXED_PHI);
    const y = this.radius * Math.cos(this.FIXED_PHI);
    const z = this.TARGET.z + this.radius * Math.cos(this.FIXED_THETA) * Math.sin(this.FIXED_PHI);
    this._tempVec.set(x, y, z);
    this.camera.position.lerp(this._tempVec, 0.1);
    this.camera.lookAt(this.TARGET);
  }
};
