# 🍲 KainOyats — Player Guide

> *"Authentic Filipino Lutong Bahay" — Build your carinderia from a humble eatery into a legendary restaurant.*

---

## Table of Contents

1. [What Is KainOyats?](#what-is-kainoyats)
2. [Getting Started](#getting-started)
3. [Tutorial Walkthrough](#tutorial-walkthrough)
4. [Core Gameplay Loop](#core-gameplay-loop)
5. [The HUD Explained](#the-hud-explained)
6. [Tables & Seating](#tables--seating)
7. [Customers](#customers)
8. [Staff](#staff)
9. [Upgrades](#upgrades)
10. [Mini-Games](#mini-games)
11. [Spin the Wheel](#spin-the-wheel)
12. [Daily Login Rewards](#daily-login-rewards)
13. [Skills](#skills)
14. [Rivals](#rivals)
15. [Random Events & Weather](#random-events--weather)
16. [Market Trends](#market-trends)
17. [Bills & Taxes](#bills--taxes)
18. [Achievements](#achievements)
19. [Saving & Loading](#saving--loading)
20. [Tips & Strategies](#tips--strategies)
21. [Deployment Notes](#deployment-notes)

---

## What Is KainOyats?

KainOyats (also known as **KantoKain** in-game) is a **3D idle restaurant management game** set in the Philippines. You manage a local *carinderia* — a Filipino home-cooked eatery — serving hungry customers throughout the day. Place tables, hire staff, cook food, keep things clean, and grow your reputation until your humble eatery becomes the top carinderia in town.

The game is built entirely in the browser using **Three.js** for the 3D scene and the **Web Audio API** for procedural sound — no installation required.

---

## Getting Started

### Running the Game

Open `index.html` through a **local server** — not by double-clicking the file directly. Save data requires `localStorage`, which browsers block on `file://` URLs.

Quick options:
- **VS Code Live Server** — right-click `index.html` → *Open with Live Server*
- **Python**: `python -m http.server 8080`, then visit `http://localhost:8080`
- **Node.js**: `npx serve .`

### Main Menu

From the main menu you can:

- **New Game** — choose a save slot and name your carinderia
- **Load Game** — continue from a saved slot
- **Settings** — audio and display options
- **Credits** — game info and attributions

The game is version **v1.6.7**, built with Three.js.

### Save Slots

There are **6 save slots**. On New Game, pick any empty slot (or overwrite an existing one by confirming the prompt). The 🗑 icon in Load Game deletes a slot permanently. **Auto-save runs every 5 minutes** while playing.

---

## Tutorial Walkthrough

A 16-step in-game tutorial starts automatically on a new game. A golden mascot bubble appears with instructions, and a glowing spotlight highlights the relevant element. You can press **Next** at any point to skip a step — the tutorial never softlocks you.

### Step 1 — Welcome
The chef mascot greets you: *"Mabuhay! Welcome to KantoKain!"* You're introduced as the proud owner of a Filipino carinderia. Press **Let's Start!** to begin.

### Step 2 — Buy Your First Table
The **🪑 Table — ₱150** button on the left sidebar glows. Click it, then click any open floor space on the 3D scene to place your first dining table. Tables cost ₱150 each and are required before any customers can be seated.

### Step 3 — Watch Your First Customer
Once a table is placed, a customer is automatically spawned and walks in through the entrance. The tutorial pauses and lets you watch them sit down, order food, eat, and pay — all automatically for this first customer.

### Step 4 — First Income
After the customer pays, your cash balance increases. The tutorial explains: the more tables you have, the more customers you serve, the more you earn.

### Step 5 — Hire a Manager
Open **👔 Staff** and hire a **Manager (₱240)**. The Manager automatically greets and seats queued customers so you don't have to do it manually.

### Step 6 — Hire a Waiter
Still in the Staff panel, hire a **Waiter (₱120)**. Waiters take orders, serve food, and process customer payments automatically.

### Step 7 — Hire a Chef
Hire a **Chef (₱180)**. Chefs cook orders in the kitchen — faster cooking means happier customers and more tips.

### Step 8 — Hire a Cleaner
Hire a **Cleaner (₱75)**. Cleaners clear dirty tables and bring dishes to the kitchen sink. A clean carinderia has a higher star rating, which attracts more customers.

### Step 9 — Hire a Dishwasher
Hire a **Dishwasher (₱75)**. Dishwashers handle the sink, washing dirty plates to keep the kitchen running smoothly.

### Step 10 — Try the Cooking Mini-Game
The tutorial introduces the **Cooking Challenge** mini-game. A timing bar moves across the screen — tap when it hits the green zone to cook a perfect dish. Perfect cooks earn bonus cash and XP.

### Step 11 — Buy an Upgrade
Open **⬆️ Upgrades** and buy any upgrade. The tutorial recommends **Ingredient Quality** — better ingredients mean tastier food and higher prices.

### Step 12 — Check Rivals
Open **⚔️ Rivals** to see competing local carinderias: Aling Nena's Carinderia, Mang Jose Eatery, Tapsi ni Maria, and more. Beat them in reputation to become the top carinderia in town.

### Step 13 — Unlock Skills
Open **🌳 Skills** to see available passive skill upgrades — Suki Customers (regulars return more), Viral Carinderia (TikTok fame boost), and Fiesta Promo (big income events).

### Step 14 — Earn Achievements
Open **🎖️ Awards** to browse all unlockable milestones. Each achievement rewards bonus cash and XP — they're one of the best ways to accelerate early growth.

### Step 15 & 16 — Level Unlocks & Closing
The tutorial explains that reaching **Level 2** unlocks the Manager Office room expansion, and **Level 5** unlocks the Accountant. After this final message, the tutorial ends with a confetti pop and a milestone banner: *"You are ready to run your carinderia!"*

---

## Core Gameplay Loop

Each in-game day runs from **8:00 AM to 10:00 PM**. One real-time second equals one game hour at 1× speed.

```
8AM – 11AM    Slow morning trickle of customers
11AM – 1PM    🍽 LUNCH RUSH — 60% more spawn rate (banner shows in top bar)
1PM – 6PM     Steady afternoon flow
6PM – 10PM    Evening wind-down
10PM          Day closes — Day Summary modal appears
```

Your daily cycle:
1. Customers enter and queue near the entrance
2. Manager (or you) seats them at available tables
3. Customers order, eat, and wait to pay
4. Waiter (or you) collects payment
5. Cleaner clears dirty tables; Dishwasher washes the dishes
6. Profits fund new tables, staff, and upgrades
7. Day ends with a summary of earnings, expenses, and reputation change

---

## The HUD Explained

### Top Bar (left to right)

| Element | What it shows |
|---|---|
| 💰 Cash | Current pesos (₱) on hand |
| ⭐ Rep % | Your current reputation percentage |
| 👥 Customers | Active customers vs. max capacity |
| 🎮 Level | Your current owner level |
| 🌤 / 🌧 Date | Weather icon + in-game Year/Month/Day |
| 🕐 Time | Current in-game hour and minute |
| ⚡ Speed | Current game speed |
| Active Trend | Current market trend name (e.g. LUNCH RUSH, RAINY DAY SOUP) |
| Cafe Name | Your carinderia's name |

Speed cycles between **1×, 3×, and 10×** — click the speed indicator to switch.

### Left Sidebar

| Button | Action |
|---|---|
| 🪑 Table ₱150 | Place a new dining table on the floor |
| 💰 Sell / Refund | Remove a placed table for a partial refund |
| 🍳 Manual Wok | Open the Manual Wok Station mini-game (if unlocked) |
| 📋 Menu / Dishes | Manage your food menu and unlocked dishes |
| 🏗 Expand Rooms | Unlock room expansions (Manager Office, VIP Area, etc.) |
| ⬆️ Upgrades | Open the upgrades shop |
| 👔 Staff | Hire or fire staff |
| ⚔️ Rivals | View the reputation leaderboard |
| 🌳 Skills | Open the skill tree |
| 🎖 Awards | Browse earned achievements |

### Right Sidebar

| Button | Action |
|---|---|
| ⚙️ Settings | Audio and display settings |
| 🔥 Cook | Cooking Challenge mini-game |
| 🫧 Wash | Dishwashing Rush mini-game |
| 💰 Register | Cash Register mini-game |
| 📦 Restock | Restock Ingredients mini-game |
| 🎡 Spin | Spin the Wheel (every 5 minutes) |
| 📅 Calendar | Daily login reward calendar |

### Bottom Bar

The **Satisfaction bar** (orange, bottom-left) and the **Reputation bar** (full width, very bottom) track your overall performance. Reputation affects how many customers want to visit per hour — higher reputation means more foot traffic.

---

## Tables & Seating

Tables are your primary revenue source. Each table seats **up to 4 customers** simultaneously.

- Cost: **₱150 per table** (refundable via the Sell button)
- Tables can become **dirty** over time — trash lowers your cleanliness rating and reputation
- A broken table (from the Kitchen Disaster event) stops accepting customers until repaired
- As seen in the late-game screenshot, you can fill the entire floor — the VIP area on the right has a red carpet section for higher-tier service

The more tables you place, the higher your maximum customer capacity (`maxCustomers = tables × 1.1`).

---

## Customers

Customers enter through the front door and follow this path:

```
Queued → Walking to Table → Ordering → Eating → Waiting to Pay → Leaving
```

### Customer Types

- **Regular** — standard customer, standard payment
- **VIP** 👑 — available from Level 5, pays significantly more, +5 reputation on checkout
- **Suki** 💛 — loyal regulars who stay longer and give +3 reputation; more common if you unlock the Suki Customers skill

### Customer Emotions

Customers display emotion icons above their heads in the 3D scene:

| Emotion | Meaning | Rep Effect |
|---|---|---|
| 😊 Happy | Content with service | +1 |
| 😍 Excited | VIP or great experience | +2 |
| 💛 Suki | Loyal regular | +3 |
| 😡 Angry | Waited too long in queue | -2 |
| 😴 Bored | Slow service | -1 |
| 🍽 Hungry | Waiting to order | -1 |
| 😋 Eating | Currently dining | +1 |
| ⏳ Waiting | Done eating, waiting to pay | 0 |

### Combo System

Collecting payments in quick succession builds a combo multiplier:

- 🔥 3× Combo — combo notification appears
- 🔥🔥 5× Combo — "On fire!" toast
- 💥 10× MEGA COMBO — maximum multiplier bonus

The combo decays when no customers are actively eating. Letting a customer walk out breaks the combo entirely.

### Walkouts

If a queued customer waits too long without being seated, they **leave angry** — costing -2 reputation and breaking your combo. A **Manager** prevents this by auto-seating queued customers.

---

## Staff

Staff are hired from the 👔 Staff panel. Each hire costs **3× their hourly salary** as a one-time fee. Wages are deducted from your cash every 8 in-game hours.

### Staff Roles

| Role | Icon | Hire Cost | Hourly Salary | Effect |
|---|---|---|---|---|
| Manager | 👔 | ₱240 | ₱80 | Auto-seats queued customers |
| Waiter | 🤵 | ₱120 | ₱40 | Auto-collects payments |
| Chef | 👨‍🍳 | ₱180 | ₱60 | Cooks orders in the kitchen |
| Cashier | 💁 | ₱105 | ₱35 | Processes payments at counter |
| Cleaner | 🧹 | ₱75 | ₱25 | Auto-cleans dirty tables and trash |
| Dishwasher | 🫧 | ₱75 | ₱25 | Washes dishes at the sink |
| Guard | 👮 | ₱135 | ₱45 | Prevents dine-and-dash (Level 2+) |
| Accountant | 🧑‍💼 | ₱210 | ₱70 | Passive income + tax savings (Level 5+, requires Accountant Office room) |

### Personalities

Each hired staff member gets a random personality:

| Personality | Effect |
|---|---|
| Hardworking | Standard performance |
| Enthusiastic | Mood improves +3/day |
| Friendly | Better customer interaction |
| Lazy | 25% chance to arrive late |
| Grumpy | Mood drops faster |
| Burnt Out | Mood drops -5/day; may quit |

### Mood & Loyalty

- Each employee has **Mood (0–100)** and **Loyalty (0–100)** stats
- Low mood shows as a colored bar above the 3D character model (yellow = cautionary, red = critical)
- Staff with mood below 20 have a 10% daily chance of **quitting and leaving a message in the event log**
- The **Staff Lounge** upgrade recovers mood 2.5× faster when staff are idle
- Loyalty increases by 1 point per day worked

---

## Upgrades

Open **⬆️ Upgrades** to permanently improve your carinderia.

### Key Upgrades

| Upgrade | Effect |
|---|---|
| Lighting | Better ambiance, comfort boost |
| Air Conditioning | Keeps customers comfortable |
| Neon Sign | +10% customer spawn rate |
| Snack Bar | Passive +₱50 per hour |
| Vending Machine | Passive +₱80 per hour |
| Coffee Machine | Adds coffee orders, income boost |
| Manual Wok (Pancit Cooker) | Doubles passive Snack Bar income; unlocks Wok mini-game |
| Social Media | +20% spawn rate |
| Verified Badge | +15% spawn rate, reputation boost |
| Staff Lounge | Staff mood recovers 2.5× faster |
| Accountant Office | Required to hire Accountant |
| Security Cameras | Reduces theft events |
| Soundproofing | Noise reduction benefits |
| Ergonomic Chairs | Customers stay longer, spend more |
| Ingredient Quality (0–4) | Higher dish prices and customer satisfaction |
| Dish Selection (0–4) | Unlocks more menu items |

---

## Mini-Games

Four mini-games are accessible from the **right sidebar** at any time. They each reward bonus cash and XP.

### 🔥 Cooking Challenge
A timing bar slides across a track. Tap (or click) the **Cook** button when the bar lands inside the **green zone** to cook a perfect dish. Near-misses earn partial rewards; mistimed cooks earn nothing for that attempt.

### 🫧 Dishwashing Rush
A dishwashing sequence where you complete a series of timed button presses to scrub and rinse plates. Speed and accuracy determine your bonus.

### 💰 Cash Register
A quick-math or button-sequence challenge at the register. Processing orders correctly earns cash; mistakes reduce the payout.

### 📦 Restock Ingredients
A timed restocking mini-game where you fill your ingredient inventory (rice, meat, vegetables). Running low on ingredients slows cooking and customer throughput.

All four mini-games can also be triggered randomly during gameplay as events.

### Kitchen Disaster (Event-triggered)
When a table breaks down due to an event, a **Kitchen Disaster** mini-game triggers — you must complete 3 phases:

1. **Diagnosis** — pick the correct kitchen problem (e.g. Spoiled Food, Dirty Plato, Hair in Food) from 4 options
2. **Command Line** — select the correct action for a given kitchen task (e.g. "Clean the spilled soup?" → pick the right step)
3. **Quick Reaction** — the button turns red after a random delay; click it within 1.5 seconds

Score 2 or 3 out of 3 → Table fixed, +₱50, +5 rep, +30 XP. Score 0 or 1 → Table stays broken, -5 rep.

---

## Spin the Wheel

Click **🎡 Spin** on the right sidebar to spin the prize wheel. Prizes include cash bonuses and XP bursts. The wheel has a **5-minute cooldown** between spins — a countdown timer appears when it's not ready.

---

## Daily Login Rewards

When you open the game, a **Daily Reward** popup appears automatically (visible as Image 2). It shows a 7-day streak tracker:

| Day | Reward |
|---|---|
| Day 1 | ₱100 |
| Day 2 | ₱150 |
| Day 3 | ₱200 |
| Day 4 | ₱300 |
| Day 5 | ₱400 |
| Day 6 | ₱600 |
| Day 7 | ₱1,000 |

The current day's reward is highlighted with a gold border. Click **✨ Claim Reward!** to collect. You can also view the calendar anytime via the **📅 Calendar** button on the right sidebar.

---

## Skills

Open **🌳 Skills** to unlock passive bonuses using earned skill points (gained by leveling up). Key skills include:

- **Suki Customers** — 25% of customers become loyal Suki regulars, giving +3 rep per checkout
- **Viral Carinderia** — +35% customer spawn rate (TikTok fame simulation)
- **Fiesta Promo** — enables large-income Fiesta events

---

## Rivals

The **⚔️ Rivals** panel shows a leaderboard of competing carinderias, ranked by reputation. New rivals unlock as you level up:

| Rival | Unlocked At |
|---|---|
| 🍲 Aling Nena's Carinderia | Start |
| 🍖 Mang Jose Eatery | Level 2 |
| 🍳 Tapsi ni Maria | Level 4 |
| 🥘 Kusina ni Aling Rosa | Level 6 |
| 🍜 Pares House ni Kuya Ben | Level 9 |

Each rival grows daily — gaining cash, reputation, and occasionally triggering events that affect your carinderia:

- *"Poached some of your suki customers!"* → You lose -2 reputation
- *"Had a kitchen fire!"* → You gain +2 reputation (their disaster is your opportunity)
- *"Went viral on TikTok!"* → They gain fame rapidly

Your ranking is shown prominently at the top of the Rivals panel with a medal icon (🥇 🥈 🥉).

---

## Random Events & Weather

Every in-game hour there's roughly a **4% chance** of a random event. These appear as toast notifications and in the event log (bottom-right).

### Positive Events

| Event | Effect |
|---|---|
| 📸 Influencer Visit | +10 rep, +₱200, +50 XP |
| 📰 News Feature | +8 rep, +40 XP |
| 🏆 Fiesta Sponsor | +₱500, +80 XP |
| 🌙 Lunch Rush | +₱150, 3 bonus customers |
| 🎒 School Rush | 6 bonus customers, +2 rep |

### Negative Events

| Event | Effect |
|---|---|
| 🔥 Stove Fire | -5 reputation |
| 🤢 Spoiled Stock | -₱100, -3 reputation |
| 🚚 Supply Delay | -2 reputation |
| 💣 Review Bomb | Rivals flood you with bad reviews, -5 rep |
| 🚨 Health Inspection | +5 rep if rating > 3★; -10 rep if below |
| 🌀 Typhoon | Fewer customers, but loyal ones stay longer |

### Weather

Weather shifts roughly every hour (15% chance each hour):

- **☀️ Clear** — normal customer flow
- **🌧 Rain** — fewer walk-in customers, but customers who do come stay longer (+2 eating time), and queued customers are more patient

Your star rating (based on cleanliness) determines whether a Health Inspection event helps or hurts you — keep your tables clean.

---

## Market Trends

Market trends shift periodically (20% chance each hour) and boost income for specific table types. The active trend is always shown in the **top HUD bar**.

| Trend | Icon | Bonus |
|---|---|---|
| Lunch Rush | 🍚 | Standard earnings (baseline) |
| Ulam Festival | 🍖 | Large meal tables earn +50% |
| Payday Rush | 💸 | Standard tables earn +30% |
| Merienda Craze | 🍢 | Snack-type tables earn +40% |
| Rainy Day Soup | 🍲 | Basic prep station meals earn +25% |
| Boodle Fight | 🍃 | VIP Mantel tables earn +70% |

Watch the event log for trend shift announcements. The **Market Shift** notification also appears in the bottom-right corner (visible in the late-game screenshot).

---

## Bills & Taxes

Your carinderia has financial obligations that hit on a schedule:

- **Every 7 days** — BIR Monthly Tax: 12% of that day's income (minimum ₱250)
- **Every 30 days** — Mayor's Business Permit: ₱1,500

These appear as **unpaid bills** that deduct from your cash. Keep enough reserves so bills don't wipe you out during a slow day.

---

## Achievements

Achievements reward bonus **cash and +50 XP** when unlocked. Golden achievements 🌟 have larger cash rewards.

### Table Milestones

| Achievement | Condition | Reward |
|---|---|---|
| First Table | Place 1 table | ₱50 |
| Busy Eatery | Own 5 tables | ₱100 |
| Carinderia Hub 🌟 | Own 10 tables | ₱200 |
| Restaurant Chain 🌟 | Own 25 tables | ₱500 |
| Culinary Empire 🌟 | Own 50 tables | ₱1,500 |
| Food King 🌟 | Own 100 tables | ₱5,000 |

### Earnings Milestones

| Achievement | Condition | Reward |
|---|---|---|
| Making Bank | ₱1,000 total earned | ₱100 |
| Big Money 🌟 | ₱10,000 total earned | ₱500 |
| Rich Manager | ₱50,000 total earned | ₱1,200 |
| Six Figures 🌟 | ₱100,000 total earned | ₱2,500 |
| The Millionaire 🌟 | ₱1,000,000 total earned | ₱10,000 |

### Customer Milestones

| Achievement | Condition | Reward |
|---|---|---|
| Getting Noticed | Serve 100 customers | ₱200 |
| Busy Bees 🌟 | Serve 1,000 customers | ₱1,000 |
| Tourist Spot 🌟 | Serve 10,000 customers | ₱5,000 |

### Other Notable Achievements

| Achievement | Condition | Reward |
|---|---|---|
| Boss Mode | Hire first staff | ₱100 |
| The Whole Crew 🌟 | Hire 10 staff | ₱800 |
| Local Legend | Reach 50 reputation | ₱200 |
| Legendary Cafe 🌟 | Max reputation (100) | ₱1,000 |
| Pro Manager | Reach Level 5 | ₱250 |
| Veteran Owner 🌟 | Reach Level 20 | ₱2,000 |
| God-Tier Manager 🌟 | Reach Level 50 | ₱10,000 |
| Week One | Survive 7 days | ₱300 |
| Monthly Cycle | Survive 30 days | ₱1,000 |
| Anniversary 🌟 | Survive 360 days | ₱10,000 |
| Fiesta Host | Host 1 Fiesta event | ₱150 |
| Fiesta King 🌟 | Host 5 Fiesta events | ₱500 |
| Wok Master | Buy the Manual Wok | ₱300 |

---

## Saving & Loading

- **Auto-save** runs every 5 minutes while in-game
- **Manual save** via the 💾 button in the sidebar
- Saves are stored in `localStorage` — they persist across browser sessions on the same device and browser
- 6 save slots total; each shows cafe name, level, cash, reputation, and minutes played
- Requires HTTP/HTTPS — **will not work if opened directly as a file**

---

## Tips & Strategies

### Early Game (Days 1–7)
- Place 2–3 tables immediately — your starting ₱500 covers two tables with ₱200 left for a Waiter hire
- Hire a **Waiter** first to automate payments, then a **Manager** to stop customer walkouts
- Buy **Neon Sign** as soon as you can — the spawn rate bonus pays for itself quickly
- Spin the wheel every 5 minutes during early play for free cash and XP

### Mid Game (Days 8–30)
- Hire a **Cleaner** early — trash accumulation is a silent reputation killer (-0.5 rep per trash per hour)
- Add **Social Media** + **Neon Sign** together for a compounding spawn rate bonus
- Check the active market trend before buying new table types — wait for a matching trend to maximize early income
- Keep watching the Rivals panel; if a rival "goes viral," push back with extra customer volume

### Late Game (Day 30+)
- Pack the floor with tables (see the late-game screenshot — the dining room is completely full)
- The **Manual Wok** doubles Snack Bar passive income — buy Snack Bar first, then the Wok upgrade
- Keep a cash reserve of at least ₱1,500 at all times to cover the monthly Mayor's Permit
- During **Boodle Fight** market trend, your VIP section earns +70% — make sure VIP tables are unlocked and placed before this trend hits
- Maintain staff mood above 40 to avoid surprise resignations mid-day

### Combo Tips
- Don't seat all your customers at the same time — stagger arrival so payments come in a rolling stream rather than all at once
- During Lunch Rush (11AM–1PM), spawn rates are highest. Have enough seating ready before 11AM

### Reputation Management
- A rating above 3★ before a Health Inspection gives +5 rep; below it costs -10 rep — big swing
- Trash is the #1 cleanliness drag. Keep at least one Cleaner hired whenever you have 5+ tables

---

## Deployment Notes

### File Structure

```
index.html          Entry point and HTML structure
main.css            Core visual theme, main menu, loading screen, toasts
hud.css             Top bar, left sidebar, bottom bar, combo display
modals.css          All modal windows (upgrades, staff, rivals, achievements, etc.)
tutorial.css        Tutorial bubble, spotlight, mascot, highlight animations
state.js            GameState, market trends, achievements, random events, tick logic
camera.js           Three.js isometric camera (zoom only — no rotation)
scene.js            3D scene setup, restaurant layout, rendering loop
customers.js        Customer state machine, 3D character logic, Filipino dialogue
staff.js            Staff system, 3D staff meshes, role behaviors
rivals.js           Rival carinderia data and daily growth logic
virus.js            Kitchen Disaster minigame (3-phase repair challenge)
sounds.js           Web Audio API procedural ambient music and SFX
save.js             localStorage save/load system (6 slots, auto-save)
tutorial.js         16-step guided tutorial system
ui.js               Modals, HUD updates, mini-games, spin wheel, right panel
```

### Browser Requirements

- Chrome 90+, Firefox 88+, or Edge 90+
- WebGL required (Three.js 3D rendering)
- Web Audio API required for sound (gracefully disabled if unavailable)
- `localStorage` available — requires HTTP or HTTPS, not `file://`

### Known Limitations

- Table placement is mouse-only (click on the 3D floor after pressing the Table button)
- Save data is local to the device and browser — no cloud sync
- Opening the game in two tabs simultaneously may cause save conflicts

---

*Salamat for playing KainOyats! Kain na, Boss! 🍲*
