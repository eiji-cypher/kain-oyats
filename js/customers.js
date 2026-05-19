/* ===== CUSTOMER SYSTEM — Filipino Carinderia Idle Tycoon ===== */
window.CustomerSystem = {

  EMOTIONS: {
    happy:   { icon: '&#x1F60A;', color: 0x39ff14, rep: +1 },
    excited: { icon: '&#x1F60D;', color: 0xffd700, rep: +2 },
    angry:   { icon: '&#x1F621;', color: 0xff2d78, rep: -2 },
    bored:   { icon: '&#x1F634;', color: 0x888888, rep: -1 },
    hungry:  { icon: '&#x1F37D;&#xFE0F;', color: 0xff9900, rep: -1 },
    eating:  { icon: '&#x1F60B;', color: 0x39ff14, rep: +1 },
    vip:     { icon: '&#x1F451;', color: 0xffd700, rep: +5 },
    waiting: { icon: '&#x23F3;', color: 0xffcc00, rep:  0 },
    suki:    { icon: '&#x1F49B;', color: 0xffdd00, rep: +3 },
  },

  GREETINGS: [
    'Hello po!', 'Good day!', 'Magandang umaga!',
    'Kumain na tayo!', 'Gutom na ko!', 'Ang bango!',
    'Pabili nga!', 'Sige, boss!', 'Uy, may luto!',
    'Masarap ba?', 'Pwede pa!', 'Salamat!'
  ],

  FILIPINO_QUIPS: [
    'Boss, dalawang kanin nga.',
    'Pabili pong adobo.',
    'Mainit pa ba yung sabaw?',
    'Ang sarap ng ulam dito!',
    'Extra rice ako, salamat.',
    'May sisig pa ba?',
    'Sulit dito ah, murang-mura.',
    'Pares nga boss, dagdag sabaw.',
    'Ang bango ng pagkain!',
    'Ate, pabili ng sinigang.',
    'Masarap talaga dito.',
    'Ang init ng araw, may halo-halo?',
    'Suki na ko dito, lagi masarap.',
    'Kuya, yung order namin matagal na.',
  ],

  // ── State machine ──────────────────────────────────────────────────────────
  stateHandlers: {
    queued: {
      tick(c) {
        c.waitTime++;
        if (c.waitTime > 8 && c.emotion !== 'angry') {
          c.emotion = 'angry';
          addEventLog('&#x1F621; Customer getting impatient! Seat them fast!');
        }
        if (c.waitTime > 50) {
          c.state = 'leaving';
          c.target = new THREE.Vector3(0, 0.65, 8.5);
          c.walking = true;
          GameState.addReputation(-2);
          GameState.satisfaction = Math.max(0, (GameState.satisfaction || 50) - 5);
          window.CustomerSystem._breakCombo();
          addEventLog('&#x1F6AA; A customer left without being seated!');
          showToast('&#x1F621; Customer walked out! Hire a Manager!', 'danger');
          if (window.SoundManager) SoundManager.play('error');
        }
      },
      update() {}
    },

    walking_to_pc: {
      tick() {},
      update(c) {
        if (!c.walking) {
          c.state = 'ordering';
          c.orderTimer = 4; // 4 ticks gives player time to click
          c.emotion = 'hungry';
          c._tapIndicatorShown = false;
        }
      }
    },

    ordering: {
      tick(c) {
        c.orderTimer--;
        // Show a pulsing tap indicator so player knows they can click
        if (c.orderTimer > 0 && !c._tapIndicatorShown) {
          c._tapIndicatorShown = true;
          window.CustomerSystem.showTextBubble(c, '\uD83D\uDCCB Tap to take order!');
        }
        if (c.orderTimer <= 0) {
          c._tapIndicatorShown = false;
          c.state = 'eating';
          c.emotion = 'eating';
          const dishes = GameState.upgrades.unlockedDishes || [];
          const allDishes = window.FOOD_MENU || [];
          const available = allDishes.filter(d => dishes.includes(d.id) || d.level === 1);
          c.orderedDish = available.length
            ? available[Math.floor(Math.random() * available.length)]
            : { name: 'Kanin at Ulam', icon: '\uD83C\uDF5A', price: 45, cost: 10 };
          window.CustomerSystem.showTextBubble(c, c.orderedDish.icon + ' ' + c.orderedDish.name);
          addEventLog('\uD83D\uDCCB Order: ' + c.orderedDish.name + ' (\u20B1' + c.orderedDish.price + ')');
          if (window.SoundManager) SoundManager.play('ping');
        }
      },
      update() {}
    },

    eating: {
      tick(c) {
        c.sessionTime++;
        const ratio = c.sessionTime / c.maxSession;
        if (ratio < 0.6)      c.emotion = 'eating';
        else if (ratio < 0.9) c.emotion = 'happy';
        else                  c.emotion = 'waiting';

        if (c.sessionTime >= c.maxSession) {
          // Free this customer's seat slot (not the whole table)
          if (c.pc) {
            c.pc.seatsTaken = Math.max(0, (c.pc.seatsTaken || 1) - 1);
            if (c.pc.seatsTaken === 0) c.pc.occupied = false;
          }
          c.state = 'waiting_to_pay';
          c.target = new THREE.Vector3(
            c.pc ? c.pc.group.position.x + (Math.random() - 0.5) * 0.6 : -3,
            0.65, 5.2
          );
          c.walking = true;
        }
        if (Math.random() < 0.0004) {
          const quip = window.CustomerSystem.FILIPINO_QUIPS[
            Math.floor(Math.random() * window.CustomerSystem.FILIPINO_QUIPS.length)
          ];
          window.CustomerSystem.showTextBubble(c, quip);
        }
      },
      update() {}
    },

    waiting_to_pay: {
      tick(c) {
        c.payWait = (c.payWait || 0) + 1;
        // Show tap indicator on first tick
        if (c.payWait === 1) {
          window.CustomerSystem.showTextBubble(c, '\uD83D\uDCB0 Tap to collect payment!');
        }
        if (c.payWait >= 3) window.CustomerSystem.checkout(c);
      },
      update() {}
    },

    leaving: {
      tick() {},
      update(c) {
        if (!c.walking) {
          const idx = GameState.customers.indexOf(c);
          if (idx > -1) {
            if (c.mesh) SceneManager.scene.remove(c.mesh);
            GameState.customers.splice(idx, 1);
          }
        }
      }
    }
  },

  // ── Spawn — 4 seats per table ──────────────────────────────────────────────
  spawnCustomer() {
    if (GameState.customers.filter(c => c.state === 'queued').length >= 12) return null;

    // Find a table with available seats (max 4 per table)
    const tableWithSeats = GameState.pcs.find(p => !p.broken && (p.seatsTaken || 0) < 4);
    if (!tableWithSeats) { SceneManager.updateFullSign(true); return null; }

    const group   = new THREE.Group();
    const isVIP   = GameState.level >= 5 && Math.random() < 0.12;
    const isSuki  = !!(GameState.skills && GameState.skills.suki_customers) && Math.random() < 0.25;

    const shirtColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22];
    const bodyGeo = THREE.CapsuleGeometry
      ? new THREE.CapsuleGeometry(0.14, 0.38, 4, 8)
      : new THREE.CylinderGeometry(0.14, 0.14, 0.52, 8);
    const body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({
      color: isVIP ? 0xffd700 : isSuki ? 0xffdd44 : shirtColors[Math.floor(Math.random() * shirtColors.length)]
    }));
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xf5cba7 })
    );
    head.position.y = 0.42;
    group.add(head);

    // Stagger queue positions so customers don't overlap
    const queueIdx = GameState.customers.filter(c => c.state === 'queued').length;
    const queueX = -5 + (queueIdx % 6) * 1.2;
    const queueZ = 7.2 - Math.floor(queueIdx / 6) * 1.0;
    group.position.set(0, 0.65, 9.2); // spawn just outside door
    SceneManager.scene.add(group);

    const customer = {
      mesh: group,
      pc: null,
      target: new THREE.Vector3(queueX, 0.65, queueZ),
      emotion: isVIP ? 'vip' : isSuki ? 'suki' : 'happy',
      sessionTime: 0,
      maxSession: 5 + Math.floor(Math.random() * 4) + (isSuki ? 3 : 0) + (GameState.weather === 'rain' ? 2 : 0),
      orderTimer: 0,
      payWait: 0,
      walking: true,
      state: 'queued',
      speed: 0.045 + Math.random() * 0.025,
      requests: [],
      isVIP, isSuki,
      waitTime: 0,
      orderedDish: null,
      _checkedOut: false,
    };

    GameState.customers.push(customer);
    this.showEmotionBubble(customer);

    // Greeting sound + popup
    const greeting = this.GREETINGS[Math.floor(Math.random() * this.GREETINGS.length)];
    if (window.SoundManager) SoundManager.greet(greeting);

    // Notification
    const typeLabel = isVIP ? '&#x1F451; VIP Customer arrived!' : isSuki ? '&#x1F49B; Suki customer is back!' : '&#x1F6B6; New customer arrived!';
    addEventLog(typeLabel);
    if (isVIP) showToast('&#x1F451; VIP Customer! Serve them well!', 'success');
    if (isSuki) showToast('&#x1F49B; Suki customer! +30% earnings!', 'success');

    // Tutorial flag
    if (window.Tutorial && Tutorial.active) Tutorial.onFlag('customer_arrived');

    return customer;
  },

  // Tutorial: spawn and auto-seat immediately
  spawnTutorialCustomer() {
    const c = this.spawnCustomer();
    if (c) {
      const freePC = GameState.pcs.find(p => !p.broken && (p.seatsTaken || 0) < 4);
      if (freePC) setTimeout(() => this.assignPC(c, freePC), 1400);
    }
  },

  // ── Assign to table seat (up to 4 per table) ──────────────────────────────
  assignPC(customer, pc) {
    if (!customer || !pc) return;
    if ((pc.seatsTaken || 0) >= 4) {
      showToast('&#x26D4; Table is full! (4/4 seats)', 'warn');
      return;
    }
    customer.pc = pc;
    pc.seatsTaken = (pc.seatsTaken || 0) + 1;
    // Mark occupied only when all 4 seats taken
    pc.occupied = pc.seatsTaken >= 4;

    // Seat offset so customers don't stack
    const seatOffsets = [
      { x:  0,    z:  0.55 },
      { x:  0,    z: -0.55 },
      { x: -0.55, z:  0    },
      { x:  0.55, z:  0    },
    ];
    const seatIdx = (pc.seatsTaken - 1) % 4;
    const off = seatOffsets[seatIdx];
    customer.state = 'walking_to_pc';
    customer.target = pc.group.position.clone().add(new THREE.Vector3(off.x, 0.65, off.z));
    customer.walking = true;
    customer.waitTime = 0;

    addEventLog('&#x1FA91; Customer seated at table (' + pc.seatsTaken + '/4)');
    if (window.Tutorial && Tutorial.active) Tutorial.onFlag('customer_seated');
  },

  // ── Checkout ──────────────────────────────────────────────────────────────
  checkout(customer) {
    if (customer._checkedOut) return;
    customer._checkedOut = true;

    const dish    = customer.orderedDish || { price: 45, cost: 10 };
    const skills  = GameState.skills || {};
    const quality = GameState.upgrades.pcQuality || 0;

    let base = dish.price + quality * 8;
    if (skills.extra_rice)   base += 15;
    if (skills.premium_ulam) base = Math.floor(base * 1.2);
    if (customer.isSuki)     base = Math.floor(base * 1.3);

    const tip = customer.isVIP
      ? Math.floor(base * 0.5)
      : Math.floor(base * (GameState.reputation / 200));

    const fiestaBonus = GameState.fiestaActive ? Math.floor(base * 0.5) : 0;
    const silogBonus  = (skills.silog_special && GameState.hour >= 6 && GameState.hour <= 10)
      ? Math.floor(base * 0.4) : 0;

    const trend = window.MARKET_TRENDS && window.MARKET_TRENDS.find(t => t.id === GameState.currentTrendId);
    const trendBonus = trend ? Math.floor(base * trend.bonus) : 0;

    GameState.comboCount = (GameState.comboCount || 0) + 1;
    const comboMult  = Math.min(1 + (GameState.comboCount - 1) * 0.05, 2.0);
    const comboBonus = GameState.comboCount >= 3 ? Math.floor(base * (comboMult - 1)) : 0;

    const total = Math.floor(base + tip + fiestaBonus + silogBonus + trendBonus + comboBonus);

    GameState.addCash(total, this._buildPopLabel(total, comboBonus, fiestaBonus, trendBonus));
    GameState.addXP(15 + (customer.isSuki ? 5 : 0) + (customer.isVIP ? 10 : 0));
    GameState.stats.totalCustomers++;

    // Satisfaction
    const happyEmo = customer.emotion === 'happy' || customer.emotion === 'eating';
    GameState.satisfaction = Math.min(100, (GameState.satisfaction || 50) + (happyEmo ? 2 : -1));

    if (customer.isSuki) GameState.sukiCount = (GameState.sukiCount || 0) + 1;

    // Sound
    if (window.SoundManager) SoundManager.play('coin');

    // Combo notification
    this._updateComboHUD();
    if (GameState.comboCount === 3)  { showToast('&#x1F525; 3x COMBO! Keep it up!', 'success'); if (window.SoundManager) SoundManager.play('combo'); }
    if (GameState.comboCount === 5)  { showToast('&#x1F525;&#x1F525; 5x COMBO! On fire!', 'success'); if (window.SoundManager) SoundManager.play('combo'); }
    if (GameState.comboCount === 10) { showToast('&#x1F4A5; 10x MEGA COMBO!', 'success'); if (window.SoundManager) SoundManager.play('combo'); }

    addEventLog('&#x1F4B0; Paid &#x20B1;' + total + (comboBonus > 0 ? ' (&#x1F525;x' + GameState.comboCount + ' combo!)' : ''));

    customer.state = 'leaving';
    customer.target = new THREE.Vector3(0, 0.65, 8.5);
    customer.walking = true;

    if (window.Tutorial && Tutorial.active) Tutorial.onFlag('cash_earned');
  },

  _buildPopLabel(total, comboBonus, fiestaBonus, trendBonus) {
    let label = '+&#x20B1;' + total;
    const combo = GameState.comboCount || 0;
    if (combo >= 5)       label += ' &#x1F525;x' + combo;
    if (fiestaBonus > 0)  label += ' &#x1F389;';
    if (trendBonus > 0)   label += ' &#x1F4C8;';
    return label;
  },

  _breakCombo() {
    if ((GameState.comboCount || 0) >= 3) {
      showToast('&#x1F494; Combo broken!', 'warn');
      if (window.SoundManager) SoundManager.play('error');
    }
    GameState.comboCount = 0;
    this._updateComboHUD();
  },

  _updateComboHUD() {
    const el = document.getElementById('combo-display');
    if (!el) return;
    const c = GameState.comboCount || 0;
    if (c >= 3) {
      el.style.display = 'flex';
      const cnt = document.getElementById('combo-count');
      if (cnt) cnt.textContent = '\uD83D\uDD25 x' + c + ' COMBO';
      el.style.color = c >= 10 ? 'var(--gold)' : c >= 5 ? 'var(--warn)' : 'var(--neon2)';
    } else {
      el.style.display = 'none';
    }
  },

  // ── Tick ──────────────────────────────────────────────────────────────────
  tickCustomers() {
    GameState.customers.forEach(c => {
      const handler = this.stateHandlers[c.state];
      if (handler) handler.tick(c);
      this.showEmotionBubble(c);
      const emo = this.EMOTIONS[c.emotion];
      if (emo) GameState.addReputation(emo.rep * 0.08);
    });

    // Manager auto-seats (up to 4 per table)
    if (GameState.staff.some(s => s.roleId === 'manager')) {
      const queued = GameState.customers.find(c => c.state === 'queued');
      const freePC = GameState.pcs.find(p => !p.broken && (p.seatsTaken || 0) < 4);
      if (queued && freePC) this.assignPC(queued, freePC);
    }

    // Waiter auto-pays
    if (GameState.staff.some(s => s.roleId === 'waiter')) {
      const waiting = GameState.customers.find(c => c.state === 'waiting_to_pay');
      if (waiting) { this.checkout(waiting); addEventLog('&#x1F935; Waiter processed payment'); }
    }

    // Spawn logic
    let spawnChance = (GameState.weather === 'rain' ? 0.12 : 0.35)
      * (0.4 + (GameState.rating / 5) * 0.6);
    if (GameState.skills && GameState.skills.viral_carinderia) spawnChance *= 1.35;
    if (GameState.upgrades.socialMedia) spawnChance *= 1.2;
    if (GameState.upgrades.neon)        spawnChance *= 1.1;
    if (GameState.hour >= 11 && GameState.hour <= 13) {
      spawnChance *= 1.6;
    }

    const hasSeats = GameState.pcs.some(p => !p.broken && (p.seatsTaken || 0) < 4);
    if (Math.random() < spawnChance && hasSeats) {
      this.spawnCustomer();
      SceneManager.updateFullSign(false);
    }

    // Combo decay
    if ((GameState.comboCount || 0) > 0 && GameState.customers.filter(c => c.state === 'eating').length === 0) {
      GameState.comboCount = Math.max(0, GameState.comboCount - 1);
      this._updateComboHUD();
    }
  },

  // ── Frame update ──────────────────────────────────────────────────────────
  update(delta) {
    GameState.customers.forEach(c => {
      const handler = this.stateHandlers[c.state];
      if (handler) handler.update(c, delta);

      if (c.walking) {
        const dir = c.target.clone().sub(c.mesh.position);
        if (dir.length() < 0.12) {
          c.walking = false;
          c.mesh.position.copy(c.target);
          if (c.state === 'leaving') {
            SceneManager.scene.remove(c.mesh);
            const idx = GameState.customers.indexOf(c);
            if (idx > -1) GameState.customers.splice(idx, 1);
          } else if (c.state === 'walking_to_pc') {
            c.state = 'ordering';
            c.orderTimer = 4;
            c.emotion = 'hungry';
            c._tapIndicatorShown = false;
          }
        } else {
          dir.normalize();
          c.mesh.lookAt(c.mesh.position.clone().add(dir));

          // Separation steering — prevent customers and staff from overlapping
          const sep = new THREE.Vector3();
          GameState.customers.forEach(other => {
            if (other === c || !other.mesh) return;
            const d = c.mesh.position.clone().sub(other.mesh.position);
            const dist = d.length();
            if (dist < 0.55 && dist > 0.001) sep.add(d.normalize().multiplyScalar((0.55 - dist) * 0.5));
          });
          GameState.staff.forEach(s => {
            if (!s.mesh) return;
            const d = c.mesh.position.clone().sub(s.mesh.position);
            const dist = d.length();
            if (dist < 0.5 && dist > 0.001) sep.add(d.normalize().multiplyScalar((0.5 - dist) * 0.3));
          });

          const move = dir.clone().multiplyScalar(c.speed * delta * 60).add(sep.multiplyScalar(delta * 60));
          c.mesh.position.add(move);
          // Clamp inside room bounds (away from walls and counter)
          c.mesh.position.x = Math.max(-8.2, Math.min(8.2, c.mesh.position.x));
          c.mesh.position.z = Math.max(-8.2, Math.min(8.8, c.mesh.position.z));
        }
      }
    });
  },

  spawnBurst(count) {
    for (let i = 0; i < count; i++) setTimeout(() => this.spawnCustomer(), i * 350);
  },

  // ── Bubble helpers ────────────────────────────────────────────────────────
  showTextBubble(customer, text) {
    if (!customer.mesh) return;
    const old = customer.mesh.getObjectByName('bubble');
    if (old) customer.mesh.remove(old);
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(20,12,8,0.88)';
    if (ctx.roundRect) ctx.roundRect(4, 4, 504, 88, 14);
    else ctx.rect(4, 4, 504, 88);
    ctx.fill();
    ctx.fillStyle = '#fff7ea';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 56);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas), transparent: true
    }));
    sprite.name = 'bubble';
    sprite.scale.set(2.8, 0.52, 1);
    sprite.position.y = 1.1;
    customer.mesh.add(sprite);
    setTimeout(() => { if (customer.mesh) this.showEmotionBubble(customer); }, 3000);
  },

  showEmotionBubble(customer) {
    if (!customer.mesh) return;
    const old = customer.mesh.getObjectByName('emotion');
    if (old) customer.mesh.remove(old);
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const icons = { happy:'&#x1F60A;', excited:'&#x1F60D;', angry:'&#x1F621;', bored:'&#x1F634;', hungry:'&#x1F37D;', eating:'&#x1F60B;', vip:'&#x1F451;', waiting:'&#x23F3;', suki:'&#x1F49B;' };
    const emoMap = { happy:'😊', excited:'😍', angry:'😡', bored:'😴', hungry:'🍽', eating:'😋', vip:'👑', waiting:'⏳', suki:'💛' };
    ctx.font = '40px serif';
    ctx.textAlign = 'center';
    ctx.fillText(emoMap[customer.emotion] || '😊', 32, 44);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas), transparent: true
    }));
    sprite.name = 'emotion';
    sprite.scale.set(0.45, 0.45, 0.45);
    sprite.position.y = 0.75;
    customer.mesh.add(sprite);
  },

  fulfillSnack(c)  { this.checkout(c); },
  fulfillCoffee(c) { this.checkout(c); },
};
