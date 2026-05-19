/* ===== STAFF SYSTEM ===== */
window.StaffSystem = {
  ROLES: [
    { id:'manager',    icon:'👔', name:'Manager',    desc:'Greets & seats customers automatically',    salary:80,  minLevel:1 },
    { id:'waiter',     icon:'🤵', name:'Waiter',     desc:'Takes orders, serves food, gives the bill', salary:40,  minLevel:1 },
    { id:'chef',       icon:'👨‍🍳', name:'Chef',       desc:'Cooks orders in the kitchen',               salary:60,  minLevel:1 },
    { id:'cashier',    icon:'💁', name:'Cashier',    desc:'Processes customer payments at the counter', salary:35,  minLevel:1 },
    { id:'cleaner',    icon:'🧹', name:'Cleaner',    desc:'Clears dirty tables, brings plates to sink', salary:25,  minLevel:1 },
    { id:'dishwasher', icon:'🫧', name:'Dishwasher', desc:'Washes dishes at the washing area',          salary:25,  minLevel:1 },
    { id:'guard',      icon:'👮', name:'Guard',      desc:'Prevents theft and dine-and-dash',           salary:45,  minLevel:2 },
    { id:'accountant', icon:'🧑‍💼', name:'Accountant', desc:'Reduces tax penalties, tracks expenses',    salary:70,  minLevel:5, requiresRoom: true },
  ],

  PERSONALITIES: ['Hardworking','Lazy','Friendly','Grumpy','Enthusiastic','Burnt Out'],
  NAMES: ['Alex','Jordan','Sam','Casey','Riley','Morgan','Taylor','Quinn','Blake','Avery',
          'Nena','Mang Tito','Ate Bea','Kuya Jun','Lola Cita','Manong Ben'],

  hire(roleId) {
    const role = this.ROLES.find(r => r.id === roleId);
    if (!role) return;
    if (GameState.level < (role.minLevel || 1)) { showToast('Need Level ' + role.minLevel + ' to hire!', 'warn'); return; }
    if (role.requiresRoom && !GameState.upgrades.accountantRoom) {
      showToast('🔒 Buy the Accountant Office expansion first!', 'warn'); return;
    }
    const cost = role.salary * 3;
    if (GameState.cash < cost) { showToast('Need ₱' + cost + ' to hire!', 'warn'); return; }
    GameState.addCash(-cost, '-₱' + cost + ' hiring');
    const emp = this._generate(roleId);
    GameState.staff.push(emp);
    this.createStaffMesh(emp);
    showToast(role.icon + ' Hired ' + emp.name + ' as ' + role.name + '!', 'success');
    addEventLog(role.icon + ' ' + emp.name + ' joined the team!');
    checkAchievements();
    // Tutorial flags
    if (window.Tutorial) Tutorial.onFlag('hired_' + roleId);
    openModal('staff');
  },

  fire(empId) {
    const idx = GameState.staff.findIndex(e => e.id === empId);
    if (idx === -1) return;
    const emp = GameState.staff[idx];
    if (emp.mesh) SceneManager.scene.remove(emp.mesh);
    GameState.staff.splice(idx, 1);
    showToast('👋 Fired ' + emp.name, 'warn');
    openModal('staff');
  },

  _generate(roleId) {
    const role = this.ROLES.find(r => r.id === roleId);
    return {
      id: Date.now() + Math.random(),
      roleId,
      name: this.NAMES[Math.floor(Math.random() * this.NAMES.length)],
      personality: this.PERSONALITIES[Math.floor(Math.random() * this.PERSONALITIES.length)],
      salary: role.salary,
      skill: 1 + Math.floor(Math.random() * 3),
      mood: 70 + Math.floor(Math.random() * 30),
      loyalty: 50 + Math.floor(Math.random() * 50),
      isLate: false,
      daysWorked: 0,
      icon: role.icon,
      role: role.name,
      state: 'idle',
      targetPos: null,
      cleaningTrashId: null,
      fixingPcId: null,
      path: [],
      animationTimer: 0
    };
  },

  restoreStaff(data) {
    const emp = { ...data, state: 'idle', targetPos: null, path: [], cleaningTrashId: null, fixingPcId: null, animationTimer: 0 };
    GameState.staff.push(emp);
    this.createStaffMesh(emp);
  },

  createStaffMesh(emp) {
    if (!window.THREE || !SceneManager.scene) return;
    const group = new THREE.Group();

    const bodyGeo = THREE.CapsuleGeometry
      ? new THREE.CapsuleGeometry(0.15, 0.4, 4, 8)
      : new THREE.CylinderGeometry(0.15, 0.15, 0.55, 8);

    // Role-based uniform colors
    const uniformColors = {
      manager: 0x1a3a6b, waiter: 0xffffff, chef: 0xf5f5f5,
      cashier: 0x2e7d32, cleaner: 0x795548, dishwasher: 0x546e7a,
      guard: 0x212121, accountant: 0x4a148c
    };
    const body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: uniformColors[emp.roleId] || 0x2244aa }));
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshLambertMaterial({ color: 0xffdbac }));
    head.position.y = 0.45;
    group.add(head);

    // Chef hat
    if (emp.roleId === 'chef') {
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.22, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      hat.position.y = 0.65;
      group.add(hat);
    }
    // Cleaner broom
    if (emp.roleId === 'cleaner') {
      const stick = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.8, 0.03), new THREE.MeshLambertMaterial({ color: 0x884422 }));
      stick.position.set(0.2, 0, 0.1); stick.rotation.z = -0.2;
      group.add(stick);
    }

    // Mood bar
    const barBg = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.05), new THREE.MeshBasicMaterial({ color: 0x333333 }));
    barBg.position.y = 0.8; barBg.name = 'fatigue_bg';
    group.add(barBg);
    const barFill = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.05), new THREE.MeshBasicMaterial({ color: 0xff2d78 }));
    barFill.position.set(0, 0.8, 0.01); barFill.name = 'fatigue_fill';
    group.add(barFill);
    group.userData.fatigueBar = barFill;
    group.userData.fatigueBg = barBg;

    // Spawn staff in the safe dining area, away from walls and furniture
    const safeSpawnPositions = [
      [-3, -3], [-1, -3], [1, -3], [3, -3],
      [-3, -1], [-1, -1], [1, -1], [3, -1],
      [-3,  1], [-1,  1], [1,  1], [3,  1],
    ];
    const usedPositions = GameState.staff.map(s => s.mesh ? [s.mesh.position.x, s.mesh.position.z] : null).filter(Boolean);
    const freePos = safeSpawnPositions.find(([sx, sz]) =>
      !usedPositions.some(([ux, uz]) => Math.abs(ux - sx) < 1.2 && Math.abs(uz - sz) < 1.2)
    ) || [-2 + Math.random() * 4, -2 + Math.random() * 4];
    group.position.set(freePos[0], 0.65, freePos[1]);
    SceneManager.scene.add(group);
    emp.mesh = group;
  },

  applyEffects() {
    const has = (id) => GameState.staff.some(e => e.roleId === id && (!e.isLate || GameState.hour >= 10));

    // Manager: auto-seat queued customers
    if (has('manager')) {
      const queued = GameState.customers.find(c => c.state === 'queued');
      const freePC = GameState.pcs.find(p => !p.occupied && !p.broken);
      if (queued && freePC) {
        CustomerSystem.assignPC(queued, freePC, queued.desiredType);
        addEventLog('👔 Manager seated a customer');
      }
    }

    // Waiter: auto-checkout waiting customers (works solo)
    if (has('waiter')) {
      const waiting = GameState.customers.find(c => c.state === 'waiting_to_pay');
      if (waiting) {
        CustomerSystem.checkout(waiting);
        addEventLog('🤵 Waiter processed payment');
      }
    }

    // Cleaner: auto-clean trash
    if (has('cleaner') && GameState.trash.length > 0) {
      const cleaner = GameState.staff.find(e => e.roleId === 'cleaner' && e.state === 'idle');
      if (cleaner) {
        const trash = GameState.trash.find(t => !GameState.staff.some(s => s.cleaningTrashId === t.id));
        if (trash) {
          cleaner.state = 'walking';
          cleaner.targetPos = new THREE.Vector3(trash.x, 0.65, trash.z);
          cleaner.path = SceneManager.getPath(cleaner.mesh.position, cleaner.targetPos);
          cleaner.cleaningTrashId = trash.id;
        }
      }
    }

    // Accountant: small passive savings
    if (has('accountant') && Math.random() < 0.05) {
      const saved = Math.floor(30 + Math.random() * 80);
      GameState.addCash(saved, `+₱${saved} accounting`);
    }

    return {};
  },

  dailyMoodUpdate() {
    GameState.staff.forEach(emp => {
      if (emp.personality === 'Burnt Out') emp.mood = Math.max(10, emp.mood - 5);
      else if (emp.personality === 'Enthusiastic') emp.mood = Math.min(100, emp.mood + 3);
      else emp.mood = Math.max(20, Math.min(100, emp.mood + (Math.random() > 0.5 ? 2 : -2)));
      emp.daysWorked++;
      emp.loyalty = Math.min(100, emp.loyalty + 1);
      emp.isLate = false;
      if (emp.personality === 'Lazy' && Math.random() < 0.25) {
        emp.isLate = true;
        addEventLog(`⏰ ${emp.name} is running late today!`);
      }
      if (emp.mood < 20 && Math.random() < 0.1) {
        this.fire(emp.id);
        addEventLog('😤 ' + emp.name + ' quit due to low morale!');
        showToast('😤 ' + emp.name + ' resigned!', 'danger');
      }
    });
  },

  update(delta) {
    // Break room is the manager desk area — inside the room
    const breakRoomPos = new THREE.Vector3(6.5, 0.65, -7);
    GameState.staff.forEach(emp => {
      if (!emp.mesh) return;
      if (emp.isLate && GameState.hour < 10) return;

      // Mood bar
      const fill = emp.mesh.userData.fatigueBar;
      const bg = emp.mesh.userData.fatigueBg;
      if (fill && bg) {
        const low = emp.mood < 40;
        fill.visible = bg.visible = low;
        if (low) {
          fill.scale.x = emp.mood / 100;
          fill.position.x = -0.2 * (1 - emp.mood / 100);
          fill.material.color.setHex(emp.mood < 20 ? 0xff0000 : 0xffaa00);
        }
      }

      if (emp.state === 'walking') {
        if (emp.path && emp.path.length > 0) {
          const next = emp.path[0];
          const dir = next.clone().sub(emp.mesh.position);
          if (dir.length() < 0.2) {
            emp.path.shift();
            if (emp.path.length === 0) {
              emp.state = emp.cleaningTrashId !== null ? 'cleaning' : emp.fixingPcId !== null ? 'fixing' : 'idle';
              emp.animationTimer = 2.0;
            }
            return;
          }
          dir.normalize().multiplyScalar(0.05 * delta * 60);
          emp.mesh.position.add(dir);
          emp.mesh.lookAt(next.x, emp.mesh.position.y, next.z);
        }
      } else if (emp.state === 'idle') {
        if (emp.mesh.position.distanceTo(breakRoomPos) > 1.5) {
          emp.state = 'walking';
          emp.targetPos = breakRoomPos.clone();
          emp.path = SceneManager.getPath(emp.mesh.position, emp.targetPos);
        } else {
          const rate = GameState.upgrades.staffLounge ? 0.5 : 0.2;
          emp.mood = Math.min(100, emp.mood + rate);
        }
        emp.mesh.position.y = 0.65 + Math.sin(Date.now() * 0.002) * 0.01;
      } else if (emp.state === 'cleaning' || emp.state === 'fixing') {
        emp.animationTimer -= delta;
        emp.mesh.rotation.y += Math.sin(Date.now() * 0.01) * 0.1;
        emp.mesh.position.y = 0.65 + Math.sin(Date.now() * 0.02) * 0.02;
        if (emp.animationTimer <= 0) {
          if (emp.cleaningTrashId !== null) {
            SceneManager.cleanTrash(emp.cleaningTrashId);
            emp.cleaningTrashId = null;
          } else if (emp.fixingPcId !== null) {
            const pc = GameState.pcs.find(p => p.id === emp.fixingPcId);
            if (pc) { pc.broken = false; SceneManager.updatePC(pc); }
            emp.fixingPcId = null;
          }
          emp.state = 'idle';
          emp.mesh.position.y = 0.65;
        }
      }
    });
  }
};

GameState.onTick(() => StaffSystem.applyEffects());
