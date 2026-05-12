// === Neon Sprint (Formerly Stop & Go) ===
// Features: Full-screen infinite road, AI Gesture Control, Sync Zones, Procedural Difficulty
// Update: Corruption mechanic - cannot stop in Red Zones, Green Sanctuary Nodes inside Red.
// Update: Death mechanic via Neural Integrity (HP) and Hazard Spikes.

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/btvlWZOp3/";
const PREDICT_INTERVAL = 100; // ms

// Game State
let player;
let syncZones = [];
let hazards = [];
let score = 0;
let highScore = localStorage.getItem('stopAndGoHighscore') || 0;
let gameState = 'START'; 
let speed = 6;
let maxSpeed = 22;
let roadY;
let integrity = 100;
let deathReason = "";

// AI State
let model = null, video = null;
let aiLabel = "idle", lastAiLabel = "idle";

function isDayTime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

class Hazard {
    constructor(x) {
        this.x = x;
        this.y = roadY;
        this.w = 40;
        this.h = 50;
    }
    update() {
        if (player.moving) {
            this.x -= speed;
        }
    }
    draw() {
        push();
        fill('#ef4444');
        stroke(255);
        strokeWeight(2);
        // Draw a dangerous spike/shard
        triangle(this.x, this.y, this.x + this.w, this.y, this.x + this.w/2, this.y - this.h);
        pop();
    }
}

class Player {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = width * 0.2;
        this.y = roadY;
        this.w = 60;
        this.h = 30;
        this.moving = false;
        this.inCorruption = false;
        integrity = 100;
    }
    update() {
        if (this.moving && gameState === 'PLAYING') {
            score += speed / 100;
            speed = min(maxSpeed, speed + 0.003);
            
            // Death condition: Hitting a spike while moving
            hazards.forEach(h => {
                if (this.x + this.w > h.x && this.x < h.x + h.w) {
                    gameOver("CRITICAL COLLISION: NEURAL SPIKE DETECTED");
                }
            });
        }
        
        // Corruption detection
        this.inCorruption = false;
        syncZones.forEach(z => {
            if (z.type === 'CORRUPT' && this.x + this.w > z.x && this.x < z.x + z.w) {
                if (z.nested && this.x + this.w > z.nx && this.x < z.nx + z.nw) {
                    this.inCorruption = false;
                } else {
                    this.inCorruption = true;
                    integrity -= 0.25; // Damage while forced to move through corruption
                }
            }
        });

        if (integrity <= 0) gameOver("INTEGRITY DEPLETED - LINK LOST");
    }
    draw() {
        push();
        const isDay = isDayTime();
        if (this.inCorruption) {
            fill('#ef4444');
            drawingContext.shadowBlur = 15;
            drawingContext.shadowColor = '#ef4444';
        } else {
            fill(isDay ? '#0284c7' : '#38bdf8');
        }
        stroke(255);
        strokeWeight(2);
        rect(this.x, this.y - this.h, this.w, this.h, 5);
        if (this.inCorruption) {
            fill(255);
            textAlign(CENTER);
            textSize(10);
            text("NO BRAKES", this.x + this.w/2, this.y - this.h - 5);
        }
        pop();
    }
}

class SyncZone {
    constructor(x) {
        this.x = x;
        this.w = random(350, 700);
        this.active = true;
        this.type = random() > 0.35 ? 'SYNC' : 'CORRUPT';
        this.nested = this.type === 'CORRUPT' && random() > 0.45;
        if (this.nested) {
            this.nw = random(100, 180);
            this.nx_offset = random(50, this.w - this.nw - 50);
        }
    }
    get nx() { return this.x + this.nx_offset; }
    update() { if (player.moving) this.x -= speed; }
    draw() {
        push();
        noStroke();
        if (this.type === 'SYNC') {
            fill(16, 185, 129, 60);
            rect(this.x, 0, this.w, height);
            stroke('#10b981');
            line(this.x, 0, this.x, height);
            line(this.x + this.w, 0, this.x + this.w, height);
        } else {
            fill(239, 68, 68, 80);
            rect(this.x, 0, this.w, height);
            stroke('#ef4444');
            line(this.x, 0, this.x, height);
            line(this.x + this.w, 0, this.x + this.w, height);
            if (this.nested) {
                fill(16, 185, 129, 150);
                rect(this.nx, 0, this.nw, height);
                stroke('#fff');
                line(this.nx, 0, this.nx, height);
                line(this.nx + this.nw, 0, this.nx + this.nw, height);
            }
        }
        pop();
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    roadY = height * 0.7;
    player = new Player();
    video = createCapture(VIDEO);
    video.size(320, 240);
    video.hide();
    tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json").then(m => { model = m; startClassifyLoop(); });
}

function startClassifyLoop() {
    setInterval(async () => {
        if (!model || !video) return;
        try {
            const preds = await model.predict(video.elt);
            preds.sort((a, b) => b.probability - a.probability);
            aiLabel = preds[0].className.toLowerCase();
            handleAI();
        } catch (err) {}
    }, PREDICT_INTERVAL);
}

function handleAI() {
    if (gameState !== 'PLAYING') return;
    if (aiLabel === 'go') player.moving = true;
    if (aiLabel === 'stop' && lastAiLabel !== 'stop' && !player.inCorruption) {
        checkSync();
    }
    lastAiLabel = aiLabel;
}

function checkSync() {
    player.moving = false;
    let hit = false;
    syncZones.forEach(z => {
        if (z.active) {
            if (z.type === 'SYNC' && player.x >= z.x && player.x + player.w <= z.x + z.w) {
                score += 500; integrity = min(100, integrity + 15);
                z.active = false; hit = true; speed = max(6, speed - 2);
            }
            if (z.nested && player.x >= z.nx && player.x + player.w <= z.nx + z.nw) {
                score += 2000; integrity = min(100, integrity + 40);
                z.active = false; hit = true; speed = max(6, speed - 4);
            }
        }
    });
}

function gameOver(reason) {
    gameState = 'GAMEOVER';
    deathReason = reason;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('stopAndGoHighscore', highScore);
    }
}

function draw() {
    const isDay = isDayTime();
    background(isDay ? '#f1f5f9' : '#0a0a0c');
    drawRoad();
    
    if (gameState === 'PLAYING') {
        if (syncZones.length === 0 || syncZones[syncZones.length - 1].x < width) {
            syncZones.push(new SyncZone(width + random(600, 1200)));
        }
        if (frameCount % 180 === 0 && random() > 0.4) {
            hazards.push(new Hazard(width + 200));
        }

        syncZones.forEach(z => {
            z.update();
            if (z.active && z.type === 'SYNC' && z.x + z.w < player.x) {
                integrity -= 15; // Penalty for missing green zones
                z.active = false;
            }
        });
        hazards.forEach(h => h.update());
        player.update();
        syncZones = syncZones.filter(z => z.x + z.w > -100);
        hazards = hazards.filter(h => h.x + h.w > -100);
    }

    syncZones.forEach(z => z.draw());
    hazards.forEach(h => h.draw());
    player.draw();
    drawHUD();
}

function drawRoad() {
    const isDay = isDayTime();
    stroke(isDay ? '#cbd5e1' : '#1e293b');
    strokeWeight(3);
    line(0, roadY, width, roadY);
    if (player.moving) {
        const offset = (frameCount * speed) % 100;
        for (let x = width - offset; x > -100; x -= 100) { line(x, roadY, x - 50, roadY); }
    }
}

function drawHUD() {
    const isDay = isDayTime();
    fill(isDay ? '#0f172a' : '#f8fafc');
    noStroke();
    textSize(24);
    text(`SYNC SCORE: ${Math.floor(score)}`, 30, 50);
    fill(isDay ? '#cbd5e1' : '#1e293b');
    rect(30, 65, 200, 10);
    fill(integrity > 30 ? '#10b981' : '#ef4444');
    rect(30, 65, integrity * 2, 10);
    textSize(14);
    text(`INTEGRITY: ${Math.floor(integrity)}%`, 30, 95);
    text(`PEAK SYNC: ${Math.floor(highScore)}`, 30, 115);
    text(`VELOCITY: ${speed.toFixed(2)}x`, 30, 135);

    push();
    fill(aiLabel === 'go' ? '#10b981' : '#ef4444');
    ellipse(width - 50, 50, 20, 20);
    textAlign(RIGHT);
    fill(isDay ? '#0f172a' : '#f8fafc');
    text(`NEURAL: ${aiLabel.toUpperCase()}`, width - 70, 55);
    if (player.inCorruption) { fill('#ef4444'); text("BRAKES OFFLINE", width - 70, 80); }
    pop();

    if (gameState === 'START') {
        drawOverlay("NEON SPRINT", "OPEN PALM = GO, FIST = STOP.\n\nSTOP IN SYNC ZONES (GREEN).\nDON'T HIT SPIKES (RED) WHILE MOVING.\n\nPress SPACE to Start.");
    } else if (gameState === 'GAMEOVER') {
        drawOverlay("TERMINATED", `${deathReason}\n\nFinal Sync: ${Math.floor(score)}\nPress R to Restart.`);
    }
}

function drawOverlay(title, sub) {
    push();
    fill(0, 210);
    rect(0, 0, width, height);
    textAlign(CENTER);
    fill('#38bdf8');
    textSize(64);
    text(title, width / 2, height / 2 - 50);
    fill(255);
    textSize(20);
    text(sub, width / 2, height / 2 + 40);
    pop();
}

function keyPressed() {
    if (gameState === 'START' && key === ' ') gameState = 'PLAYING';
    if (gameState === 'GAMEOVER' && (key === 'r' || key === 'R')) {
        gameState = 'PLAYING';
        score = 0; speed = 6; syncZones = []; hazards = []; player.reset();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    roadY = height * 0.7;
}
