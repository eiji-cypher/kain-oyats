/* ===== RIVAL SYSTEM — Filipino Carinderia Names ===== */
window.RivalSystem = {
  rivals: [
    { id:1, name:"Aling Nena's Carinderia", icon:'🍲', level:1, cash:600,  rep:18, internet:1, pcs:3,  fame:12, active:true  },
    { id:2, name:"Mang Jose Eatery",        icon:'🍖', level:2, cash:1200, rep:32, internet:2, pcs:6,  fame:28, active:false },
    { id:3, name:"Tapsi ni Maria",           icon:'🍳', level:3, cash:2000, rep:48, internet:2, pcs:9,  fame:40, active:false },
    { id:4, name:"Kusina ni Aling Rosa",     icon:'🥘', level:5, cash:3500, rep:65, internet:3, pcs:14, fame:58, active:false },
    { id:5, name:"Pares House ni Kuya Ben",  icon:'🍜', level:7, cash:5000, rep:80, internet:4, pcs:20, fame:75, active:false },
  ],

  RIVAL_EVENTS: [
    'launched a discount promo!',
    'poached some of your suki customers!',
    'hosted a popular boodle fight event!',
    'had a kitchen fire — losing customers!',
    'launched a new silog meal!',
    'opened a second branch!',
    'got a bad review on Facebook!',
    'upgraded their menu selection!',
    'went viral on TikTok!',
    'hired a new chef from Manila!',
    'ran out of rice during lunch rush!',
    'got featured in a food blog!',
  ],

  tick() {
    this.rivals[1].active = GameState.level >= 2;
    this.rivals[2].active = GameState.level >= 4;
    this.rivals[3].active = GameState.level >= 6;
    this.rivals[4].active = GameState.level >= 9;
  },

  dailyGrowth() {
    this.rivals.filter(r => r.active).forEach(r => {
      r.cash += 80 + r.level * 20;
      r.rep   = Math.min(100, r.rep  + (Math.random() > 0.6 ? 1 : 0));
      r.fame  = Math.min(100, r.fame + (Math.random() > 0.7 ? 1 : 0));

      if (Math.random() < 0.15) {
        const evt = this.RIVAL_EVENTS[Math.floor(Math.random() * this.RIVAL_EVENTS.length)];
        addEventLog(`⚔️ ${r.icon} ${r.name} ${evt}`);
        if (evt.includes('poached')) {
          GameState.addReputation(-2);
          showToast(`😡 ${r.name} stole some customers!`, 'danger');
        } else if (evt.includes('kitchen fire')) {
          showToast(`😂 ${r.name} had a kitchen fire!`, 'success');
          GameState.addReputation(2);
        }
      }

      if (r.cash > 500 && r.internet < 4) { r.internet++; r.cash -= 300; }
      if (r.cash > 400) { r.pcs++; r.cash -= 150; }
    });
  },

  getLeaderboard() {
    const player = {
      name: GameState.cafeName || 'Your Carinderia',
      icon: '⭐', level: GameState.level,
      rep: Math.floor(GameState.reputation),
      internet: GameState.upgrades.internet + 1,
      pcs: GameState.pcs.length,
      fame: Math.floor(GameState.reputation * 0.8),
      active: true, isPlayer: true
    };
    return [player, ...this.rivals.filter(r => r.active)]
      .sort((a, b) => b.rep - a.rep);
  }
};
