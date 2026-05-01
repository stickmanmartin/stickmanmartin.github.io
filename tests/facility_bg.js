/**
 * TESTING FACILITY BACKGROUND SCRIPT
 * Feature: The "Pulse" Grid
 * Rhythmic, clinical scanning pulses that ripple across a dark technical grid.
 */

const canvas = document.createElement('canvas');
canvas.id = 'facility-canvas';
document.body.prepend(canvas);

const ctx = canvas.getContext('2d');
let width, height;
let pulses = [];
const gridSpacing = 50;
const mouse = { x: -1000, y: -1000 };

// Neural Facility Color Palette
const themes = [
    { primary: '#38bdf8', secondary: 'rgba(56, 189, 248, 0.1)' }, // Teal
    { primary: '#a78bfa', secondary: 'rgba(167, 139, 250, 0.1)' } // Purple
];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

class GridPulse {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.r = 0;
        this.maxR = Math.max(width, height) * 0.8;
        this.speed = 4;
        this.theme = themes[Math.floor(Math.random() * themes.length)];
        this.opacity = 1;
    }

    update() {
        this.r += this.speed;
        this.opacity = 1 - (this.r / this.maxR);
    }

    draw() {
        // Draw the expanding ring
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.strokeStyle = this.theme.primary;
        ctx.globalAlpha = this.opacity * 0.3;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Secondary inner glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.r - 20), 0, Math.PI * 2);
        ctx.globalAlpha = this.opacity * 0.1;
        ctx.lineWidth = 10;
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }

    isDead() { return this.r >= this.maxR; }
}

function drawBackgroundGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    for (let x = 0; x < width; x += gridSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += gridSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Highlight grid lines near mouse
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    let mx = Math.round(mouse.x / gridSpacing) * gridSpacing;
    let my = Math.round(mouse.y / gridSpacing) * gridSpacing;
    
    ctx.moveTo(mx, 0); ctx.lineTo(mx, height);
    ctx.moveTo(0, my); ctx.lineTo(width, my);
    ctx.stroke();
}

function animate() {
    ctx.fillStyle = '#0a0a0c'; // Sterile dark background
    ctx.fillRect(0, 0, width, height);

    drawBackgroundGrid();

    // Periodic "Scanning" Pulse
    if (Math.random() < 0.008) {
        pulses.push(new GridPulse());
    }

    pulses = pulses.filter(p => {
        p.update();
        p.draw();
        return !p.isDead();
    });

    requestAnimationFrame(animate);
}

// Custom Laboratory Pointer (Syncs with the facility vibe)
const pointer = document.createElement('div');
pointer.id = 'facility-pointer';
document.body.appendChild(pointer);

document.addEventListener('mousemove', (e) => {
    pointer.style.left = e.clientX + 'px';
    pointer.style.top = e.clientY + 'px';
});

// Pulse on click
window.addEventListener('mousedown', (e) => {
    let p = new GridPulse();
    p.x = e.clientX;
    p.y = e.clientY;
    p.speed = 8; // Faster click pulse
    pulses.push(p);
});

resize();
animate();
