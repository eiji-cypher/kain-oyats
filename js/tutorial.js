/* ===== TUTORIAL SYSTEM — Fully Guided, No Softlocks, Always Has Next ===== */
window.Tutorial = {
  active: false,
  stepIdx: 0,
  flags: {},
  _autoTimer: null,

  STEPS: [
    // 0 — Welcome
    {
      id: 'welcome',
      mascot: '&#x1F9D1;&#x200D;&#x1F373;',
      text: '<b>Mabuhay! Welcome to KantoKain!</b><br><br>' +
            'You are the proud owner of a Filipino carinderia. &#x1F371;<br><br>' +
            'Serve delicious home-cooked meals, hire staff, and grow your restaurant into a legend!<br><br>' +
            '<span style="color:var(--neon)">Let\'s get cooking, Boss!</span>',
      target: null,
      nextLabel: "Let's Start! &#x1F373;",
    },

    // 1 — Buy first Table
    {
      id: 'buy_table',
      mascot: '&#x1FA91;',
      text: '<b>Buy Your First Table!</b><br><br>' +
            'Customers need a place to sit before they can eat.<br><br>' +
            '&#x1F449; Click the glowing <b style="color:var(--gold)">&#x1FA91; Table &#x2014; &#x20B1;150</b> button on the left sidebar!<br><br>' +
            '<span style="color:var(--text-dim);font-size:14px">Or press Next to skip this step.</span>',
      target: '#btn-add-pc',
      waitFlag: 'pc_placed',
      nextLabel: 'Next &#x2192;',
      waitingText: 'Click the Table button on the left...',
    },

    // 2 — Customer arriving (auto-spawned)
    {
      id: 'wait_customer',
      mascot: '&#x1F440;',
      text: '<b>Table Placed! Great job, Boss!</b> &#x2705;<br><br>' +
            'A customer is walking in right now!<br><br>' +
            'Watch them sit down, order food, eat, and pay &#x2014; all automatically!<br><br>' +
            '<span style="color:var(--neon)">Your carinderia is open for business!</span>',
      target: null,
      waitFlag: 'cash_earned',
      nextLabel: 'Next &#x2192;',
      waitingText: 'Waiting for customer to pay...',
    },

    // 3 — First income
    {
      id: 'first_income',
      mascot: '&#x1F4B0;',
      text: '<b>You Earned Money!</b> &#x1F4B0;<br><br>' +
            'Every customer who eats and pays adds to your <b style="color:var(--gold)">Balance</b>.<br><br>' +
            'The more tables you have, the more you earn!<br><br>' +
            '<b style="color:var(--success)">Tip: Buy more tables to serve more customers at once!</b>',
      target: '#stat-cash',
      nextLabel: 'Got it! &#x2192;',
    },

    // 4 — Hire Manager
    {
      id: 'hire_manager',
      mascot: '&#x1F454;',
      text: '<b>Hire a Manager!</b><br><br>' +
            'A Manager automatically <b>greets and seats customers</b> so you don\'t have to!<br><br>' +
            '&#x1F449; Open <b style="color:var(--gold)">&#x1F454; Staff</b> and hire a <b>Manager</b>.<br><br>' +
            '<span style="color:var(--text-dim);font-size:14px">Cost: &#x20B1;240 &mdash; Worth every peso!</span>',
      target: '#btn-staff',
      waitFlag: 'hired_manager',
      nextLabel: 'Next &#x2192;',
      waitingText: 'Open Staff panel and hire a Manager...',
    },

    // 5 — Hire Waiter
    {
      id: 'hire_waiter',
      mascot: '&#x1F935;',
      text: '<b>Hire a Waiter!</b><br><br>' +
            'Waiters <b>take orders, serve food, and process payments</b> automatically!<br><br>' +
            '&#x1F449; Still in <b style="color:var(--gold)">&#x1F454; Staff</b> &#x2014; hire a <b>Waiter</b>.<br><br>' +
            '<span style="color:var(--text-dim);font-size:14px">Cost: &#x20B1;120 &mdash; Faster service = happier customers!</span>',
      target: '#btn-staff',
      waitFlag: 'hired_waiter',
      nextLabel: 'Next &#x2192;',
      waitingText: 'Open Staff panel and hire a Waiter...',
    },

    // 6 — Hire Chef
    {
      id: 'hire_chef',
      mascot: '&#x1F468;&#x200D;&#x1F373;',
      text: '<b>Hire a Chef!</b><br><br>' +
            'Chefs <b>cook customer orders</b> in the kitchen.<br><br>' +
            'Faster cooking = happier customers = more tips! &#x1F373;<br><br>' +
            '&#x1F449; Hire a <b>Chef</b> from the Staff panel.<br><br>' +
            '<span style="color:var(--text-dim);font-size:14px">Cost: &#x20B1;180</span>',
      target: '#btn-staff',
      waitFlag: 'hired_chef',
      nextLabel: 'Next &#x2192;',
      waitingText: 'Open Staff panel and hire a Chef...',
    },

    // 7 — Hire Cleaner
    {
      id: 'hire_cleaner',
      mascot: '&#x1F9F9;',
      text: '<b>Hire a Cleaner!</b><br><br>' +
            'Cleaners <b>clear dirty tables</b> and bring dishes to the kitchen sink.<br><br>' +
            'A clean carinderia = more customers! &#x2728;<br><br>' +
            '&#x1F449; Hire a <b>Cleaner</b> from the Staff panel.<br><br>' +
            '<span style="color:var(--text-dim);font-size:14px">Cost: &#x20B1;75</span>',
      target: '#btn-staff',
      waitFlag: 'hired_cleaner',
      nextLabel: 'Next &#x2192;',
      waitingText: 'Open Staff panel and hire a Cleaner...',
    },

    // 8 — Hire Dishwasher
    {
      id: 'hire_dishwasher',
      mascot: '&#x1FAE7;',
      text: '<b>Hire a Dishwasher!</b><br><br>' +
            'Dishwashers <b>wash all dirty dishes</b> at the sink so your kitchen stays clean!<br><br>' +
            '&#x1F449; Hire a <b>Dishwasher</b> from the Staff panel.<br><br>' +
            '<span style="color:var(--text-dim);font-size:14px">Cost: &#x20B1;75 &mdash; Clean dishes = faster service!</span>',
      target: '#btn-staff',
      waitFlag: 'hired_dishwasher',
      nextLabel: 'Next &#x2192;',
      waitingText: 'Open Staff panel and hire a Dishwasher...',
    },

    // 9 — Mini-game intro: Cooking
    {
      id: 'minigame_cook_intro',
      mascot: '&#x1F525;',
      text: '<b>Try the Cooking Mini-Game!</b><br><br>' +
            'Tap the button when the bar hits the <b style="color:var(--success)">GREEN ZONE</b> to cook a perfect dish!<br><br>' +
            'Perfect cooks earn <b style="color:var(--gold)">bonus cash and XP!</b><br><br>' +
            '<span style="color:var(--neon)">Mini-games appear randomly during gameplay!</span>',
      target: null,
      nextLabel: 'Try it! &#x1F373;',
      onNext() { openModal('minigame_cook'); },
    },

    // 10 — Upgrades
    {
      id: 'upgrades',
      mascot: '&#x2B06;&#xFE0F;',
      text: '<b>Upgrade Your Carinderia!</b><br><br>' +
            'Open <b style="color:var(--gold)">&#x2B06;&#xFE0F; Upgrades</b> and buy <b>Ingredient Quality</b>.<br><br>' +
            'Better ingredients = tastier food = higher prices = more profit! &#x1F4B8;<br><br>' +
            '<span style="color:var(--text-dim);font-size:14px">Or press Next to continue.</span>',
      target: '#btn-upgrades',
      waitFlag: 'upgrade_bought',
      nextLabel: 'Next &#x2192;',
      waitingText: 'Buy any upgrade to continue...',
    },

    // 11 — Rivals
    {
      id: 'rivals',
      mascot: '&#x2694;&#xFE0F;',
      text: '<b>Watch Out for Rivals!</b><br><br>' +
            'Open <b style="color:var(--gold)">&#x2694;&#xFE0F; Rivals</b> to see competing carinderias:<br><br>' +
            '&#x1F372; <b>Aling Nena\'s Carinderia</b><br>' +
            '&#x1F356; <b>Mang Jose Eatery</b><br>' +
            '&#x1F373; <b>Tapsi ni Maria</b><br><br>' +
            'Beat them in reputation to become the top carinderia in town!',
      target: '#btn-rivals',
      nextLabel: "I'll beat them! &#x2694;&#xFE0F;",
    },

    // 12 — Skills
    {
      id: 'skills',
      mascot: '&#x1F333;',
      text: '<b>Unlock Skills!</b><br><br>' +
            'Open <b style="color:var(--gold)">&#x1F333; Skills</b> to unlock powerful upgrades:<br><br>' +
            '&#x1F4B3; <b>Suki Customers</b> &#x2014; regulars return more often<br>' +
            '&#x1F4F1; <b>Viral Carinderia</b> &#x2014; TikTok fame!<br>' +
            '&#x1F389; <b>Fiesta Promo</b> &#x2014; massive income boosts!',
      target: '#btn-skills',
      nextLabel: 'Awesome! &#x2192;',
    },

    // 13 — Achievements
    {
      id: 'achievements',
      mascot: '&#x1F396;&#xFE0F;',
      text: '<b>Earn Achievements!</b><br><br>' +
            'Open <b style="color:var(--gold)">&#x1F396;&#xFE0F; Awards</b> to see all milestones you can unlock.<br><br>' +
            'Each achievement gives you <b>bonus cash and XP!</b> &#x1F3C6;<br><br>' +
            '<span style="color:var(--neon)">Achievements are the best way to earn big rewards!</span>',
      target: '#btn-achievements',
      nextLabel: "Let's earn them! &#x2192;",
    },

    // 14 — Level 2 & 5 unlocks
    {
      id: 'level_unlocks',
      mascot: '&#x1F3E2;',
      text: '<b>Level Up to Unlock More!</b><br><br>' +
            '&#x1F3E2; Reach <b style="color:var(--gold)">Level 2</b> to unlock the <b>Manager Office</b>!<br><br>' +
            '&#x1F9D1;&#x200D;&#x1F4BC; Reach <b style="color:var(--gold)">Level 5</b> to hire an <b>Accountant</b> who manages your cash flow and analytics!<br><br>' +
            '<span style="color:var(--neon)">Earn XP by serving customers and buying upgrades!</span>',
      target: '#stat-level',
      nextLabel: 'Got it! &#x2192;',
    },

    // 15 — Finish
    {
      id: 'finish',
      mascot: '&#x1F389;',
      text: '<b>You\'re Ready, Boss!</b> &#x1F389;<br><br>' +
            'Keep buying tables, hiring staff, upgrading food, and serving customers.<br><br>' +
            '&#x1F3C6; Build the most legendary carinderia in the Philippines!<br><br>' +
            '<span style="color:var(--neon);font-size:18px"><b>Good luck, Boss! Kaya mo \'yan!</b></span> &#x1F371;',
      target: null,
      nextLabel: "Let's Cook! &#x1F373;",
      last: true,
    },
  ],

  start() {
    this.active = true;
    this.stepIdx = 0;
    this.flags = {};
    this._clearAuto();
    this.show();
  },

  show() {
    const step = this.STEPS[this.stepIdx];
    if (!step) { this.end(); return; }

    const bubble   = document.getElementById('tut-bubble');
    const dim      = document.getElementById('tut-dim');
    const spot     = document.getElementById('tut-spotlight');
    const textEl   = document.getElementById('tut-text');
    const stepEl   = document.getElementById('tut-step');
    const nextBtn  = document.getElementById('tut-next');
    const skipBtn  = document.getElementById('tut-skip');
    const waitEl   = document.getElementById('tut-waiting');
    const mascotEl = document.getElementById('tut-mascot');

    if (!bubble) return;

    textEl.innerHTML  = step.text;
    stepEl.textContent = 'Step ' + (this.stepIdx + 1) + ' of ' + this.STEPS.length;
    mascotEl.innerHTML = step.mascot || '&#x1F9D1;&#x200D;&#x1F373;';

    // ALWAYS show Next button — no softlocks
    nextBtn.innerHTML = step.nextLabel || 'Next &#x2192;';
    nextBtn.style.display = 'inline-flex';

    // Waiting indicator only when there's a waitFlag
    if (waitEl) {
      if (step.waitFlag) {
        waitEl.textContent = step.waitingText || 'Waiting for you to act...';
        waitEl.classList.remove('hidden');
      } else {
        waitEl.classList.add('hidden');
      }
    }

    if (skipBtn) skipBtn.style.display = step.last ? 'none' : 'inline-flex';

    bubble.classList.remove('hidden');
    bubble.style.animation = 'none';
    void bubble.offsetWidth;
    bubble.style.animation = '';

    dim.classList.add('active');
    document.querySelectorAll('.tut-highlight').forEach(el => el.classList.remove('tut-highlight'));
    this._removeArrow();

    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) {
        el.classList.add('tut-highlight');
        this._positionSpotlight(el);
        this._positionBubbleNear(el);
        this._positionArrow(el);
        spot.classList.add('active');
      } else {
        spot.classList.remove('active');
        this._positionBubbleCenter();
      }
    } else {
      spot.classList.remove('active');
      this._positionBubbleCenter();
    }
  },

  _positionSpotlight(el) {
    const rect = el.getBoundingClientRect();
    const pad  = 12;
    const spot = document.getElementById('tut-spotlight');
    spot.style.left   = (rect.left - pad) + 'px';
    spot.style.top    = (rect.top  - pad) + 'px';
    spot.style.width  = (rect.width  + pad * 2) + 'px';
    spot.style.height = (rect.height + pad * 2) + 'px';
  },

  _positionBubbleNear(el) {
    const rect   = el.getBoundingClientRect();
    const bubble = document.getElementById('tut-bubble');
    const bw = Math.min(400, window.innerWidth - 180);
    const bh = 360;
    const margin = 16;
    const rightPanelW = 80;
    let left = rect.right + 24;
    let top  = rect.top;
    // Flip left if off right edge
    if (left + bw > window.innerWidth - rightPanelW) left = rect.left - bw - 24;
    // If still off left edge, center it
    if (left < margin) left = Math.max(margin, (window.innerWidth - bw) / 2);
    // Clamp vertical
    if (top + bh > window.innerHeight - 44) top = window.innerHeight - bh - 50;
    if (top < 60) top = 60;
    // Final safety clamp
    left = Math.max(margin, Math.min(left, window.innerWidth - bw - margin));
    top  = Math.max(60, Math.min(top, window.innerHeight - bh - 44));
    bubble.style.position  = 'fixed';
    bubble.style.left      = left + 'px';
    bubble.style.top       = top  + 'px';
    bubble.style.right     = 'auto';
    bubble.style.bottom    = 'auto';
    bubble.style.transform = 'none';
    bubble.style.maxWidth  = bw + 'px';
  },

  _positionBubbleCenter() {
    const bubble = document.getElementById('tut-bubble');
    // Always truly centered, clamped within safe viewport area
    bubble.style.position   = 'fixed';
    bubble.style.left       = '50%';
    bubble.style.top        = '50%';
    bubble.style.right      = 'auto';
    bubble.style.bottom     = 'auto';
    bubble.style.transform  = 'translate(-50%, -50%)';
    bubble.style.maxWidth   = 'min(400px, calc(100vw - 180px))';
  },

  _positionArrow(el) {
    this._removeArrow();
    const rect  = el.getBoundingClientRect();
    const arrow = document.createElement('div');
    arrow.className = 'tut-arrow';
    arrow.id        = 'tut-arrow';
    const spaceRight  = window.innerWidth  - rect.right;
    const spaceBottom = window.innerHeight - rect.bottom;
    if (spaceRight > 80) {
      arrow.innerHTML = '&#x1F448;';
      arrow.style.left = (rect.right + 16) + 'px';
      arrow.style.top  = (rect.top + rect.height / 2 - 20) + 'px';
    } else if (spaceBottom > 80) {
      arrow.innerHTML = '&#x1F446;';
      arrow.style.left = (rect.left + rect.width / 2 - 20) + 'px';
      arrow.style.top  = (rect.bottom + 12) + 'px';
    } else {
      arrow.innerHTML = '&#x1F447;';
      arrow.style.left = (rect.left + rect.width / 2 - 20) + 'px';
      arrow.style.top  = (rect.top - 56) + 'px';
    }
    document.body.appendChild(arrow);
  },

  _removeArrow() {
    document.querySelectorAll('.tut-arrow').forEach(a => a.remove());
  },

  _clearAuto() {
    if (this._autoTimer) { clearTimeout(this._autoTimer); this._autoTimer = null; }
  },

  next() {
    const step = this.STEPS[this.stepIdx];
    if (!step) return;
    if (step.last) { this.end(); return; }
    if (step.onNext) step.onNext();
    this.stepIdx++;
    this.show();
  },

  skip() {
    if (confirm('Skip the tutorial? You can restart it from Settings anytime.')) {
      this.end();
    }
  },

  // Called by game systems when player does something
  onFlag(flag) {
    if (!this.active) return;
    this._tryAdvance(flag);
  },

  _tryAdvance(flag) {
    const step = this.STEPS[this.stepIdx];
    if (step && step.waitFlag === flag) {
      this._clearAuto();
      this.stepIdx++;
      // When first table is placed, immediately spawn a tutorial customer
      if (flag === 'pc_placed' && window.CustomerSystem) {
        setTimeout(function() {
          var c = CustomerSystem.spawnCustomer();
          if (c) {
            var freePC = GameState.pcs.find(function(p){ return !p.occupied && !p.broken; });
            if (freePC) setTimeout(function(){ CustomerSystem.assignPC(c, freePC); }, 1400);
          }
        }, 700);
      }
      this._autoTimer = setTimeout(() => this.show(), 500);
    }
  },

  end() {
    this.active = false;
    this._clearAuto();
    const bubble = document.getElementById('tut-bubble');
    const dim    = document.getElementById('tut-dim');
    const spot   = document.getElementById('tut-spotlight');
    if (bubble) bubble.classList.add('hidden');
    if (dim)    dim.classList.remove('active');
    if (spot)   spot.classList.remove('active');
    document.querySelectorAll('.tut-highlight').forEach(el => el.classList.remove('tut-highlight'));
    this._removeArrow();
    if (window.showToast)        showToast('&#x1F389; Tutorial complete! Good luck, Boss!', 'success');
    if (window.addEventLog)      addEventLog('&#x1F393; Tutorial completed! Welcome to KantoKain!');
    if (window.showMilestonePop) showMilestonePop('&#x1F393;', 'TUTORIAL COMPLETE!', 'You are ready to run your carinderia!', 3000);
  }
};
