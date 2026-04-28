const state = {
    player: {
        hp: 100, maxHp: 100, attack: 15, defense: 0, gold: 100, xp: 0, lvl: 1,
        class: null, weapon: null, armor: null, pet: null, magic: null
    },
    enemy: {
        hp: 100, maxHp: 100, attack: 15, wins: 0
    },
    classes: [
        { name: "Recruit", rarity: "common", hp: 1.0, atk: 1.0, def: 2, type: "Warrior", icon: "recruit-img" },
        { name: "Apprentice", rarity: "common", hp: 0.8, atk: 1.2, def: 0, type: "Mage", icon: "apprentice-img" },
        { name: "Scout", rarity: "common", hp: 0.9, atk: 1.1, def: 0, type: "Ranger", icon: "scout-img" },
        { name: "Squire", rarity: "common", hp: 1.1, atk: 0.9, def: 4, type: "Warrior", icon: "squire-img" },
        { name: "Knight", rarity: "rare", hp: 1.3, atk: 1.3, def: 10, type: "Warrior", icon: "knight-img" },
        { name: "Wizard", rarity: "rare", hp: 0.9, atk: 1.8, def: 3, type: "Mage", icon: "wizard-img" },
        { name: "Archer", rarity: "rare", hp: 1.1, atk: 1.5, def: 2, type: "Ranger", icon: "archer-img" },
        { name: "Cleric", rarity: "rare", hp: 1.4, atk: 1.1, def: 6, type: "Paladin", icon: "cleric-img" },
        { name: "Berserker", rarity: "epic", hp: 1.6, atk: 2.2, def: 0, type: "Warrior", icon: "berserker-img" },
        { name: "Sorcerer", rarity: "epic", hp: 1.1, atk: 2.8, def: 4, type: "Mage", icon: "sorcerer-img" },
        { name: "Assassin", rarity: "epic", hp: 1.2, atk: 2.5, def: 3, type: "Ranger", icon: "assassin-img" },
        { name: "Lich", rarity: "epic", hp: 1.1, atk: 2.6, def: 8, type: "Necro", icon: "lich-img" },
        { name: "Holy Paladin", rarity: "epic", hp: 1.9, atk: 1.6, def: 15, type: "Paladin", icon: "paladinknight-img" },
        { name: "Dragon Knight", rarity: "legendary", hp: 2.5, atk: 3.2, def: 25, type: "Warrior", icon: "dragonknight-img" },
        { name: "Archmage", rarity: "legendary", hp: 1.7, atk: 4.5, def: 12, type: "Mage", icon: "archmage-img" },
        { name: "Shadow Hunter", rarity: "legendary", hp: 2.0, atk: 3.8, def: 10, type: "Ranger", icon: "shadowhunter-img" },
        { name: "Templar", rarity: "legendary", hp: 3.0, atk: 2.2, def: 40, type: "Paladin", icon: "templar-img" },
        { name: "Sun God", rarity: "mythic", hp: 6.0, atk: 7.0, def: 60, type: "Paladin", icon: "sungod-img" },
        { name: "Void Reaver", rarity: "mythic", hp: 4.0, atk: 9.0, def: 30, type: "Necro", icon: "voidreaver-img" },
        { name: "Chaos Lord", rarity: "mythic", hp: 5.5, atk: 6.5, def: 50, type: "Warrior", icon: "chaoslord-img" },
        { name: "Eternal One", rarity: "mythic", hp: 10.0, atk: 12.0, def: 100, type: "Mage", icon: "eternalone-img" }
    ],
    shopItems: {
        weapons: [
            { id: "sword", name: "Steel Sword", cost: 25, attack: 15, type: "melee", classes: ["Warrior", "Paladin"] },
            { id: "wand", name: "Arcane Wand", cost: 25, attack: 18, type: "fire", classes: ["Mage", "Necro"] },
            { id: "bow", name: "Recurve Bow", cost: 25, attack: 14, type: "arrow", classes: ["Ranger"] }
        ],
        armor: [
            { id: "plate", name: "Steel Plate", cost: 50, defense: 20, classes: ["Warrior", "Paladin"] },
            { id: "robe", name: "Silk Robe", cost: 40, defense: 10, classes: ["Mage", "Necro", "Ranger"] }
        ],
        pets: [
            { id: "wisp", name: "Soul Wisp", cost: 120, bonus: 35, classes: ["Warrior", "Mage", "Ranger", "Paladin", "Necro"] }
        ]
    }
};

const dom = {
    classOverlay: document.getElementById('class-select'),
    rollVisual: document.getElementById('roll-visual-inner'),
    rollName: document.getElementById('roll-name'),
    rollRarity: document.getElementById('roll-rarity'),
    classCard: document.getElementById('class-display-card'),
    rollBtn: document.getElementById('roll-btn'),
    startBtn: document.getElementById('start-btn'),
    playerVisual: document.getElementById('player-visual-inner'),
    currentClass: document.getElementById('current-class'),
    classTag: document.getElementById('class-tag'),
    gold: document.getElementById('gold'),
    lvl: document.getElementById('lvl'),
    xpFill: document.getElementById('xp-fill'),
    playerHp: document.getElementById('player-hp'),
    playerMaxHp: document.getElementById('player-max-hp'),
    playerHpFill: document.getElementById('player-hp-fill'),
    playerAtk: document.getElementById('player-atk'),
    playerDef: document.getElementById('player-def'),
    enemyHp: document.getElementById('enemy-hp'),
    enemyMaxHp: document.getElementById('enemy-max-hp'),
    enemyHpFill: document.getElementById('enemy-hp-fill'),
    log: document.getElementById('combat-log'),
    attackBtn: document.getElementById('attack-btn'),
    shopBtn: document.getElementById('shop-btn'),
    bmBtn: document.getElementById('blackmarket-btn'),
    restartBtn: document.getElementById('restart-btn'),
    playerSprite: document.getElementById('player-sprite'),
    projectileLayer: document.getElementById('projectile-layer'),
    playerPet: document.getElementById('player-pet-wisp'),
    shopOverlay: document.getElementById('shop-overlay'),
    shopItems: document.getElementById('shop-items-container'),
    shopGold: document.getElementById('shop-gold-display'),
    bmOverlay: document.getElementById('blackmarket-overlay'),
    bmGold: document.getElementById('bm-gold-display')
};

function rollClass() {
    dom.rollBtn.disabled = true;
    dom.classCard.classList.add('roll-anim');
    let i = 0;
    const interval = setInterval(() => {
        const cls = state.classes[Math.floor(Math.random() * state.classes.length)];
        updateDisplay(cls, dom.rollVisual, dom.rollName, dom.rollRarity, dom.classCard);
        if (++i >= 30) { clearInterval(interval); finalize(); }
    }, 80);
}

function updateDisplay(cls, visual, name, rar, card) {
    visual.className = 'hero-base ' + cls.icon;
    name.textContent = cls.name;
    rar.textContent = cls.rarity.toUpperCase();
    card.className = `class-card rarity-${cls.rarity}`;
}

function finalize() {
    const r = Math.random() * 100;
    let rar = 'common';
    if (r < 2) rar = 'mythic'; else if (r < 10) rar = 'legendary'; else if (r < 25) rar = 'epic'; else if (r < 50) rar = 'rare';
    const pool = state.classes.filter(c => c.rarity === rar);
    const sel = pool[Math.floor(Math.random() * pool.length)];
    state.rolledClass = sel;
    updateDisplay(sel, dom.rollVisual, dom.rollName, dom.rollRarity, dom.classCard);
    dom.classCard.classList.remove('roll-anim');
    dom.rollBtn.style.display = 'none';
    dom.startBtn.style.display = 'block';
}

function startGame() {
    const cls = state.rolledClass;
    state.player.class = cls.type;
    state.player.maxHp = Math.floor(100 * cls.hp);
    state.player.hp = state.player.maxHp;
    state.player.attack = Math.floor(15 * cls.atk);
    state.player.defense = cls.def;
    dom.currentClass.textContent = cls.name;
    dom.classTag.className = `rarity-${cls.rarity}`;
    dom.playerVisual.className = 'hero-base ' + cls.icon;
    dom.classOverlay.style.display = 'none';
    updateUI();
    addLog(`Battle: Your legend begins as the ${cls.name}!`, 'gold');
}

function addLog(m, c = '#fff') {
    const e = document.createElement('div');
    e.style.color = c; e.textContent = `> ${m}`;
    dom.log.appendChild(e); dom.log.scrollTop = dom.log.scrollHeight;
}

function updateUI() {
    dom.playerHp.textContent = state.player.hp;
    dom.playerMaxHp.textContent = state.player.maxHp;
    dom.playerHpFill.style.width = `${(state.player.hp / state.player.maxHp) * 100}%`;
    dom.playerAtk.textContent = state.player.attack;
    dom.playerDef.textContent = state.player.defense;
    dom.enemyHp.textContent = state.enemy.hp;
    dom.enemyMaxHp.textContent = state.enemy.maxHp;
    dom.enemyHpFill.style.width = `${(state.enemy.hp / state.enemy.maxHp) * 100}%`;
    dom.gold.textContent = state.player.gold;
    dom.shopGold.textContent = state.player.gold;
    dom.bmGold.textContent = state.player.gold;
    dom.lvl.textContent = state.player.lvl;
    dom.xpFill.style.width = `${(state.player.xp / (state.player.lvl * 100)) * 100}%`;
}

async function handleAttack() {
    dom.attackBtn.disabled = true;
    let type = 'melee';
    if (state.player.magic) type = state.player.magic.type;
    else if (state.player.weapon) type = state.player.weapon.type;
    else {
        const t = state.player.class;
        if (t === 'Mage') type = 'fire'; else if (t === 'Necro') type = 'void'; else if (t === 'Ranger') type = 'arrow'; else if (t === 'Paladin') type = 'holy';
    }

    if (type === 'melee') {
        dom.playerSprite.classList.add('charge');
        await new Promise(r => setTimeout(r, 200));
        dom.playerSprite.classList.remove('charge');
    } else {
        const p = document.createElement('div');
        p.className = (type==='arrow'?'arrow-projectile':(type==='fire'?'fire-orb':(type==='water'?'water-orb':(type==='void'?'void-orb':'holy-bolt')))) + ' p-fly';
        dom.projectileLayer.appendChild(p);
        setTimeout(() => p.remove(), 400);
        await new Promise(r => setTimeout(r, 400));
    }

    let d = Math.floor(Math.random() * state.player.attack) + (state.player.pet ? state.player.pet.bonus : 0);
    state.enemy.hp = Math.max(0, state.enemy.hp - d);
    addLog(`Battle: Dealt ${d} damage.`);

    if (state.enemy.hp <= 0) {
        addLog("Victory!", 'gold');
        state.player.gold += 120 + (state.player.lvl * 25);
        state.player.xp += 50;
        if (state.player.xp >= state.player.lvl * 100) {
            state.player.lvl++; state.player.xp = 0;
            state.player.maxHp += 30; state.player.attack += 8;
            addLog("Level Up!", '#00ff66');
        }
        endRound();
    } else {
        await new Promise(r => setTimeout(r, 500));
        let ed = Math.max(1, Math.floor(Math.random() * state.enemy.attack) - state.player.defense);
        state.player.hp = Math.max(0, state.player.hp - ed);
        addLog(`Battle: Taken ${ed} damage.`, '#ff4444');
        if (state.player.hp <= 0) { addLog("Hero Fallen.", 'red'); endRound(); }
        else dom.attackBtn.disabled = false;
    }
    updateUI();
}

function endRound() { dom.attackBtn.style.display = 'none'; dom.restartBtn.style.display = 'block'; dom.shopBtn.style.display = 'block'; dom.bmBtn.style.display = 'block'; }

function showTab(cat) {
    dom.shopItems.innerHTML = '';
    state.shopItems[cat].forEach(item => {
        const ok = item.classes.includes(state.player.class);
        const card = document.createElement('div');
        card.className = `item-card ${!ok ? 'restricted' : ''}`;
        card.innerHTML = `<strong>${item.name}</strong><br><span style="color:gold">${item.cost}G</span><br>${ok ? `<button onclick="buy('${cat}','${item.id}')">BUY</button>` : `<button disabled>BLOCKED</button>`}`;
        dom.shopItems.appendChild(card);
    });
}

function buy(cat, id) {
    const item = state.shopItems[cat].find(i => i.id === id);
    if (state.player.gold >= item.cost) {
        state.player.gold -= item.cost;
        if (cat === 'weapons') state.player.weapon = item;
        else if (cat === 'armor') state.player.defense += item.defense;
        else if (cat === 'pets') { state.player.pet = item; dom.playerPet.className = 'wisp-pet'; }
        updateUI(); showTab(cat);
    }
}

function sac(type) {
    if (type === 'weapon' && state.player.weapon) { state.player.attack += 30; state.player.weapon = null; addLog("Sacrificed weapon for power!", 'red'); closeBM(); updateUI(); }
}

function buyBM(type) {
    if (type === 'reroll' && state.player.gold >= 500) { state.player.gold -= 500; dom.classOverlay.style.display = 'flex'; dom.rollBtn.style.display = 'block'; dom.rollBtn.disabled = false; dom.startBtn.style.display = 'none'; closeBM(); updateUI(); }
}

function closeShop() { dom.shopOverlay.style.display = 'none'; }
function closeBM() { dom.bmOverlay.style.display = 'none'; }

dom.attackBtn.addEventListener('click', handleAttack);
dom.shopBtn.addEventListener('click', () => { dom.shopOverlay.style.display = 'flex'; showTab('weapons'); });
dom.bmBtn.addEventListener('click', () => { dom.bmOverlay.style.display = 'flex'; });
dom.restartBtn.addEventListener('click', () => {
    state.enemy.maxHp += 60; state.enemy.hp = state.enemy.maxHp;
    state.enemy.attack += 12; state.player.hp = state.player.maxHp;
    dom.attackBtn.style.display = 'block'; dom.attackBtn.disabled = false;
    dom.restartBtn.style.display = 'none'; dom.shopBtn.style.display = 'none'; dom.bmBtn.style.display = 'none';
    updateUI();
});

window.rollClass = rollClass; window.startGame = startGame; window.showTab = showTab;
window.buy = buy; window.sac = sac; window.buyBM = buyBM; window.closeShop = closeShop; window.closeBM = closeBM;
updateUI();
