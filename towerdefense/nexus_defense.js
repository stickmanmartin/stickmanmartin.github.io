/**
 * NEXUS DEFENSE: TACTICAL OVERDRIVE (ULTIMATE EDITION)
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// --- CONFIG & DIFFICULTY ---
const DIFFICULTIES = {
    'EASY': { hp: 2000, gold: 1500, scale: 1.1, baseDmg: 50 },
    'NORMAL': { hp: 1200, gold: 800, scale: 1.4, baseDmg: 100 },
    'BRUTAL': { hp: 800, gold: 500, scale: 1.8, baseDmg: 200 }
};

const state = {
    difficulty: 'NORMAL',
    hp: 1200, maxHp: 1200, gold: 800, xp: 0, level: 1, wave: 0, speed: 1, ult: 0, maxUlt: 100,
    towers: [], enemies: [], bullets: [], particles: [],
    active: false, gameOver: false, placing: null, inWave: false,
    log: document.getElementById('combat-log'), lastTime: performance.now()
};

const TOWER_TYPES = [
    { type: 'pulse', name: 'Pulse Tower', desc: 'Sleek rapid fire', dmg: 16, rate: 200, range: 220, color: '#00f2ff', price: 100 },
    { type: 'heavy', name: 'Siege Cannon', desc: 'Splash damage beast', dmg: 65, rate: 1100, range: 380, color: '#ff0055', price: 180, splash: 90 },
    { type: 'tesla', name: 'Volt Spire', desc: 'Chain lightning', dmg: 22, rate: 600, range: 280, color: '#aa00ff', isChain: true, chains: 4, price: 200 },
    { type: 'railgun', name: 'Odin Rail', desc: 'Piercing beam', dmg: 130, rate: 2000, range: 1000, color: '#ffffff', isBeam: true, price: 300 },
    { type: 'frost', name: 'Glacier Obelisk', desc: 'Area slow', dmg: 8, rate: 800, range: 200, color: '#0077ff', isSlow: true, slowVal: 0.4, price: 150 }
];

const ENEMY_TYPES = [
    { type: 'normal', name: 'Drone', color: '#ff0055', hpMult: 1.0, spdMult: 1.0, size: 24, reward: 20 },
    { type: 'fast', name: 'Interceptor', color: '#ffd700', hpMult: 0.6, spdMult: 1.8, size: 18, reward: 25 },
    { type: 'tank', name: 'Behemoth', color: '#8800ff', hpMult: 5.0, spdMult: 0.6, size: 42, reward: 75 }
];

// --- CORE ENGINE ---

function setDifficulty(diff) {
    const d = DIFFICULTIES[diff];
    state.difficulty = diff;
    state.hp = d.hp; state.maxHp = d.hp;
    state.gold = d.gold;
    state.active = true;
    document.getElementById('difficulty-overlay').style.display = 'none';
    updateHUD();
    showChoices();
}

function updateHUD() {
    document.getElementById('base-hp').textContent = Math.max(0, state.hp);
    document.getElementById('gold').textContent = state.gold;
    document.getElementById('wave').textContent = state.wave;
    document.getElementById('level').textContent = state.level;
    document.getElementById('xp').textContent = state.xp;
    const ultFill = document.getElementById('ult-fill');
    if (ultFill) ultFill.style.width = `${(state.ult / state.maxUlt) * 100}%`;
}

function spawnWave() {
    state.wave++; state.inWave = true; updateHUD();
    const d = DIFFICULTIES[state.difficulty];
    let count = 6 + Math.floor(state.wave * d.scale);
    let spawned = 0;
    const interval = setInterval(() => {
        if (!state.active || spawned >= count) { clearInterval(interval); return; }
        const isBoss = state.wave % 5 === 0 && spawned === 0;
        const typeIndex = isBoss ? 2 : Math.floor(Math.random() * ENEMY_TYPES.length);
        const base = ENEMY_TYPES[typeIndex];
        const e = {
            ...base, x: Math.random() * (canvas.width - 60) + 30, y: -50,
            hp: Math.floor((60 + (state.wave * 45)) * base.hpMult * (isBoss ? 5 : 1) * (state.difficulty === 'BRUTAL' ? 1.5 : 1)),
            speed: base.spdMult * (1 + state.wave * 0.05) * (state.difficulty === 'BRUTAL' ? 1.2 : 1),
            poisoned: 0, slowed: 0, isBoss
        };
        e.maxHp = e.hp; state.enemies.push(e); spawned++;
    }, 700 / state.speed);
}

function drawTower(ctx, t) {
    ctx.save();
    ctx.translate(t.x, t.y);
    
    // Tower Base (Stone/Metal texture)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(-20, 20); ctx.lineTo(20, 20);
    ctx.lineTo(15, -10); ctx.lineTo(-15, -10);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#444'; ctx.stroke();

    // Tower Middle Tier
    ctx.fillStyle = '#333';
    ctx.fillRect(-10, -25, 20, 20);
    ctx.strokeStyle = t.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(-10, -25, 20, 20);

    // Rotating Turret Top
    ctx.rotate(t.angle);
    ctx.fillStyle = t.color;
    ctx.shadowBlur = 15; ctx.shadowColor = t.color;
    // Turret Barrel
    ctx.fillRect(0, -5, 30, 10);
    // Turret Hub
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.restore();
}

// ... logic continues ... (abbreviated for this turn's focus)

function hitEnemy(enemy, dmg, tower) {
    let finalDmg = dmg;
    if (tower.crit && Math.random() < tower.crit) { finalDmg *= 2.5; }
    enemy.hp -= finalDmg;
    if (enemy.hp <= 0) { 
        state.gold += enemy.reward; 
        state.ult = Math.min(state.maxUlt, state.ult + 4);
        state.xp += 10;
        updateHUD(); 
    }
}

function update(delta) {
    if (!state.active || state.gameOver) return;
    const timeScale = delta * state.speed / 16.67;

    state.enemies.forEach(e => {
        let s = e.speed; if (e.slowed > 0) { s *= 0.4; e.slowed -= delta * state.speed; }
        e.y += s * timeScale;
        if (e.y > canvas.height - 20) {
            state.hp -= DIFFICULTIES[state.difficulty].baseDmg;
            e.hp = 0; updateHUD();
        }
    });
    state.enemies = state.enemies.filter(e => e.hp > 0);

    state.towers.forEach(t => {
        const rate = t.rate / state.speed;
        if (performance.now() - t.lastShot > rate) {
            const targets = state.enemies.filter(e => getDist(t, e) < t.range);
            if (targets.length > 0) {
                const target = targets.sort((a, b) => b.y - a.y)[0];
                t.angle = Math.atan2(target.y - t.y, target.x - t.x);
                spawnBullet(t, target, t.angle);
                t.lastShot = performance.now();
            }
        }
    });

    state.bullets.forEach((b, i) => {
        if (b.target && b.target.hp > 0) {
            const a = Math.atan2(b.target.y - b.y, b.target.x - b.x);
            b.vx = Math.cos(a) * 14; b.vy = Math.sin(a) * 14;
        }
        b.x += b.vx * timeScale; b.y += b.vy * timeScale;
        if (b.target && b.target.hp > 0 && getDist(b, b.target) < 20) {
            hitEnemy(b.target, b.dmg, b.tower); state.bullets.splice(i, 1);
        } else if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            state.bullets.splice(i, 1);
        }
    });

    if (state.hp <= 0) triggerGameOver();
    if (state.inWave && state.enemies.length === 0) { state.inWave = false; showChoices(); }
}

function spawnBullet(tower, target, angle) {
    state.bullets.push({ x: tower.x, y: tower.y, vx: Math.cos(angle)*14, vy: Math.sin(angle)*14, dmg: tower.dmg, color: tower.color, tower, target });
}

function getDist(o1, o2) { return Math.sqrt((o1.x-o2.x)**2 + (o1.y-o2.y)**2); }

function showChoices() {
    const overlay = document.getElementById('choice-overlay');
    const container = document.getElementById('choices-container');
    container.innerHTML = ''; overlay.style.display = 'flex';
    const shuffled = [...TOWER_TYPES].sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffled.forEach(t => {
        const card = document.createElement('div'); card.className = 'choice-card';
        card.innerHTML = `<div style="background:${t.color}; width:15px; height:15px; border-radius:2px; margin:auto;"></div><h3>${t.name}</h3><p>${t.desc}</p><div style="font-weight:bold; color:#00ff66;">FREE</div>`;
        card.onclick = () => startPlacement(t); container.appendChild(card);
    });
}

function startPlacement(t) {
    state.placing = { ...t, level: 1 };
    document.getElementById('choice-overlay').style.display = 'none';
    document.getElementById('placement-hint').style.display = 'block';
}

function draw() {
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    state.enemies.forEach(e => {
        ctx.fillStyle = e.color; ctx.fillRect(e.x-e.size/2, e.y-e.size/2, e.size, e.size);
        ctx.fillStyle = 'red'; ctx.fillRect(e.x-e.size/2, e.y-e.size/2-10, e.size, 4);
        ctx.fillStyle = 'lime'; ctx.fillRect(e.x-e.size/2, e.y-e.size/2-10, e.size*(e.hp/e.maxHp), 4);
    });
    state.towers.forEach(t => drawTower(ctx, t));
    state.bullets.forEach(b => { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI*2); ctx.fill(); });
}

function gameLoop(time) { const delta = time - state.lastTime; state.lastTime = time; update(delta); draw(); requestAnimationFrame(gameLoop); }

function triggerGameOver() { state.active = false; state.gameOver = true; document.getElementById('gameover-overlay').style.display = 'flex'; }

canvas.onclick = (e) => {
    if (!state.placing) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    if (y < canvas.height * 0.65) return;
    state.towers.push({ ...state.placing, x, y, lastShot: 0, angle: 0 });
    state.placing = null; document.getElementById('placement-hint').style.display = 'none'; spawnWave();
};

updateHUD(); requestAnimationFrame(gameLoop);
window.setDifficulty = setDifficulty;
