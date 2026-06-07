/**
 * LIGHT CASCADE: DETAILED EARTH SYSTEM (v5.1)
 * Features:
 * 1. 3-Level Glass Elevator (Sky, Ground, Mines).
 * 2. Multi-Role AI (Miners, Scientists, Divers).
 * 3. 3 Gear Stations with 300px "Industrial Plazas" (Zero Trees).
 * 4. Interactive Seasonal HUD (Clickable UI).
 * 5. Realistic Boarding & Climbing Animations.
 */

let entities = [];
let clouds = [];
let stars = [];
let flora = [];
let bloodParticles = []; 
let weatherParticles = []; 
let elevator; 
let changingStations = []; 
let crystals = [];
let worldTime = 0;
let seasonTime = 0; 
let autoSeason = true; 
let camX = 1000; 
const WORLD_WIDTH = 4000;

// --- HELPERS ---

class BloodParticle {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.vx = random(-2, 2); this.vy = random(-1, 2);
        this.life = 255; this.size = random(4, 8);
    }
    update() { this.x += this.vx; this.y += this.vy; this.vy += 0.05; this.life -= 2; }
    draw() { noStroke(); fill(200, 0, 0, this.life); ellipse(this.x, this.y, this.size, this.size); }
}

class WeatherParticle {
    constructor(type, x) {
        this.type = type; this.x = x; this.y = -50;
        this.vx = type === 'Snow' ? random(-1, 1) : 0;
        this.vy = type === 'Snow' ? random(1, 3) : type === 'Hail' ? random(8, 12) : random(12, 18);
        this.size = type === 'Snow' ? random(3, 6) : type === 'Hail' ? random(4, 7) : 1;
        this.isDead = false;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        if (this.type === 'Snow') this.vx += sin(worldTime * 2 + this.y * 0.01) * 0.1;
        let gy = getGroundY(this.x);
        if (this.y > gy || this.y > height) this.isDead = true;
    }
    draw() {
        push();
        if (this.type === 'Rain') { stroke(100, 180, 255, 180); strokeWeight(1); line(this.x, this.y, this.x, this.y + 12); } 
        else if (this.type === 'Snow') { noStroke(); fill(255, 220); ellipse(this.x, this.y, this.size, this.size); } 
        else if (this.type === 'Hail') { noStroke(); fill(200, 220, 255); ellipse(this.x, this.y, this.size, this.size); }
        pop();
    }
}

function getGroundY(x) {
    const groundY = height * 0.65;
    if (x < 3000) return groundY; 
    if (x <= 3380) return groundY + map(x, 3000, 3380, 0, 15); 
    if (x <= 3600) return groundY + map(x, 3381, 3600, 15, 300); 
    return groundY + map(x, 3601, WORLD_WIDTH, 300, height - groundY + 50); 
}

class Elevator {
    constructor(x) {
        this.x = x; this.w = 150; 
        this.groundY = height * 0.65;
        this.tunnelY = height * 0.82 + 25;
        this.skyY = height * 0.25;
        this.y = this.groundY; this.targetY = this.groundY;
        this.queue = []; this.state = 'IDLE'; 
        this.speed = 5; this.doorOpen = 0; this.waitTimer = 0;
    }
    call(targetLevel) { if (!this.queue.includes(targetLevel)) this.queue.push(targetLevel); }
    update() {
        if (this.state === 'IDLE') {
            if (this.waitTimer > 0) { this.waitTimer--; this.doorOpen = lerp(this.doorOpen, 1, 0.1); } 
            else {
                this.doorOpen = lerp(this.doorOpen, 0, 0.1);
                if (this.queue.length > 0 && this.doorOpen < 0.05) { this.targetY = this.queue.shift(); this.state = 'MOVING'; }
            }
        } else if (this.state === 'MOVING') {
            this.doorOpen = lerp(this.doorOpen, 0, 0.1);
            if (abs(this.y - this.targetY) > 2) this.y += Math.sign(this.targetY - this.y) * this.speed;
            else { this.y = this.targetY; this.state = 'IDLE'; this.waitTimer = 100; }
        }
    }
    draw(light) {
        push();
        const sx = this.x; const sw = this.w;
        const topLimit = this.skyY - 100; const botLimit = this.tunnelY + 150;
        stroke(lerpColor(color(10), color(40), light)); strokeWeight(8);
        line(sx + 10, topLimit, sx + 10, botLimit); line(sx + sw - 10, topLimit, sx + sw - 10, botLimit);
        fill(lerpColor(color(15), color(45), light)); noStroke();
        rect(sx - 30, topLimit, 30, botLimit - topLimit, 5); rect(sx + sw, topLimit, 30, botLimit - topLimit, 5);
        translate(this.x, this.y);
        fill(lerpColor(color(5), color(20), light)); noStroke(); rect(5, -60, sw - 10, 60, 2); 
        entities.forEach(ent => {
            if (ent instanceof Miner && (ent.isRidingElevator || (ent.isWaitingForElevator && ent.depth > 0 && abs(ent.y - this.y) < 50))) {
                push(); let ox = ent.isRidingElevator ? ent.rideOffsetX : (ent.x - this.x);
                translate(ox, -2 - ent.depth); let sc = map(ent.depth, 0, 15, 1, 0.85); scale(sc);
                ent.drawRiding(light); pop();
            }
        });
        fill(100, 200, 255, 30); rect(15, -50, sw - 30, 40, 4); 
        noFill(); stroke(lerpColor(color(20), color(60), light)); strokeWeight(4); rect(5, -60, sw - 10, 60, 2); 
        fill(lerpColor(color(30), color(80), light)); noStroke(); rect(0, 0, sw, 10, 2); rect(5, -65, sw - 10, 8, 2); 
        let dMaxW = (sw/2) - 10; let dW = dMaxW * (1 - this.doorOpen);
        fill(100, 220, 255, 50); stroke(255, 100); strokeWeight(1);
        rect(10, -58, dW, 58, 2); rect(sw - 10 - dW, -58, dW, 58, 2);
        if (dW > 5) { stroke(255, 30); line(12, -50, 12 + dW/2, -10); line(sw - 12 - dW/2, -50, sw - 12, -10); }
        pop();
        this.drawIndicator(this.x - 45, this.skyY - 20, light);
        this.drawIndicator(this.x - 45, this.groundY - 20, light);
        this.drawIndicator(this.x - 45, this.tunnelY - 20, light);
    }
    drawIndicator(ix, iy, light) {
        push(); translate(ix, iy); fill(20); rect(0, 0, 15, 30, 2);
        if (this.state === 'MOVING') { fill(255, 150, 0); if (this.targetY < this.y) triangle(3, 10, 12, 10, 7.5, 3); else triangle(3, 20, 12, 20, 7.5, 27); } 
        else { fill(0, 200, 50); ellipse(7.5, 15, 8, 8); } pop();
    }
}

class Plant {
    constructor(type, x, y, isSeedling = false) { 
        this.x = x; this.y = y; this.type = type; 
        this.maxH = type === 'Tree' ? random(80, 160) : random(40, 120); 
        this.h = isSeedling ? 10 : this.maxH; this.growthRate = random(0.005, 0.015);
    }
    update() { if (this.h < this.maxH) this.h += this.growthRate; }
    draw(light) {
        const s = window.currentSeason || 'SPRING';
        push(); translate(this.x, this.y);
        if (this.type === 'Tree') {
            const trunk = lerpColor(color(10), color('#4a2b10'), light);
            let leaf = color('#166534');
            if (s === 'SPRING') leaf = color('#f472b6'); else if (s === 'AUTUMN') leaf = color('#ea580c'); else if (s === 'WINTER') leaf = color('#fff');
            fill(trunk); noStroke(); rect(-6, 0, 12, -this.h * 0.4); 
            fill(lerpColor(color(5), leaf, light)); push(); translate(0, -this.h * 0.4);
            ellipse(0, -this.h * 0.3, this.h * 0.7, this.h * 0.7); ellipse(-this.h * 0.2, -this.h * 0.1, this.h * 0.5, this.h * 0.5); ellipse(this.h * 0.2, -this.h * 0.1, this.h * 0.5, this.h * 0.5); pop();
        } else if (this.type === 'Coral') {
            fill(lerpColor(color(40, 0, 0), color(255, 100, 100), light)); noStroke();
            rect(-4, 0, 8, -this.h/3); rect(-15, -this.h/6, 30, 6, 2);
        } else { stroke(lerpColor(color(5,15,5), color('#10b981'), light)); strokeWeight(2); line(0, 0, sin(worldTime*2)*3, -this.h * 0.15); }
        pop();
    }
}

class ChangingStation {
    constructor(x) { this.x = x; this.y = getGroundY(x); this.w = 120; this.h = 80; }
    draw(light) {
        push(); translate(this.x, this.y);
        // Concrete Plaza (Paving)
        fill(lerpColor(color(5), color(30), light)); noStroke();
        rect(-150, -5, this.w + 300, 10, 5); 
        // Building
        fill(lerpColor(color(10), color(40), light)); rect(-10, -5, this.w + 20, 15, 2);
        fill(lerpColor(color(20), color(60), light)); rect(0, -this.h, this.w, this.h, 5);
        fill(lerpColor(color(10), color(30), light)); beginShape(); vertex(-10, -this.h); vertex(this.w + 10, -this.h); vertex(this.w - 10, -this.h - 20); vertex(10, -this.h - 20); endShape(CLOSE);
        fill(100, 200, 255, 150 * light + 20); rect(15, -60, 25, 20, 2); rect(this.w - 40, -60, 25, 20, 2);
        fill(10); rect(this.w/2 - 15, -40, 30, 40, 2);
        textAlign(CENTER); textSize(8); fill(255, 200 * light + 50); text("GEAR STATION", this.w/2, -this.h - 5);
        stroke(180); strokeWeight(2); push(); translate(30, -35); rotate(-QUARTER_PI); line(0, -10, 0, 10); stroke(255, 200, 0); arc(0, -10, 20, 10, PI, TWO_PI); pop();
        noStroke(); fill(0, 255, 150, 150); push(); translate(60, -35); rect(-4, -10, 8, 5); ellipse(0, 0, 15, 15); fill(255, 100); rect(-3, -8, 6, 2); pop();
        fill(100, 150, 255, 150); push(); translate(90, -35); arc(0, 0, 18, 18, PI, TWO_PI); rect(-9, 0, 18, 5, 2); fill(255, 200); ellipse(0, -5, 8, 8); pop();
        pop();
    }
}

class Miner {
    constructor(x) { 
        this.x = x; this.y = height * 0.82 + 25; this.tx = random(WORLD_WIDTH); this.ty = this.y; 
        this.gear = 'MINING'; this.targetGear = 'MINING'; this.isGearingUp = false; 
        this.gearTimer = 0; this.plantTimer = 0; this.speed = random(1.5, 3);
        this.isRidingElevator = false; this.isWaitingForElevator = false; this.rideOffsetX = 0;
        this.state = 'ALIVE'; this.diveProgress = 0; this.climbProgress = 0; this.depth = 0; this.deathTimer = 0; this.isDead = false;
    }

    update() {
        if (this.isDead) return;
        if (this.state === 'DYING') {
            this.deathTimer++; this.y += 0.5; this.x += sin(worldTime * 20) * 1.5; 
            if (this.deathTimer % 5 === 0) bloodParticles.push(new BloodParticle(this.x, this.y));
            if (this.deathTimer > 180) this.isDead = true; return;
        }
        if (this.state === 'DIVING_ANIM') {
            this.diveProgress += 0.05; this.x += 3; this.y = (this.ty - 60 * sin(this.diveProgress * PI)) + (this.diveProgress * 80);
            if (this.diveProgress >= 1) { this.state = 'ALIVE'; this.y = height * 0.65 + 50; } return;
        }
        if (this.state === 'CLIMBING_ANIM') {
            this.climbProgress += 0.015; this.y = lerp(this.climbStartY, height * 0.65 - 15, this.climbProgress);
            this.x = 3380 - sin(this.climbProgress * PI * 6) * 4; 
            if (this.climbProgress >= 1) { this.state = 'ALIVE'; this.y = height * 0.65 - 15; this.x = 3370; } return;
        }

        const gY = height * 0.65; const tY = height * 0.82 + 25; const sY = height * 0.25; const sea = 3380;
        const isUnderwater = this.gear === 'DIVING' && this.y > gY + 30;

        if (this.gear === 'DIVING' && !isUnderwater) {
            entities.forEach(ent => { if (ent instanceof LakeApex && dist(this.x, this.y, ent.x, ent.y) < 60) if (random() < 0.05) this.state = 'DYING'; });
            if (this.state === 'DYING') return;
        }

        if (this.isGearingUp) { 
            if (++this.gearTimer > 40) { this.isGearingUp = false; this.gearTimer = 0; this.gear = this.targetGear; if (this.gear === 'DIVING') { this.state = 'DIVING_ANIM'; this.diveProgress = 0; this.ty = this.y; } } 
            return; 
        }

        if (this.isRidingElevator) {
            this.x = elevator.x + this.rideOffsetX; this.y = elevator.y - 5; 
            if (elevator.state === 'IDLE' && abs(elevator.y - this.ty) < 10) { if (this.depth > 0) this.depth -= 0.6; else { this.isRidingElevator = false; this.isWaitingForElevator = false; this.y = this.ty; } } return;
        }

        if (abs(this.x - this.tx) < 20) { 
            this.tx = random(WORLD_WIDTH); 
            if (this.tx > sea) { this.ty = gY + random(100, 300); this.targetGear = 'DIVING'; } 
            else {
                let r = random(); if (r < 0.2) { this.ty = sY - 15; this.targetGear = 'SCIENTIST'; }
                else if (r < 0.5) { this.ty = gY - 15; this.targetGear = random() < 0.6 ? 'SCIENTIST' : 'MINING'; }
                else { this.ty = tY; this.targetGear = 'MINING'; }
            }
        }

        const curL = abs(this.y - tY) < 40 ? tY : (abs(this.y - sY) < 40 ? sY : gY);
        const tarL = abs(this.ty - tY) < 40 ? tY : (abs(this.ty - sY) < 40 ? sY : gY);

        if (this.gear !== this.targetGear) {
            if (isUnderwater) {
                let dxToClimb = 3380 - this.x; if (abs(dxToClimb) > 5) this.x += Math.sign(dxToClimb) * this.speed;
                else { this.state = 'CLIMBING_ANIM'; this.climbProgress = 0; this.climbStartY = this.y; } return;
            }
            if (curL !== gY) {
                let dx = (elevator.x + elevator.w/2) - this.x;
                if (abs(dx) > 5 && !this.isWaitingForElevator) this.x += Math.sign(dx) * this.speed;
                else {
                    this.isWaitingForElevator = true; elevator.call(curL); elevator.call(gY);
                    if (elevator.state === 'IDLE' && abs(elevator.y - curL) < 20 && elevator.doorOpen > 0.8) {
                        let tXIn = elevator.x + random(30, elevator.w - 30); let dXIn = tXIn - this.x;
                        if (abs(dXIn) > 2 || this.depth < 12) { if (abs(dXIn) > 2) this.x += Math.sign(dXIn) * 1.2; if (this.depth < 12) this.depth += 0.4; } 
                        else { this.isRidingElevator = true; this.isWaitingForElevator = false; this.rideOffsetX = this.x - elevator.x; this.ty = gY; }
                    }
                }
            } else {
                let nearestStation = changingStations.reduce((prev, curr) => (abs(curr.x - this.x) < abs(prev.x - this.x) ? curr : prev));
                let dx = (nearestStation.x + 60) - this.x; if (abs(dx) > 10) { this.x += Math.sign(dx) * this.speed; this.y = getGroundY(this.x) - 15; } else this.isGearingUp = true;
            } return;
        }

        if (tarL !== curL && !isUnderwater && this.tx < sea && this.x < sea) {
            let dx = (elevator.x + elevator.w/2) - this.x;
            if (abs(dx) > 5 && !this.isWaitingForElevator) this.x += Math.sign(dx) * this.speed;
            else {
                this.isWaitingForElevator = true; elevator.call(curL); elevator.call(tarL);
                if (elevator.state === 'IDLE' && abs(elevator.y - curL) < 20 && elevator.doorOpen > 0.8) {
                    let tXIn = elevator.x + random(30, elevator.w - 30); let dXIn = tXIn - this.x;
                    if (abs(dXIn) > 2 || this.depth < 12) { if (abs(dXIn) > 2) this.x += Math.sign(dXIn) * 1.2; if (this.depth < 12) this.depth += 0.4; } 
                    else { this.isRidingElevator = true; this.isWaitingForElevator = false; this.rideOffsetX = this.x - elevator.x; }
                }
            }
            if (!this.isRidingElevator && !this.isWaitingForElevator && curL === gY) this.y = getGroundY(this.x) - 15; return;
        }

        let dxMove = this.tx - this.x;
        if (abs(dxMove) > 1) {
            const nextX = this.x + Math.sign(dxMove) * this.speed;
            if (curL === sY) this.x = constrain(nextX, elevator.x - 50, elevator.x + elevator.w + 200);
            else if (this.gear === 'DIVING' || nextX < sea) this.x = nextX; else this.tx = random(0, sea - 50);
        }
        if (this.gear === 'DIVING') {
            let dy = this.ty - this.y; if (abs(dy) > 1) this.y += Math.sign(dy) * 2;
            let gy = getGroundY(this.x); this.y = constrain(this.y, gY + 10, gy - 15);
        } else if (curL === gY) this.y = getGroundY(this.x) - 15;

        if (++this.plantTimer > 400) { 
            this.plantTimer = 0; if (this.gear === 'DIVING') flora.push(new Plant('Coral', this.x, this.y, true)); 
            else if (this.gear !== 'SCIENTIST') {
                let gy = getGroundY(this.x); let nearS = changingStations.some(cs => abs(cs.x + 60 - this.x) < 300);
                if (this.x < 3380 && !nearS) flora.push(new Plant((this.x > 3000 ? 'Grass' : random(['Tree', 'Grass'])), this.x, gy - 5, true));
            }
            if (flora.length > 400) flora.shift(); 
        }
    }

    draw(light) {
        if (this.isDead || this.isRidingElevator || this.isGearingUp) return;
        const eY = (abs(this.y - elevator.tunnelY) < 50) ? elevator.tunnelY : (abs(this.y - elevator.skyY) < 50 ? elevator.skyY : elevator.groundY);
        if (this.isWaitingForElevator && this.depth > 0 && abs(this.y - eY) < 30) return;
        this.drawRiding(light);
    }

    drawRiding(light) {
        push(); translate(this.x, this.y); 
        if (this.state === 'DYING') rotate(sin(worldTime * 25) * 0.4);
        if (this.state === 'DIVING_ANIM') rotate(this.diveProgress * PI);
        if (this.state === 'CLIMBING_ANIM') rotate(sin(worldTime * 15) * 0.2);
        if (light < 0.6) {
            let bCol = this.gear === 'SCIENTIST' ? color(100, 255, 255, 80) : color(255, 255, 200, 80);
            push(); translate(0, -22); let bD = (this.tx > this.x) ? 1 : -1; if (this.isRidingElevator) bD = 0;
            noStroke(); fill(bCol); drawingContext.shadowBlur = 30; drawingContext.shadowColor = bCol;
            if (bD !== 0) { beginShape(); vertex(bD * 5, 0); vertex(bD * 120, -40); vertex(bD * 120, 40); endShape(CLOSE); } 
            else { ellipse(0, 0, 40, 40); } pop();
        }
        if (this.gear === 'MINING') { fill(lerpColor(color(20), color(60), light)); rect(-8, -18, 16, 22, 2); fill(30); rect(-10, -5, 20, 4); fill(100); rect(-4, -5, 3, 8); fill(lerpColor(color(30), color(80), light)); rect(-6, -24, 12, 8, 5); fill('#fbbf24'); ellipse(0, -22, 6, 6); }
        else if (this.gear === 'SCIENTIST') { fill(240); rect(-8, -18, 16, 22, 2); fill(lerpColor(color(100, 150, 255), color(200, 230, 255), light)); rect(-6, -24, 12, 8, 5); fill(20); rect(-4, -10, 8, 2); }
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
    update() { this.x += this.vx; if (this.x > 3950 || this.x < 3450) this.vx *= -1; this.y += sin(worldTime * 5 + this.x * 0.1) * 1; this.y = constrain(this.y, height * 0.66, height - 50); }
    draw(light) { push(); translate(this.x, this.y); fill(`hsl(${Math.floor(this.hue)}, 80%, ${Math.floor(40 + light * 40)}%)`); noStroke(); ellipse(0, 0, 20, 10); triangle(this.vx > 0 ? -10 : 10, 0, this.vx > 0 ? -18 : 18, -6, this.vx > 0 ? -18 : 18, 6); pop(); }
}

class LakeApex {
    constructor(x, y) { this.x = x; this.y = y; this.vx = random(0.5, 1.5); }
    update() { this.x += this.vx; if (this.x > 3900 || this.x < 3500) this.vx *= -1; this.y += sin(worldTime) * 1.5; this.y = constrain(this.y, height * 0.66, height - 100); }
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

class Crystal {
    constructor(x, y) { this.x = x; this.y = y; this.hue = random(360); this.size = random(5, 12); this.rotation = random(TWO_PI); this.sparkle = random(TWO_PI); }
    draw() {
        push(); translate(this.x, this.y); rotate(this.rotation);
        let s = this.size + sin(worldTime * 3 + this.sparkle) * 1.5;
        drawingContext.shadowBlur = 15; drawingContext.shadowColor = `hsla(${this.hue}, 100%, 50%, 0.8)`;
        fill(`hsla(${this.hue}, 80%, 60%, 0.8)`); noStroke();
        beginShape(); vertex(0, -s); vertex(s * 0.6, -s * 0.2); vertex(s * 0.4, s * 0.8); vertex(0, s); vertex(-s * 0.4, s * 0.8); vertex(-s * 0.6, -s * 0.2); endShape(CLOSE);
        fill(255, 150); beginShape(); vertex(0, -s); vertex(s * 0.3, -s * 0.1); vertex(0, s * 0.3); endShape(CLOSE);
        drawingContext.shadowBlur = 0; pop();
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight); noCursor();
    for (let i = 0; i < 400; i++) stars.push({ x: random(WORLD_WIDTH), y: random(height * 0.45), size: random(1, 3) });
    elevator = new Elevator(1550);
    changingStations = [new ChangingStation(400), new ChangingStation(1800), new ChangingStation(3250)]; 
    for (let i = 0; i < 80; i++) {
        let cx = random(WORLD_WIDTH); const tY = height * 0.82 + 25; let cy;
        if (random() < 0.5) cy = random(height * 0.65 + 20, tY - 35); else cy = random(tY + 50, height - 20);
        if (abs(cx - 1625) > 100) crystals.push(new Crystal(cx, cy));
    }
    for (let i = 0; i < 20; i++) clouds.push(new Cloud());
    generateInitialFlora();
    for (let i = 0; i < 12; i++) entities.push(new Deer(random(500, 3000)));
    for (let i = 0; i < 18; i++) entities.push(new Bird());
    for (let i = 0; i < 10; i++) entities.push(new Miner(random(100, 3400)));
    for (let i = 0; i < 25; i++) entities.push(new LakeFish(random(3450, 3950), random(height * 0.68, height * 0.75)));
    for (let i = 0; i < 4; i++) entities.push(new LakeApex(random(3500, 3900), height * 0.72));
}

function generateInitialFlora() {
    flora = []; for (let x = 0; x <= WORLD_WIDTH; x += 30) {
        let gy = getGroundY(x); let nearStation = changingStations.some(cs => abs(cs.x + 60 - x) < 300);
        if (!nearStation && random() < 0.15) {
            if (x < 3200) flora.push(new Plant((x > 3000 ? 'Grass' : random(['Tree', 'Grass'])), x, gy - 5)); 
            else if (x > 3450) flora.push(new Plant('Coral', x, gy + 50));
        }
    }
}

function draw() {
    const seasons = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
    if (autoSeason) { seasonTime += 0.0005; const seasonIdx = floor(seasonTime % 4); window.currentSeason = seasons[seasonIdx]; }
    handleInput();
    const currentS = window.currentSeason || 'SPRING';
    if (currentS === 'SPRING') { if (random() < 0.6) weatherParticles.push(new WeatherParticle('Rain', random(camX, camX + width))); }
    else if (currentS === 'SUMMER') { if (random() < 0.1) weatherParticles.push(new WeatherParticle('Rain', random(camX, camX + width))); }
    else if (currentS === 'AUTUMN') { if (random() < 0.3) weatherParticles.push(new WeatherParticle('Rain', random(camX, camX + width))); }
    else if (currentS === 'WINTER') { if (random() < 0.5) weatherParticles.push(new WeatherParticle('Snow', random(camX, camX + width))); if (random() < 0.03) weatherParticles.push(new WeatherParticle('Hail', random(camX, camX + width))); }
    const speed = 15; const margin = 100;
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW) || (mouseX < margin && mouseX > 0)) camX -= speed;
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW) || (mouseX > width - margin)) camX += speed;
    camX = constrain(camX, 0, WORLD_WIDTH - width);
    const sunX = mouseX; const sunY = mouseY; const lightL = map(sunY, 0, height, 1, 0.22); 
    const topC = lerpColor(color('#0f172a'), color('#87ceeb'), lightL); const botC = lerpColor(color('#1e1b4b'), color('#e0f2fe'), lightL);
    background(botC); push(); translate(-camX, 0); 
    drawAtmosphere(lightL, topC, botC); drawUnderground(lightL); drawSurface(lightL); drawSkyPlatform(lightL);
    flora.forEach(f => { f.update(); f.draw(lightL); });
    entities.forEach(ent => { if (ent instanceof LakeFish || ent instanceof LakeApex) { ent.update(sunX + camX, sunY, lightL); ent.draw(lightL); } });
    drawSea(lightL); 
    entities.forEach(ent => { if (!(ent instanceof LakeFish) && !(ent instanceof LakeApex)) { ent.update(sunX + camX, sunY, lightL); ent.draw(lightL); } });
    changingStations.forEach(cs => cs.draw(lightL));
    entities = entities.filter(ent => !ent.isDead); elevator.update(); elevator.draw(lightL); clouds.forEach(c => { c.update(); c.draw(lightL); }); pop();
    drawSun(sunX, sunY, lightL); drawSeasonalHUD(lightL); worldTime += 0.01;
}

function mousePressed() {
    if (mouseX > 20 && mouseX < 280 && mouseY > 20 && mouseY < 100) {
        let section = floor(map(mouseX, 20, 280, 0, 5));
        if (section === 0) autoSeason = true;
        else if (section === 1) { window.currentSeason = 'SPRING'; autoSeason = false; }
        else if (section === 2) { window.currentSeason = 'SUMMER'; autoSeason = false; }
        else if (section === 3) { window.currentSeason = 'AUTUMN'; autoSeason = false; }
        else if (section === 4) { window.currentSeason = 'WINTER'; autoSeason = false; }
    }
}

function handleInput() {
    if (keyIsPressed) {
        if (key === '1') { window.currentSeason = 'SPRING'; autoSeason = false; } if (key === '2') { window.currentSeason = 'SUMMER'; autoSeason = false; }
        if (key === '3') { window.currentSeason = 'AUTUMN'; autoSeason = false; } if (key === '4') { window.currentSeason = 'WINTER'; autoSeason = false; }
        if (key === '0') { autoSeason = true; }
    }
}

function drawSeasonalHUD(light) {
    const s = window.currentSeason || 'SPRING'; const mode = autoSeason ? "AUTO" : "MANUAL";
    push(); resetMatrix(); noStroke(); fill(0, 180); rect(20, 20, 260, 80, 10); textFont('Poppins, sans-serif'); textAlign(LEFT, CENTER);
    textSize(11); fill(255); text("CLICK TO CHANGE:", 40, 35);
    textSize(10); const labels = ["AUTO", "SPRING", "SUMMER", "AUTUMN", "WINTER"];
    for(let i=0; i<5; i++) {
        let lx = 35 + i * 50; let isSelected = (i===0 && autoSeason) || (labels[i] === s && !autoSeason);
        fill(isSelected ? color(0, 255, 150) : 200); text(labels[i], lx, 60);
        if (isSelected) rect(lx - 2, 65, textWidth(labels[i]) + 4, 2);
    }
    textSize(9); fill(150); text(`WEATHER: ${s === 'WINTER' ? 'SNOW/HAIL' : 'RAIN'}`, 40, 85); pop();
}

function drawAtmosphere(light, topColor, bottomColor) {
    const groundY = height * 0.65; for (let i = 0; i < groundY; i += 4) { const inter = map(i, 0, groundY, 0, 1); stroke(lerpColor(topColor, bottomColor, inter)); strokeWeight(4); line(0, i, WORLD_WIDTH, i); }
    if (light < 0.5) { fill(255, 255 * (1 - light * 2)); noStroke(); stars.forEach(s => { ellipse(s.x, s.y, s.size, s.size); }); }
}

function drawSun(sx, sy, light) {
    push(); translate(sx, sy); const glowC = lerpColor(color(255, 255, 255, 80), color(251, 191, 36, 180), light);
    noStroke(); drawingContext.shadowBlur = light > 0.5 ? 80 : 120; drawingContext.shadowColor = light > 0.5 ? '#fbbf24' : '#fff';
    fill(glowC); ellipse(0, 0, 150, 150); fill(255); ellipse(0, 0, 70, 70); drawingContext.shadowBlur = 0; pop();
}

function drawSurface(light) {
    const gY = height * 0.65; const s = window.currentSeason || 'SPRING';
    let hC, mC, sC; if (s === 'SPRING') { hC = color('#86efac'); mC = color('#94a3b8'); sC = color('#fef3c7'); } else if (s === 'SUMMER') { hC = color('#22c55e'); mC = color('#475569'); sC = color('#fde68a'); } else if (s === 'AUTUMN') { hC = color('#b45309'); mC = color('#71717a'); sC = color('#d97706'); } else { hC = color('#f1f5f9'); mC = color('#cbd5e1'); sC = color('#f8fafc'); }
    const nightG = color('#020617'); fill(lerpColor(nightG, mC, light)); noStroke(); beginShape(); vertex(0, gY); for (let x = 0; x <= 3000; x += 20) { let fall = x > 2500 ? map(x, 2500, 3000, 1, 0) : 1; vertex(x, gY - noise(x * 0.005, 50) * 300 * fall); } vertex(3000, gY); endShape(CLOSE);
    fill(lerpColor(nightG, hC, light)); beginShape(); vertex(0, gY); for (let x = 0; x <= 3000; x += 15) { let fall = x > 2800 ? map(x, 2800, 3000, 1, 0) : 1; vertex(x, gY - noise(x * 0.01, 150) * 150 * fall); } vertex(3000, gY); endShape(CLOSE);
    let nightS = color('#2e1065'); fill(lerpColor(nightS, sC, light)); beginShape(); vertex(3000, gY); for (let x = 3000; x <= 3380; x += 20) { let d = map(x, 3000, 3380, 0, 15); vertex(x, gY + d + noise(x * 0.05) * 4); } for (let x = 3381; x <= 3600; x += 20) { let d = map(x, 3381, 3600, 10, 300); vertex(x, gY + d); } for (let x = 3601; x <= WORLD_WIDTH; x += 50) { let d = map(x, 3601, WORLD_WIDTH, 300, height - gY + 50); vertex(x, gY + d); } vertex(WORLD_WIDTH, height); vertex(3000, height); endShape(CLOSE);
}

function drawSea(light) {
    const wC = lerpColor(color('#082f49'), color(56, 189, 248, 180), light); const gY = height * 0.65; const sea = 3360; const wL = gY + 10; fill(wC); noStroke();
    beginShape(); vertex(sea, wL + 5); for (let x = sea; x <= WORLD_WIDTH; x += 25) { let w = sin(x * 0.1 + worldTime * 4) * 5; vertex(x, wL + w); } vertex(WORLD_WIDTH, height); vertex(sea, height); endShape(CLOSE);
    stroke(255, 100); strokeWeight(2); for (let x = sea; x < WORLD_WIDTH; x += 25) { let w = sin(x * 0.1 + worldTime * 4) * 5; line(x, wL + w, x + 15, wL + w); }
}

function drawSkyPlatform(light) {
    const sY = height * 0.25; const ex = 1550; const ew = 150;
    push(); translate(ex - 100, sY); fill(lerpColor(color(10), color(50), light)); noStroke(); rect(0, 0, ew + 200, 15, 5); fill(100, 200, 255, 60); rect(100, 0, ew, 15);
    stroke(lerpColor(color(40), color(100), light)); strokeWeight(2); for(let i = 0; i <= ew + 200; i += 25) { line(i, 0, i, -25); } line(0, -25, ew + 200, -25);
    fill(lerpColor(color(15), color(40), light)); rect(20, -50, 50, 50); fill(0, 255, 150, 150 + sin(worldTime * 5) * 100); rect(25, -45, 10, 5); rect(25, -35, 10, 5);
    push(); translate(ew + 150, 0); stroke(lerpColor(color(20), color(60), light)); strokeWeight(4); line(0, 0, 0, -30); noStroke(); fill(lerpColor(color(30), color(70), light)); arc(0, -30, 60, 40, PI, TWO_PI); stroke(100, 255, 255, 150); strokeWeight(2); line(0, -30, sin(worldTime) * 20, -60); pop(); pop();
}

function drawUnderground(light) {
    const dC = lerpColor(color('#1e1b4b'), color('#2d1a10'), 0.45); const gY = height * 0.65; const sY = height * 0.25; const tY = height * 0.82 + 25;
    fill(dC); noStroke(); rect(0, gY, WORLD_WIDTH, height - gY); fill(0, 50); for(let i=0; i<100; i++) { let rx = noise(i, 10) * WORLD_WIDTH; let ry = gY + noise(i, 20) * (height - gY); ellipse(rx, ry, 120, 70); }
    fill(0, 150); rect(1550, sY - 100, 150, height - (sY - 100)); fill(0, 200); rect(0, tY - 25, WORLD_WIDTH, 50); 
    fill(dC); noStroke(); beginShape(); vertex(0, tY - 25); for(let x=0; x<=WORLD_WIDTH; x+=40) { vertex(x, tY - 25 + noise(x*0.1, 500)*12); } vertex(WORLD_WIDTH, tY - 50); vertex(0, tY - 50); endShape(CLOSE);
    beginShape(); vertex(0, tY + 25); for(let x=0; x<=WORLD_WIDTH; x+=40) { vertex(x, tY + 25 - noise(x*0.1, 600)*12); } vertex(WORLD_WIDTH, tY + 50); vertex(0, tY + 50); endShape(CLOSE);
    for (let x = 0; x < WORLD_WIDTH; x += 180) { if (abs(x - 1625) < 120) continue; fill(lerpColor(color(20), color(70), light)); stroke(10); strokeWeight(1); rect(x, tY - 30, 14, 60, 2); rect(x - 10, tY - 30, 34, 8, 2); fill(200); noStroke(); ellipse(x+7, tY - 25, 4, 4); ellipse(x+7, tY + 25, 4, 4); }
    crystals.forEach(c => c.draw()); fill(20, 220); rect(1550, gY, 8, height - gY); rect(1692, gY, 8, height - gY);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
