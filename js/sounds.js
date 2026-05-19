/* ===== SOUND MANAGER — Procedural Web Audio API ===== */
window.SoundManager = {
  ctx: null,
  enabled: true,
  masterGain: null,

  GREETINGS: [
    'Hello!', 'Good day!', 'Magandang umaga!', 'Kumain na tayo!',
    'Masarap ba?', 'Pabili nga!', 'Salamat!', 'Sige, boss!',
    'Uy, may luto!', 'Gutom na ko!', 'Ang bango!', 'Pwede pa!'
  ],

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
      this._startAmbient();
      this._startChatter();
      console.log('SoundManager initialized');
    } catch(e) {
      console.warn('Web Audio API not available:', e);
    }

    // Click SFX on every button
    document.addEventListener('click', (e) => {
      if (!this.enabled) return;
      if (e.target.closest('button, .upgrade-card, .skill-node, .ach-card, .rival-card, .staff-card, .save-slot')) {
        this._sfxClick(0.07, 900 + Math.random() * 200);
      }
    });

    // Hover SFX
    document.addEventListener('mouseover', (e) => {
      if (!this.enabled) return;
      if (e.target.closest('button, .upgrade-card, .skill-node')) {
        this._sfxClick(0.025, 1100);
      }
    });
  },

  // ── Ambient pentatonic melody ──
  _startAmbient() {
    if (!this.ctx) return;
    const notes = [261.63, 293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46];
    const playNote = () => {
      if (!this.enabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'triangle';
      osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      env.gain.setValueAtTime(0, this.ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.07, this.ctx.currentTime + 0.05);
      env.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
      osc.connect(filter); filter.connect(env); env.connect(this.masterGain);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 1.3);
    };
    const schedule = () => {
      if (this.enabled) playNote();
      setTimeout(schedule, 400 + Math.random() * 700);
    };
    schedule();
  },

  // ── Crowd chatter noise bursts ──
  _startChatter() {
    if (!this.ctx) return;
    const playChatter = () => {
      if (!this.enabled || !this.ctx) return;
      const bufSize = this.ctx.sampleRate * 0.15;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 700 + Math.random() * 1400;
      bp.Q.value = 9;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0, this.ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.035, this.ctx.currentTime + 0.03);
      env.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      src.connect(bp); bp.connect(env); env.connect(this.masterGain);
      src.start(this.ctx.currentTime);
    };
    const schedule = () => {
      if (this.enabled) { const b = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < b; i++) setTimeout(playChatter, i * 110); }
      setTimeout(schedule, 1800 + Math.random() * 3000);
    };
    schedule();
  },

  // ── Public play API ──
  play(id) {
    if (!this.enabled || !this.ctx) return;
    switch(id) {
      case 'click':       this._sfxClick(0.08, 850); break;
      case 'hover':       this._sfxClick(0.025, 1100); break;
      case 'purchase':    this._sfxPurchase(); break;
      case 'ping':        this._sfxPing(880, 0.15); break;
      case 'ui_open':     this._sfxClick(0.06, 750); break;
      case 'coin':        this._sfxCoin(); break;
      case 'levelup':     this._sfxLevelUp(); break;
      case 'combo':       this._sfxCombo(); break;
      case 'achievement': this._sfxAchievement(); break;
      case 'customer_in': this._sfxCustomerIn(); break;
      case 'customer_pay':this._sfxCoin(); break;
      case 'error':       this._sfxError(); break;
      case 'whoosh':      this._sfxWhoosh(); break;
      case 'streak':      this._sfxStreak(); break;
    }
  },

  // ── Greeting popup with spoken text ──
  greet(text) {
    if (!this.enabled) return;
    // Play a cheerful ding then show the text popup
    this._sfxCustomerIn();
    this._showGreetingPop(text || this.GREETINGS[Math.floor(Math.random() * this.GREETINGS.length)]);
  },

  _showGreetingPop(text) {
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'bottom:' + (80 + Math.random() * 120) + 'px',
      'left:' + (60 + Math.random() * (window.innerWidth - 260)) + 'px',
      'background:linear-gradient(135deg,rgba(255,211,122,0.97),rgba(255,177,92,0.97))',
      'color:#1a0a00',
      'font-family:Rajdhani,sans-serif',
      'font-size:18px',
      'font-weight:800',
      'padding:10px 18px',
      'border-radius:22px',
      'box-shadow:0 4px 20px rgba(255,177,92,0.55)',
      'pointer-events:none',
      'z-index:1500',
      'animation:greetPop 0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
      'white-space:nowrap'
    ].join(';');
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s,transform 0.4s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-20px)';
      setTimeout(() => el.remove(), 420);
    }, 1800);
  },

  // ── SFX implementations ──
  _sfxClick(vol, freq) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.value = freq; osc.type = 'sine';
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
    osc.connect(g); g.connect(this.masterGain);
    osc.start(); osc.stop(this.ctx.currentTime + 0.1);
  },

  _sfxPurchase() {
    if (!this.ctx) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.value = f; osc.type = 'triangle';
      const t = this.ctx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.13, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.24);
    });
  },

  _sfxCoin() {
    if (!this.ctx) return;
    [1047, 1319, 1568].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.value = f; osc.type = 'sine';
      const t = this.ctx.currentTime + i * 0.06;
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.2);
    });
  },

  _sfxPing(freq, vol) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.value = freq || 880; osc.type = 'sine';
    g.gain.setValueAtTime(vol || 0.15, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
    osc.connect(g); g.connect(this.masterGain);
    osc.start(); osc.stop(this.ctx.currentTime + 0.47);
  },

  _sfxLevelUp() {
    if (!this.ctx) return;
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.value = f; osc.type = 'triangle';
      const t = this.ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.32);
    });
  },

  _sfxCombo() {
    if (!this.ctx) return;
    const freqs = [659, 784, 988, 1319];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.value = f; osc.type = 'square';
      const t = this.ctx.currentTime + i * 0.07;
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.17);
    });
  },

  _sfxAchievement() {
    if (!this.ctx) return;
    [523, 784, 1047, 1319, 1568, 2093].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.value = f; osc.type = 'triangle';
      const t = this.ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.37);
    });
  },

  _sfxCustomerIn() {
    if (!this.ctx) return;
    // Cheerful two-tone ding
    [[880, 0], [1100, 0.12]].forEach(([f, delay]) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.value = f; osc.type = 'sine';
      const t = this.ctx.currentTime + delay;
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.3);
    });
  },

  _sfxError() {
    if (!this.ctx) return;
    [220, 180].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.value = f; osc.type = 'sawtooth';
      const t = this.ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.2);
    });
  },

  _sfxWhoosh() {
    if (!this.ctx) return;
    const bufSize = this.ctx.sampleRate * 0.2;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 800;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    src.connect(filter); filter.connect(g); g.connect(this.masterGain);
    src.start(); src.stop(this.ctx.currentTime + 0.22);
  },

  _sfxStreak() {
    if (!this.ctx) return;
    [392, 494, 587, 740, 988].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.value = f; osc.type = 'triangle';
      const t = this.ctx.currentTime + i * 0.08;
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.27);
    });
  },

  toggle() {
    this.enabled = !this.enabled;
    if (this.masterGain) this.masterGain.gain.value = this.enabled ? 0.5 : 0;
    const btn = document.getElementById('btn-sound-toggle');
    if (btn) btn.textContent = this.enabled ? '&#x1F50A;' : '&#x1F507;';
    showToast(this.enabled ? 'Sound ON' : 'Sound OFF', 'info');
  },

  updateMusic() {}
};
