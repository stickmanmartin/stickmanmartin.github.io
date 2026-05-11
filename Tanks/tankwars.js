// Tank Wars: Massive Evolution Engine - Final Release
// Features: Independent Turret Aiming, 6-Tier Evolution Tree, Ultimate State, Faction AI

const canvasContainer = document.getElementById('canvas-container');
const pointer = document.getElementById('facility-pointer');

// --- Game Constants ---
const SPEED_BASE = 5; 
const TANK_WIDTH = 2;
const TANK_HEIGHT = 1.5;
const TANK_DEPTH = 3;
const BULLET_RADIUS = 0.3;
const MAP_SIZE = 4000; 
const EVOLUTION_LEVELS = [10, 20, 30, 50, 75, 100];
const ULTIMATE_LEVEL = 150;

const BLOCK_TIERS = {
    BLUE: { color: 0x38bdf8, size: 1.2, hp: 40, exp: 150 },
    YELLOW: { color: 0xfbbf24, size: 1.8, hp: 100, exp: 300 },
    PURPLE: { color: 0xa78bfa, size: 4.0, hp: 400, exp: 1200 },
    GREEN: { color: 0x10b981, size: 3.0, hp: 600, exp: 1800 },
    RED: { color: 0xef4444, size: 3.5, hp: 800, exp: 2500 },
    DARK_MATTER: { color: 0x000000, size: 8.0, hp: 5000, exp: 15000, name: "Elite Data" },
    CORE_GOLIATH: { color: 0xff00ff, size: 20.0, hp: 50000, exp: 250000, name: "The Mainframe" },
    WALL: { color: 0x334155, size: 15.0, hp: Infinity, exp: 0, isWall: true },
};

const STAT_NAMES = { 
    maxHealth: "MAX_INTEGRITY", healthRegen: "AUTO_REPAIR",
    bulletSpeed: "VELOCITY", bulletDamage: "KINETIC_OUTPUT",
    fireRate: "CYCLE_RATE", bodyDamage: "RAM_STRENGTH", movementSpeed: "THRUST",
};

// --- EVOLUTION TREE ---
const EVOLUTION_TREE = {
    'Basic': ['Twin', 'Sniper', 'MachineGun'],
    'Twin': ['Triple', 'Quad', 'TwinSniper'],
    'Sniper': ['Assassin', 'Hunter', 'Railgun'],
    'MachineGun': ['Destroyer', 'Sprayer', 'Minigun'],
    'Triple': ['Penta', 'Hurricane', 'Vector'],
    'Quad': ['Octa', 'Battery', 'Aegis'],
    'Assassin': ['Ghost', 'Stalker', 'Phantom'],
    'Destroyer': ['Annihilator', 'WreckingBall', 'Smasher'],
    'Penta': ['Spreadshot', 'Shotgun', 'Tornado'],
    'Octa': ['Spider', 'Crab', 'Centipede'],
    'Hurricane': ['Typhoon', 'Cyclone', 'Maelstrom'],
    'Ghost': ['Wraith', 'Specter', 'Shadow'],
    'Ultimate': { color: 0xffffff, description: "THE SINGULARITY. 50 CANNONS." }
};

const TANK_DATA = {
    'Basic': { cannons: [{x: 0, z: 1.8}], color: 0x38bdf8 },
    'Twin': { cannons: [{x: -0.5, z: 1.8}, {x: 0.5, z: 1.8}], color: 0x38bdf8 },
    'Sniper': { cannons: [{x: 0, z: 3.5, scale: 2.2}], color: 0xfbbf24 },
    'MachineGun': { cannons: [{x: 0, z: 1.8, width: 0.8}], color: 0x10b981 },
    'Triple': { cannons: [{x: -0.8, z: 1.8}, {x: 0, z: 2.2}, {x: 0.8, z: 1.8}], color: 0x38bdf8 },
    'Quad': { cannons: [{x: -0.6, z: 1.8}, {x: -0.2, z: 2.0}, {x: 0.2, z: 2.0}, {x: 0.6, z: 1.8}], color: 0x38bdf8 },
    'Octa': { cannons: Array.from({length: 8}, (_, i) => ({x: 0, z: 2.0, rotation: (i * Math.PI / 4)})), color: 0xff00ff },
    'Ultimate': { 
        cannons: Array.from({length: 50}, (_, i) => ({
            x: Math.cos(i * (Math.PI*2/50)) * 2.0, 
            z: Math.sin(i * (Math.PI*2/50)) * 2.0,
            rotation: i * (Math.PI*2/50),
            scale: 2.5 + Math.random() * 2
        })),
        color: 0xffffff
    }
};

// --- Three.js State ---
let scene, camera, renderer, clock;
let playerTank;
let entities = []; 
let blocks = [];
let bullets = [];
let keys = {};

class BaseTank {
    constructor(isPlayer = false, initialLevel = 1, faction = 'Red') {
        this.isPlayer = isPlayer;
        this.faction = isPlayer ? 'Blue' : faction;
        this.group = new THREE.Group(); 
        this.turret = new THREE.Group(); 
        this.group.add(this.turret);
        
        this.group.position.set((Math.random()-0.5)*MAP_SIZE*0.8, 0.75, (Math.random()-0.5)*MAP_SIZE*0.8); 
        
        this.level = initialLevel;
        this.exp = 0;
        this.skillPoints = 0;
        this.tankType = 'Basic'; 
        this.stats = {
            maxHealth: 150, healthRegen: 1.0, bulletSpeed: 40,
            bulletDamage: 30, fireRate: 0.6, bodyDamage: 25, movementSpeed: 1.5,
        };
        this.currentHP = this.stats.maxHealth;
        this.lastShotTime = 0;
        this.isAlive = true;
        this.cannons = [];

        this.updateModel();
    }
    
    getExpToNextLevel() { return Math.floor(60 * (this.level ** 1.5)); }

    addExp(amount) {
        if (!this.isAlive) return;
        this.exp += amount;
        let req = this.getExpToNextLevel();
        while (this.exp >= req) {
            this.exp -= req;
            this.level++;
            this.skillPoints += 5; 
            if (this.isPlayer) showMessage(`EVOLUTION PROTOCOL: TIER ${this.level} UNLOCKED`);
            else this.autoUpgrade(); 
            req = this.getExpToNextLevel();
        }
        
        if (this.level >= ULTIMATE_LEVEL && this.tankType !== 'Ultimate') {
            this.evolve('Ultimate');
            if (this.isPlayer) {
                Object.keys(this.stats).forEach(k => {
                    if (k === 'fireRate') this.stats[k] = 0.02;
                    else this.stats[k] = 999999;
                });
                this.currentHP = this.stats.maxHealth;
                showMessage("ULTIMATE FORM ACHIEVED: LIMITER REMOVED");
            }
        }
        if (this.isPlayer) updateStatPanel();
    }

    autoUpgrade() {
        const sKeys = Object.keys(this.stats);
        for(let i=0; i<5; i++) this.upgradeStat(sKeys[Math.floor(Math.random()*sKeys.length)]);
        const possible = EVOLUTION_TREE[this.tankType];
        if (Array.isArray(possible) && EVOLUTION_LEVELS.includes(this.level)) {
            this.evolve(possible[Math.floor(Math.random()*possible.length)]);
        }
    }

    updateModel() {
        while(this.turret.children.length > 0) this.turret.remove(this.turret.children[0]);
        this.group.children.forEach(c => { if(c !== this.turret) this.group.remove(c); });

        const data = TANK_DATA[this.tankType] || TANK_DATA['Basic'];
        const color = this.isPlayer ? 0x38bdf8 : (this.faction === 'Red' ? 0xef4444 : 0xfbbf24);
        
        this.body = new THREE.Mesh(
            this.isPlayer ? new THREE.SphereGeometry(TANK_DEPTH/1.5, 32, 16) : new THREE.BoxGeometry(TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH),
            new THREE.MeshLambertMaterial({ color: color })
        );
        this.group.add(this.body);

        this.cannons = [];
        data.cannons.forEach(off => {
            const cannonGeo = new THREE.CylinderGeometry(off.width||0.4, off.width||0.5, 2.5*(off.scale||1), 32);
            const cannonMesh = new THREE.Mesh(cannonGeo, new THREE.MeshLambertMaterial({ color: color }));
            cannonMesh.rotation.x = Math.PI / 2;
            if (off.rotation) cannonMesh.rotation.z = off.rotation;
            cannonMesh.position.set(off.x, 0, off.z);
            this.turret.add(cannonMesh);
            this.cannons.push({ mesh: cannonMesh, offset: off });
        });
    }

    takeDamage(damage) {
        this.currentHP -= damage;
        if (this.body) {
            this.body.material.emissive.setHex(0xffffff); 
            setTimeout(() => { if(this.body) this.body.material.emissive.setHex(0x000000); }, 50);
        }
        if (this.currentHP <= 0) {
            this.isAlive = false;
            scene.remove(this.group);
            return true;
        }
        return false;
    }

    shoot() {
        const now = clock.getElapsedTime();
        const rate = this.tankType === 'Ultimate' ? 0.02 : this.stats.fireRate;
        if (now - this.lastShotTime < rate) return;
        this.lastShotTime = now;
        
        this.cannons.forEach(cannon => {
            let localForward = new THREE.Vector3(0, 0, 1);
            if (cannon.offset.rotation) {
                const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), cannon.offset.rotation);
                localForward.applyQuaternion(q);
            }
            const worldDirection = localForward.clone().applyQuaternion(this.turret.quaternion).applyQuaternion(this.group.quaternion);
            const bulletMesh = new THREE.Mesh(new THREE.SphereGeometry(BULLET_RADIUS * (this.tankType === 'Ultimate'?2.5:1), 16, 16), new THREE.MeshBasicMaterial({ color: this.isPlayer ? 0x38bdf8 : 0xef4444 }));
            const worldPos = new THREE.Vector3();
            cannon.mesh.getWorldPosition(worldPos);
            bulletMesh.position.copy(worldPos).add(worldDirection.clone().multiplyScalar(1.5));
            scene.add(bulletMesh);
            bullets.push({ mesh: bulletMesh, velocity: worldDirection.multiplyScalar(this.stats.bulletSpeed), damage: this.stats.bulletDamage, radius: BULLET_RADIUS, shooter: this });
        });
    }

    upgradeStat(key) {
        if (this.skillPoints <= 0 && this.isPlayer) return;
        if (this.isPlayer) this.skillPoints--;
        if (key === 'maxHealth') { this.stats.maxHealth += 200; this.currentHP += 200; }
        else if (key === 'fireRate') this.stats.fireRate = Math.max(0.02, this.stats.fireRate - 0.1);
        else if (key === 'bulletDamage') this.stats.bulletDamage += 50;
        else this.stats[key] *= 1.4;
        if (this.isPlayer) updateStatPanel();
    }

    evolve(type) {
        this.tankType = type;
        this.updateModel();
        if (this.isPlayer) {
            document.getElementById('upgrade-modal').classList.add('hidden');
            showMessage(`EVOLUTION COMPLETE: ${type.toUpperCase()}_ENGAGED`);
        }
    }
}

function isDayTime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

function initScene() {
    const isDay = isDayTime();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(isDay ? 0x87ceeb : 0x050507); // Sky Blue or Near Black
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 15000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasContainer.appendChild(renderer.domElement);

    clock = new THREE.Clock();
    scene.add(new THREE.AmbientLight(0xffffff, isDay ? 0.8 : 0.4));
    const sun = new THREE.DirectionalLight(0xffffff, isDay ? 2.5 : 1.5);
    sun.position.set(1000, 5000, 1000);
    scene.add(sun);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(MAP_SIZE * 2, MAP_SIZE * 2), 
        new THREE.MeshStandardMaterial({ 
            color: isDay ? 0xeeeeee : 0x050505, 
            wireframe: !isDay 
        })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
...

    playerTank = new BaseTank(true);
    scene.add(playerTank.group);
    entities.push(playerTank);

    generateWorld();
    setupEventListeners();
    animate();
}

function generateWorld() {
    // ELITE CORE
    for (let i = 0; i < 2000; i++) {
        const a = Math.random()*Math.PI*2; const d = Math.random()*800;
        blocks.push(new Block(Math.cos(a)*d, Math.sin(a)*d, 'DARK_MATTER'));
    }
    blocks.push(new Block(0, 0, 'CORE_GOLIATH'));

    for (let i = 0; i < 15000; i++) {
        const tier = Object.keys(BLOCK_TIERS)[Math.floor(Math.random()*5)];
        blocks.push(new Block((Math.random()-0.5)*MAP_SIZE, (Math.random()-0.5)*MAP_SIZE, tier));
    }
    
    for (let i = 0; i < 200; i++) {
        const f = Math.random() > 0.5 ? 'Red' : 'Yellow';
        const e = new BaseTank(false, Math.floor(Math.random()*60)+1, f);
        entities.push(e);
        scene.add(e.group);
    }
}

class Block {
    constructor(x, z, tier) {
        const config = BLOCK_TIERS[tier];
        this.config = config;
        this.currentHP = config.hp;
        this.isAlive = true;
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(config.size, config.size, config.size), new THREE.MeshPhongMaterial({ color: config.color }));
        this.mesh.position.set(x, config.size / 2, z);
        scene.add(this.mesh);
    }
    takeDamage(dmg, source) {
        if (this.config.isWall) return false;
        this.currentHP -= dmg;
        if (this.currentHP <= 0) {
            this.isAlive = false;
            scene.remove(this.mesh);
            if (source) source.addExp(this.config.exp);
            return true;
        }
        return false;
    }
}

function updateAI(dt) {
    entities.forEach(ent => {
        if (ent.isPlayer || !ent.isAlive) return;
        let target = null; let minDist = 600;
        entities.forEach(other => {
            if (other.isAlive && other.faction !== ent.faction) {
                const d = ent.group.position.distanceTo(other.group.position);
                if (d < minDist) { minDist = d; target = other; }
            }
        });

        if (target) {
            const dir = target.group.position.clone().sub(ent.group.position);
            const targetRot = Math.atan2(-dir.x, -dir.z);
            ent.group.rotation.y = targetRot;
            ent.turret.rotation.y = 0;
            if (minDist > 30) ent.group.translateZ(SPEED_BASE * dt * ent.stats.movementSpeed);
            ent.shoot();
        } else {
            ent.group.rotation.y += dt * 0.8; 
            ent.group.translateZ(SPEED_BASE * dt * 0.5);
            blocks.forEach(b => { if (b.isAlive && ent.group.position.distanceTo(b.mesh.position) < 80) ent.shoot(); });
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    if (playerTank.isAlive) {
        const speed = SPEED_BASE * playerTank.stats.movementSpeed;
        if (keys['KeyW']) playerTank.group.translateZ(speed * dt);
        if (keys['KeyS']) playerTank.group.translateZ(-speed * dt);
        if (keys['KeyA']) playerTank.group.rotation.y += 2.5 * dt;
        if (keys['KeyD']) playerTank.group.rotation.y -= 2.5 * dt;
        
        playerTank.currentHP = Math.min(playerTank.stats.maxHealth, playerTank.currentHP + playerTank.stats.healthRegen * dt);

        // --- THIRD PERSON FOLLOW CAMERA ---
        const cameraOffset = new THREE.Vector3(0, 8, -25).applyQuaternion(playerTank.turret.quaternion).applyQuaternion(playerTank.group.quaternion);
        camera.position.copy(playerTank.group.position).add(cameraOffset);
        
        const lookDir = new THREE.Vector3(0, 2, 15).applyQuaternion(playerTank.turret.quaternion).applyQuaternion(playerTank.group.quaternion);
        camera.lookAt(playerTank.group.position.clone().add(lookDir));
    }

    updateAI(dt);
    
    bullets.forEach((b, i) => {
        b.mesh.position.add(b.velocity.clone().multiplyScalar(dt));
        if (b.mesh.position.distanceTo(playerTank.group.position) > 4000) { scene.remove(b.mesh); bullets.splice(i, 1); return; }

        entities.forEach(t => {
            if (t.isAlive && t.faction !== b.shooter.faction && b.mesh.position.distanceTo(t.group.position) < 4) {
                if (t.takeDamage(b.damage)) b.shooter.addExp(t.level * 2000);
                scene.remove(b.mesh); bullets.splice(i, 1);
            }
        });
        blocks.forEach(bl => {
            if (bl.isAlive && b.mesh.position.distanceTo(bl.mesh.position) < bl.config.size) {
                bl.takeDamage(b.damage, b.shooter);
                scene.remove(b.mesh); bullets.splice(i, 1);
            }
        });
    });

    updateStatPanel();
    renderer.render(scene, camera);
}

function updateStatPanel() {
    document.getElementById('player-level').textContent = playerTank.level;
    document.getElementById('skill-points').textContent = playerTank.skillPoints;
    const req = playerTank.getExpToNextLevel();
    document.getElementById('exp-bar').style.width = `${Math.min(100, (playerTank.exp/req)*100)}%`;
    if (EVOLUTION_LEVELS.includes(playerTank.level) && EVOLUTION_TREE[playerTank.tankType]) {
        if(document.getElementById('upgrade-modal').classList.contains('hidden')) showUpgradeModal();
    }
}

function showUpgradeModal() {
    const modal = document.getElementById('upgrade-modal');
    const container = document.getElementById('upgrade-choices');
    container.innerHTML = '';
    const choices = EVOLUTION_TREE[playerTank.tankType];
    if (!Array.isArray(choices)) return;
    choices.forEach(e => {
        const btn = document.createElement('button');
        btn.className = 'bg-sky-900/80 hover:bg-sky-500 border-2 border-sky-400 p-6 rounded text-white font-black text-xl transition-all';
        btn.innerHTML = `<p>${e}</p>`;
        btn.onclick = () => playerTank.evolve(e);
        container.appendChild(btn);
    });
    modal.classList.remove('hidden');
}

function showMessage(t) {
    const el = document.getElementById('game-messages');
    el.textContent = t; el.style.display = 'block';
    setTimeout(() => { if(el.textContent === t) el.style.display = 'none'; }, 3000);
}

function setupEventListeners() {
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);
    window.addEventListener('mousemove', e => {
        if (playerTank.isAlive) playerTank.turret.rotation.y -= e.movementX * 0.004;
    });
    window.addEventListener('mousedown', () => playerTank.shoot());
}

initScene();
