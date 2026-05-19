# 🍜 Kain Oyats: Filipino Carinderia Tycoon

**Kain Oyats** is a cozy and addictive 3D idle restaurant tycoon game built with Three.js. Immerse yourself in a vibrant "Filipino Carinderia" aesthetic, blending traditional charm with modern fusion. Start with a humble street-side food stall and grow it into a massive, automated, money-printing culinary empire!

> *Fantasy: Build a tiny food stall into a chaotic money-printing culinary empire.*

---

## 🔄 The Core Gameplay Loop

The game is designed for **Autonomous Management**. While you can interact directly in First-Person mode, the restaurant is designed to run itself once you optimize your systems:

1.  **Spawn & Queue:** Customers arrive at the entrance and wait at the Host Stand.
2.  **Seating:** An `Eatery Host` (Staff) or the Player assigns customers to specific stations (Wooden Tables, VIP Mantels, or Turo-Turo Counters).
3.  **Ordering:** Waiters (`Tindera`) automatically take orders and add them to the **Global Task Queue**.
4.  **Cooking:** Chefs (`Kusinero`) claim cooking tasks, process ingredients at Prep Stations or Kaldero Kitchens, and place finished meals on the counter.
5.  **Service:** Waiters deliver food. Customers eat, generating passive XP and Reputation.
6.  **Revenue:** Customers pay at the counter or via the Cashier staff.
7.  **Expansion:** Use profits to buy **Upgrades**, unlock **Skills**, and build **Room Expansions**.

---

## 🤖 How the Game Works (Internal Systems)

### 1. The Autonomous Task System (`staff.js` & `state.js`)
The "brain" of the game is a **Priority-Based Task Queue**. Instead of hard-coding staff behavior, the game generates "Tasks" (e.g., `TAKE_ORDER`, `COOK_MEAL`, `CLEAN_TRASH`). 
- Staff members constantly poll the queue for the highest-priority task they are capable of doing.
- Roles like **Tanod (Security)** and **Utility Boy (Cleaner)** act as background "janitors" maintaining the restaurant's reputation.

### 2. Economy & Market Trends (`state.js`)
Revenue isn't static. Every game hour, there is a chance for a **Market Shift**:
- **Lunch Rush:** Standard earnings.
- **Merienda Craze:** 40% bonus to Turo-Turo snacks.
- **Boodle Fight:** 70% bonus to VIP Mantel tables.
Strategic players time their manual interventions (like Fiesta Events) with these trends.

### 3. The RPG Skill Tree (`ui.js`)
Progression is split into four branches:
- **Efficiency:** Faster serving and unlimited rice bonuses.
- **Quality:** Premium ingredients that boost base dish prices.
- **Marketing:** TikTok fame and Suki (regular) customer return rates.
- **Fiesta:** Boosting massive Boodle Fight event earnings.

### 4. Technical Interaction Modes (`camera.js`)
- **Tycoon Mode:** Classic top-down management view.
- **1st/3rd Person:** Walk through your restaurant. Walk up to a table and press **'E'** to manually clean or repair stations.

---

## 🛠️ Tech Stack & Architecture

| Layer | Tech | Description |
| :--- | :--- | :--- |
| **Rendering** | Three.js | WebGL-based 3D engine with UnrealBloom post-processing. |
| **Physics/Path** | Custom NavGrid | A 60x60 grid-based A* pathfinding system for staff/customers. |
| **State Management** | GameState Object | A centralized, serializable object for all game variables. |
| **Audio** | Web Audio API | Procedural sound management with music that shifts based on trends. |
| **Data** | LocalStorage | Multi-slot save system with automatic JSON serialization. |

---

## 🍱 Restaurant Zones

- **Main Dining:** Standard wooden tables for high-volume traffic.
- **Kaldero Kitchen:** High-tech cooking area for Large Kaldero stations.
- **VIP Mantel:** Exclusive lounge for high-paying "Suki" and VIP guests.
- **Turo-Turo Counter:** Rapid-turnover snack area for quick cash.
- **Staff Lounge:** Vital for recovering staff "Mood" and preventing resignations.

---

## 🎮 Interaction & Controls

### Tycoon Controls
- **Left Click:** Select UI, assign customers, or place objects.
- **Right Click + Drag:** Rotate camera.
- **Mouse Wheel:** Zoom in/out.
- **Key 'R':** Rotate the object currently being placed.

### First-Person Controls
- **WASD:** Walk.
- **Mouse:** Look around (Pointer Lock).
- **Key 'E':** Interact (Fixing/Cleaning/Serving).
- **Key 'F':** Toggle Flashlight.

---

## 📂 Project Structure

```text
netzone/
├── assets/           # GLTF/GLB 3D models and textures
├── css/              # HUD and Modal styling (Neon/Cyber themes)
├── js/
│   ├── state.js      # Global GameState, Game Loop, and Economy
│   ├── scene.js      # Three.js environment, Lighting, and NavGrid
│   ├── staff.js      # AI Task Claiming and Role logic
│   ├── customers.js  # Customer State Machine (Queued -> Active -> Paying)
│   ├── ui.js         # UIManager, Modal Renderers, and Menu data
│   ├── save.js       # LocalStorage Slot Management
│   ├── rivals.js     # Competitive AI growth system
│   └── virus.js      # "Kitchen Disaster" (Malfunction) minigames
└── index.html        # Entry point and HUD layout
```

---
*Built with Three.js & Passion.*
