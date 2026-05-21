/**
 * LIGHT CASCADE: DETAILED EARTH SYSTEM (v4.6)
 * Features:
 * 1. Massive 4000px World Map (Horizontal Scrolling).
 * 2. Multi-Role Miners: Mining, Surface Work, and Diving.
 * 3. Layered Aquatic Realism: Fish and Orcas submerged in semi-transparent water.
 * 4. Seasonal System & Detailed Biometric AI.
 * 5. Natural Terrain Falloff and Seamless Biome Blending.
 */

let entities = [];
let clouds = [];
let stars = [];
let flora = [];
let worldTime = 0;
let camX = 1000; 
const WORLD_WIDTH = 4000;

function setup() {
    createCanvas(windowWidth, windowHeight);
    noCursor();
    
    // stars
    for (let i = 0; i < 400; i++) {
        stars.push({ x: random(WORLD_WIDTH), y: random(height * 0.45), size: random(1, 3) });
    }

    // Clouds
    for (let i = 0; i < 20; i++) clouds.push(new Cloud());

    generateInitialFlora();

    // --- LIFE POPULATION ---
    for (let i = 0; i < 12; i++) entities.push(new Deer(random(500, 3000)));
    for (let i = 0; i < 18; i++) entities.push(new Bird());
    for (let i = 0; i < 10; i++) entities.push(new Miner(random(100, 3400)));
    
    // Aquatic Life (Lake) - strictly below groundY
    for (let i = 0; i < 25; i++) entities.push(new LakeFish(random(3450, 3950), random(height * 0.68, height * 0.75)));
    for (let i = 0; i < 4; i++) entities.push(new LakeApex(random(3500, 3900), height * 0.72));
}

function generateInitialFlora() {
    flora = [];
    for (let x = 0; x <= WORLD_WIDTH; x += 150) {
        if (x < 3000) flora.push(new Plant(random(['Tree', 'Grass']), x, height * 0.65 - 10));
        else if (x > 3450) flora.push(new Plant('Coral', x, height * 0.65 + 50));
    }
}

function draw() {
    // Navigation (Keyboard & Edge Scroll)
    const speed = 15;
    const margin = 100;
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW) || (mouseX < margin && mouseX > 0)) camX -= speed;
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW) || (mouseX > width - margin)) camX += speed;
    camX = constrain(camX, 0, WORLD_WIDTH - width);

    const sunX = mouseX;
    const sunY = mouseY;
    const lightLevel = map(sunY, 0, height, 1, 0); 
    
    const topColor = lerpColor(color('#0a0a0c'), color('#87ceeb'), lightLevel);
    const bottomColor = lerpColor(color('#1a1a20'), color('#e0f2fe'), lightLevel);
    
    background(bottomColor); 
    
    push();
    translate(-camX, 0); 
    
    // 1. Sky & Atmosphere
    drawAtmosphere(lightLevel, topColor, bottomColor);
    
    // 2. Subterranean Base
    drawUnderground(lightLevel);
    
    // 3. Mountains & Surface Terrain
    drawSurface(lightLevel);
    
    // 4. Flora (Land & Sea)
    flora.forEach(f => f.draw(lightLevel));

    // 5. AQUATIC ENTITIES (Drawn UNDER water)
    entities.forEach(ent => {
        if (ent instanceof LakeFish || ent instanceof LakeApex) {
            ent.update(sunX + camX, sunY, lightLevel);
            ent.draw(lightLevel);
        }
    });

    // 6. SEA WATER (With Alpha for depth)
    drawSea(lightLevel);

    // 7. LAND & SKY ENTITIES (Drawn OVER water)
    entities.forEach(ent => {
        if (!(ent instanceof LakeFish) && !(ent instanceof LakeApex)) {
            ent.update(sunX + camX, sunY, lightLevel);
            ent.draw(lightLevel);
        }
    });

    // 8. Clouds
    clouds.forEach(c => {
        c.update();
        c.draw(lightLevel);
    });
    
    pop();

    drawSun(sunX, sunY, lightLevel);
    worldTime += 0.01;
}

function drawAtmosphere(light, topColor, bottomColor) {
    const groundY = height * 0.65;
    for (let i = 0; i < groundY; i += 4) {
        const inter = map(i, 0, groundY, 0, 1);
        stroke(lerpColor(topColor, bottomColor, inter)); strokeWeight(4); line(0, i, WORLD_WIDTH, i);
    }
    if (light < 0.4) {
        fill(255, 255 * (1 - light * 2.5)); noStroke();
        stars.forEach(s => { ellipse(s.x, s.y, s.size, s.size); });
    }
}

function drawSun(sx, sy, light) {
    push(); translate(sx, sy);
    const glowCol = lerpColor(color(255, 255, 255, 50), color(251, 191, 36, 120), light);
    noStroke(); drawingContext.shadowBlur = 60; drawingContext.shadowColor = light > 0.5 ? '#fbbf24' : '#fff';
    fill(glowCol); ellipse(0, 0, 120, 120); fill(255); ellipse(0, 0, 60, 60);
    drawingContext.shadowBlur = 0; pop();
}

function drawSurface(light) {
    const groundY = height * 0.65;
    const season = window.currentSeason || 'SPRING';
    let hillColor, mtColor, sandColor;
    if (season === 'SPRING') { hillColor = color('#86efac'); mtColor = color('#94a3b8'); sandColor = color('#fef3c7'); }
    else if (season === 'SUMMER') { hillColor = color('#22c55e'); mtColor = color('#475569'); sandColor = color('#fde68a'); }
    else if (season === 'AUTUMN') { hillColor = color('#b45309'); mtColor = color('#71717a'); sandColor = color('#d97706'); }
    else { hillColor = color('#f1f5f9'); mtColor = color('#cbd5e1'); sandColor = color('#f8fafc'); }

    // Mountains with falloff (0 - 3000)
    fill(lerpColor(color(20), mtColor, light)); noStroke();
    beginShape(); vertex(0, groundY);
    for (let x = 0; x <= 3000; x += 20) { 
        let falloff = x > 2500 ? map(x, 2500, 3000, 1, 0) : 1;
        vertex(x, groundY - noise(x * 0.005, 50) * 300 * falloff); 
    }
    vertex(3000, groundY); endShape(CLOSE);

    // Hills with falloff
    fill(lerpColor(color(10), hillColor, light));
    beginShape(); vertex(0, groundY);
    for (let x = 0; x <= 3000; x += 15) { 
        let falloff = x > 2800 ? map(x, 2800, 3000, 1, 0) : 1;
        vertex(x, groundY - noise(x * 0.01, 150) * 150 * falloff); 
    }
    vertex(3000, groundY); endShape(CLOSE);

    // BEACH (3000 - 3400)
    fill(lerpColor(color(15), sandColor, light));
    beginShape(); vertex(3000, groundY);
    for (let x = 3000; x <= 3400; x += 30) { vertex(x, groundY - map(x, 3000, 3400, 0, 10)); }
    vertex(3400, groundY + 100); vertex(3000, groundY + 100); endShape(CLOSE);
}

function drawSea(light) {
    const waterColor = lerpColor(color(12, 74, 110, 180), color(56, 189, 248, 180), light);
    const groundY = height * 0.65;
    const seaStart = 3400;
    fill(waterColor); noStroke();
    rect(seaStart, groundY - 20, 600, height - groundY + 20);
    stroke(255, 100); strokeWeight(2);
    for (let x = seaStart; x < WORLD_WIDTH; x += 25) {
        let w = sin(x * 0.1 + worldTime * 4) * 5;
        line(x, groundY - 20 + w, x + 15, groundY - 20 + w);
    }
}

function drawUnderground(light) {
    const dirtColor = lerpColor(color('#0a0a0c'), color('#2d1a10'), 0.3);
    const groundY = height * 0.65;
    fill(dirtColor); noStroke(); rect(0, groundY, WORLD_WIDTH, height - groundY);
    fill(0, 100); rect(1500, groundY, 100, height - groundY); rect(0, height * 0.82, WORLD_WIDTH, 50); 
    for (let i = 0; i < 50; i++) {
        fill(`hsla(${(i * 40)%360}, 100%, 50%, 0.6)`);
        ellipse(noise(i, 500) * WORLD_WIDTH, height * 0.7 + noise(i, 600) * (height * 0.25), 5, 5);
    }
}

// --- CLASSES ---

class Plant {
    constructor(type, x, y) { this.x = x; this.y = y; this.type = type; this.h = random(40, 120); }
    draw(light) {
        const s = window.currentSeason || 'SPRING';
        push(); translate(this.x, this.y);
        if (this.type === 'Tree') {
            const trunk = lerpColor(color(10), color('#4a2b10'), light);
            let leaf = color('#166534');
            if (s === 'SPRING') leaf = color('#f472b6'); else if (s === 'AUTUMN') leaf = color('#ea580c'); else if (s === 'WINTER') leaf = color('#fff');
            fill(trunk); rect(-3, 0, 6, 20); fill(lerpColor(color(5), leaf, light)); noStroke();
            ellipse(0, -15, 30, 30); ellipse(-10, -5, 20, 20); ellipse(10, -5, 20, 20);
        } else if (this.type === 'Coral') {
            fill(lerpColor(color(40, 0, 0), color(255, 100, 100), light)); noStroke();
            rect(-4, 0, 8, -this.h/3); rect(-15, -this.h/6, 30, 6, 2);
        } else { stroke(lerpColor(color(5,15,5), color('#10b981'), light)); strokeWeight(2); line(0, 0, sin(worldTime*2)*3, -15); }
        pop();
    }
}

class Miner {
    constructor(x) { this.x = x; this.y = height * 0.82 + 25; this.tx = random(WORLD_WIDTH); this.ty = this.y; this.gear = 'MINING'; this.isGearingUp = false; this.gearTimer = 0; this.plantTimer = 0; }
    update() {
        const groundY = height * 0.65; const seaStart = 3400;
        if (this.isGearingUp) { if (++this.gearTimer > 120) { this.isGearingUp = false; this.gearTimer = 0; this.gear = (this.x >= 3380 && this.tx > 3400) ? 'DIVING' : 'MINING'; } return; }
        if (abs(this.x - this.tx) < 15) { this.tx = random(WORLD_WIDTH); if (this.tx > seaStart) this.ty = groundY + random(50, 150); else if (random() < 0.5) this.ty = groundY - 15; else this.ty = height * 0.82 + 25; }
        const approachSea = (this.x < 3400 && this.tx > 3400 && abs(this.x - 3400) < 20); const approachLand = (this.x > 3400 && this.tx < 3400 && abs(this.x - 3400) < 20);
        if ((approachSea && this.gear === 'MINING') || (approachLand && this.gear === 'DIVING')) { this.isGearingUp = true; return; }
        this.x += (this.tx - this.x) * 0.015; this.y += (this.ty - this.y) * 0.015;
        if (++this.plantTimer > 400) { this.plantTimer = 0; if (this.gear === 'DIVING') flora.push(new Plant('Coral', this.x, this.y)); else if (this.y < groundY) flora.push(new Plant(random(['Tree', 'Grass']), this.x, this.y)); if (flora.length > 100) flora.shift(); }
    }
    draw(light) {
        push(); translate(this.x, this.y); if (this.isGearingUp) { fill(255, 200, 0, 150); ellipse(0, -10, 40, 40); }
        if (this.gear === 'MINING') { fill(lerpColor(color(20), color(60), light)); rect(-8, -18, 16, 22, 2); fill(30); rect(-10, -5, 20, 4); fill(100); rect(-4, -5, 3, 8); fill(lerpColor(color(30), color(80), light)); rect(-6, -24, 12, 8, 5); fill('#fbbf24'); ellipse(0, -22, 6, 6); }
        else { fill(0, 120, 120); rect(-9, -20, 18, 26, 6); fill(180); rect(-13, -15, 6, 18, 2); rect(7, -15, 6, 18, 2); fill(200, 255, 255, 100); stroke(255, 150); strokeWeight(1); ellipse(0, -22, 20, 20); fill(255, 200); noStroke(); ellipse(5, -26, 5, 5); fill(20); const f = sin(worldTime * 10) * 5; triangle(-8, 5, -15, 15 + f, -2, 15); triangle(8, 5, 15, 15 - f, 2, 15); }
        pop();
    }
}

class Deer {
    constructor(x) { this.x = x; this.vx = random(-1.5, 1.5); this.sleepProgress = 0; this.sleepThreshold = random(0.15, 0.35); }
    update(sx, sy, light) {
        if (light < this.sleepThreshold) { this.sleepProgress = min(1, this.sleepProgress + 0.01); this.vx *= 0.9; } else { this.sleepProgress = max(0, this.sleepProgress - 0.01); }
        if (this.sleepProgress > 0.8) return;
        if (this.sleepProgress < 0.3 && dist(this.x, height * 0.65, sx, sy) < 150) this.vx = (this.x - sx) / 15; else { this.vx *= 0.95; this.vx += random(-0.3, 0.3); }
        this.x += this.vx * (1 - this.sleepProgress); this.x = constrain(this.x, 50, 3350);
    }
    draw(light) {
        const col = lerpColor(color(20), color('#92400e'), light); push(); translate(this.x, height * 0.65 - 30 + (this.sleepProgress * 20)); fill(col); noStroke();
        rect(-25, -15 + (this.sleepProgress * 5), 50, 28 - (this.sleepProgress * 8), 8); push(); translate(this.vx > 0 ? 15 : -35, -20); rotate(this.vx > 0 ? this.sleepProgress * PI/2.5 : -this.sleepProgress * PI/2.5); rect(0, -20, 12, 30, 4); pop();
        if (this.sleepProgress < 0.9) { stroke(col); strokeWeight(5 * (1 - this.sleepProgress)); let m = sin(worldTime * 12) * 10 * (1 - this.sleepProgress); line(-15, 15, -15 + m, 35 - (this.sleepProgress * 20)); line(15, 15, 15 - m, 35 - (this.sleepProgress * 20)); } pop();
    }
}

class LakeFish {
    constructor(x, y) { this.x = x; this.y = y; this.vx = random(1, 3); this.hue = random(180, 240); }
    update() { this.x += this.vx; if (this.x > 3950 || this.x < 3450) this.vx *= -1; this.y += sin(worldTime * 5 + this.x * 0.1) * 1; this.y = constrain(this.y, height * 0.66, height * 0.95); }
    draw(light) { push(); translate(this.x, this.y); fill(`hsl(${Math.floor(this.hue)}, 80%, ${Math.floor(40 + light * 40)}%)`); noStroke(); ellipse(0, 0, 20, 10); triangle(this.vx > 0 ? -10 : 10, 0, this.vx > 0 ? -18 : 18, -6, this.vx > 0 ? -18 : 18, 6); pop(); }
}

class LakeApex {
    constructor(x, y) { this.x = x; this.y = y; this.vx = random(0.5, 1.5); }
    update() { this.x += this.vx; if (this.x > 3900 || this.x < 3500) this.vx *= -1; this.y += sin(worldTime) * 1.5; this.y = constrain(this.y, height * 0.66, height * 0.9); }
    draw(light) { push(); translate(this.x, this.y); fill(20, 20 + light * 40); noStroke(); ellipse(0, 0, 80, 35); triangle(0, -18, -15, -40, 15, -18); pop(); }
}

class Bird {
    constructor() { this.x = random(WORLD_WIDTH); this.y = random(height * 0.1, height * 0.4); this.vx = random(3, 6); }
    update() { this.x += this.vx; if (this.x > WORLD_WIDTH + 100) this.x = -100; this.y += sin(worldTime + this.x * 0.1) * 2; }
    draw(light) { if (light < 0.2) return; stroke(0, 200 * light); strokeWeight(3); noFill(); const f = sin(worldTime * 15) * 15; beginShape(); vertex(this.x - 25, this.y + f); vertex(this.x, this.y); vertex(this.x + 25, this.y + f); endShape(); }
}

class Cloud {
    constructor() { this.x = random(WORLD_WIDTH); this.y = random(50, 180); this.w = random(150, 300); this.s = random(0.3, 1.2); }
    update() { this.x += this.s; if (this.x > WORLD_WIDTH + 200) this.x = -200; }
    draw(light) { noStroke(); fill(255, 180 * light); ellipse(this.x, this.y, this.w, this.w * 0.5); }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
