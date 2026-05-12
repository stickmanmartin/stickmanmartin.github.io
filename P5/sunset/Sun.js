/**
 * LIGHT CASCADE: HIGH-DETAIL WORLD ENGINE (v2.3)
 * Features:
 * 1. 6000x6000px Scrollable World [WASD / Arrows]
 * 2. Dynamic ZOOM [Scroll Wheel]
 * 3. Continuous Circadian Lighting (Sun locked to Cursor)
 * 4. High-Detail Biometric Entities (Orcas, Deer, Rats, Birds)
 * 5. Multi-Tier Biomes: Space, Ocean, Beach, Plains, Jungle, Core
 */

let camX = 3000, camY = 3000;
let zoom = 1.0;
let entities = [];
let clouds = [];
let stars = [];
let worldTime = 0;

const WORLD_WIDTH = 6000;
const WORLD_HEIGHT = 6000;
const HORIZON_Y = 3800;

function setup() {
    createCanvas(windowWidth, windowHeight);
    noCursor();
    
    // Init Space Elements
    for (let i = 0; i < 200; i++) {
        stars.push({ x: random(WORLD_WIDTH), y: random(-3000, 0), size: random(1, 4) });
    }

    // Init Clouds
    for (let i = 0; i < 20; i++) {
        clouds.push(new Cloud(random(WORLD_WIDTH), random(500, 2500)));
    }

    generateLife();
}

function generateLife() {
    entities = [];
    // --- OCEAN LIFE ---
    for (let i = 0; i < 50; i++) entities.push(new Fish(random(0, 1800), random(4000, 5500)));
    for (let i = 0; i < 8; i++) entities.push(new Orca(random(0, 1500), random(4200, 5200)));
    for (let i = 0; i < 5; i++) entities.push(new Whale(random(0, 1400), random(4500, 5400)));
    for (let i = 0; i < 6; i++) entities.push(new Shark(random(0, 1600), random(4100, 5300)));

    // --- LAND LIFE ---
    for (let i = 0; i < 20; i++) entities.push(new Deer(random(2200, 5800), HORIZON_Y));
    
    // --- SUBTERRANEAN ---
    for (let i = 0; i < 15; i++) entities.push(new Mole(random(1500, 4500), random(4200, 5500)));
    for (let i = 0; i < 30; i++) entities.push(new Rat(random(1500, 4500), random(4000, 5400)));

    // --- SKY ---
    for (let i = 0; i < 40; i++) entities.push(new Bird(random(WORLD_WIDTH), random(500, 3000)));
}

function draw() {
    // Camera Control (Speed adjusted for zoom)
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) camY -= 25 / zoom;
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) camY += 25 / zoom;
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) camX -= 25 / zoom;
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) camX += 25 / zoom;
    
    camX = constrain(camX, 0, WORLD_WIDTH);
    camY = constrain(camY, -3000, WORLD_HEIGHT);

    // Dynamic Lighting Calculation (Continuous)
    const lightLevel = map(mouseY, 0, height, 1, 0); 
    
    // Background Clear
    const bgCol = lerpColor(color('#0a0a0c'), color('#87ceeb'), lightLevel);
    background(bgCol); 

    // Calculate World Coordinates for Sun (Adjusted for Zoom)
    const sunWorldX = (mouseX - width/2) / zoom + camX;
    const sunWorldY = (mouseY - height/2) / zoom + camY;

    push();
    translate(width/2, height/2);
    scale(zoom);
    translate(-camX, -camY);
    
    drawWorldLayers(lightLevel);
    
    entities.forEach(e => {
        e.update();
        e.draw(lightLevel);
    });

    clouds.forEach(c => {
        c.update();
        c.draw(lightLevel);
    });
    
    // Draw Sun in World Space
    drawSun(sunWorldX, sunWorldY, lightLevel);
    pop();

    drawHUD();
    worldTime += 0.01;
}

function drawWorldLayers(light) {
    noStroke();
    
    // 1. SPACE & ATMOSPHERE
    fill(0); rect(0, -3000, WORLD_WIDTH, 3000);
    let skyDay = color('#87ceeb');
    let skyNight = color('#0f172a');
    let currentSky = lerpColor(skyNight, skyDay, light);
    
    for(let i=0; i<8; i++) {
        fill(lerpColor(color(0), currentSky, (i+1)/8));
        rect(0, -3000 + (i*450), WORLD_WIDTH, 455);
    }

    // 2. STARS (Only at night)
    if (light < 0.4) {
        fill(255, 255 * (1 - light * 2.5));
        stars.forEach(s => { ellipse(s.x, s.y, s.size, s.size); });
    }

    // 3. TERRAIN
    const groundY = HORIZON_Y;
    
    // Under-surface fill
    const dirtNight = color('#0a0a0c');
    const dirtDay = color('#2d1a10');
    fill(lerpColor(dirtNight, dirtDay, 0.3));
    rect(0, groundY, WORLD_WIDTH, 3000);

    // Core
    fill(153, 27, 27);
    rect(0, WORLD_HEIGHT - 600, WORLD_WIDTH, 600);

    // Biometric Surface
    for (let x = 0; x <= WORLD_WIDTH; x += 60) {
        let h = 0;
        let terrainCol;
        
        if (x < 1800) { // Ocean
            terrainCol = lerpColor(color('#0c4a6e'), color('#38bdf8'), light);
            h = -20;
        } else if (x < 2200) { // Beach
            const sea = lerpColor(color('#0c4a6e'), color('#38bdf8'), light);
            const sand = lerpColor(color('#2a1a0a'), color('#fde68a'), light);
            terrainCol = lerpColor(sea, sand, map(x, 1800, 2200, 0, 1));
            h = map(x, 1800, 2200, -20, 0);
        } else if (x < 4500) { // Plains
            terrainCol = lerpColor(color('#061d12'), color('#22c55e'), light);
            h = noise(x * 0.005, 10) * 200;
        } else { // Jungle
            terrainCol = lerpColor(color('#052e16'), color('#064e3b'), light);
            h = noise(x * 0.01, 20) * 150 + 50;
        }

        fill(terrainCol);
        rect(x, groundY - h, 65, WORLD_HEIGHT);
    }
}

function drawSun(sx, sy, light) {
    push();
    translate(sx, sy);
    scale(1/zoom); // Maintain visual size of sun relative to viewport
    const sunCol = lerpColor(color('#ffffff'), color('#fbbf24'), light);
    const glowColor = lerpColor(color(255, 255, 255, 50), color(251, 191, 36, 120), light);
    
    noStroke();
    drawingContext.shadowBlur = 60;
    drawingContext.shadowColor = light > 0.5 ? '#fbbf24' : '#fff';
    
    fill(glowColor);
    ellipse(0, 0, 150, 150);
    fill(255);
    ellipse(0, 0, 70, 70);
    
    drawingContext.shadowBlur = 0;
    pop();
}

function drawHUD() {
    const isDay = mouseY < height/2;
    fill(isDay ? 0 : 255);
    noStroke();
    textSize(14);
    text(`DRIVE_STATUS: [X:${Math.floor(camX)}, Y:${Math.floor(camY)}] | ZOOM: ${zoom.toFixed(2)}x | WASD_NAV | SCROLL_ZOOM`, 20, height - 30);
}

function mouseWheel(event) {
    if (event.delta > 0) {
        zoom = max(0.1, zoom - 0.05);
    } else {
        zoom = min(4.0, zoom + 0.05);
    }
    return false;
}

// --- LIFEFORMS ---

class Fish {
    constructor(x, y) { this.x = x; this.y = y; this.speed = random(2, 4); this.hue = random(180, 240); }
    update() { this.x += this.speed; if (this.x > 1800) this.x = -50; this.y += sin(worldTime * 2 + this.x * 0.1) * 2; }
    draw(light) {
        push(); translate(this.x, this.y); 
        const col = color(`hsl(${Math.floor(this.hue)}, 80%, ${Math.floor(40 + light * 40)}%)`);
        fill(col); ellipse(0, 0, 25, 12); triangle(-12, 0, -22, -8, -22, 8); 
        pop();
    }
}

class Orca {
    constructor(x, y) { this.x = x; this.y = y; this.speed = random(3, 6); }
    update() { this.x += this.speed; if (this.x > 1800) this.x = -200; this.y += sin(worldTime + this.x * 0.05) * 3; }
    draw(light) {
        push(); translate(this.x, this.y); 
        fill(lerpColor(color(0), color(40), light));
        ellipse(0, 0, 110, 45); 
        fill(255, 255 * light); ellipse(35, -10, 25, 12); // Patch
        fill(lerpColor(color(0), color(40), light)); triangle(0, -20, -15, -45, 15, -20); // Fin
        ellipse(-55, 0, 30, 40); pop();
    }
}

class Whale {
    constructor(x, y) { this.x = x; this.y = y; this.speed = random(1, 2.5); }
    update() { this.x += this.speed; if (this.x > 1800) this.x = -350; this.y += sin(worldTime * 0.5) * 1.5; }
    draw(light) {
        push(); translate(this.x, this.y); fill(lerpColor(color(20), color(100, 110, 140), light));
        ellipse(0, 0, 220, 85); ellipse(-110, 0, 55, 65); pop();
    }
}

class Shark {
    constructor(x, y) { this.x = x; this.y = y; this.speed = random(5, 8); }
    update() { this.x += this.speed; if (this.x > 1800) this.x = -150; }
    draw(light) {
        push(); translate(this.x, this.y); fill(lerpColor(color(30), color(120), light));
        ellipse(0, 0, 90, 35); triangle(0, -18, -25, -45, 25, -18); triangle(-45, 0, -60, -18, -60, 18); pop();
    }
}

class Deer {
    constructor(x, baseLine) { this.x = x; this.baseLine = baseLine; this.vx = random(-2, 2); this.isSleeping = false; }
    update() {
        if (mouseY > height * 0.7) { this.isSleeping = true; this.vx *= 0.9; } else { this.isSleeping = false; }
        this.x += this.vx; if(random() < 0.01) this.vx *= -1; 
        this.x = constrain(this.x, 2200, 5800);
    }
    draw(light) {
        push(); translate(this.x, this.baseLine - 30);
        const col = lerpColor(color('#1a1a1a'), color('#92400e'), light);
        fill(col); noStroke();
        if (this.isSleeping) { ellipse(0, 20, 40, 20); } 
        else {
            rect(-25, -15, 50, 30, 8); rect(this.vx > 0 ? 15 : -35, -40, 12, 30, 4);
            stroke(col); strokeWeight(5); let m = sin(worldTime * 10) * 12;
            line(-15, 15, -15 + m, 35); line(15, 15, 15 - m, 35);
        }
        pop();
    }
}

class Mole {
    constructor(x, y) { this.x = x; this.y = y; this.vx = random(-0.8, 0.8); }
    update() { this.x += this.vx; if(abs(this.x) > WORLD_WIDTH) this.vx *= -1; }
    draw(light) {
        push(); translate(this.x, this.y); fill(lerpColor(color(20), color(70), 0.5));
        ellipse(0, 0, 35, 22); fill(255, 180, 180); ellipse(this.vx > 0 ? 18 : -18, 0, 10, 10); pop();
    }
}

class Rat {
    constructor(x, y) { this.x = x; this.y = y; this.vx = random(-2.5, 2.5); }
    update() { this.x += this.vx; if(this.x > 4500) this.x = 1500; }
    draw(light) {
        push(); translate(this.x, this.y); fill(lerpColor(color(10), color(90), 0.5));
        ellipse(0, 0, 38, 18); fill(255, 0, 0); ellipse(this.vx > 0 ? 16 : -16, -2, 4, 4);
        stroke(80); line(this.vx > 0 ? -18 : 18, 0, this.vx > 0 ? -40 : 40, 6); pop();
    }
}

class Bird {
    constructor(x, y) { this.x = x; this.y = y; this.vx = random(5, 12); }
    update() { this.x += this.vx; if(this.x > WORLD_WIDTH) this.x = -100; }
    draw(light) {
        if(light < 0.2) return;
        stroke(0, 200 * light); strokeWeight(3); noFill();
        let flap = sin(worldTime * 18) * 15;
        beginShape(); vertex(this.x - 30, this.y + flap); vertex(this.x, this.y); vertex(this.x + 30, this.y + flap); endShape();
    }
}

class Cloud {
    constructor(x, y) { this.x = x; this.y = y; this.w = random(180, 350); this.speed = random(0.5, 2.5); }
    update() { this.x += this.speed; if(this.x > WORLD_WIDTH) this.x = -400; }
    draw(light) {
        noStroke(); fill(255, 200 * light);
        ellipse(this.x, this.y, this.w, this.w * 0.5);
        ellipse(this.x + 50, this.y - 30, this.w * 0.9, this.w * 0.7);
    }
}

class SpaceLife {
    constructor(type, x, y) { this.x = x; this.y = y; this.size = random(300, 600); this.color = color(random(50, 255), random(50, 255), random(150, 255)); }
    update() {}
    draw(light) {
        if(light > 0.6) return;
        push(); translate(this.x, this.y); fill(this.color);
        ellipse(0, 0, this.size, this.size);
        noFill(); stroke(255, 120); strokeWeight(5);
        ellipse(0, 0, this.size * 1.6, this.size * 0.25); pop();
    }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
