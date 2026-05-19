/* ===== KITCHEN DISASTER MINIGAME ===== */
window.VirusGame = {
  currentPC: null,
  phase: 0,
  score: 0,
  targets: [],
  reactionTimer: null,

  trigger(pc) {
    this.currentPC = pc;
    this.phase = 0;
    this.score = 0;
    document.getElementById('virus-pc-id').textContent = 'TABLE #' + (pc.id + 1);
    document.getElementById('virus-modal').classList.remove('hidden');
    this.runPhase();
  },

  runPhase() {
    const area = document.getElementById('virus-game-area');
    const phases = [this.phaseDiagnosis, this.phaseCommandLine, this.phaseReaction];
    if (this.phase < phases.length) {
      phases[this.phase].call(this, area);
    } else {
      this.finish();
    }
  },

  phaseDiagnosis(area) {
    const issues = ['SPOILED_FOOD','FLY_INFESTATION','DIRTY_PLATO','LACK_OF_RICE','SALTY_ADOBO','SPILLS','STALE_SOUP','HAIR_IN_FOOD']; // Corrected variable name
    const correct = issues[Math.floor(Math.random() * issues.length)];
    const options = [...issues].sort(() => Math.random() - 0.5).slice(0, 4);
    if (!options.includes(correct)) options[0] = correct;
    options.sort(() => Math.random() - 0.5);

    area.innerHTML = `
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-family:var(--font-mono);color:var(--danger);font-size:13px;margin-bottom:8px">PHASE 1 — DIAGNOSING...</div>
        <div style="font-size:13px;color:var(--text);margin-bottom:14px">Problem detected: <span style="color:var(--warn);font-weight:700">${correct}</span> — What's the issue?</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:320px;margin:0 auto">
          ${options.map(o => `<button onclick="VirusGame.answerAntivirus('${o}','${correct}')" style="background:rgba(255,45,120,0.08);border:1px solid rgba(255,45,120,0.3);color:var(--text);font-family:var(--font-mono);font-size:12px;padding:12px;border-radius:4px;cursor:pointer;transition:all 0.15s" onmouseover="this.style.borderColor='var(--neon)'" onmouseout="this.style.borderColor='rgba(255,45,120,0.3)'">${o}</button>`).join('')}
        </div>
      </div>`;
  },

  answerAntivirus(chosen, correct) {
    if (chosen === correct) { this.score++; showToast('✅ Diagnosis Correct!', 'success'); }
    else showToast('❌ Incorrect Diagnosis! It was ' + correct, 'danger');
    this.phase++;
    this.runPhase();
  },

  phaseCommandLine(area) {
    const commands = [
      { q:'Clean the spilled soup?', a:'wipe table_01', opts:['wipe table_01','burn_it_all','ignore_mess','throw_plate'] }, // Karinderya themed commands
      { q:'Serve the hot adobo?', a:'serve plate_full', opts:['serve plate_full','eat_it_yourself','drop_it','sell_expired'] }, // Karinderya themed commands
      { q:'Throw away spoiled rice?', a:'discard spoil_ed', opts:['discard spoil_ed','keep_it','sell_it','mix_it'] }, // Karinderya themed commands
    ];
    const q = commands[Math.floor(Math.random() * commands.length)];
    q.opts.sort(() => Math.random() - 0.5);

    area.innerHTML = `
      <div style="text-align:center">
        <div style="font-family:var(--font-mono);color:var(--danger);font-size:13px;margin-bottom:8px">PHASE 2 — COMMAND LINE</div>
        <div style="background:rgba(20,12,8,0.9);border:1px solid rgba(255,211,122,0.3);border-radius:4px;padding:12px;font-family:var(--font-mono);font-size:12px;color:var(--gold);text-align:left;margin-bottom:14px">
          📋 TASK: ${q.q}<br><span style="color:var(--text-dim)">Pick the correct action:</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;max-width:320px;margin:0 auto">
          ${q.opts.map(o => `<button onclick="VirusGame.answerCmd('${o}','${q.a}')" style="background:rgba(255,211,122,0.06);border:1px solid rgba(255,211,122,0.25);color:var(--text);font-family:var(--font-mono);font-size:12px;padding:10px;border-radius:4px;cursor:pointer;text-align:left;transition:all 0.15s" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='rgba(255,211,122,0.25)'">▶ ${o}</button>`).join('')}
        </div>
      </div>`;
  },

  answerCmd(chosen, correct) {
    if (chosen === correct) { this.score++; showToast('✅ Command Accepted!', 'success'); }
    else showToast('❌ Invalid Command!', 'danger');
    this.phase++;
    this.runPhase();
  },

  phaseReaction(area) {
    let timeLeft = 5; // Keep the timer for quick reaction
    let clicked = false;

    area.innerHTML = `
      <div style="text-align:center">
        <div style="font-family:var(--font-mono);color:var(--danger);font-size:13px;margin-bottom:8px">PHASE 3 — QUICK REACTION</div>
        <div style="font-size:12px;color:var(--text);margin-bottom:14px">Click CLEAN when it turns red!</div>
        <div style="position:relative;height:100px;display:flex;align-items:center;justify-content:center">
          <button id="react-btn" style="background:rgba(0,200,255,0.1);border:2px solid var(--neon);color:var(--text);font-family:var(--font-head);font-size:14px;padding:16px 32px;border-radius:4px;cursor:pointer;transition:all 0.3s" onclick="VirusGame.clickReact()">PREPARE TO CLEAN...</button>
        </div>
        <div id="react-timer" style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim)">Get ready...</div>
      </div>`;

    const delay = 1500 + Math.random() * 2000;
    setTimeout(() => {
      const btn = document.getElementById('react-btn');
      if (!btn) return;
      btn.textContent = 'CLEAN!';
      btn.style.background = 'rgba(255,45,120,0.3)';
      btn.style.borderColor = 'var(--danger)';
      btn.style.color = 'var(--danger)';
      this._reactionActive = true;

      this.reactionTimer = setTimeout(() => {
        if (!this._reactionClicked) {
          showToast('⏱ Too slow!', 'danger');
          this.phase++;
          this.runPhase();
        }
      }, 1500);
    }, delay);
  },

  clickReact() {
    if (!this._reactionActive) { showToast('Too early!', 'warn'); return; }
    clearTimeout(this.reactionTimer);
    this._reactionClicked = true;
    this._reactionActive = false;
    this.score++;
    showToast('⚡ Fast reflexes!', 'success');
    this.phase++;
    this.runPhase();
  },

  finish() {
    const area = document.getElementById('virus-game-area');
    const success = this.score >= 2;
    const pc = this.currentPC;

    if (success) {
      pc.broken = false;
      SceneManager.updatePC(pc);
      GameState.addReputation(5);
      GameState.addXP(30);
      GameState.addCash(50, '+₱50 bonus');
      area.innerHTML = `<div style="text-align:center;padding:20px"><div style="font-size:48px;margin-bottom:12px">✅</div><div style="font-family:var(--font-head);color:var(--success);font-size:16px;margin-bottom:8px">CLEANED UP!</div><div style="font-size:13px;color:var(--text)">Score: ${this.score}/3 — Table is ready!</div><button onclick="VirusGame.close()" style="margin-top:16px;background:var(--success);border:none;color:#000;font-family:var(--font-head);font-size:12px;padding:10px 24px;border-radius:4px;cursor:pointer;font-weight:700">SALAMAT!</button></div>`; // Updated success message
    } else {
      pc.broken = true;
      SceneManager.updatePC(pc);
      GameState.addReputation(-5);
      area.innerHTML = `<div style="text-align:center;padding:20px"><div style="font-size:48px;margin-bottom:12px">💀</div><div style="font-family:var(--font-head);color:var(--danger);font-size:16px;margin-bottom:8px">CLEANUP FAILED!</div><div style="font-size:13px;color:var(--text)">Score: ${this.score}/3 — Table remains dirty!</div><button onclick="VirusGame.close()" style="margin-top:16px;background:var(--danger);border:none;color:#fff;font-family:var(--font-head);font-size:12px;padding:10px 24px;border-radius:4px;cursor:pointer;font-weight:700">CLOSE</button></div>`; // Updated failure message
    }
  },

  close() {
    document.getElementById('virus-modal').classList.add('hidden');
    this._reactionActive = false;
    this._reactionClicked = false;
    clearTimeout(this.reactionTimer);
  }
};
