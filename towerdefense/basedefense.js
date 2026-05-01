const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const towerPool = [
  { name: "Pulse Turret", type: "rapid", fireRate: 100, damage: 5, range: 220, level: 1 },
  { name: "Sniper Spire", type: "sniper", fireRate: 800, damage: 35, range: 800, level: 1 },
  { name: "Nova Splash", type: "splash", fireRate: 450, damage: 15, range: 250, level: 1 },
  { name: "Siege Bomb", type: "bomb", fireRate: 1000, damage: 45, range: 300, level: 1 },
  { name: "Inferno", type: "flame", fireRate: 50, damage: 4, range: 180, level: 1 },
  { name: "Glacier", type: "freeze", fireRate: 400, damage: 8, range: 220, level: 1 },
  { name: "Volt Coil", type: "tesla", fireRate: 500, damage: 22, range: 320, level: 1 },
  { name: "Spreadshot", type: "multi", fireRate: 350, damage: 9, range: 240, level: 1 },
  { name: "Crit Bolt", type: "crit", fireRate: 500, damage: 12, range: 260, level: 1 },
  { name: "Venom", type: "poison", fireRate: 400, damage: 6, range: 250, level: 1 },
];

const towerColors = {
  rapid: "#3B82F6", sniper: "#EF4444", splash: "#F59E0B", bomb: "#7C3AED", flame: "#FB923C",
  freeze: "#06B6D4", tesla: "#A855F7", multi: "#84CC16", crit: "#EAB308", poison: "#10B981"
};

// --- GAME STATE ---
let towers = [], enemies = [], bullets = [];
let round = 1, xp = 0, money = 0, level = 1, gameOver = false;
let upgrades = { damage: 1, firerate: 1, slots: 3 }; 
let baseHp = 1500, maxBaseHp = 1500; 
let baseSpeed = 1;

// State Flags to prevent overlapping loops
let isPaused = true;
let isChoosingTower = false;
let isPlacingTower = false;
let isShopping = false;
let isLevelingUp = false;
let currentTowerToPlace = null;

const hud = document.getElementById('hud');
const gameMessageDiv = document.getElementById('gameMessage');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');

function showModal(title, contentHtml, buttons = []) {
    isPaused = true;
    modalContent.innerHTML = `<h2>${title}</h2><div id="modalBody">${contentHtml}</div>`;
    const btnContainer = document.createElement('div');
    btnContainer.style.marginTop = '20px';
    buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.textContent = b.text; btn.onclick = b.onClick;
        btn.style.margin = '0 5px'; btn.style.padding = "10px 20px";
        btn.style.cursor = "pointer";
        btnContainer.appendChild(btn);
    });
    modalContent.appendChild(btnContainer);
    modalOverlay.style.display = 'flex';
}

function hideModal() { 
    modalOverlay.style.display = 'none'; 
    isPaused = false;
}

function showGameMessage(msg, dur = 2000) {
    gameMessageDiv.textContent = msg; gameMessageDiv.style.display = 'block';
    if (dur > 0) setTimeout(() => { gameMessageDiv.style.display = 'none'; }, dur);
}

function spawnEnemies() {
  enemies = [];
  const types = [
    { color: "#EF4444", hpMult: 1, spdMult: 1.1, reward: 1, size: 20 },
    { color: "#8B5CF6", hpMult: 2.2, spdMult: 0.8, reward: 2, size: 26 },
    { color: "#FBBF24", hpMult: 0.6, spdMult: 1.8, reward: 1, size: 16 }
  ];
  for (let i = 0; i < 5 + round * 3; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const isBoss = (round % 5 === 0) && (i === 0);
    enemies.push({
      x: Math.random()*560+20, y: -20 - (i * 40) - (isBoss ? 100 : 0),
      hp: (35 + round*25) * (isBoss?10:type.hpMult), maxHp: (35 + round*25) * (isBoss?10:type.hpMult),
      speed: (1.2 + round*0.1) * (isBoss?0.6:type.spdMult), poison: 0, slow: 1,
      color: isBoss?"#000":type.color, size: isBoss?45:type.size, reward: isBoss?30:type.reward, isBoss
    });
  }
}

function handlePlacementClick(x, y, taken) {
    if (taken) return;
    towers.push({...currentTowerToPlace, x, y, lastShot: 0, currentLevel: 1});
    isPlacingTower = false; currentTowerToPlace = null;
    hideModal(); 
    showGameMessage(`WAVE ${round} STARTING!`, 1500);
    spawnEnemies();
    isPaused = false;
}

function showPlacementGrid(tower) {
    currentTowerToPlace = tower; isPlacingTower = true;
    let content = `<p style='color:#38bdf8'>Deploy <b>${tower.name}</b>:</p><div class="placement-grid" style="grid-template-columns: repeat(6, 1fr);">`;
    const startY = canvas.height - 350, startX = 40, cellSize = 85;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 6; c++) {
            const px = startX + c * cellSize + 40, py = startY + r * cellSize + 40;
            const taken = towers.some(t => Math.sqrt((t.x-px)**2 + (t.y-py)**2) < 40);
            content += `<div class="placement-slot ${taken?'taken':''}" style="width:65px; height:65px; border-radius:8px;" onclick="handlePlacementClick(${px},${py},${taken})">${taken?'🛡️':'+'}</div>`;
        }
    }
    content += '</div>';
    showModal("Tactical Deployment", content);
}

function showTowerChoices() {
    isChoosingTower = true;
    let content = '<div class="choices" style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">';
    [...towerPool].sort(()=>0.5-Math.random()).slice(0,3).forEach(t => {
        content += `<div class="card"><h3>${t.name}</h3><button onclick="selectTower(${JSON.stringify(t).replace(/"/g, '&quot;')})">Select</button></div>`;
    });
    showModal("Wave Reward: Pick a Unit", content);
}

function selectTower(t) { isChoosingTower = false; hideModal(); showPlacementGrid(t); }

function showShop() {
    isShopping = true;
    let content = `<p style="color:#10B981; font-weight:bold;">Reserve: $${money}</p><div class="shop" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px;">`;
    [{n:"DMG",t:"damage",v:0.25,c:60},{n:"SPD",t:"firerate",v:0.85,c:80},{n:"Slots",t:"slot",v:1,c:150},{n:"Heal",t:"heal",v:400,c:50}].forEach(u=>{
        const cost = u.c*level; content += `<div class="card"><h3>${u.n}</h3><button onclick="buyUpgrade('${u.t}',${u.v},${cost})">Buy $${cost}</button></div>`;
    });
    showModal("Fortress Armory", content, [{text: "Confirm & Deploy", onClick: finishShop}]);
}

function buyUpgrade(t,v,c) {
    if (money>=c) { money-=c; if(t==='damage') upgrades.damage*=(1+v); if(t==='firerate') upgrades.firerate*=v; if(t==='slot') upgrades.slots+=v; if(t==='heal') baseHp=Math.min(maxBaseHp, baseHp+v); showShop(); }
}

function finishShop() { isShopping = false; hideModal(); if (enemies.length === 0) showTowerChoices(); }

function showLevelUp() {
    isLevelingUp = true;
    showModal("Promotion!", `<div class="level-up-options" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">
        <div class="card"><h3>Unit</h3><button onclick="pickLvlTower()">Pick</button></div>
        <div class="card"><h3>Upgrade</h3><button onclick="showTowerUpgrades()">Stats</button></div>
        <div class="card"><h3>Supply</h3><button onclick="showShop()">Open</button></div>
    </div>`);
}

function pickLvlTower() { isLevelingUp = false; hideModal(); showTowerChoices(); }

function showTowerUpgrades() {
    if (towers.length===0) return showLevelUp();
    let content = '<div class="level-up-options" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px;">';
    towers.forEach((t, i) => { content += `<div class="card"><h3>${t.name}</h3><button onclick="applyUnitUpgrade(${i},'damage')">+PWR</button><button onclick="applyUnitUpgrade(${i},'firerate')">+SPD</button></div>`; });
    showModal("Unit Refinement", content);
}

function applyUnitUpgrade(i, type) {
    if(type==='damage') towers[i].damage*=1.3; else towers[i].fireRate*=0.75;
    towers[i].currentLevel++; isLevelingUp = false; hideModal();
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  enemies.forEach(e=>{
    ctx.fillStyle = e.color; ctx.fillRect(e.x-e.size/2, e.y-e.size/2, e.size, e.size);
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(e.x-e.size/2, e.y-e.size/2-10, e.size, 5);
    ctx.fillStyle = "#10B981"; ctx.fillRect(e.x-e.size/2, e.y-e.size/2-10, (e.hp/e.maxHp)*e.size, 5);
  });
  towers.forEach(t=>{
    ctx.beginPath(); ctx.arc(t.x, t.y, 16, 0, Math.PI*2); ctx.fillStyle = towerColors[t.type]; ctx.fill();
    ctx.strokeStyle="#fff"; ctx.stroke();
  });
  bullets.forEach(b=>{ ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI*2); ctx.fillStyle = b.color; ctx.fill(); });
  ctx.fillStyle = "#334155"; ctx.fillRect(0, canvas.height-35, canvas.width, 35);
  ctx.fillStyle = "#10B981"; ctx.fillRect(20, canvas.height-25, (baseHp/maxBaseHp)*(canvas.width-40), 15);
}

function update(delta) {
  if (isPaused || isChoosingTower || isPlacingTower || isShopping || isLevelingUp || gameOver) return;
  enemies.forEach(e=>{
    e.y += e.speed * e.slow;
    if (e.y > canvas.height-40) { baseHp -= 100; e.hp=0; if (baseHp<=0) { gameOver=true; showModal("Nexus Breached", "<p>Mission Failed.</p>", [{text:"Restart", onClick:restart}]); } }
  });
  enemies = enemies.filter(e=>e.hp>0);
  bullets.forEach(b=>{
    const dx = b.target.x-b.x, dy = b.target.y-b.y, dist = Math.sqrt(dx*dx+dy*dy);
    if (dist < 15) { b.target.hp -= b.tower.damage*upgrades.damage; b.hit=true; if(b.target.hp<=0) { money+=15; xp+=20; } }
    else { b.x += (dx/dist)*14; b.y += (dy/dist)*14; }
  });
  bullets = bullets.filter(b=>!b.hit && b.target.hp>0);
  if (xp >= level*150) { xp=0; level++; money+=200; showLevelUp(); }
  if (enemies.length===0 && !isPaused && !isChoosingTower && !isPlacingTower && !isShopping && !isLevelingUp) { round++; showShop(); }
}

function shoot(delta) {
  if (isPaused || isChoosingTower || isPlacingTower || isShopping || isLevelingUp || gameOver) return;
  towers.forEach(t=>{
    t.lastShot += delta; if (t.lastShot < t.fireRate*upgrades.firerate) return;
    const target = enemies.find(e=>e.y > 0);
    if (target) { t.lastShot=0; bullets.push({x:t.x, y:t.y, target, tower:t, color:towerColors[t.type]}); }
  });
}

function setBaseSpeed(s) { baseSpeed = s; document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.toggle('active', parseInt(btn.textContent) === s)); }

let last = performance.now();
function loop(ts) { 
    if (!last) last = ts;
    const delta = (ts - last) * baseSpeed;
    update(delta); shoot(delta); draw();
    last = ts; requestAnimationFrame(loop); 
}

function restart() { towers=[], enemies=[], bullets=[], round=1, xp=0, money=0, level=1, gameOver=false, baseHp=1500; hideModal(); showTowerChoices(); }

window.selectTower = selectTower; window.handlePlacementClick = handlePlacementClick; window.buyUpgrade = buyUpgrade;
window.finishShop = finishShop; window.pickLvlTower = pickLvlTower; window.applyUnitUpgrade = applyUnitUpgrade;
window.showTowerUpgrades = showTowerUpgrades; window.showShop = showShop; window.setBaseSpeed = setBaseSpeed;

restart();
requestAnimationFrame(loop);
