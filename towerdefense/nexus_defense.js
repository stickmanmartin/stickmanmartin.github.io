/**
 * NEXUS DEFENSE: TACTICAL OVERDRIVE (BALANCED MODE)
 * Re-tuned for a challenging but fair progression.
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// --- GAME STATE ---
const state = {
    hp: 1500,          // Balanced: Lowered from 3000
    maxHp: 1500,
    gold: 1200,        // Balanced: Lowered from 2000
    xp: 0,
    level: 1,
    wave: 0,
    speed: 1,
    
    towers: [],
    enemies: [],
    bullets: [],
    particles: [],
    
    active: true,
    gameOver: false,
    placing: null,
    inWave: false,
    currentShopTab: 'upgrades',
    
    log: document.getElementById('combat-log'),
    lastTime: performance.now()
};

// --- CONFIGURATION & DATA ---

const TOWER_TYPES = [
    { type: 'pulse', name: 'Pulse Turret', desc: 'Standard rapid fire', dmg: 18, rate: 220, range: 220, color: '#00f2ff', price: 100 },
    { type: 'heavy', name: 'Heavy Cannon', desc: 'Powerful splash shots', dmg: 70, rate: 1000, range: 380, color: '#ff0055', price: 150, splash: 80 },
    { type: 'tesla', name: 'Tesla Coil', desc: 'Chain lightning', dmg: 25, rate: 550, range: 280, color: '#aa00ff', isChain: true, chains: 4, price: 180 },
    { type: 'railgun', name: 'Railgun', desc: 'Piercing beam', dmg: 140, rate: 1800, range: 1000, color: '#ffffff', isBeam: true, price: 250 },
    { type: 'frost', name: 'Frost Nova', desc: 'Slows groups', dmg: 10, rate: 750, range: 200, color: '#0077ff', isSlow: true, slowVal: 0.4, price: 120 },
    { type: 'poison', name: 'Toxic Sprayer', desc: 'DoT damage', dmg: 8, rate: 380, range: 240, color: '#00ff66', isPoison: true, dot: 3, price: 140 },
    { type: 'multi', name: 'Spread Shot', desc: '3-Way Volley', dmg: 18, rate: 480, range: 260, color: '#ffaa00', multi: 3, price: 160 },
    { type: 'sniper', name: 'Elite Sniper', desc: 'Precision criticals', dmg: 110, rate: 1400, range: 650, color: '#ff00ff', crit: 0.4, price: 200 },
    { type: 'bomb', name: 'Cluster Bomb', desc: 'Large AoE explosions', dmg: 60, rate: 1700, range: 320, color: '#ff5500', cluster: true, price: 220 },
    { type: 'laser', name: 'Focus Laser', desc: 'Ramping continuous damage', dmg: 3, rate: 40, range: 300, color: '#ff0000', isContinuous: true, price: 180 }
];

const ENEMY_TYPES = [
    { type: 'normal', name: 'Drone', color: '#ff0055', hpMult: 1.0, spdMult: 0.9, size: 24, reward: 20 },
    { type: 'fast', name: 'Scout', color: '#ffd700', hpMult: 0.5, spdMult: 1.6, size: 18, reward: 25 },
    { type: 'tank', name: 'Goliath', color: '#8800ff', hpMult: 4.0, spdMult: 0.55, size: 38, reward: 70 },
    { type: 'regen', name: 'Bio-Mech', color: '#00ff66', hpMult: 1.4, spdMult: 0.8, size: 30, reward: 50, regen: 0.8 }
];

// --- UTILITIES ---

function addLog(msg, color = '#aaa') {
    const entry = document.createElement('div');
    entry.style.color = color;
    entry.textContent = `> ${msg}`;
    state.log.appendChild(entry);
    state.log.scrollTop = state.log.scrollHeight;
}

function updateHUD() {
    document.getElementById('base-hp').textContent = Math.max(0, state.hp);
    document.getElementById('gold').textContent = state.gold;
    document.getElementById('shop-gold-val').textContent = state.gold;
    document.getElementById('wave').textContent = state.wave;
    document.getElementById('level').textContent = state.level;
    document.getElementById('xp').textContent = state.xp;
}

function spawnParticles(x, y, color, count = 10, speed = 3) {
    for (let i = 0; i < count; i++) {
        state.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03,
            color,
            size: 2 + Math.random() * 4
        });
    }
}

function getDist(o1, o2) {
    return Math.sqrt((o1.x - o2.x) ** 2 + (o1.y - o2.y) ** 2);
}

// --- WAVE MANAGEMENT ---

function spawnWave() {
    state.wave++;
    state.inWave = true;
    updateHUD();
    addLog(`WAVE ${state.wave} INITIALIZED.`, '#00f2ff');
    
    let count = 5 + Math.floor(state.wave * 1.4);
    let spawned = 0;
    
    const interval = setInterval(() => {
        if (!state.active || spawned >= count) {
            clearInterval(interval);
            return;
        }
        
        const isBoss = state.wave % 5 === 0 && spawned === 0;
        const typeIndex = isBoss ? 2 : Math.floor(Math.random() * ENEMY_TYPES.length);
        const base = ENEMY_TYPES[typeIndex];
        
        const e = {
            ...base,
            x: Math.random() * (canvas.width - 60) + 30,
            y: -50,
            hp: Math.floor((50 + (state.wave * 35)) * base.hpMult * (isBoss ? 4.5 : 1)),
            speed: base.spdMult * (1 + state.wave * 0.04),
            poisoned: 0,
            slowed: 0,
            isBoss
        };
        e.maxHp = e.hp;
        state.enemies.push(e);
        spawned++;
    }, 850 / Math.max(1, state.speed / 2));
}

function checkWaveEnd() {
    if (state.inWave && state.enemies.length === 0) {
        state.inWave = false;
        state.xp += state.wave * 30;
        if (state.xp >= state.level * 180) {
            state.level++;
            state.xp = 0;
            addLog(`RANK INCREASED TO ${state.level}!`, '#00ff66');
            state.gold += 300; 
        }
        showChoices();
        updateHUD();
    }
}

// --- UI OVERLAYS ---

function showChoices() {
    const overlay = document.getElementById('choice-overlay');
    const container = document.getElementById('choices-container');
    container.innerHTML = '';
    
    overlay.style.display = 'flex';
    document.getElementById('overlay-title').textContent = state.wave === 0 ? 'SYSTEM INITIALIZATION' : 'WAVE DEFEATED';

    const shuffled = [...TOWER_TYPES].sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffled.forEach(t => {
        const card = document.createElement('div');
        card.className = 'choice-card';
        card.innerHTML = `
            <div style="background:${t.color}; width:15px; height:15px; border-radius:50%; margin:auto;"></div>
            <h3>${t.name}</h3>
            <p>${t.desc}</p>
            <div style="font-weight:bold; color:#00ff66; margin-top:5px;">FREE REWARD</div>
        `;
        card.onclick = () => startPlacement(t);
        container.appendChild(card);
    });
}

function startPlacement(tower) {
    state.placing = { ...tower, level: 1 };
    document.getElementById('choice-overlay').style.display = 'none';
    document.getElementById('upgrade-overlay').style.display = 'none';
    document.getElementById('placement-hint').style.display = 'block';
    updateHUD();
}

function skipPlacement() {
    document.getElementById('choice-overlay').style.display = 'none';
    spawnWave();
}

function switchShopTab(tab) {
    state.currentShopTab = tab;
    document.getElementById('tab-upgrades').classList.toggle('active', tab === 'upgrades');
    document.getElementById('tab-market').classList.toggle('active', tab === 'market');
    
    if (tab === 'upgrades') {
        document.getElementById('upgrade-list').style.display = 'block';
        document.getElementById('market-list').style.display = 'none';
        renderUpgrades();
    } else {
        document.getElementById('upgrade-list').style.display = 'none';
        document.getElementById('market-list').style.display = 'block';
        renderMarket();
    }
}

function renderUpgrades() {
    const list = document.getElementById('upgrade-list');
    list.innerHTML = '';
    if (state.towers.length === 0) {
        list.innerHTML = '<p style="color:#666; text-align:center;">No weapon systems found.</p>';
        return;
    }
    state.towers.forEach((t, i) => {
        const cost = t.level * 110;
        const item = document.createElement('div');
        item.className = 'upgrade-item';
        item.innerHTML = `
            <div>
                <strong style="color:${t.color}">${t.name}</strong> <small>(Lv ${t.level})</small><br>
                <small>DMG: ${t.dmg} | RNG: ${t.range}</small>
            </div>
            <button class="main-btn gold-btn" onclick="upgradeTower(${i}, ${cost})" ${state.gold < cost ? 'disabled' : ''}>
                UPGRADE ($${cost})
            </button>
        `;
        list.appendChild(item);
    });
}

function renderMarket() {
    const list = document.getElementById('market-list');
    list.innerHTML = '';
    TOWER_TYPES.forEach(t => {
        const item = document.createElement('div');
        item.className = 'upgrade-item';
        item.innerHTML = `
            <div>
                <strong style="color:${t.color}">${t.name}</strong><br>
                <small>${t.desc}</small>
            </div>
            <button class="main-btn gold-btn" onclick="buyFromMarket('${t.type}')" ${state.gold < t.price ? 'disabled' : ''}>
                BUY ($${t.price})
            </button>
        `;
        list.appendChild(item);
    });
}

function buyFromMarket(type) {
    const tower = TOWER_TYPES.find(t => t.type === type);
    if (state.gold >= tower.price) {
        state.gold -= tower.price;
        startPlacement(tower);
    }
}

function upgradeTower(index, cost) {
    if (state.gold >= cost) {
        state.gold -= cost;
        const t = state.towers[index];
        t.level++;
        t.dmg = Math.floor(t.dmg * 1.5);
        t.range = Math.floor(t.range * 1.1);
        t.rate = Math.floor(t.rate * 0.88);
        addLog(`UPGRADED ${t.name.toUpperCase()} TO LVL ${t.level}`, t.color);
        renderUpgrades();
        updateHUD();
    }
}

function showUpgradeMenu() {
    document.getElementById('choice-overlay').style.display = 'none';
    document.getElementById('upgrade-overlay').style.display = 'flex';
    switchShopTab(state.currentShopTab);
    updateHUD();
}

function closeUpgradeMenu() {
    document.getElementById('upgrade-overlay').style.display = 'none';
    showChoices();
}

function setSpeed(s) {
    state.speed = s;
    document.querySelectorAll('.speed-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.textContent) === s);
    });
}

function triggerGameOver() {
    state.active = false;
    state.gameOver = true;
    const overlay = document.getElementById('gameover-overlay');
    overlay.style.display = 'flex';
    document.getElementById('final-stats').textContent = `SURVIVED ${state.wave} WAVES | LEVEL ${state.level}`;
}

// --- CANVAS INTERACTION ---

canvas.onclick = (e) => {
    if (!state.placing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const zoneLimit = canvas.height * 0.65;
    if (y < zoneLimit) {
        addLog("SECTOR OUTSIDE DEFENSE ZONE", '#ff0055');
        return;
    }

    const overlap = state.towers.some(t => getDist({x, y}, t) < 35);
    if (overlap) {
        addLog("SECTOR OCCUPIED", '#ff0055');
        return;
    }

    state.towers.push({ ...state.placing, x, y, lastShot: 0, angle: 0 });
    addLog(`SYSTEM DEPLOYED: ${state.placing.name}`, state.placing.color);
    state.placing = null;
    document.getElementById('placement-hint').style.display = 'none';
    spawnWave();
};

// --- CORE GAME ENGINE ---

function update(delta) {
    if (!state.active || state.gameOver) return;

    const timeScale = delta * state.speed / 16.67;

    state.particles.forEach((p, i) => {
        p.x += p.vx * timeScale; p.y += p.vy * timeScale;
        p.life -= p.decay * timeScale;
        if (p.life <= 0) state.particles.splice(i, 1);
    });

    state.enemies.forEach(e => {
        let speed = e.speed;
        if (e.slowed > 0) { speed *= 0.45; e.slowed -= delta * state.speed; }
        e.y += speed * timeScale;
        if (e.regen && e.hp < e.maxHp) e.hp += e.regen * timeScale;
        if (e.poisoned > 0) { e.hp -= 0.7 * timeScale; e.poisoned -= delta * state.speed; }
        if (e.y > canvas.height - 20) {
            state.hp -= e.isBoss ? 500 : 100; e.hp = 0;
            updateHUD(); spawnParticles(e.x, canvas.height - 10, '#ff0055', 20, 5);
        }
    });
    state.enemies = state.enemies.filter(e => e.hp > 0);

    const now = performance.now();
    state.towers.forEach(t => {
        const rate = t.rate / state.speed;
        if (now - t.lastShot > rate) {
            const targets = state.enemies.filter(e => getDist(t, e) < t.range);
            if (targets.length > 0) {
                const target = targets.sort((a, b) => b.y - a.y)[0];
                t.angle = Math.atan2(target.y - t.y, target.x - t.x);
                if (t.isBeam) handleBeam(t, target);
                else if (t.multi) {
                    for(let i=0; i<t.multi; i++){ spawnBullet(t, target, t.angle + (i-1)*0.2); }
                } else spawnBullet(t, target, t.angle);
                t.lastShot = now;
            }
        }
    });

    state.bullets.forEach((b, i) => {
        if (b.target && b.target.hp > 0) {
            const angle = Math.atan2(b.target.y - b.y, b.target.x - b.x);
            b.vx = Math.cos(angle) * 13; b.vy = Math.sin(angle) * 13;
        }
        b.x += b.vx * timeScale; b.y += b.vy * timeScale;
        if (b.x < -50 || b.x > canvas.width + 50 || b.y < -50 || b.y > canvas.height + 50) {
            state.bullets.splice(i, 1); return;
        }
        if (b.target && b.target.hp > 0) {
            if (getDist(b, b.target) < (b.target.size/2 + 10)) { hitEnemy(b.target, b.dmg, b.tower); state.bullets.splice(i, 1); }
        } else {
            for (let e of state.enemies) {
                if (getDist(b, e) < (e.size/2 + 10)) { hitEnemy(e, b.dmg, b.tower); state.bullets.splice(i, 1); break; }
            }
        }
    });

    if (state.hp <= 0) triggerGameOver();
    checkWaveEnd();
}

function spawnBullet(tower, target, angle) {
    state.bullets.push({ x: tower.x, y: tower.y, vx: Math.cos(angle)*13, vy: Math.sin(angle)*13, dmg: tower.dmg, color: tower.color, tower, target });
}

function handleBeam(tower, target) {
    spawnParticles(target.x, target.y, tower.color, 5, 2);
    target.hp -= tower.dmg * 1.5; if (target.hp <= 0) { state.gold += target.reward; updateHUD(); }
}

function hitEnemy(enemy, dmg, tower) {
    let finalDmg = dmg;
    if (tower.crit && Math.random() < tower.crit) { finalDmg *= 2.5; spawnParticles(enemy.x, enemy.y, '#fff', 15, 6); }
    enemy.hp -= finalDmg; spawnParticles(enemy.x, enemy.y, tower.color, 4, 2);
    if (tower.isSlow) enemy.slowed = 2500;
    if (tower.isPoison) enemy.poisoned = 4000;
    if (tower.splash) {
        state.enemies.forEach(e => { if (e !== enemy && getDist(enemy, e) < tower.splash) { e.hp -= Math.floor(finalDmg * 0.4); spawnParticles(e.x, e.y, tower.color, 2, 1); } });
    }
    if (enemy.hp <= 0) { state.gold += enemy.reward; updateHUD(); spawnParticles(enemy.x, enemy.y, enemy.color, 12, 4); }
}

function draw() {
    ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const zoneY = canvas.height * 0.65;
    ctx.fillStyle = state.placing ? 'rgba(0, 242, 255, 0.1)' : 'rgba(0, 242, 255, 0.02)';
    ctx.fillRect(0, zoneY, canvas.width, canvas.height - zoneY);
    state.particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
    ctx.globalAlpha = 1.0;

    state.enemies.forEach(e => {
        ctx.save(); ctx.translate(e.x, e.y); ctx.shadowBlur = 10; ctx.shadowColor = e.color; ctx.fillStyle = e.color;
        if (e.isBoss) { ctx.beginPath(); ctx.moveTo(0, -e.size/2); ctx.lineTo(e.size/2, 0); ctx.lineTo(0, e.size/2); ctx.lineTo(-e.size/2, 0); ctx.closePath(); ctx.fill(); }
        else ctx.fillRect(-e.size/2, -e.size/2, e.size, e.size);
        ctx.restore();
        ctx.fillStyle = '#222'; ctx.fillRect(e.x - e.size/2, e.y - e.size/2 - 12, e.size, 4);
        ctx.fillStyle = '#ff0055'; ctx.fillRect(e.x - e.size/2, e.y - e.size/2 - 12, e.size * (e.hp / e.maxHp), 4);
    });

    state.bullets.forEach(b => { ctx.shadowBlur = 8; ctx.shadowColor = b.color; ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); });

    state.towers.forEach(t => {
        ctx.save(); ctx.translate(t.x, t.y); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = t.color; ctx.lineWidth = 2; ctx.stroke();
        ctx.rotate(t.angle); ctx.fillStyle = t.color; ctx.shadowBlur = 15; ctx.shadowColor = t.color; ctx.fillRect(0, -5, 25, 10); ctx.restore();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Consolas'; ctx.textAlign = 'center'; ctx.fillText(`LVL ${t.level}`, t.x, t.y + 35);
    });
}

function gameLoop(time) {
    const delta = time - state.lastTime; state.lastTime = time;
    update(delta); draw();
    requestAnimationFrame(gameLoop);
}

// Start
updateHUD(); showChoices(); requestAnimationFrame(gameLoop);
window.switchShopTab = switchShopTab; window.buyFromMarket = buyFromMarket; window.upgradeTower = upgradeTower;
window.closeUpgradeMenu = closeUpgradeMenu; window.showUpgradeMenu = showUpgradeMenu; window.skipPlacement = skipPlacement; window.setSpeed = setSpeed;
