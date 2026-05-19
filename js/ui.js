/* ===== UI SYSTEM ===== */

// Centralized UI Manager to handle state and navigation
const UIManager = { // Changed to const to prevent re-declaration issues
  activeModal: null,
  history: [],
  sidebarCollapsed: false,
  rightPanelsCollapsed: false,

  // Centralized Modal Mapping
  renderers: { // Functions are defined later, so we reference them directly here
    upgrades: () => renderUpgrades(),
    staff:    () => renderStaff(),
    rivals:   () => renderRivals(),
    achievements: () => renderAchievements(),
    skills:   () => renderSkills(),
    settings: () => renderSettings(),
    credits:  () => renderCredits(),
    reception: () => renderReception(),
    server:    renderOwnerLedger,
    certificate: renderCertificate,
    dayEnd:    renderDayEnd,
    pancitMinigame: renderCookingMinigame,
    managerStats: renderManagerStats,
    hacking:   renderSabotageMinigame,
    foodMenu:  renderFoodMenu,
    rooms:     renderRoomExpansions,
    minigame_cook:    () => renderMiniCook(),
    minigame_wash:    () => renderMiniWash(),
    minigame_cash:    () => renderMiniCash(),
    minigame_restock: () => renderMiniRestock(),
    spin_wheel:       () => renderSpinWheel(),
  },

  titles: {
    upgrades:      '&#x2B06;&#xFE0F; UPGRADES',
    staff:         '&#x1F454; STAFF',
    rivals:        '&#x2694;&#xFE0F; RIVALS',
    achievements:  '&#x1F396;&#xFE0F; ACHIEVEMENTS',
    skills:        '&#x1F333; SKILL TREE',
    settings:      '&#x2699;&#xFE0F; SETTINGS',
    credits:       '&#x2139;&#xFE0F; CREDITS',
    reception:     '&#x1F6CE;&#xFE0F; HOST STAND',
    server:        '&#x1F4D6; OWNER\'S LEDGER',
    certificate:   '&#x1F4DC; CERTIFICATE',
    dayEnd:        '&#x1F4C5; DAY FINISHED',
    pancitMinigame:'&#x1F35C; MANUAL WOK STATION',
    managerStats:  '&#x1F465; STAFF MONITOR',
    hacking:       '&#x1F6A8; SECURITY BREACH',
    foodMenu:      '&#x1F4CB; FOOD MENU',
    rooms:         '&#x1F3D7;&#xFE0F; ROOM EXPANSIONS',
    minigame_cook:    '&#x1F525; COOKING CHALLENGE',
    minigame_wash:    '&#x1FAE7; DISHWASHING RUSH',
    minigame_cash:    '&#x1F4B0; CASH REGISTER',
    minigame_restock: '&#x1F4E6; RESTOCK INGREDIENTS',
    spin_wheel:       '&#x1F3A1; SPIN THE WHEEL',
  },

  init() {
    console.log("🖥️ UIManager Initialized");
    // Ensure initial states are clean
    this.closeModal();
  },

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    const container = document.getElementById('hud-main-container');
    const btn = document.getElementById('btn-toggle-left');
    container.classList.toggle('collapsed', this.sidebarCollapsed);
    btn.textContent = this.sidebarCollapsed ? '▶' : '◀';
  },

  toggleRightPanels() {},  // removed — right panel eliminated

  goBack() {
    if (this.history.length > 0) {
      const last = this.history.pop();
      openModal(last.route, last.data, 'back');
    } else {
      this.closeModal();
    }
  },

  updateHeader() {
    const backBtn = document.getElementById('modal-back-btn');
    if (backBtn) {
      backBtn.classList.toggle('hidden', this.history.length === 0);
    }
  },

  closeModal() {
    // Clear any minigame timers or states if a minigame modal was active
    if (this.activeModal === 'pancitMinigame' && window.pancitMinigameTimer) clearInterval(window.pancitMinigameTimer);
    if (this.activeModal === 'server' && window.serverMaintenanceTimer) clearInterval(window.serverMaintenanceTimer);
    this.activeModal = null;
    this.history = [];
    currentModalData = null;
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-body').innerHTML = '';
    this.updateHeader();
  }
};

// Make UIManager globally accessible after its definition
window.UIManager = UIManager;

// ===== GAME START / STOP (Moved into UIManager) =====
UIManager.startGame = function(isLoad, saveData, newName) {
  const loading = document.getElementById('loading-screen');
  const menu = document.getElementById('main-menu');
  const status = document.getElementById('loading-status');

  loading.classList.remove('hidden', 'fade-out');
  menu.style.display = 'none';

  // Reset scene/renderer so init() runs fresh on every game start
  if (window.SceneManager && SceneManager.frameId) { cancelAnimationFrame(SceneManager.frameId); SceneManager.frameId = null; }
  if (window.SceneManager) SceneManager.renderer = null;
  if (window.CameraSystem) CameraSystem.initialized = false;

  if (isLoad && saveData) {
    GameState.restore(saveData);
  } else {
    Object.assign(GameState, {
      cafeName: newName || 'Kain Oyats',
      cash: 500, xp: 0, level: 1, reputation: 0,
      day: 1, hour: 8, minute: 0,
      pcs: [], customers: [], staff: [], skills: {}, achievements: {},
      trash: [], pendingPayments: [], reviews: [],
      stats: { totalEarned: 0, totalCustomers: 0, fiestaEvents: 0, daysPlayed: 0 },
      upgrades: {
        internet: 0, pcQuality: 0, lighting: false, aircon: false, snackbar: false,
        security: false, neon: false, serverRack: false,
        coffeeMachine: false, serverLevel: 1,
        serverHealth: 100, pancitCooker: false, unpaidBills: [], totalPowerUsage: 0,
        soundproofing: false, ergonomicChairs: false, wallColor: 0, floorPattern: 0,
        securityCameras: false, staffLounge: false, socialMedia: false, verifiedBadge: false,
        deliveryBox: false, diningChairs: 0, outdoorSeating: false, pisonetMode: false,
        unlockedDishes: [], expansionRooms: [], accountantRoom: false
      },
      sukiCount: 0, fiestaActive: false, satisfaction: 50, comboCount: 0, streakDay: 0,
      playtime: 0, currentTrendId: 'stable',
      loginStreak: 0, lastLogin: null, difficulty: 'normal', weather: 'clear'
    });
    document.getElementById('btn-pancit')?.classList.add('hidden');
    // Start with NO tables — tutorial teaches player to buy first one
    // (no starter table placed)
  }

  document.getElementById('loading-cafe-name').textContent = GameState.cafeName;
  status.textContent = 'LOADING...';
  status.className = 'loading-text';

  // Defer heavy init so the loading screen actually renders first
  setTimeout(() => {
    try {
      CameraSystem.init();
      SceneManager.init();
      UIManager.init();
      if (window.SoundManager) SoundManager.init();
      SceneManager.rebuildFullScene();
      clearInterval(tickInterval);
      startTick();
      checkDailyReward();
    } catch (err) {
      console.error('Game init error:', err);
    }

    status.textContent = 'OPEN';
    status.className = 'loading-text status-open';

    setTimeout(() => {
      loading.classList.add('fade-out');
      setTimeout(() => loading.classList.add('hidden'), 500);
      document.getElementById('game-canvas').classList.remove('hidden');
      document.getElementById('hud').classList.remove('hidden');
      document.getElementById('right-panels-wrap')?.classList.remove('hidden');
      updateHUD();
      updateQueueSidebar();
      if (!isLoad) setTimeout(() => Tutorial.start(), 800);
    }, 600);
  }, 100);
};

// ===== GAME START / STOP (Global Functions) =====
function showMainMenu() {
  SaveSystem.saveGame(true);
  clearInterval(tickInterval);
  if (SceneManager.frameId) { cancelAnimationFrame(SceneManager.frameId); SceneManager.frameId = null; }
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('game-canvas').classList.add('hidden');
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('main-menu').style.display = '';
  UIManager.closeModal();
  GameState.pcs = []; GameState.customers = []; GameState.staff = []; GameState.trash = [];
  SceneManager.resetScene();
  SceneManager.renderer = null;
  CameraSystem.initialized = false;
}

// ===== HUD UPDATES =====
function updateHUD() {
  document.getElementById('val-cash').textContent   = '₱' + Math.floor(GameState.cash).toLocaleString();
  updateSidebarAffordability();
  document.getElementById('val-rep').textContent    = Math.floor(GameState.reputation) + '%';
  document.getElementById('val-cust').textContent   = GameState.customers.length + '/' + GameState.maxCustomers;
  document.getElementById('val-level').textContent  = 'Lv.' + GameState.level;

  // Show carinderia name in HUD top
  let nameEl = document.getElementById('hud-cafe-name');
  if (!nameEl) {
    nameEl = document.createElement('div');
    nameEl.id = 'hud-cafe-name';
    nameEl.style.cssText = 'font-family:var(--font-head);font-size:13px;font-weight:900;color:var(--gold);letter-spacing:2px;white-space:nowrap;padding:0 8px;border-left:1px solid var(--border);margin-left:4px;';
    const hudTop = document.getElementById('hud-top'); // Corrected variable name
    if (hudTop) hudTop.insertBefore(nameEl, hudTop.querySelector('.hud-btns'));
  }
  nameEl.textContent = GameState.cafeName || 'KantoKain';
  
  const date = GameState.currentDate;
  const weatherIcon = GameState.weather === 'rain' ? '🌧️' : '☀️';
  document.getElementById('val-time').textContent   = `${weatherIcon} Y${date.year} M${date.month} D${date.day}`;
  document.getElementById('val-hour').textContent   = String(GameState.hour).padStart(2,'0') + ':' + String(GameState.minute).padStart(2,'0');
  document.getElementById('val-speed-indicator').textContent = GameState.speed + 'x';

  // Satisfaction meter
  const sat = GameState.satisfaction ?? 50;
  const satBar = document.getElementById('satisfaction-bar');
  const satVal = document.getElementById('satisfaction-val');
  if (satBar) satBar.style.width = sat + '%';
  if (satVal) satVal.textContent = Math.floor(sat) + '%';

  // Lunch rush banner
  const lunchBanner = document.getElementById('lunch-rush-banner');
  if (lunchBanner) {
    const isLunch = GameState.hour >= 11 && GameState.hour <= 13;
    lunchBanner.style.display = isLunch ? 'block' : 'none';
  }

  // Market Trend Update
  const trend = window.MARKET_TRENDS.find(t => t.id === GameState.currentTrendId) || window.MARKET_TRENDS[0];
  document.getElementById('val-trend').textContent = trend.name.toUpperCase();
  document.getElementById('trend-icon').textContent = trend.icon;
  document.getElementById('stat-trend').title = trend.desc;

  // XP bar
  const cur = GameState.xp - GameState.getXPThreshold(GameState.level - 1);
  const next = GameState.getXPThreshold(GameState.level) - GameState.getXPThreshold(GameState.level - 1);
  document.getElementById('xp-bar').style.width = Math.min(100, (cur / next) * 100) + '%';

  // Rep bar
  document.getElementById('rep-bar').style.width = GameState.reputation + '%';
  document.getElementById('rep-label').textContent = Math.floor(GameState.reputation) + ' / 100';
  
  // Responsive Font Scaling (Inject Global Style)
  if (!document.getElementById('global-ui-scaling')) {
    const style = document.createElement('style');
    style.id = 'global-ui-scaling';
    style.innerHTML = `
      :root { --font-size-base: 16px; --spacing-std: 12px; }
      .modal-content { padding: var(--spacing-std); font-size: calc(var(--font-size-base) * 1.1); }
      .upgrade-name { font-size: 1.2rem; margin-bottom: 8px; }
      .hud-val { font-size: 1.1rem; font-weight: bold; }
      button { padding: 10px 15px; font-size: 1rem; cursor: pointer; transition: transform 0.1s; }
      button:active { transform: scale(0.95); }
    `;
    document.head.appendChild(style);
  }


}

function updateSidebarAffordability() {
  const btn = document.getElementById('btn-add-pc');
  if (!btn) return;
  if (GameState.cash >= 150) {
    btn.classList.add('can-afford');
    btn.classList.remove('cannot-afford');
  } else {
    btn.classList.add('cannot-afford');
    btn.classList.remove('can-afford');
  }
}

// Right panel removed — stub kept for compatibility
window.updateQueueSidebar = function() {};

// ===== MODALS =====
let currentModalData = null;
function openModal(id, data, navMode = 'reset') {
  // 1. Strict Route Validation
  // If passed an event, extract ID from dataset; otherwise use the string
  const route = (id && id.target && id.target.dataset && id.target.dataset.modalId) ? id.target.dataset.modalId : id;
  
  if (typeof route !== 'string' || !UIManager.renderers[route]) {
    console.warn(`Routing Error: Attempted to open invalid modal: ${route}`);
    return;
  }

  // 2. Navigation History Management
  if (navMode === 'reset') {
    UIManager.history = [];
  } else if (navMode === 'push' && UIManager.activeModal) {
    UIManager.history.push({ route: UIManager.activeModal, data: currentModalData });
  }

  UIManager.activeModal = route;
  currentModalData = null;
  
  const modalBody = document.getElementById('modal-body');
  modalBody.innerHTML = '<div class="loading-spinner"></div>'; // UI Feedback
  modalBody.scrollTop = 0;

  // 4. Data Injection
  if (route === 'reception' && typeof data === 'number') {
    currentModalData = GameState.customers[data];
  } else {
    currentModalData = data;
  }
  
  document.getElementById('modal-overlay').classList.remove('hidden');
  if (window.SoundManager) SoundManager.play('ui_open');

  // 5. Update UI
  document.getElementById('modal-title').textContent = UIManager.titles[route] || route.toUpperCase();
  UIManager.updateHeader();

  // 6. Execute renderer
  try {
    UIManager.renderers[route]();
  } catch (err) {
    console.error(`UI Renderer Crash in [${route}]:`, err);
    modalBody.innerHTML = `<div class="error">Failed to load ${route}.</div>`;
  }
}

function closeModal() {
  UIManager.closeModal();
}

// ===== RECEPTION MODAL (Host Stand — seat queued customer) =====
function renderReception() {
  const body = document.getElementById('modal-body');
  const customer = currentModalData;

  if (!customer) {
    body.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-dim)">No customer selected.</p>';
    return;
  }

  const freeTables = GameState.pcs.filter(p => !p.occupied && !p.broken);
  const icon = customer.isVIP ? '👑' : customer.isSuki ? '💛' : '👤';

  body.innerHTML = `
    <div style="text-align:center; padding:20px">
      <div style="font-size:48px; margin-bottom:10px">${icon}</div>
      <div style="font-family:var(--font-head); color:var(--gold); margin-bottom:6px">
        ${customer.isVIP ? 'VIP CUSTOMER' : customer.isSuki ? 'SUKI CUSTOMER 💛' : 'CUSTOMER'}
      </div>
      <div style="color:var(--text-dim); font-size:12px; margin-bottom:20px">
        Waiting: ${customer.waitTime} ticks | Mood: ${customer.emotion}
      </div>
      ${freeTables.length === 0
        ? '<div style="color:var(--danger);margin-bottom:20px">⛔ No free tables available!</div>'
        : `<div style="color:var(--success);margin-bottom:20px">✅ ${freeTables.length} table(s) available</div>`
      }
      <button class="menu-btn primary" style="width:100%" ${freeTables.length === 0 ? 'disabled' : ''}
        onclick="CustomerSystem.assignPC(currentModalData, GameState.pcs.find(p=>!p.occupied&&!p.broken)); closeModal(); updateQueueSidebar();">
        🪑 Seat Customer
      </button>
      <button class="upgrade-btn" style="width:100%; margin-top:10px; border-color:var(--danger); color:var(--danger)"
        onclick="closeModal()">
        ✕ Close
      </button>
    </div>
  `;
}

// ===== UPGRADES =====
window.UPGRADES_DATABASE = {
  internet:      { label:'Menu Selection',      icon:'📋',  maxLevel:4, costs:[200,400,800,1500],   desc:'More dishes = more customers & income' },
  pcQuality:     { label:'Ingredient Quality',  icon:'🥩',  maxLevel:4, costs:[300,600,1200,2500],  desc:'Better ingredients make more profitable food' },
  lighting:      { label:'LED Lighting',        icon:'💡',  maxLevel:1, costs:[150],                desc:'Improves ambiance and +5 reputation' },
  aircon:        { label:'Electric Fan',        icon:'🌀',  maxLevel:1, costs:[400],                desc:'Keeps customers cool and comfortable longer' },
  pisonetMode:   { label:'Merienda Corner',     icon:'🍢',  maxLevel:1, costs:[200],                desc:'Unlock quick merienda snack sales for extra income' },
  serverRack:    { label:'Inventory Ledger',    icon:'📦',  maxLevel:1, costs:[1000],               desc:'Enables centralized ingredient tracking' },
  snackbar:      { label:'Snack Bar',           icon:'🍡',  maxLevel:1, costs:[350],                desc:'Extra passive income from snacks' },
  security:      { label:'Security Cams',       icon:'📷',  maxLevel:1, costs:[250],                desc:'Reduces theft & vandalism events' },
  neon:          { label:'Neon Signs',          icon:'✨',  maxLevel:1, costs:[200],                desc:'Attracts more walk-in customers' },
  wallColor:     { label:'Wall Paint',          icon:'🎨',  maxLevel:4, costs:[100,200,400,800],    desc:'Change the interior wall theme' },
  floorPattern:  { label:'Flooring',            icon:'🏠',  maxLevel:4, costs:[150,300,500,1000],   desc:'Upgrade to premium floor patterns' },
  coffeeMachine: { label:'Drinks Station',      icon:'🥤',  maxLevel:1, costs:[500],                desc:'Serve drinks — passive ₱30/hr income' },
  pancitCooker:  { label:'Manual Wok Station',  icon:'🍜',  maxLevel:1, costs:[600],                desc:'Unlock manual cooking minigame & double snack income' },
  diningChairs:  { label:'Comfortable Chairs',  icon:'🪑',  maxLevel:3, costs:[200,400,800],        desc:'Customers stay longer and spend more' },
  outdoorSeating:{ label:'Outdoor Seating',     icon:'🌿',  maxLevel:1, costs:[500],                desc:'Adds extra seating capacity outside' },
  deliveryBox:   { label:'Delivery Service',    icon:'🛵',  maxLevel:1, costs:[800],                desc:'Accept delivery orders — passive ₱60/hr income' },
  staffLounge:   { label:'Staff Rest Area',     icon:'🛋️',  maxLevel:1, costs:[600],                desc:'Staff recover mood faster during breaks' },
  socialMedia:   { label:'Social Media Page',   icon:'📱',  maxLevel:1, costs:[300],                desc:'Attract 20% more customers via online presence' },
};

function renderUpgrades() {
  const body = document.getElementById('modal-body');
  body.innerHTML = '<div class="upgrade-grid">' + Object.keys(UPGRADES_DATABASE).map(id => {
    const u = UPGRADES_DATABASE[id];
    const cur = typeof GameState.upgrades[id] === 'boolean'
      ? (GameState.upgrades[id] ? 1 : 0)
      : GameState.upgrades[id];
    const maxed = cur >= u.maxLevel;
    const cost = maxed ? 0 : (u.costs[cur] || u.costs[0] || 0);
    const pips = Array.from({length: u.maxLevel}, (_,i) => `<div class="upgrade-pip ${i < cur ? 'filled' : ''}"></div>`).join('');

    return `<div class="upgrade-card ${maxed ? 'maxed' : ''}">
      <div class="upgrade-name">${u.icon} ${u.label}</div>
      <div class="upgrade-desc">${u.desc}</div>
      <div class="upgrade-level">${pips}</div>
      <button class="upgrade-btn" ${maxed || GameState.cash < cost ? 'disabled' : ''} onclick="buyUpgrade('${id}')">
        ${maxed ? '✅ MAXED' : '⬆️ UPGRADE — ₱' + cost}
      </button>
    </div>`;
  }).join('') + '</div>';
}

function buyUpgrade(id) {
  const def = UPGRADES_DATABASE[id];
  if (!def) return;
  const cur = typeof GameState.upgrades[id] === 'boolean' ? (GameState.upgrades[id] ? 1 : 0) : GameState.upgrades[id];
  if (cur >= def.maxLevel) return;
  const cost = def.costs[cur];
  if (GameState.cash < cost) { showToast('Not enough money!', 'warn'); return; }
  GameState.addCash(-cost, '-\u20B1' + cost);
  if (window.SoundManager) window.SoundManager.play('purchase');
  if (typeof GameState.upgrades[id] === 'boolean') GameState.upgrades[id] = true;
  else GameState.upgrades[id]++;
  // Visual changes per upgrade
  if (id === 'lighting')    { GameState.addReputation(5); SceneManager.addDynamicSceneElements(); }
  if (id === 'neon')        { GameState.addReputation(3); SceneManager.addDynamicSceneElements(); }
  if (id === 'wallColor' || id === 'floorPattern') SceneManager.updateVisualTheme();
  if (id === 'coffeeMachine') SceneManager.addCoffeeStation();
  if (id === 'snackbar')    SceneManager.addSnackBar();
  if (id === 'deliveryBox') SceneManager.addDeliveryBox();
  if (id === 'security' || id === 'securityCameras') SceneManager.addSecurityCamera();
  if (id === 'staffLounge') SceneManager.addStaffLounge();
  if (id === 'pancitCooker') document.getElementById('btn-pancit')?.classList.remove('hidden');
  if (id === 'pisonetMode') SceneManager.addMeriendaCorner();
  if (id === 'serverRack')  { SceneManager.addServerRack(); renderOwnerLedger(); }
  GameState.addXP(20);
  // Satisfying upgrade feedback
  _upgradeFlash(def.icon + ' ' + def.label + ' upgraded!');
  showToast('\u2705 ' + def.label + ' upgraded!', 'success');
  addEventLog('\u2B06\uFE0F Upgraded: ' + def.label);
  if (window.Tutorial && Tutorial.active) Tutorial.onFlag('upgrade_bought');
  renderUpgrades();
}

function _upgradeFlash(msg) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.7);z-index:2000;background:linear-gradient(135deg,rgba(255,211,122,0.18),rgba(255,106,61,0.12));border:2px solid var(--gold);border-radius:20px;padding:18px 32px;font-family:var(--font-head);font-size:18px;font-weight:900;color:var(--gold);letter-spacing:2px;text-align:center;pointer-events:none;animation:upgradeFlashAnim 0.7s cubic-bezier(0.175,0.885,0.32,1.275) forwards;';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 750);
  if (!document.getElementById('upgrade-flash-style')) {
    const s = document.createElement('style');
    s.id = 'upgrade-flash-style';
    s.textContent = '@keyframes upgradeFlashAnim{0%{opacity:0;transform:translate(-50%,-50%) scale(0.7)}40%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}70%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.05)}}';
    document.head.appendChild(s);
  }
}

// ===== STAFF =====
function renderStaff() {
  const body = document.getElementById('modal-body');
  let html = '';

  // Tutorial step hints
  const tutHints = {
    manager:    Tutorial.active && Tutorial.STEPS[Tutorial.stepIdx]?.id === 'hire_manager',
    waiter:     Tutorial.active && Tutorial.STEPS[Tutorial.stepIdx]?.id === 'hire_waiter',
    chef:       Tutorial.active && Tutorial.STEPS[Tutorial.stepIdx]?.id === 'hire_chef',
    cleaner:    Tutorial.active && Tutorial.STEPS[Tutorial.stepIdx]?.id === 'hire_cleaner',
    dishwasher: Tutorial.active && Tutorial.STEPS[Tutorial.stepIdx]?.id === 'hire_dishwasher',
  };

  // Group current staff by roleId
  const groupedStaff = {};
  GameState.staff.forEach(s => {
    if (!groupedStaff[s.roleId]) groupedStaff[s.roleId] = [];
    groupedStaff[s.roleId].push(s);
  });

  // Current staff
  html += '<div class="staff-section"><div class="staff-section-title" style="font-size:16px;letter-spacing:2px">YOUR TEAM (' + GameState.staff.length + ')</div>';
  if (GameState.staff.length > 0) {
    StaffSystem.ROLES.forEach(role => {
      const members = groupedStaff[role.id] || [];
      if (members.length === 0) return;
      html += `
        <details class="staff-dropdown" open>
          <summary style="font-size:15px">${role.icon} ${role.name.toUpperCase()} (${members.length})</summary>
          <div class="staff-list" style="padding:10px;">
            ${members.map(e => `
              <div class="staff-card">
                <div class="staff-avatar" style="font-size:28px">${e.icon}</div>
                <div class="staff-info">
                  <div class="staff-name">${e.name} <span style="font-size:12px;color:var(--text-dim)">${e.personality}</span></div>
                  <div class="staff-stats">Skill: ${e.skill} | Mood: <div class="staff-mood-bar"><div class="staff-mood-fill" style="width:${e.mood}%;background:${e.mood>60?'var(--success)':e.mood>30?'var(--warn)':'var(--danger)'}"></div></div> ₱${e.salary}/hr</div>
                </div>
                <button class="hire-btn" style="color:var(--danger);border-color:var(--danger);font-size:13px" onclick="StaffSystem.fire(${e.id})">Fire</button>
              </div>`).join('')}
          </div>
        </details>`;
    });
  } else {
    html += '<p style="text-align:center;padding:20px;color:var(--text-dim);font-size:15px">No staff hired yet. Hire your first employee below!</p>';
  }
  html += '</div>';

  // Hire section
  html += '<div class="staff-section"><div class="staff-section-title" style="font-size:16px;letter-spacing:2px">HIRE STAFF</div><div class="staff-list">';
  html += StaffSystem.ROLES.map(r => {
    const owned  = GameState.staff.filter(e => e.roleId === r.id).length;
    const locked = GameState.level < r.minLevel;
    const cost   = r.salary * 3;
    const isTutTarget = tutHints[r.id];
    return `<div class="staff-card ${isTutTarget ? 'tut-highlight' : ''}" style="${locked?'opacity:0.45':''}${isTutTarget?';border:2px solid var(--gold);background:rgba(255,211,122,0.08)':''}">
      <div class="staff-avatar" style="font-size:30px">${r.icon}</div>
      <div class="staff-info">
        <div class="staff-name" style="font-size:16px">${r.name} ${locked ? '<span style="color:var(--danger);font-size:13px">[Lv.'+r.minLevel+' req]</span>' : ''}</div>
        <div class="staff-role" style="font-size:13px;color:var(--text-dim);margin:3px 0">${r.desc}</div>
        <div class="staff-stats" style="font-size:13px">₱${r.salary}/hr | Hired: ${owned}</div>
      </div>
      <button class="hire-btn" style="font-size:14px;padding:10px 16px${isTutTarget?';background:var(--gold);color:#1a0a00;border-color:var(--gold);font-weight:800':''}" onclick="StaffSystem.hire('${r.id}')" ${locked||GameState.cash<cost?'disabled':''}>Hire — ₱${cost}</button>
    </div>`;
  }).join('');
  html += '</div></div>';

  body.innerHTML = html;
}

// ===== RIVALS =====
function renderRivals() {
  const body = document.getElementById('modal-body');
  const board = RivalSystem.getLeaderboard();
  const playerRank = board.findIndex(r => r.isPlayer) + 1;
  const rankEmoji = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣'][playerRank - 1] || '🏅';

  let html = `
    <div style="text-align:center;margin-bottom:18px;padding:14px;background:rgba(255,211,122,0.07);border:1px solid rgba(255,211,122,0.2);border-radius:14px">
      <div style="font-size:36px;margin-bottom:6px">${rankEmoji}</div>
      <div style="font-family:var(--font-head);font-size:18px;color:var(--gold);font-weight:800">YOUR RANK: #${playerRank}</div>
      <div style="font-size:14px;color:var(--text-dim);margin-top:4px">${playerRank === 1 ? '🏆 You are the TOP carinderia!' : 'Beat the rivals above you to climb the ranks!'}</div>
    </div>
    <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);letter-spacing:2px;margin-bottom:12px">⚔️ LEADERBOARD</div>`;

  html += board.map((r, i) => {
    const medals = ['🥇','🥈','🥉'];
    const medal  = medals[i] || (i + 1) + '.';
    const repBar = Math.min(100, r.rep);
    return `
    <div class="rival-card" style="${r.isPlayer ? 'border-color:var(--neon);background:rgba(0,200,255,0.07);' : ''}margin-bottom:12px;border-radius:14px;padding:14px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <span style="font-size:22px">${medal}</span>
        <span style="font-size:24px">${r.icon}</span>
        <div style="flex:1">
          <div class="rival-name" style="font-size:17px;font-weight:800;${r.isPlayer?'color:var(--neon)':''}">${r.name}</div>
          <div style="font-size:12px;color:var(--text-dim)">Level ${r.level || 1}</div>
        </div>
        ${r.isPlayer ? '<span style="font-family:var(--font-mono);font-size:11px;color:var(--neon);background:rgba(0,200,255,0.15);padding:3px 10px;border-radius:8px;border:1px solid var(--neon)">YOU</span>' : ''}
      </div>
      <div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim);margin-bottom:4px">
          <span>Reputation</span><span style="color:var(--gold);font-weight:700">${r.rep}%</span>
        </div>
        <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${repBar}%;background:${r.isPlayer?'var(--neon)':'var(--gold)'};border-radius:4px;transition:width 0.5s"></div>
        </div>
      </div>
      <div class="rival-stats-grid">
        <div class="rival-stat"><span class="rival-stat-val" style="font-size:18px">${r.pcs}</span><span class="rival-stat-lbl">TABLES</span></div>
        <div class="rival-stat"><span class="rival-stat-val" style="font-size:18px">${r.internet}x</span><span class="rival-stat-lbl">MENU LVL</span></div>
        <div class="rival-stat"><span class="rival-stat-val" style="font-size:18px">${r.fame || 0}</span><span class="rival-stat-lbl">FAME</span></div>
      </div>
    </div>`;
  }).join('');

  body.innerHTML = html;
}

// ===== ACHIEVEMENTS =====
function renderAchievements() {
  const body = document.getElementById('modal-body');
  const unlocked = ACHIEVEMENTS.filter(a => GameState.achievements[a.id]).length;
  const pct = Math.round((unlocked / ACHIEVEMENTS.length) * 100);

  body.innerHTML = `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;margin-bottom:6px">
        <span style="color:var(--gold)">🎖️ UNLOCKED: ${unlocked} / ${ACHIEVEMENTS.length}</span>
        <span style="color:var(--neon)">${pct}%</span>
      </div>
      <div style="height:10px;background:rgba(255,255,255,0.08);border-radius:5px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--gold),var(--neon));border-radius:5px;transition:width 0.5s"></div>
      </div>
    </div>
    <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);margin-bottom:14px;letter-spacing:2px">UNLOCKED: ${unlocked} / ${ACHIEVEMENTS.length}</div>
  <div class="ach-grid">` + ACHIEVEMENTS.map(a => {
    const isUnlocked = !!GameState.achievements[a.id];
    return `
    <div class="ach-card ${isUnlocked ? 'unlocked' : ''}" ${isUnlocked ? `onclick="openModal('certificate', '${a.id}', 'push')" style="cursor:pointer;"` : ''}>
      <div class="ach-card-icon" style="font-size:32px">${a.icon}</div>
      <div class="ach-card-name" style="font-size:15px;font-weight:800">${a.name}</div>
      <div class="ach-card-desc" style="font-size:13px">${a.desc}</div>
      ${isUnlocked ? `
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--gold);margin-top:6px;font-weight:700">+₱${a.reward}</div>
        <div style="font-size:11px;color:var(--neon);margin-top:8px;letter-spacing:1px">TAP TO VIEW CERTIFICATE</div>
      ` : `<div style="font-size:12px;color:var(--text-dim);margin-top:6px">🔒 Locked</div>`}
    </div>`;
  }).join('') + '</div>';
}

function renderCertificate() {
  const achId = currentModalData;
  const ach = ACHIEVEMENTS.find(a => a.id === achId);
  const body = document.getElementById('modal-body');

  // Check for first-time view to trigger confetti
  const achData = GameState.achievements[achId];
  if (achData && achData.viewed === false) {
    achData.viewed = true;
    setTimeout(triggerConfetti, 300);
  }
  
  body.innerHTML = `
    <div class="certificate-wrap">
      <div class="cert-border ${ach.isGolden ? 'golden' : ''}">
        <div class="cert-content ${ach.isGolden ? 'golden' : ''}">
          <div class="cert-header">${ach.isGolden ? '✨ GOLDEN ACHIEVEMENT ✨' : 'CERTIFICATE OF ACHIEVEMENT'}</div>
          <div class="cert-icon">${ach.icon}</div>
          <div class="cert-main">
            This is to certify that
            <span class="cert-name">${GameState.cafeName}</span>
            has successfully accomplished the feat of
            <span class="cert-ach-name">${ach.name}</span>
          </div>
          <div class="cert-desc">${ach.desc}</div>
          <div class="cert-footer">
            <div class="cert-seal">BY<span>TE</span></div>
            <div class="cert-date">Day ${GameState.day}, Year 20XX</div>
          </div>
        </div>
      </div>
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="upgrade-btn" style="flex:1; border-color:var(--gold); color:var(--gold)" onclick="shareCertificate()">📸 SHARE ACHIEVEMENT</button>
      </div>
    </div>
  `;
}

function renderSabotageMinigame() {
  const body = document.getElementById('modal-body');
  const codes = ['ADOBO-RECIPE', 'SINIGANG-SECRET', 'HALO-HALO-MIX', 'LECHON-MARINADE'];
  const target = codes[Math.floor(Math.random()*codes.length)];
  
  body.innerHTML = `
    <div style="text-align:center; padding:20px; color:var(--danger)">
      <div style="font-size:64px; margin-bottom:20px">👀</div>
      <h3>RIVAL SABOTAGE DETECTED!</h3>
      <p>A rival is trying to steal your secret recipe! Type the recipe name to protect it!</p>
      <div class="hacking-code">${target}</div>
      <input type="text" class="hacking-input" id="hacking-input" placeholder="TYPE RECIPE NAME HERE..." autofocus>
    </div>
  `;

  const input = document.getElementById('hacking-input');
  input.addEventListener('input', () => {
    if (input.value.toUpperCase() === target) {
      GameState.addCash(200, '+₱200 Recipe Protected');
      GameState.addReputation(5);
      showToast('🛡️ Secret Recipe Protected!', 'success');
      closeModal();
    }
  });
  
  const interval = setInterval(() => {
    if (!document.getElementById('modal-overlay').classList.contains('hidden')) {
      GameState.addCash(-5, 'Sabotage draining...');
    } else clearInterval(interval);
  }, 2000);
}

function renderDayEnd() {
  const body = document.getElementById('modal-body');
  const income = GameState.dailyIncome || 0;
  const expenses = GameState.dailyExpenses || 0;
  const net = income - expenses;
  const netColor = net >= 0 ? 'var(--success)' : 'var(--danger)';
  
  body.innerHTML = `
    <div style="text-align:center; padding: 20px;">
      <div style="font-size:48px; margin-bottom:15px;">📊</div>
      <h2 style="color:var(--neon); margin-bottom:10px;">DAY ${GameState.day} SUMMARY</h2>
      
      <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:8px; margin-bottom:25px; font-family:var(--font-mono);">
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <span>Daily Income:</span>
          <span style="color:var(--success)">+₱${income.toLocaleString()}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid var(--border); padding-bottom:10px;">
          <span>Daily Expenses:</span>
          <span style="color:var(--danger)">-₱${expenses.toLocaleString()}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:18px; font-weight:bold; margin-top:10px;">
          <span>NET PROFIT:</span>
          <span style="color:${netColor}">₱${net.toLocaleString()}</span>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-family:var(--font-mono); font-size:10px; color:var(--text-dim); margin-bottom:5px; text-align:left;">NET PROFIT TREND (24H)</div>
        <canvas id="day-summary-chart" width="500" height="150" style="width:100%; height:100px; background:rgba(0,0,0,0.5); border:1px solid var(--border); border-radius:4px;"></canvas>
      </div>

      <button class="menu-btn primary" style="width:100%" onclick="GameState.nextDay(); closeModal();">
        START DAY ${GameState.day + 1}
      </button>
      <div style="margin-top:15px; font-size:10px; color:var(--text-dim);">The cafe will open at 08:00 AM</div>
    </div>
  `;

  // Draw the chart after the HTML is injected
  setTimeout(() => drawIncomeChart(GameState.hourlyIncomeLog), 100);
}

function drawIncomeChart(data) {
  const canvas = document.getElementById('day-summary-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const padding = 20;

  ctx.clearRect(0, 0, w, h);
  
  if (data.length < 2) return;

  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const range = max - min;

  // Draw Baseline
  ctx.strokeStyle = '#333';
  ctx.beginPath();
  const zeroY = h - padding - ((0 - min) / range) * (h - padding * 2);
  ctx.moveTo(padding, zeroY); ctx.lineTo(w - padding, zeroY);
  ctx.stroke();

  // Draw Line
  ctx.strokeStyle = 'var(--neon)';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'var(--neon)';
  ctx.beginPath();

  for (let i = 0; i < data.length; i++) {
    const x = padding + (i / (data.length - 1)) * (w - padding * 2);
    const y = h - padding - ((data[i] - min) / range) * (h - padding * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  
  // Points
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 0;
  data.forEach((val, i) => {
    const x = padding + (i / (data.length - 1)) * (w - padding * 2);
    const y = h - padding - ((val - min) / range) * (h - padding * 2);
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  });
}

function triggerConfetti() {
  const container = document.querySelector('.certificate-wrap');
  if (!container) return;
  
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-particle';
    p.style.left = '50%';
    p.style.top = '50%';
    p.style.backgroundColor = ['#00c8ff', '#ff2d78', '#39ff14', '#ffd700'][Math.floor(Math.random() * 4)];
    p.style.setProperty('--tx', (Math.random() - 0.5) * 400 + 'px');
    p.style.setProperty('--ty', (Math.random() - 0.5) * 400 + 'px');
    p.style.setProperty('--tr', Math.random() * 720 + 'deg');
    container.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }
  showToast("🎊 Congratulations on your achievement!", "success");
};

function shareCertificate() {
  const certElement = document.querySelector('.cert-border');
  if (!certElement) return;
  if (typeof html2canvas === 'undefined') {
    showToast("Capture system not ready. Try again in a second.", "warn");
    return;
  }

  showToast("📸 Capturing certificate...", "info");
  
  // Brief flash effect
  const flash = document.createElement('div');
  flash.style.cssText = "position:fixed;inset:0;background:white;z-index:3000;opacity:0.8;pointer-events:none;";
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 100);

  html2canvas(certElement, {
    backgroundColor: '#080b14',
    scale: 2,
  }).then(canvas => {
    const link = document.createElement('a'); // Corrected variable name
    link.download = `KantoKain_Achievement_${GameState.cafeName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("💾 Certificate saved to your downloads!", "success");
  });
};

// ===== FOOD MENU SYSTEM =====
window.FOOD_MENU = [
  { id:'adobo',       name:'Adobo',          icon:'🍖', price:55,  cost:15, xp:10, level:1,  desc:'Classic Filipino pork/chicken adobo' },
  { id:'sinigang',    name:'Sinigang',        icon:'🍲', price:65,  cost:20, xp:12, level:1,  desc:'Sour tamarind soup with veggies' },
  { id:'kare_kare',   name:'Kare-Kare',       icon:'🥜', price:75,  cost:25, xp:15, level:2,  desc:'Peanut stew with oxtail' },
  { id:'sisig',       name:'Sisig',           icon:'🥩', price:60,  cost:18, xp:12, level:2,  desc:'Sizzling chopped pork face' },
  { id:'lumpia',      name:'Lumpia',          icon:'🌯', price:35,  cost:8,  xp:8,  level:1,  desc:'Filipino spring rolls' },
  { id:'pancit',      name:'Pancit',          icon:'🍜', price:45,  cost:12, xp:10, level:1,  desc:'Stir-fried noodles' },
  { id:'tinola',      name:'Tinola',          icon:'🍗', price:55,  cost:15, xp:10, level:2,  desc:'Ginger chicken soup' },
  { id:'tapsilog',    name:'Tapsilog',        icon:'🍳', price:55,  cost:15, xp:10, level:1,  desc:'Tapa, sinangag, itlog' },
  { id:'longsilog',   name:'Longsilog',       icon:'🌭', price:50,  cost:12, xp:10, level:1,  desc:'Longganisa, sinangag, itlog' },
  { id:'tocilog',     name:'Tocilog',         icon:'🍱', price:50,  cost:12, xp:10, level:1,  desc:'Tocino, sinangag, itlog' },
  { id:'bbq',         name:'BBQ',             icon:'🍢', price:40,  cost:10, xp:8,  level:1,  desc:'Pork BBQ on a stick' },
  { id:'halo_halo',   name:'Halo-Halo',       icon:'🍧', price:40,  cost:10, xp:8,  level:2,  desc:'Mixed shaved ice dessert' },
  { id:'turon',       name:'Turon',           icon:'🍌', price:25,  cost:6,  xp:6,  level:1,  desc:'Banana spring roll' },
  { id:'lechon_kawali',name:'Lechon Kawali',  icon:'🥓', price:80,  cost:28, xp:18, level:3,  desc:'Deep-fried crispy pork belly' },
  { id:'bicol_express',name:'Bicol Express',  icon:'🌶️', price:65,  cost:20, xp:14, level:3,  desc:'Spicy pork in coconut milk' },
  { id:'inasal',      name:'Chicken Inasal',  icon:'🍗', price:70,  cost:22, xp:15, level:3,  desc:'Grilled marinated chicken' },
  { id:'dinuguan',    name:'Dinuguan',        icon:'🫙', price:60,  cost:18, xp:12, level:3,  desc:'Pork blood stew' },
  { id:'caldereta',   name:'Caldereta',       icon:'🥘', price:75,  cost:25, xp:16, level:4,  desc:'Spicy goat/beef tomato stew' },
  { id:'palabok',     name:'Palabok',         icon:'🍝', price:65,  cost:20, xp:14, level:4,  desc:'Rice noodles with shrimp sauce' },
  { id:'batchoy',     name:'Batchoy',         icon:'🍜', price:60,  cost:18, xp:12, level:4,  desc:'Pork noodle soup from Iloilo' },
];

function renderFoodMenu() {
  const body = document.getElementById('modal-body');
  const unlocked = GameState.upgrades.unlockedDishes || [];
  body.innerHTML = '<div class="upgrade-grid">' + FOOD_MENU.map(dish => {
    const owned = unlocked.includes(dish.id);
    const locked = GameState.level < dish.level;
    const cost = dish.price * 3;
    return `<div class="upgrade-card ${owned ? 'maxed' : ''} ${locked ? '' : ''}" style="${locked ? 'opacity:0.5' : ''}">
      <div class="upgrade-name">${dish.icon} ${dish.name}</div>
      <div class="upgrade-desc">${dish.desc}</div>
      <div style="font-size:10px;color:var(--text-dim);margin:4px 0">Sell: ₱${dish.price} | Cost: ₱${dish.cost} | Lv.${dish.level} req</div>
      <button class="upgrade-btn" ${owned || locked || GameState.cash < cost ? 'disabled' : ''} onclick="unlockDish('${dish.id}')">
        ${owned ? '✅ ON MENU' : locked ? '🔒 Lv.'+dish.level+' req' : '📋 Add to Menu — ₱'+cost}
      </button>
    </div>`;
  }).join('') + '</div>';
}

window.unlockDish = function(id) {
  const dish = FOOD_MENU.find(d => d.id === id);
  if (!dish) return;
  const cost = dish.price * 3;
  if (GameState.cash < cost) { showToast('Not enough money!', 'warn'); return; }
  if (!GameState.upgrades.unlockedDishes) GameState.upgrades.unlockedDishes = [];
  GameState.addCash(-cost, '-₱' + cost);
  GameState.upgrades.unlockedDishes.push(dish.id);
  GameState.addXP(dish.xp);
  showToast(dish.icon + ' ' + dish.name + ' added to menu!', 'success');
  addEventLog('📋 New dish: ' + dish.name);
  renderFoodMenu();
};

// ===== ROOM EXPANSION =====
window.ROOM_EXPANSIONS = [
  { id:'dining_ext',    name:'Dining Extension',   icon:'🏠', cost:2000, desc:'Adds more dining space (+8 table slots)', level:3 },
  { id:'kitchen_ext',   name:'Kitchen Extension',  icon:'🍳', cost:3000, desc:'Larger kitchen, faster cooking',          level:5 },
  { id:'accountant_room',name:'Accountant Office', icon:'🧑💼', cost:4000, desc:'Unlocks hiring an Accountant',           level:4 },
  { id:'vip_room',      name:'VIP Dining Room',    icon:'👑', cost:6000, desc:'Premium room for VIP customers',          level:8 },
];

function renderRoomExpansions() {
  const body = document.getElementById('modal-body');
  const owned = GameState.upgrades.expansionRooms || [];
  body.innerHTML = '<div class="upgrade-grid">' + ROOM_EXPANSIONS.map(room => {
    const isOwned = owned.includes(room.id);
    const locked = GameState.level < room.level;
    return `<div class="upgrade-card ${isOwned ? 'maxed' : ''}" style="${locked ? 'opacity:0.5' : ''}">
      <div class="upgrade-name">${room.icon} ${room.name}</div>
      <div class="upgrade-desc">${room.desc}</div>
      <div style="font-size:10px;color:var(--text-dim);margin:4px 0">Lv.${room.level} required</div>
      <button class="upgrade-btn" ${isOwned || locked || GameState.cash < room.cost ? 'disabled' : ''} onclick="buyRoomExpansion('${room.id}')">
        ${isOwned ? '✅ BUILT' : locked ? '🔒 Lv.'+room.level+' req' : '🏗️ Build — ₱'+room.cost}
      </button>
    </div>`;
  }).join('') + '</div>';
}

window.buyRoomExpansion = function(id) {
  const room = ROOM_EXPANSIONS.find(r => r.id === id);
  if (!room) return;
  if (GameState.level < room.level) { showToast('Need Level ' + room.level + '!', 'warn'); return; }
  if (GameState.cash < room.cost) { showToast('Not enough money!', 'warn'); return; }
  if (!GameState.upgrades.expansionRooms) GameState.upgrades.expansionRooms = [];
  if (GameState.upgrades.expansionRooms.includes(id)) { showToast('Already built!', 'warn'); return; }
  GameState.addCash(-room.cost, '-\u20B1' + room.cost);
  GameState.upgrades.expansionRooms.push(room.id);
  if (id === 'accountant_room') GameState.upgrades.accountantRoom = true;
  GameState.addXP(50);
  // Physically spawn the room in the scene
  SceneManager.addDynamicSceneElements();
  _upgradeFlash(room.icon + ' ' + room.name + ' built!');
  showToast(room.icon + ' ' + room.name + ' built!', 'success');
  addEventLog('\uD83C\uDFD7\uFE0F Expansion: ' + room.name);
  if (window.Tutorial && Tutorial.active) Tutorial.onFlag('expansion_bought');
  renderRoomExpansions();
};


// ===== SKILLS (Filipino Carinderia themed) =====
const SKILLS_DEF = [
  [
    { id:'better_rice',    icon:'🍚', name:'Better Rice',       desc:'Rice quality up — customers stay 20% longer',  cost:100, requires:null },
    { id:'fast_serving',   icon:'⚡', name:'Faster Serving',    desc:'Waiters serve 25% faster',                   cost:120, requires:null },
  ],
  [
    { id:'suki_customers', icon:'💳', name:'Suki Customers',    desc:'Regulars return 30% more often',             cost:200, requires:'better_rice' },
    { id:'premium_ulam',   icon:'🍖', name:'Premium Ulam',      desc:'All dishes earn 20% more',                   cost:250, requires:'fast_serving' },
  ],
  [
    { id:'extra_rice',     icon:'🍚', name:'Unlimited Extra Rice',desc:'Customers spend ₱15 more per visit',          cost:300, requires:'suki_customers' },
    { id:'viral_carinderia',icon:'📱', name:'Viral Carinderia',  desc:'TikTok fame — +35% customer traffic',         cost:400, requires:'premium_ulam' },
  ],
  [
    { id:'fiesta_promo',   icon:'🎉', name:'Fiesta Promo',      desc:'Fiesta events earn 50% more',                cost:350, requires:'extra_rice' },
  ],
  [
    { id:'halo_halo_master',icon:'🍧', name:'Better Halo-Halo', desc:'Dessert sales double on hot days',            cost:450, requires:'fiesta_promo' },
    { id:'silog_special',  icon:'🍳', name:'Silog Special',     desc:'Breakfast rush earns 40% more',              cost:500, requires:'viral_carinderia' },
  ]
];

function renderSkills() {
  const body = document.getElementById('modal-body');
  const totalSkills = SKILLS_DEF.flat().length;
  const ownedSkills = SKILLS_DEF.flat().filter(s => GameState.skills[s.id]).length;
  body.innerHTML = `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;margin-bottom:6px">
        <span style="color:var(--gold)">🌳 SKILLS: ${ownedSkills} / ${totalSkills}</span>
        <span style="color:var(--neon)">Balance: ₱${Math.floor(GameState.cash).toLocaleString()}</span>
      </div>
      <div style="font-size:13px;color:var(--text-dim);margin-bottom:12px">Unlock skills to boost your carinderia's performance!</div>
    </div>
    <div class="skill-tree">` + SKILLS_DEF.map((row) => `
    <div class="skill-row">
      ${row.map(s => {
        const locked = s.requires && !GameState.skills[s.requires];
        const owned  = !!GameState.skills[s.id];
        const canAfford = GameState.cash >= s.cost;
        return `<div class="skill-node ${owned?'unlocked':locked?'locked':''}" onclick="${owned||locked ? '' : 'buySkill(\''+s.id+'\')'}" style="cursor:${owned||locked?'default':'pointer'}">
          <div class="skill-node-icon" style="font-size:28px">${s.icon}</div>
          <div class="skill-node-name" style="font-size:15px;font-weight:800">${s.name}</div>
          <div class="skill-node-desc" style="font-size:12px">${s.desc}</div>
          ${owned ? '<div class="skill-node-cost" style="color:var(--success);font-size:14px;font-weight:700">✅ OWNED</div>' :
            locked ? `<div class="skill-node-cost" style="color:var(--danger);font-size:13px">🔒 Unlock: ${s.requires}</div>` :
            `<div class="skill-node-cost" style="font-size:15px;font-weight:800;color:${canAfford?'var(--gold)':'var(--danger)'}">₱${s.cost}</div>`}
        </div>`;
      }).join('')}
    </div>`).join('') + '</div>';
}

function buySkill(id) {
  const skill = SKILLS_DEF.flat().find(s => s.id === id);
  if (!skill) return;
  if (GameState.skills[id]) return;
  if (skill.requires && !GameState.skills[skill.requires]) { showToast('Unlock prerequisite first!', 'warn'); return; }
  if (GameState.cash < skill.cost) { showToast('Not enough money!', 'warn'); return; }
  GameState.addCash(-skill.cost, '-₱' + skill.cost);
  GameState.skills[id] = true;
  showToast('🌳 Skill unlocked: ' + skill.name, 'success');
  addEventLog('🌳 Skill: ' + skill.name + ' unlocked!');
  renderSkills();
}

// ===== FLOATING POPS (e.g., +₱100) ===== (Karinderya themed)
function spawnFloatPop(text, x, y, isNeg) {
  const el = document.createElement('div');
  el.className = 'float-pop' + (isNeg ? ' neg' : '');
  // Sanitize text — strip any raw HTML entities that may appear as symbols
  el.textContent = text.replace(/&#x[0-9A-Fa-f]+;|&[a-zA-Z]+;/g, (m) => {
    const d = document.createElement('div'); d.innerHTML = m; return d.textContent;
  });
  el.style.fontSize = '18px';
  el.style.fontWeight = '800';
  const safeX = 180;
  el.style.left = ((x || safeX) - 20) + 'px';
  el.style.top  = ((y || window.innerHeight / 2) - 30) + 'px';
  document.getElementById('float-container').appendChild(el);
  setTimeout(() => el.remove(), 1600);

  // Combo tracking
  if (!isNeg) {
    GameState.comboCount = (GameState.comboCount || 0) + 1;
    if (GameState.comboCount >= 3) _showCombo(GameState.comboCount);
  }
}

function _showCombo(count) {
  const el = document.getElementById('combo-display');
  const cnt = document.getElementById('combo-count');
  if (!el || !cnt) return;
  cnt.textContent = '🔥 x' + count + ' COMBO!';
  el.style.display = 'flex';
  clearTimeout(window._comboHideTimer);
  window._comboHideTimer = setTimeout(() => { el.style.display = 'none'; GameState.comboCount = 0; }, 2200);
}

// ===== EVENT LOG =====
function addEventLog(rawText) {
  const log = document.getElementById('event-log');
  const item = document.createElement('div');
  item.className = 'event-item';
  // Decode HTML entities so emoji/symbols render correctly instead of showing as codes
  const tmp = document.createElement('div');
  tmp.innerHTML = rawText;
  item.textContent = tmp.textContent;
  log.prepend(item);
  while (log.children.length > 5) log.removeChild(log.lastChild);
  setTimeout(() => item.remove(), 8000);
}

// ===== TOASTS =====
function showToast(rawText, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast ' + (type === 'warn' ? 'warn' : type === 'danger' ? 'danger' : type === 'success' ? 'success' : '');
  // Decode HTML entities so emoji render correctly
  const tmp = document.createElement('div');
  tmp.innerHTML = rawText;
  el.textContent = tmp.textContent;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ===== ACHIEVEMENT POP =====
function showAchievementPop(ach) {
  const pop = document.getElementById('achievement-pop');
  document.getElementById('ach-icon').textContent = ach.icon;
  document.getElementById('ach-name').textContent = ach.name;
  pop.classList.remove('hidden');
  setTimeout(() => pop.classList.add('hidden'), 4000);
}

// ===== DAILY REWARD — enhanced with streak UI =====
function checkDailyReward() {
  const today = new Date().toDateString();
  if (GameState.lastLogin === today) return;

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const streak = GameState.lastLogin === yesterday ? Math.min(7, GameState.loginStreak + 1) : 1;
  GameState.loginStreak = streak;
  GameState.lastLogin = today;

  const rewards = [100, 150, 200, 300, 400, 600, 1000];
  const reward  = rewards[streak - 1] || 100;
  GameState.addCash(reward, '+₱' + reward + ' daily!');

  // Build streak bar
  const barEl = document.getElementById('daily-streak-bar');
  if (barEl) {
    barEl.innerHTML = Array.from({length: 7}, (_, i) => {
      const day = i + 1;
      const done = day <= streak;
      const isToday = day === streak;
      return `<div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;background:${done ? 'var(--gold)' : 'rgba(255,255,255,0.06)'};color:${done ? '#1a0a00' : 'var(--text-dim)'};border:${isToday ? '2px solid var(--neon)' : '1px solid var(--border)'};box-shadow:${isToday ? '0 0 12px var(--neon)' : 'none'};">${done ? '★' : day}</div>`;
    }).join('');
  }

  const amtEl = document.getElementById('daily-reward-amount');
  if (amtEl) amtEl.textContent = '+₱' + reward.toLocaleString();

  const streakEl = document.getElementById('daily-streak-display');
  if (streakEl) streakEl.textContent = 'Day ' + streak + ' streak! Come back tomorrow for more!';

  const pop = document.getElementById('daily-reward-pop');
  if (pop) pop.classList.remove('hidden');

  addEventLog('🎁 Daily login reward: +₱' + reward + ' (Day ' + streak + ')');
}

// ===== MILESTONE POPUP =====
function showMilestonePop(iconRaw, titleRaw, descRaw, duration = 2800) {
  const pop = document.getElementById('milestone-pop');
  if (!pop) return;
  const decode = (s) => { const d = document.createElement('div'); d.innerHTML = String(s); return d.textContent; };
  document.getElementById('milestone-icon').textContent  = decode(iconRaw);
  document.getElementById('milestone-title').textContent = decode(titleRaw);
  document.getElementById('milestone-desc').textContent  = decode(descRaw);
  pop.classList.remove('hidden');
  setTimeout(() => pop.classList.add('hidden'), duration);
}

// ===== STREAK REWARD DISPLAY =====
function showStreakReward(days, bonus) {
  showMilestonePop('🔥', days + '-DAY STREAK!', 'Profitable days in a row! +₱' + bonus + ' bonus!', 3000);
  showToast('🔥 ' + days + '-day streak! +₱' + bonus, 'success');
}

// ===== LEVEL-UP EFFECT =====
function triggerLevelUpEffect(lv) {
  // Flash the XP bar
  const xpWrap = document.getElementById('stat-level');
  if (xpWrap) {
    xpWrap.style.transition = 'box-shadow 0.1s';
    xpWrap.style.boxShadow = '0 0 30px var(--gold), 0 0 60px var(--gold)';
    setTimeout(() => { xpWrap.style.boxShadow = ''; }, 800);
  }
  // Milestone popup
  const milestones = {
    2:  { icon: '🏢', title: 'LEVEL 2!',  desc: '🏢 Manager Office unlocked! Check Room Expansions.' },
    3:  { icon: '🍚', title: 'LEVEL 3!',  desc: 'Room Expansions are now available!' },
    5:  { icon: '🧑‍💼', title: 'LEVEL 5!', desc: '🧑‍💼 Accountant unlocked! Hire from Staff panel.' },
    10: { icon: '🎉', title: 'LEVEL 10!', desc: 'Viral Carinderia skill is now available!' },
    15: { icon: '🏆', title: 'LEVEL 15!', desc: 'VIP Dining Room unlocked!' },
    20: { icon: '👑', title: 'LEVEL 20!', desc: 'Kanto Legend status reached!' },
  };
  const m = milestones[lv];
  if (m) showMilestonePop(m.icon, m.title, m.desc, 3500);
  else   showMilestonePop('🎉', 'LEVEL ' + lv + '!', 'Keep growing your carinderia!', 2000);

  // Confetti burst from center
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.style.cssText = `position:fixed;left:50%;top:50%;width:8px;height:8px;border-radius:2px;pointer-events:none;z-index:3000;background:${['#ffd700','#ff6a3d','#39ff14','#66f3ff','#ff2d78'][i%5]};animation:confettiExplode 1.5s ease forwards;`;
    p.style.setProperty('--tx', (Math.random()-0.5)*500+'px');
    p.style.setProperty('--ty', (Math.random()-0.5)*400+'px');
    p.style.setProperty('--tr', Math.random()*720+'deg');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1600);
  }
}

// ===== CREDITS / SETTINGS stubs ===== (Karinderya themed)
window.showSettings = () => openModal('settings');
window.showCredits = () => openModal('credits');

let ledgerReconciliationTimer = null;
let ledgerReconciliationScore = 0;
let ledgerReconciliationCommands = [];
let ledgerReconciliationCurrentCommand = 0;

const MANUAL_COOKING_STEPS = [
  { icon: '🔥', label: 'HEAT THE WOK' },
  { icon: '🧄', label: 'ADD GARLIC & ONION' },
  { icon: '🥩', label: 'ADD MEAT' },
  { icon: '🍜', label: 'ADD NOODLES' },
  { icon: '🧂', label: 'SEASON TO TASTE' },
  { icon: '🍽️', label: 'PLATE AND SERVE' },
];
let cookingMinigameStep = 0;

function renderOwnerLedger() {
  const body = document.getElementById('modal-body');
  const inv = GameState.inventory;
  const health = GameState.upgrades.serverHealth;
  body.innerHTML = `
    <div style="font-family:var(--font-mono); padding:10px;">
      <div style="margin-bottom:14px; font-size:11px; color:var(--text-dim); letter-spacing:2px">INVENTORY STATUS</div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:20px;">
        <div style="background:rgba(0,0,0,0.3); padding:12px; border:1px solid var(--border); border-radius:4px; text-align:center;">
          <div style="font-size:24px">🍚</div><div style="color:var(--neon)">${inv.rice}</div><div style="font-size:10px; color:var(--text-dim)">RICE</div>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:12px; border:1px solid var(--border); border-radius:4px; text-align:center;">
          <div style="font-size:24px">🥩</div><div style="color:var(--neon)">${inv.meat}</div><div style="font-size:10px; color:var(--text-dim)">MEAT</div>
        </div>
        <div style="background:rgba(0,0,0,0.3); padding:12px; border:1px solid var(--border); border-radius:4px; text-align:center;">
          <div style="font-size:24px">🥦</div><div style="color:var(--neon)">${inv.veg}</div><div style="font-size:10px; color:var(--text-dim)">VEG</div>
        </div>
      </div>
      <div style="margin-bottom:14px; font-size:11px; color:var(--text-dim); letter-spacing:2px">KITCHEN HEALTH: ${Math.floor(health)}%</div>
      <div style="background:#111; border-radius:4px; height:8px; margin-bottom:20px;">
        <div style="height:100%; border-radius:4px; background:${health > 60 ? 'var(--success)' : health > 30 ? 'var(--warn)' : 'var(--danger)'}; width:${health}%"></div>
      </div>
      <button class="upgrade-btn" style="width:100%" onclick="window.startServerMaintenanceGame()">🛠️ RUN LEDGER RECONCILIATION — ₱100</button>
    </div>
  `;
}

window.startServerMaintenanceGame = function() {
  if (GameState.cash < 100) { showToast('Not enough money!', 'warn'); return; }
  GameState.addCash(-100, '-₱100 maintenance');

  ledgerReconciliationScore = 0;
  ledgerReconciliationCurrentCommand = 0;
  ledgerReconciliationCommands = [
    { cmd: 'check_inventory', hint: 'Counting the kalderos' },
    { cmd: 'update_price_list', hint: 'Adjusting prices for inflation' },
    { cmd: 'clear_expired_stock', hint: 'Tossing out bad ingredients' },
    { cmd: 'reheat_stew', hint: 'Keeping the ulam warm' },
    { cmd: 'sweep_the_floor', hint: 'Cleaning up the dining area' },
  ].sort(() => Math.random() - 0.5).slice(0, 3);

  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <div style="text-align:center; padding:20px;">
      <div style="font-family:var(--font-head); font-size:18px; color:var(--gold); margin-bottom:15px;">LEDGER RECONCILIATION</div>
      <div id="server-command-display" style="background:rgba(20,12,8,0.9); border:1px solid rgba(255,211,122,0.3); padding:15px; margin-bottom:15px; font-family:var(--font-mono); font-size:14px; color:var(--text); text-align:left; border-radius:8px;"></div>
      <input type="text" id="server-command-input" style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid var(--gold); color:var(--text); font-family:var(--font-mono); font-size:14px; border-radius:6px;" autofocus>
      <div id="server-timer" style="margin-top:10px; font-family:var(--font-mono); color:var(--warn);">Time: 10s</div>
    </div>
  `;

  const input = document.getElementById('server-command-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (input.value.trim() === ledgerReconciliationCommands[ledgerReconciliationCurrentCommand].cmd) {
        ledgerReconciliationScore++;
        showToast('✅ Correct command!', 'success');
      } else {
        showToast('❌ Incorrect command!', 'danger');
      }
      ledgerReconciliationCurrentCommand++;
      input.value = '';
      if (ledgerReconciliationCurrentCommand < ledgerReconciliationCommands.length) {
        displayNextServerCommand();
      } else {
        endServerMaintenanceGame();
      }
    }
  });

  displayNextServerCommand();
  let timeLeft = 10;
  document.getElementById('server-timer').textContent = `Time: ${timeLeft}s`;
  ledgerReconciliationTimer = setInterval(() => {
    timeLeft--;
    document.getElementById('server-timer').textContent = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(ledgerReconciliationTimer);
      endServerMaintenanceGame();
    }
  }, 1000);
};

function displayNextServerCommand() {
  const cmdDisplay = document.getElementById('server-command-display');
  const cmd = ledgerReconciliationCommands[ledgerReconciliationCurrentCommand];
  cmdDisplay.innerHTML = `<span style="color:var(--gold)">📋 TASK:</span> <span style="color:var(--neon)">${cmd.cmd}</span><br><span style="color:var(--text-dim)">Hint: ${cmd.hint}</span>`;
  document.getElementById('server-command-input').focus();
}

function endServerMaintenanceGame() {
  clearInterval(ledgerReconciliationTimer);
  const successRate = ledgerReconciliationScore / ledgerReconciliationCommands.length;
  let healthRestored = 0;
  if (successRate >= 0.8) {
    healthRestored = 100 - GameState.upgrades.serverHealth;
    GameState.upgrades.serverHealth = 100;
    GameState.addXP(50);
    showToast('🛠️ Server fully optimized!', 'success');
  } else if (successRate >= 0.4) {
    healthRestored = 50;
    GameState.upgrades.serverHealth = Math.min(100, GameState.upgrades.serverHealth + 50);
    GameState.addXP(20);
    showToast('🛠️ Server partially optimized.', 'warn');
  } else {
    healthRestored = 20;
    GameState.upgrades.serverHealth = Math.min(100, GameState.upgrades.serverHealth + 20);
    showToast('🛠️ Server optimization failed, minor improvements.', 'danger');
  }
  addEventLog(`Ledger reconciled: ${Math.floor(healthRestored)}% stock accuracy restored.`);
  renderOwnerLedger();
};

function renderCredits() {
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <div style="text-align:center; line-height:2"> 
      <div style="font-family:var(--font-head); color:var(--gold); margin-bottom:10px">KANTOKAIN TEAM</div>
      <p>Lead Developer — Eiji, Rohan, Chiongki</p>
      <p>Graphics Engine — Three.js</p>
      <p>UI/UX Design — EijiDev COMLAB DMC CCS</p>
      <div style="margin-top:20px; font-size:12px; color:var(--text-dim)">Salamat sa lahat ng sumuporta! 🍱</div>
    </div>
  `;
}

function renderCookingMinigame() {
  const body = document.getElementById('modal-body');
  if (!body) return;

  if (cookingMinigameStep >= MANUAL_COOKING_STEPS.length) {
    cookingMinigameStep = 0;
  }

  updateManualCookingUI();
}

function updateManualCookingUI() {
  const body = document.getElementById('modal-body');
  if (!body) return;

  if (cookingMinigameStep >= MANUAL_COOKING_STEPS.length) {
    const profit = 150;
    GameState.addCash(profit, '+₱' + profit + ' bonus sales');
    GameState.addXP(40);
    body.innerHTML = `
      <div style="text-align:center; padding:20px">
        <div style="font-size:48px; margin-bottom:12px">✅</div>
        <h3 style="color:var(--success)">Ulam Ready to Serve!</h3>
        <p style="color:var(--text-dim); margin-top:10px">You earned ₱${profit} from special ulam sales!</p>
        <button class="upgrade-btn" style="margin-top:20px" onclick="closeModal()">Great!</button>
      </div>`;
    return;
  }

  const step = MANUAL_COOKING_STEPS[cookingMinigameStep];
  body.innerHTML = `
    <div style="text-align:center; padding:20px">
      <div style="font-size:64px; margin-bottom:20px">${step.icon}</div>
      <h3 style="color:var(--neon); margin-bottom:15px">PHASE ${cookingMinigameStep + 1}: ${step.label}</h3>
      <div class="staff-mood-bar" style="width:100%; height:12px; margin-bottom:20px">
        <div class="staff-mood-fill" style="width:${(cookingMinigameStep / MANUAL_COOKING_STEPS.length) * 100}%; background:var(--neon)"></div>
      </div>
      <button class="menu-btn primary" style="width:100%; padding:15px" onclick="nextPancitStep()">
        CLICK TO ${step.label}
      </button>
      <p style="color:var(--text-dim); font-size:11px; margin-top:15px">Keep the wok moving!</p>
    </div>`;
}

window.nextPancitStep = function() {
  cookingMinigameStep++;
  updateManualCookingUI();
};

window.toggleTurboCooling = function() {
  GameState.upgrades.turboCooling = !GameState.upgrades.turboCooling;
  showToast(GameState.upgrades.turboCooling ? '❄️ Turbo Cooling ON (₱30/hr)' : '❄️ Turbo Cooling OFF', 'info');
  UIManager.renderers.managerStats(); // Call the renderer via UIManager
};

// ===== MINI-GAMES =====

// 1. Cooking Timing Mini-game
function renderMiniCook() {
  const body = document.getElementById('modal-body');
  const dishes = ['Adobo', 'Sinigang', 'Sisig', 'Pancit', 'Tinola'];
  const dish = dishes[Math.floor(Math.random() * dishes.length)];
  const icons = { Adobo:'🍖', Sinigang:'🍲', Sisig:'🥩', Pancit:'🍜', Tinola:'🍗' };
  let progress = 0, timer = null, done = false;

  body.innerHTML = `
    <div style="text-align:center;padding:20px">
      <div style="font-size:52px;margin-bottom:8px">${icons[dish]}</div>
      <div style="font-family:var(--font-head);font-size:20px;color:var(--gold);margin-bottom:6px">COOK: ${dish.toUpperCase()}</div>
      <div style="font-size:14px;color:var(--text-dim);margin-bottom:20px">Tap the button when the bar is in the <b style="color:var(--success)">GREEN ZONE</b>!</div>
      <div style="position:relative;width:100%;height:28px;background:rgba(0,0,0,0.4);border-radius:14px;overflow:hidden;margin-bottom:20px;border:1px solid var(--border)">
        <div style="position:absolute;left:35%;width:30%;height:100%;background:rgba(124,255,157,0.35);border-radius:0"></div>
        <div id="cook-bar" style="position:absolute;left:0;top:0;width:8px;height:100%;background:var(--gold);border-radius:14px;transition:none"></div>
      </div>
      <button class="menu-btn primary" id="cook-tap-btn" style="width:100%;padding:16px;font-size:16px" onclick="window._cookTap()">🔥 TAP TO COOK!</button>
      <div id="cook-result" style="margin-top:16px;font-size:15px;font-weight:700"></div>
    </div>`;

  let pos = 0, dir = 1, speed = 1.8;
  timer = setInterval(() => {
    if (done) return;
    pos += dir * speed;
    if (pos >= 92) dir = -1;
    if (pos <= 0)  dir = 1;
    const bar = document.getElementById('cook-bar');
    if (bar) bar.style.left = pos + '%';
  }, 16);

  window._cookTap = () => {
    if (done) return;
    done = true;
    clearInterval(timer);
    const hit = pos >= 35 && pos <= 65;
    const reward = hit ? 200 : 50;
    GameState.addCash(reward, '+₱' + reward + (hit ? ' 🔥 Perfect!' : ''));
    GameState.addXP(hit ? 30 : 8);
    const res = document.getElementById('cook-result');
    if (res) res.innerHTML = hit
      ? `<span style="color:var(--success)">🔥 PERFECT COOK! +₱${reward} +30 XP</span>`
      : `<span style="color:var(--warn)">😅 A bit off... +₱${reward} +8 XP</span>`;
    setTimeout(() => closeModal(), 1800);
  };
}

// 2. Dishwashing Rush Mini-game
function renderMiniWash() {
  const body = document.getElementById('modal-body');
  let count = 0, total = 8, timeLeft = 12, timer = null;

  const render = () => {
    body.innerHTML = `
      <div style="text-align:center;padding:20px">
        <div style="font-size:48px;margin-bottom:8px">🫧</div>
        <div style="font-family:var(--font-head);font-size:20px;color:var(--gold);margin-bottom:6px">WASH THE DISHES!</div>
        <div style="font-size:14px;color:var(--text-dim);margin-bottom:16px">Tap each dish to wash it before time runs out!</div>
        <div style="font-family:var(--font-mono);font-size:18px;color:var(--warn);margin-bottom:16px">⏱ ${timeLeft}s | ${count}/${total} washed</div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:16px">
          ${Array.from({length: total - count}, (_, i) => `<button onclick="window._washDish(this)" style="font-size:32px;background:rgba(0,0,0,0.3);border:2px solid var(--border);border-radius:12px;padding:10px 14px;cursor:pointer;transition:all 0.1s">🍽️</button>`).join('')}
        </div>
        <div id="wash-result"></div>
      </div>`;
  };

  render();
  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0 || count >= total) {
      clearInterval(timer);
      const reward = count * 25;
      GameState.addCash(reward, '+₱' + reward + ' dishes!');
      GameState.addXP(count * 4);
      body.innerHTML = `<div style="text-align:center;padding:30px"><div style="font-size:52px">${count >= total ? '✨' : '😅'}</div><div style="font-family:var(--font-head);font-size:20px;color:var(--gold);margin:12px 0">${count >= total ? 'ALL CLEAN!' : count + '/' + total + ' WASHED'}</div><div style="font-size:15px;color:var(--success)">+₱${reward} +${count*4} XP</div></div>`;
      setTimeout(() => closeModal(), 2000);
      return;
    }
    const timeEl = body.querySelector('[style*="font-mono"]');
    if (timeEl) timeEl.textContent = `⏱ ${timeLeft}s | ${count}/${total} washed`;
  }, 1000);

  window._washDish = (btn) => {
    btn.textContent = '✅';
    btn.disabled = true;
    btn.style.opacity = '0.4';
    count++;
    if (count >= total) { clearInterval(timer); const reward = total * 25; GameState.addCash(reward, '+₱' + reward + ' dishes!'); GameState.addXP(total * 4); setTimeout(() => closeModal(), 800); }
  };
}

// 3. Cash Register Tapping Mini-game
function renderMiniCash() {
  const body = document.getElementById('modal-body');
  let taps = 0, timeLeft = 8, goal = 15, timer = null;

  const update = () => {
    const pct = Math.min(100, (taps / goal) * 100);
    const tapEl = document.getElementById('cash-taps');
    const barEl = document.getElementById('cash-bar');
    const timeEl = document.getElementById('cash-time');
    if (tapEl) tapEl.textContent = taps + '/' + goal;
    if (barEl) barEl.style.width = pct + '%';
    if (timeEl) timeEl.textContent = '⏱ ' + timeLeft + 's';
  };

  body.innerHTML = `
    <div style="text-align:center;padding:20px">
      <div style="font-size:48px;margin-bottom:8px">💰</div>
      <div style="font-family:var(--font-head);font-size:20px;color:var(--gold);margin-bottom:6px">CASH REGISTER RUSH!</div>
      <div style="font-size:14px;color:var(--text-dim);margin-bottom:16px">Tap <b style="color:var(--gold)">${goal} times</b> before time runs out!</div>
      <div style="font-family:var(--font-mono);font-size:16px;color:var(--warn);margin-bottom:10px" id="cash-time">⏱ ${timeLeft}s</div>
      <div style="width:100%;height:18px;background:rgba(0,0,0,0.4);border-radius:9px;overflow:hidden;margin-bottom:20px;border:1px solid var(--border)">
        <div id="cash-bar" style="height:100%;width:0%;background:linear-gradient(90deg,var(--gold),var(--success));border-radius:9px;transition:width 0.1s"></div>
      </div>
      <div style="font-family:var(--font-head);font-size:22px;color:var(--neon);margin-bottom:16px" id="cash-taps">0/${goal}</div>
      <button class="menu-btn primary" id="cash-btn" style="width:100%;padding:18px;font-size:18px" onclick="window._cashTap()">💵 TAP!</button>
    </div>`;

  timer = setInterval(() => {
    timeLeft--;
    update();
    if (timeLeft <= 0) {
      clearInterval(timer);
      const reward = Math.floor((taps / goal) * 300);
      GameState.addCash(reward, '+₱' + reward + ' register!');
      GameState.addXP(taps * 2);
      body.innerHTML = `<div style="text-align:center;padding:30px"><div style="font-size:52px">${taps >= goal ? '🎉' : '😅'}</div><div style="font-family:var(--font-head);font-size:20px;color:var(--gold);margin:12px 0">${taps >= goal ? 'PERFECT!' : taps + ' taps'}</div><div style="font-size:15px;color:var(--success)">+₱${reward}</div></div>`;
      setTimeout(() => closeModal(), 2000);
    }
  }, 1000);

  window._cashTap = () => {
    taps++;
    update();
    const btn = document.getElementById('cash-btn');
    if (btn) { btn.style.transform = 'scale(0.94)'; setTimeout(() => { if(btn) btn.style.transform = ''; }, 80); }
    if (taps >= goal) {
      clearInterval(timer);
      const reward = 300;
      GameState.addCash(reward, '+₱' + reward + ' register!');
      GameState.addXP(30);
      body.innerHTML = `<div style="text-align:center;padding:30px"><div style="font-size:52px">🎉</div><div style="font-family:var(--font-head);font-size:20px;color:var(--gold);margin:12px 0">PERFECT CASHIER!</div><div style="font-size:15px;color:var(--success)">+₱${reward} +30 XP</div></div>`;
      setTimeout(() => closeModal(), 1800);
    }
  };
}

// 4. Ingredient Restock Mini-game
function renderMiniRestock() {
  const body = document.getElementById('modal-body');
  const items = [
    { key: 'rice', icon: '🍚', label: 'Rice', max: 100 },
    { key: 'meat', icon: '🥩', label: 'Meat', max: 50 },
    { key: 'veg',  icon: '🥦', label: 'Veggies', max: 50 },
  ];

  const render = () => {
    body.innerHTML = `
      <div style="padding:20px">
        <div style="text-align:center;font-size:48px;margin-bottom:8px">📦</div>
        <div style="text-align:center;font-family:var(--font-head);font-size:20px;color:var(--gold);margin-bottom:6px">RESTOCK INGREDIENTS</div>
        <div style="text-align:center;font-size:14px;color:var(--text-dim);margin-bottom:20px">Tap each ingredient to restock it. Costs ₱50 each.</div>
        ${items.map(item => {
          const cur = GameState.inventory[item.key] || 0;
          const pct = Math.round((cur / item.max) * 100);
          const color = pct > 60 ? 'var(--success)' : pct > 30 ? 'var(--warn)' : 'var(--danger)';
          return `<div style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:10px;display:flex;align-items:center;gap:14px">
            <div style="font-size:32px">${item.icon}</div>
            <div style="flex:1">
              <div style="font-family:var(--font-head);font-size:14px;color:var(--text);margin-bottom:6px">${item.label}: <b style="color:${color}">${cur}/${item.max}</b></div>
              <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width 0.3s"></div>
              </div>
            </div>
            <button onclick="window._restock('${item.key}')" style="background:transparent;border:1px solid var(--gold);color:var(--gold);font-family:var(--font-head);font-size:11px;font-weight:700;padding:8px 14px;border-radius:8px;cursor:pointer" ${GameState.cash < 50 ? 'disabled' : ''}>+50 ₱50</button>
          </div>`;
        }).join('')}
        <button class="upgrade-btn" style="margin-top:10px" onclick="closeModal()">Done</button>
      </div>`;
  };

  render();

  window._restock = (key) => {
    if (GameState.cash < 50) { showToast('Not enough money!', 'warn'); return; }
    const item = items.find(i => i.key === key);
    GameState.addCash(-50, '-₱50 restock');
    GameState.inventory[key] = Math.min(item.max, (GameState.inventory[key] || 0) + 20);
    showToast(item.icon + ' Restocked ' + item.label + '!', 'success');
    render();
  };
}

function renderManagerStats() {  let html = `
    <div class="staff-section-title">REMOTE STAFF MONITORING</div>
    <div class="staff-list">`;

  if (GameState.staff.length === 0) {
    html += '<div style="text-align:center; padding:20px; color:var(--text-dim); font-size:12px">No staff hired yet.</div>';
  } else {
    html += GameState.staff.map(e => `
      <div class="staff-card" style="padding:10px 14px; background:rgba(0,0,0,0.2)">
        <div style="font-size:22px">${e.icon}</div>
        <div class="staff-info">
          <div class="staff-name" style="font-size:11px">${e.name} (${e.role})</div>
          <div class="staff-stats" style="font-size:9px">
            Mood: ${e.mood}% | Skill: ${e.skill} | Loyalty: ${e.loyalty}%
          </div>
        </div>
        <div style="color:var(--neon); font-family:var(--font-mono); font-size:10px; text-transform:uppercase">
          ● ${e.state}
        </div>
      </div>`).join('');
  }

  const body = document.getElementById('modal-body');
  html += '</div><button class="upgrade-btn" style="margin-top:20px; border-color:var(--danger); color:var(--danger)" onclick="closeModal()">CLOSE</button>';
  body.innerHTML = html;
}

// ===== SETTINGS OVERRIDE (replaces stub above) =====
function renderSettings() {
  const body = document.getElementById('modal-body');
  const sm = window.SoundManager;
  const vol = (sm && sm.masterGain) ? Math.round(sm.masterGain.gain.value * 100) : 50;
  const sfxVol = (sm && sm._sfxVol !== undefined) ? Math.round(sm._sfxVol * 100) : vol;
  const soundOn = sm ? sm.enabled : true;

  body.innerHTML = `
    <div style="padding:8px">
      <div style="font-family:var(--font-head);font-size:18px;color:var(--gold);margin-bottom:16px;letter-spacing:2px">&#x2699;&#xFE0F; SETTINGS</div>

      <div style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-family:var(--font-head);font-size:15px;font-weight:700">&#x1F3B5; Background Music</span>
          <span id="lbl-master" style="font-family:var(--font-mono);color:var(--gold);font-size:14px">${vol}%</span>
        </div>
        <input type="range" min="0" max="100" value="${vol}" style="width:100%;accent-color:var(--gold);height:8px;cursor:pointer;border-radius:4px"
          oninput="window._setMasterVol(this.value)">
      </div>

      <div style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-family:var(--font-head);font-size:15px;font-weight:700">&#x1F3A7; Sound Effects</span>
          <span id="lbl-sfx" style="font-family:var(--font-mono);color:var(--neon);font-size:14px">${sfxVol}%</span>
        </div>
        <input type="range" min="0" max="100" value="${sfxVol}" style="width:100%;accent-color:var(--neon);height:8px;cursor:pointer;border-radius:4px"
          oninput="window._setSfxVol(this.value)">
      </div>

      <div style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-family:var(--font-head);font-size:15px;font-weight:700">&#x1F50A; All Sound</span>
        <button onclick="SoundManager.toggle();renderSettings()" style="background:${soundOn?'var(--success)':'var(--danger)'};border:none;color:#fff;font-family:var(--font-head);font-size:15px;font-weight:800;padding:10px 28px;border-radius:12px;cursor:pointer;min-width:80px">
          ${soundOn ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px">
        <div style="font-family:var(--font-head);font-size:15px;font-weight:700;margin-bottom:10px">&#x23F3; Game Speed</div>
        <div style="display:flex;gap:8px">
          ${GameState.speeds.map(s => `<button onclick="GameState.speedIdx=${GameState.speeds.indexOf(s)};GameState.speed=${s};document.getElementById('btn-speed').textContent='${s}x';restartTick();renderSettings()" style="flex:1;padding:12px;font-family:var(--font-head);font-size:16px;font-weight:800;border-radius:12px;border:2px solid ${GameState.speed===s?'var(--gold)':'var(--border)'};background:${GameState.speed===s?'rgba(255,211,122,0.18)':'rgba(0,0,0,0.3)'};color:${GameState.speed===s?'var(--gold)':'var(--text-dim)'};cursor:pointer">${s}x</button>`).join('')}
        </div>
      </div>

      <div style="display:flex;gap:10px">
        <button onclick="SaveSystem.saveGame();showToast('&#x1F4BE; Game saved!','success')" style="flex:1;padding:14px;font-family:var(--font-head);font-size:15px;font-weight:800;border-radius:12px;border:1px solid var(--success);background:rgba(57,255,20,0.1);color:var(--success);cursor:pointer">&#x1F4BE; Save Now</button>
        <button onclick="if(confirm('Restart tutorial?')){closeModal();Tutorial.start()}" style="flex:1;padding:14px;font-family:var(--font-head);font-size:15px;font-weight:800;border-radius:12px;border:1px solid var(--warn);background:rgba(255,211,122,0.1);color:var(--warn);cursor:pointer">&#x1F393; Tutorial</button>
      </div>
    </div>
  `;

  window._setMasterVol = function(v) {
    document.getElementById('lbl-master').textContent = v + '%';
    if (sm && sm.masterGain) sm.masterGain.gain.value = v / 100;
  };
  window._setSfxVol = function(v) {
    document.getElementById('lbl-sfx').textContent = v + '%';
    if (sm) sm._sfxVol = v / 100;
  };
}

// ===== SPIN THE WHEEL =====
window._spinCooldown = 0; // timestamp when next spin is allowed

function renderSpinWheel() {
  const body = document.getElementById('modal-body');
  const now = Date.now();
  const cooldownMs = 5 * 60 * 1000; // 5 minutes
  const remaining = Math.max(0, window._spinCooldown - now);
  const canSpin = remaining === 0;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  const prizes = [
    { label: '+&#x20B1;100',  color: '#ffd37a', value: 100,  type: 'cash' },
    { label: '+50 XP',        color: '#39ff14', value: 50,   type: 'xp'   },
    { label: '+&#x20B1;500',  color: '#ff6a3d', value: 500,  type: 'cash' },
    { label: '+100 XP',       color: '#00c8ff', value: 100,  type: 'xp'   },
    { label: '+&#x20B1;250',  color: '#ff2d78', value: 250,  type: 'cash' },
    { label: '+200 XP',       color: '#ffd700', value: 200,  type: 'xp'   },
    { label: '+&#x20B1;50',   color: '#9b59b6', value: 50,   type: 'cash' },
    { label: '+&#x20B1;1000', color: '#e74c3c', value: 1000, type: 'cash' },
  ];

  const size = 280;
  const cx = size / 2, cy = size / 2, r = 120;
  const sliceAngle = (2 * Math.PI) / prizes.length;

  // Build SVG wheel
  let svgSlices = '';
  prizes.forEach((p, i) => {
    const startA = i * sliceAngle - Math.PI / 2;
    const endA   = startA + sliceAngle;
    const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
    const x2 = cx + r * Math.cos(endA),   y2 = cy + r * Math.sin(endA);
    const midA = startA + sliceAngle / 2;
    const tx = cx + (r * 0.65) * Math.cos(midA);
    const ty = cy + (r * 0.65) * Math.sin(midA);
    svgSlices += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z" fill="${p.color}" stroke="#1a0a00" stroke-width="2"/>`;
    svgSlices += `<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="800" fill="#1a0a00" transform="rotate(${(midA * 180 / Math.PI)},${tx},${ty})">${p.label.replace(/&#x20B1;/g,'₱')}</text>`;
  });

  body.innerHTML = `
    <div style="text-align:center;padding:16px">
      <div style="font-size:40px;margin-bottom:6px">&#x1F3A1;</div>
      <div style="font-family:var(--font-head);font-size:20px;color:var(--gold);margin-bottom:4px;font-weight:900">SPIN THE WHEEL!</div>
      <div style="font-size:14px;color:var(--text-dim);margin-bottom:16px">Win cash or XP! Refreshes every 5 minutes.</div>

      <div style="position:relative;display:inline-block;margin-bottom:16px">
        <svg id="spin-wheel" width="${size}" height="${size}" style="transition:transform 3s cubic-bezier(0.17,0.67,0.12,0.99);border-radius:50%;box-shadow:0 0 30px rgba(255,211,122,0.4)">
          ${svgSlices}
          <circle cx="${cx}" cy="${cy}" r="18" fill="#1a0a00" stroke="#ffd37a" stroke-width="3"/>
          <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="#ffd37a">&#x1F3A1;</text>
        </svg>
        <!-- Pointer -->
        <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:28px;filter:drop-shadow(0 2px 6px rgba(255,211,122,0.8))">&#x1F53D;</div>
      </div>

      <div id="spin-result" style="min-height:40px;margin-bottom:14px;font-family:var(--font-head);font-size:18px;font-weight:800"></div>

      ${canSpin
        ? `<button id="spin-btn" onclick="window._doSpin()" style="width:100%;padding:16px;font-family:var(--font-head);font-size:18px;font-weight:900;background:linear-gradient(135deg,var(--gold),#ff6a3d);border:none;color:#1a0a00;border-radius:16px;cursor:pointer;box-shadow:0 4px 20px rgba(255,177,92,0.5);letter-spacing:1px">&#x1F3A1; SPIN NOW!</button>`
        : `<div style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:14px;padding:14px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim)">&#x23F0; Next spin in: <b style="color:var(--gold)" id="spin-countdown">${mins}m ${secs}s</b></div>`
      }
    </div>
  `;

  // Live countdown
  if (!canSpin) {
    window._spinCountdownTimer = setInterval(() => {
      const rem = Math.max(0, window._spinCooldown - Date.now());
      const el = document.getElementById('spin-countdown');
      if (!el) { clearInterval(window._spinCountdownTimer); return; }
      if (rem === 0) { clearInterval(window._spinCountdownTimer); renderSpinWheel(); return; }
      el.textContent = Math.floor(rem/60000) + 'm ' + Math.floor((rem%60000)/1000) + 's';
    }, 1000);
  }

  window._doSpin = function() {
    const btn = document.getElementById('spin-btn');
    if (btn) btn.disabled = true;
    const wheel = document.getElementById('spin-wheel');
    if (!wheel) return;

    const winIdx = Math.floor(Math.random() * prizes.length);
    const prize  = prizes[winIdx];
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    const targetDeg  = extraSpins * 360 + (360 - winIdx * (360 / prizes.length)) - (360 / prizes.length / 2);

    wheel.style.transform = `rotate(${targetDeg}deg)`;
    if (window.SoundManager) SoundManager.play('whoosh');

    setTimeout(() => {
      const res = document.getElementById('spin-result');
      if (res) {
        res.innerHTML = `<span style="color:var(--gold)">&#x1F389; You won: ${prize.label}!</span>`;
        res.style.animation = 'bubbleIn 0.4s ease';
      }
      if (prize.type === 'cash') {
        GameState.addCash(prize.value, '+&#x20B1;' + prize.value + ' wheel!');
      } else {
        GameState.addXP(prize.value);
        showToast('&#x1F4AB; +' + prize.value + ' XP from wheel!', 'success');
      }
      if (window.SoundManager) SoundManager.play('achievement');
      window._spinCooldown = Date.now() + 5 * 60 * 1000;
      // Show cooldown after 2s
      setTimeout(() => {
        const btn2 = document.getElementById('spin-btn');
        if (btn2) btn2.textContent = '&#x23F0; Come back in 5 min!';
      }, 2000);
    }, 3200);
  };
}

// ===== RIGHT PANEL — Mini-games, Spin Wheel, Daily Calendar =====
window._initRightPanel = function() {
  if (document.getElementById('right-action-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'right-action-panel';
  panel.style.cssText = [
    'position:fixed',
    'right:0',
    'top:56px',
    'width:72px',
    'bottom:44px',
    'background:rgba(18,10,6,0.92)',
    'border-left:1px solid rgba(255,211,122,0.18)',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'padding:8px 0',
    'gap:6px',
    'z-index:50',
    'overflow-y:auto',
    'overflow-x:hidden',
  ].join(';');

  const buttons = [
    { icon: '&#x2699;&#xFE0F;', label: 'Settings',  action: "openModal('settings')" },
    { icon: '&#x1F525;',        label: 'Cook',       action: "openModal('minigame_cook')" },
    { icon: '&#x1FAE7;',        label: 'Wash',       action: "openModal('minigame_wash')" },
    { icon: '&#x1F4B0;',        label: 'Register',   action: "openModal('minigame_cash')" },
    { icon: '&#x1F4E6;',        label: 'Restock',    action: "openModal('minigame_restock')" },
    { icon: '&#x1F3A1;',        label: 'Spin',       action: "openModal('spin_wheel')" },
    { icon: '&#x1F4C5;',        label: 'Calendar',   action: "window._showCalendar()" },
  ];

  panel.innerHTML = buttons.map(b => `
    <button onclick="${b.action}" title="${b.label}" style="
      width:56px;height:56px;border-radius:14px;border:1px solid rgba(255,211,122,0.2);
      background:rgba(0,0,0,0.35);cursor:pointer;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:2px;transition:all 0.15s;
      font-size:22px;color:var(--gold);padding:0;
    " onmouseover="this.style.background='rgba(255,211,122,0.12)';this.style.borderColor='var(--gold)'"
       onmouseout="this.style.background='rgba(0,0,0,0.35)';this.style.borderColor='rgba(255,211,122,0.2)'">
      <span>${b.icon}</span>
      <span style="font-family:var(--font-mono);font-size:8px;color:rgba(255,211,122,0.6);letter-spacing:0.5px">${b.label.toUpperCase()}</span>
    </button>
  `).join('');

  document.getElementById('hud').appendChild(panel);
};

// ===== DAILY LOGIN CALENDAR POPUP =====
window._showCalendar = function() {
  const today = new Date().toDateString();
  const streak = GameState.loginStreak || 1;
  const rewards = [100, 150, 200, 300, 400, 600, 1000];

  const overlay = document.createElement('div');
  overlay.id = 'calendar-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1600;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px)';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(24,18,18,0.98),rgba(35,25,22,0.98));border:2px solid var(--gold);border-radius:24px;padding:32px 36px;max-width:420px;width:92vw;box-shadow:0 0 60px rgba(255,211,122,0.35);animation:bubbleIn 0.4s ease">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:44px;margin-bottom:8px">&#x1F4C5;</div>
        <div style="font-family:var(--font-head);font-size:22px;color:var(--gold);font-weight:900;letter-spacing:2px">DAILY LOGIN</div>
        <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:4px">Day ${streak} streak &#x1F525;</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:20px">
        ${Array.from({length:7},(_,i)=>{
          const day=i+1, done=day<=streak, isToday=day===streak;
          const reward=rewards[i]||100;
          return `<div style="text-align:center;background:${done?'rgba(255,211,122,0.15)':'rgba(0,0,0,0.3)'};border:${isToday?'2px solid var(--gold)':'1px solid rgba(255,211,122,0.15)'};border-radius:12px;padding:8px 4px;box-shadow:${isToday?'0 0 14px rgba(255,211,122,0.4)':'none'}">
            <div style="font-size:18px">${done?'&#x2B50;':'&#x25CB;'}</div>
            <div style="font-family:var(--font-mono);font-size:9px;color:${done?'var(--gold)':'var(--text-dim)'};margin-top:3px">Day ${day}</div>
            <div style="font-family:var(--font-head);font-size:10px;color:${done?'var(--success)':'var(--text-dim)'};font-weight:700">&#x20B1;${reward}</div>
          </div>`;
        }).join('')}
      </div>

      <div style="text-align:center;background:rgba(255,211,122,0.08);border:1px solid rgba(255,211,122,0.2);border-radius:14px;padding:14px;margin-bottom:16px">
        <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim)">Today's reward</div>
        <div style="font-family:var(--font-head);font-size:32px;font-weight:900;color:var(--success)">+&#x20B1;${rewards[Math.min(streak-1,6)]}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:4px">Come back tomorrow for Day ${Math.min(streak+1,7)}!</div>
      </div>

      <button onclick="document.getElementById('calendar-overlay').remove()" style="width:100%;padding:14px;font-family:var(--font-head);font-size:16px;font-weight:900;background:linear-gradient(135deg,var(--gold),#ff6a3d);border:none;color:#1a0a00;border-radius:14px;cursor:pointer;letter-spacing:1px">
        &#x2728; Close
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
};

// Hook right panel init into game start
const _origStartGame = UIManager.startGame;
UIManager.startGame = function(isLoad, saveData, newName) {
  _origStartGame.call(this, isLoad, saveData, newName);
  setTimeout(window._initRightPanel, 1200);
};
