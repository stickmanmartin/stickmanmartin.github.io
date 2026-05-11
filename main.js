/**
 * MARTIN'S HUB CORE SCRIPT
 * Clock + Boids Algorithm Flocking Simulation (Tech-Style)
 * Features: Flocking, Cursor Glow, Dynamic Color Cycle
 */

// --- 1. CLOCK LOGIC ---
function updateClock() {
    const now = new Date();
    const clock = document.getElementById('clock');
    if (clock) {
        clock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }
}
setInterval(updateClock, 1000);
updateClock();

// --- 2. BOIDS FLOCKING SIMULATION ---
const canvas = document.getElementById('bg-particles');
const cursorGlow = document.getElementById('cursor-glow');
const ctx = canvas.getContext('2d');

let flock = [];
const mouse = { x: null, y: null, active: false };
let hue = 0; // For color cycling

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', e => {
    mouse.x = e.x;
    mouse.y = e.y;
    mouse.active = true;
    
    // Update DOM cursor position
    if (cursorGlow) {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
        cursorGlow.style.opacity = 1;
    }
});
window.addEventListener('mouseleave', () => {
    mouse.active = false;
    if (cursorGlow) cursorGlow.style.opacity = 0;
});

window.addEventListener('mousedown', () => {
    if (cursorGlow) {
        cursorGlow.style.transform = 'scale(1.5)';
    }
    flock.forEach(boid => {
        let dx = boid.x - mouse.x;
        let dy = boid.y - mouse.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 300) {
            let force = (300 - dist) / 5;
            boid.velocity.x += (dx / dist) * force;
            boid.velocity.y += (dy / dist) * force;
        }
    });
});

window.addEventListener('mouseup', () => {
    if (cursorGlow) {
        cursorGlow.style.transform = 'scale(1)';
    }
});

class Boid {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.velocity = { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 };
        this.acceleration = { x: 0, y: 0 };
        this.maxSpeed = 3;
        this.maxForce = 0.05;
        this.size = 8;
    }

    applyForce(force) {
        this.acceleration.x += force.x;
        this.acceleration.y += force.y;
    }

    flock(boids) {
        let alignment = this.align(boids);
        let cohesion = this.cohesion(boids);
        let separation = this.separation(boids);

        alignment.x *= 1.0; alignment.y *= 1.0;
        cohesion.x *= 1.0; cohesion.y *= 1.0;
        separation.x *= 1.5; separation.y *= 1.5;

        this.applyForce(alignment);
        this.applyForce(cohesion);
        this.applyForce(separation);

        // Mouse attraction
        if (mouse.active) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 400) {
                let target = { x: dx, y: dy };
                let mag = Math.sqrt(target.x*target.x + target.y*target.y);
                target.x = (target.x / mag) * this.maxSpeed;
                target.y = (target.y / mag) * this.maxSpeed;
                
                let steer = { x: target.x - this.velocity.x, y: target.y - this.velocity.y };
                let steerMag = Math.sqrt(steer.x*steer.x + steer.y*steer.y);
                if (steerMag > this.maxForce) {
                    steer.x = (steer.x / steerMag) * this.maxForce;
                    steer.y = (steer.y / steerMag) * this.maxForce;
                }
                this.applyForce(steer);
            }
        }
    }

    align(boids) {
        let perception = 50;
        let avg = { x: 0, y: 0 };
        let total = 0;
        for (let other of boids) {
            let d = Math.sqrt((this.x - other.x)**2 + (this.y - other.y)**2);
            if (other !== this && d < perception) {
                avg.x += other.velocity.x;
                avg.y += other.velocity.y;
                total++;
            }
        }
        if (total > 0) {
            avg.x /= total; avg.y /= total;
            let mag = Math.sqrt(avg.x*avg.x + avg.y*avg.y);
            avg.x = (avg.x / mag) * this.maxSpeed;
            avg.y = (avg.y / mag) * this.maxSpeed;
            avg.x -= this.velocity.x;
            avg.y -= this.velocity.y;
            let steerMag = Math.sqrt(avg.x*avg.x + avg.y*avg.y);
            if (steerMag > this.maxForce) {
                avg.x = (avg.x / steerMag) * this.maxForce;
                avg.y = (avg.y / steerMag) * this.maxForce;
            }
        }
        return avg;
    }

    cohesion(boids) {
        let perception = 50;
        let avg = { x: 0, y: 0 };
        let total = 0;
        for (let other of boids) {
            let d = Math.sqrt((this.x - other.x)**2 + (this.y - other.y)**2);
            if (other !== this && d < perception) {
                avg.x += other.x;
                avg.y += other.y;
                total++;
            }
        }
        if (total > 0) {
            avg.x /= total; avg.y /= total;
            avg.x -= this.x; avg.y -= this.y;
            let mag = Math.sqrt(avg.x*avg.x + avg.y*avg.y);
            avg.x = (avg.x / mag) * this.maxSpeed;
            avg.y = (avg.y / mag) * this.maxSpeed;
            avg.x -= this.velocity.x;
            avg.y -= this.velocity.y;
            let steerMag = Math.sqrt(avg.x*avg.x + avg.y*avg.y);
            if (steerMag > this.maxForce) {
                avg.x = (avg.x / steerMag) * this.maxForce;
                avg.y = (avg.y / steerMag) * this.maxForce;
            }
        }
        return avg;
    }

    separation(boids) {
        let perception = 30;
        let avg = { x: 0, y: 0 };
        let total = 0;
        for (let other of boids) {
            let d = Math.sqrt((this.x - other.x)**2 + (this.y - other.y)**2);
            if (other !== this && d < perception) {
                let diff = { x: this.x - other.x, y: this.y - other.y };
                diff.x /= (d * d);
                diff.y /= (d * d);
                avg.x += diff.x;
                avg.y += diff.y;
                total++;
            }
        }
        if (total > 0) {
            avg.x /= total; avg.y /= total;
            let mag = Math.sqrt(avg.x*avg.x + avg.y*avg.y);
            if (mag > 0) {
                avg.x = (avg.x / mag) * this.maxSpeed;
                avg.y = (avg.y / mag) * this.maxSpeed;
            }
            avg.x -= this.velocity.x;
            avg.y -= this.velocity.y;
            let steerMag = Math.sqrt(avg.x*avg.x + avg.y*avg.y);
            if (steerMag > this.maxForce) {
                avg.x = (avg.x / steerMag) * this.maxForce;
                avg.y = (avg.y / steerMag) * this.maxForce;
            }
        }
        return avg;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        
        // Clamp speed
        let speed = Math.sqrt(this.velocity.x*this.velocity.x + this.velocity.y*this.velocity.y);
        if (speed > this.maxSpeed) {
            this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
            this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
        }

        this.acceleration.x = 0;
        this.acceleration.y = 0;

        // Wrap around
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw(color) {
        let angle = Math.atan2(this.velocity.y, this.velocity.x);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        // Draw techy triangle
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size, -this.size / 2);
        ctx.lineTo(-this.size / 2, 0);
        ctx.lineTo(-this.size, this.size / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

function init() {
    flock = [];
    let count = (canvas.width * canvas.height) / 10000;
    for (let i = 0; i < Math.min(count, 150); i++) {
        flock.push(new Boid());
    }
}

function isDayTime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

function animate() {
    const isDay = isDayTime();
    
    // Update Hub Background & Colors based on time
    ctx.fillStyle = isDay ? '#f1f5f9' : '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    document.documentElement.style.setProperty('--bg-dark', isDay ? '#f1f5f9' : '#0f172a');
    document.documentElement.style.setProperty('--text-main', isDay ? '#0f172a' : '#f8fafc');
    document.documentElement.style.setProperty('--card-bg', isDay ? '#ffffff' : '#1e293b');

    // Dynamic Color Cycle
    hue = (hue + 0.5) % 360;
    let lightness = isDay ? 40 : 60; // Darker colors for light mode
    let currentColor = `hsl(${hue}, 80%, ${lightness}%)`;
    let glowColor = `hsla(${hue}, 80%, ${lightness}%, 0.8)`;
    let glowSecondary = `hsla(${hue}, 80%, ${lightness}%, 0.4)`;
    let glowTertiary = `hsla(${hue}, 80%, ${lightness}%, 0.2)`;

    if (mouse.active && cursorGlow) {
        cursorGlow.style.setProperty('--glow-color', glowColor);
        cursorGlow.style.setProperty('--glow-secondary', glowSecondary);
        cursorGlow.style.setProperty('--glow-tertiary', glowTertiary);
    }

    for (let boid of flock) {
        boid.flock(flock);
        boid.update();
        boid.draw(currentColor);
    }

    requestAnimationFrame(animate);
}

resize();
animate();
