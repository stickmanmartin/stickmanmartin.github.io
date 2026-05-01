/* Tower Defense Ultimate - separated JS
   - Starting money = 1000
   - Faster gameplay via speedFactor
   - Towers always target the first enemy (first in the enemies array) that is within their range
   - Lightning, Wind, Fire, Poison, Ice, Cannon splash implemented
*/

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let money = 1000;
let wave = 1;
let gameStarted = false;

document.getElementById("money").textContent = money;
document.getElementById("wave").textContent = wave;

// Make the whole game feel faster
const speedFactor = 1.5;

const path = [
  { x: 0,   y: 300 },
  { x: 200, y: 300 },
  { x: 200, y: 100 },
  { x: 600, y: 100 },
  { x: 600, y: 400 },
  { x: 900, y: 400 }
];

let enemies = [];
let towers = [];
let bullets = [];
let particles = [];
let selectedTowerType = null;

// Tower definitions (base values)
let towerTypes = [
  { name: "Basic", range: 100, fireRate: 60, color: "blue", cost: 50, damage: 1, type: "normal" },
  { name: "Fast", range: 80, fireRate: 20, color: "green", cost: 75, damage: 1, type: "fast" },
  { name: "Sniper", range: 200, fireRate: 120, color: "purple", cost: 100, damage: 3, type: "sniper" },
  { name: "Cannon", range: 120, fireRate: 90, color: "brown", cost: 120, damage: 2, type: "splash", splashRadius: 60 },
  { name: "Fire", range: 100, fireRate: 40, color: "red", cost: 150, damage: 1, type: "burn" },
  { name: "Ice", range: 100, fireRate: 40, color: "cyan", cost: 160, damage: 0, type: "freeze" },
  { name: "Wind", range: 110, fireRate: 36, color: "white", cost: 170, damage: 1, type: "wind" },
  { name: "Lightning", range: 240, fireRate: 25, color: "lightblue", cost: 200, damage: 3, type: "lightning" },
  { name: "Poison", range: 100, fireRate: 28, color: "darkgreen", cost: 200, damage: 1, type: "poison" },
  { name: "SuperCannon", range: 500, fireRate: 0, color: "gold", cost: 500, damage: 999, type: "supercannon", duration: 7 }
];

// Enemy types (base speeds — scaled when instantiated)
const enemyTypes = [
  { name: "Normal", hp: 3, speed: 1.2, color: "red", size: 20 },
  { name: "Fast", hp: 2, speed: 2.5, color: "orange", size: 18 },
  { name: "Tank", hp: 8, speed: 0.8, color: "darkred", size: 28 },
  { name: "Heavy Tank", hp: 15, speed: 0.6, color: "maroon", size: 32 },
  { name: "Runner", hp: 1, speed: 4, color: "yellow", size: 16 },
  { name: "Boss", hp: 50, speed: 0.8, color: "black", size: 40 },
  { name: "Miniboss", hp: 100, speed: 0.9, color: "purple", size: 50 },
  { name: "SuperBoss", hp: 200, speed: 0.7, color: "darkblue", size: 60 },
  { name: "UltraBoss", hp: 400, speed: 0.6, color: "darkred", size: 70 },
  { name: "SwiftRunner", hp: 20, speed: 5, color: "gold", size: 25 },
  { name: "ArmoredTank", hp: 150, speed: 0.5, color: "gray", size: 55 },
  { name: "Swarm", hp: 1, speed: 2, color: "white", size: 10 },
  { name: "Shielded", hp: 40, speed: 1.0, color: "silver", size: 30, shield: true },
  { name: "Splitter", hp: 12, speed: 1.2, color: "lime", size: 22, split: true },
  { name: "Regenerator", hp: 30, speed: 1.0, color: "teal", size: 26, regen: true },
  { name: "Flying", hp: 15, speed: 2.5, color: "skyblue", size: 20, flying: true }
];

// UI building
towerTypes.sort((a,b) => a.cost - b.cost);
const towerContainer = document.getElementById("towers");
function refreshTowerButtons() {
  towerContainer.innerHTML = "";
  towerTypes.forEach(tower => {
    const btn = document.createElement("div");
    btn.className = "tower-button";
    btn.textContent = `${tower.name} - $${tower.cost}`;
    btn.onclick = () => {
      document.querySelectorAll(".tower-button").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedTowerType = tower;
    };
    towerContainer.appendChild(btn);
  });
}
refreshTowerButtons();

/* ---------- Particle ---------- */
class Particle {
  constructor(x,y,color) {
    this.x = x; this.y = y;
    this.vx = (Math.random()-0.5)*3*speedFactor;
    this.vy = (Math.random()-0.5)*3*speedFactor;
    this.alpha = 1; this.color = color;
  }
  update() { this.x += this.vx; this.y += this.vy; this.alpha -= 0.03; }
  draw() { ctx.fillStyle = `rgba(${this.color},${this.alpha})`; ctx.fillRect(this.x,this.y,3,3); }
}

/* ---------- Enemy ---------- */
class Enemy {
  constructor(type) {
    this.type = type;
    this.x = path[0].x; this.y = path[0].y;
    this.size = type.size;
    this.maxHp = type.hp; this.hp = type.hp;
    this.baseSpeed = type.speed * speedFactor; this.speed = this.baseSpeed;
    this.color = type.color;
    this.pathIndex = 0;
    this.slowTimer = 0;     // slowed (reduced speed)
    this.burnTimer = 0;     // damage over time
    this.poisonTimer = 0;   // damage + weakness
    this.freezeTimer = 0;   // stopped
    this.weakness = 1;
  }

  update() {
    // status/kind effects
    if (this.freezeTimer > 0) { this.freezeTimer--; this.speed = 0; }
    else if (this.slowTimer > 0) { this.slowTimer--; this.speed = this.baseSpeed * 0.5; }
    else this.speed = this.baseSpeed;

    if (this.burnTimer > 0) { this.burnTimer--; if (this.burnTimer % 15 === 0) this.hp -= 1; }
    if (this.poisonTimer > 0) { this.poisonTimer--; if (this.poisonTimer % 30 === 0) this.hp -= 1; this.weakness = 1.6; } else this.weakness = 1;
    if (this.type.regen && this.hp < this.maxHp && Math.random() < 0.02) this.hp++;

    const next = path[this.pathIndex + 1];
    if (!next) return;
    let dx = next.x - this.x, dy = next.y - this.y;
    let dist = Math.hypot(dx, dy);
    if (dist < this.speed) {
      this.x = next.x; this.y = next.y; this.pathIndex++;
    } else if (this.speed > 0) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);

    // health bar
    ctx.fillStyle = "red";
    ctx.fillRect(this.x - this.size/2, this.y - this.size/2 - 6, this.size, 4);
    ctx.fillStyle = "lime";
    ctx.fillRect(this.x - this.size/2, this.y - this.size/2 - 6, this.size * Math.max(0, this.hp/this.maxHp), 4);

    // status icons
    let s = "";
    if (this.freezeTimer > 0) s += "🧊";
    if (this.slowTimer > 0) s += "❄️";
    if (this.burnTimer > 0) s += "🔥";
    if (this.poisonTimer > 0) s += "☠️";
    if (s) { ctx.fillStyle = "white"; ctx.font = "12px sans-serif"; ctx.fillText(s, this.x - 8, this.y - this.size/2 - 12); }
  }
}

/* ---------- Tower ---------- */
class Tower {
  constructor(x,y,type) {
    this.x = x; this.y = y;
    this.range = type.range;
    this.fireRate = Math.max(5, Math.floor(type.fireRate / speedFactor));
    this.color = type.color;
    this.cooldown = 0;
    this.damage = type.damage;
    this.type = type.type;
    this.splashRadius = type.splashRadius || 0;
    if (type.type === "supercannon") this.timer = type.duration * 60;
  }

  update() {
    if (this.type === "supercannon") {
      enemies.forEach(e => {
        if (Math.hypot(e.x - this.x, e.y - this.y) <= this.range) {
          e.hp = 0;
          for (let i=0;i<10;i++) particles.push(new Particle(e.x, e.y, "255,215,0"));
        }
      });
      this.timer--;
      if (this.timer <= 0) {
        const idx = towers.indexOf(this);
        if (idx !== -1) towers.splice(idx,1);
      }
      return;
    }

    if (this.cooldown > 0) { this.cooldown--; return; }

    // TARGETING: pick the first enemy in the enemies array that is within range
    let target = null;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (Math.hypot(e.x - this.x, e.y - this.y) <= this.range) { target = e; break; }
    }

    if (target) {
      bullets.push(new Bullet(this, target));
      this.cooldown = this.fireRate;
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, 15, 0, Math.PI*2); ctx.fill();
    if (this.type === "supercannon") {
      ctx.strokeStyle = "yellow";
      ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI*2); ctx.stroke();
    }
  }
}

/* ---------- Bullet ---------- */
class Bullet {
  constructor(tower, target) {
    this.x = tower.x; this.y = tower.y;
    this.size = 5;
    this.speed = 6 * speedFactor;
    this.target = target;
    this.tower = tower;
  }

  update() {
    // if target already gone -> remove bullet
    if (!enemies.includes(this.target)) return true;

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 6 || dist === 0) {
      // hit effects
      const towerType = this.tower.type;
      if (towerType === "splash") {
        enemies.forEach(e => {
          if (Math.hypot(e.x - this.target.x, e.y - this.target.y) <= this.tower.splashRadius) {
            e.hp -= this.tower.damage * e.weakness;
            // small particle
            particles.push(new Particle(e.x, e.y, "200,150,0"));
          }
        });
      }
      else if (towerType === "freeze") {
        this.target.freezeTimer = 120; // freeze for frames
      }
      else if (towerType === "burn") {
        this.target.burnTimer = 180;
      }
      else if (towerType === "poison") {
        this.target.poisonTimer = 180;
        this.target.hp -= this.tower.damage * this.target.weakness;
      }
      else if (towerType === "lightning") {
        // damage along the line from tower -> target
        const tx = this.target.x - this.tower.x;
        const ty = this.target.y - this.tower.y;
        const denom = tx*tx + ty*ty || 1;
        const thickness = 25;
        enemies.forEach(e => {
          const ex = e.x - this.tower.x;
          const ey = e.y - this.tower.y;
          const t = (ex*tx + ey*ty) / denom; // projection factor
          if (t >= 0 && t <= 1.2) {
            const px = this.tower.x + tx * t;
            const py = this.tower.y + ty * t;
            const d = Math.hypot(e.x - px, e.y - py);
            const distToTower = Math.hypot(ex, ey);
            if (d <= thickness && distToTower <= this.tower.range) {
              e.hp -= this.tower.damage * e.weakness;
              particles.push(new Particle(e.x, e.y, "180,220,255"));
            }
          }
        });
      }
      else if (towerType === "wind") {
        // push back along the path nodes
        const backStep = 2;
        this.target.pathIndex = Math.max(0, this.target.pathIndex - backStep);
        const node = path[this.target.pathIndex];
        this.target.x = node.x;
        this.target.y = node.y;
      }
      else {
        // default direct damage
        this.target.hp -= this.tower.damage * this.target.weakness;
      }

      return true;
    }

    // move bullet towards target
    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;
    return false;
  }

  draw() {
    ctx.fillStyle = this.tower.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
  }
}

/* ---------- Utilities ---------- */

function isOnPath(x, y) {
  for (let i = 0; i < path.length - 1; i++) {
    const x1 = path[i].x, y1 = path[i].y;
    const x2 = path[i+1].x, y2 = path[i+1].y;
    const A = x - x1, B = y - y1, C = x2 - x1, D = y2 - y1;
    const dot = A*C + B*D;
    const lenSq = C*C + D*D;
    let t = dot / lenSq;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t * C, py = y1 + t * D;
    const dist = Math.hypot(px - x, py - y);
    if (dist < 30) return true;
  }
  return false;
}

/* ---------- Wave spawn ---------- */
function spawnWave(w) {
  // scale SuperCannon cost slowly with wave
  const sc = towerTypes.find(t => t.name === "SuperCannon");
  if (sc) sc.cost = 500 + Math.floor((w-1)/5) * 50;
  refreshTowerButtons();

  const count = Math.max(3, 5 + w * 2);
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const idx = Math.floor(Math.random() * enemyTypes.length);
      enemies.push(new Enemy(enemyTypes[idx]));
    }, i * 350);
  }
}

/* ---------- Input handlers ---------- */
// Start
document.getElementById("startButton").addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
    spawnWave(wave);
    document.getElementById("startButton").style.display = "none";
  }
});

// Place towers
canvas.addEventListener("click", e => {
  if (!selectedTowerType) return;
  const rect = canvas.getBoundingClientRect();
  
  // FIXED: Calculate coordinates based on CSS scale
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  
  if (isOnPath(x, y)) { alert("Can't place tower on the path!"); return; }
  if (money >= selectedTowerType.cost) {
    towers.push(new Tower(x, y, selectedTowerType));
    money -= selectedTowerType.cost;
    document.getElementById("money").textContent = money;
  } else {
    alert("Not enough money!");
  }
});

/* ---------- Drawing path ---------- */
function drawPath() {
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();
}

/* ---------- Main loop ---------- */
function gameLoop() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawPath();

  // Update enemies (iterate backwards to handle removals safely)
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.update();

    if (e.hp <= 0) {
      enemies.splice(i,1);
      let reward = 10;
      if (e.type.name === "Miniboss") reward += 150;
      if (e.type.name === "SuperBoss") reward += 400;
      money += reward;
      document.getElementById("money").textContent = money;

      if (e.type.split) {
        enemies.push(new Enemy(enemyTypes[0]));
        enemies.push(new Enemy(enemyTypes[0]));
      }
      continue;
    }

    if (e.pathIndex >= path.length - 1) {
      // enemy reached the end
      enemies.splice(i,1);
      money -= 50;
      document.getElementById("money").textContent = money;
      continue;
    }

    e.draw();
  }

  // Towers
  for (let t of towers) { t.update(); t.draw(); }

  // Bullets (iterate backwards)
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    try {
      if (b.update()) bullets.splice(i,1);
      else b.draw();
    } catch (err) {
      // safety: remove buggy bullet
      bullets.splice(i,1);
    }
  }

  // Particles (iterate backwards)
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update(); p.draw();
    if (p.alpha <= 0) particles.splice(i,1);
  }

  // Next wave
  if (gameStarted && enemies.length === 0 && bullets.length === 0) {
    wave++;
    document.getElementById("wave").textContent = wave;
    spawnWave(wave);
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
