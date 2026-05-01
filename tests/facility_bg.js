/**
 * TESTING FACILITY BACKGROUND SCRIPT
 * Feature: The "Light Forge" Title Formation & Background Light Paths
 * Paths of light run across the background, periodically releasing particles.
 * Title letters are formed by light balls originating from these paths.
 */

const canvas = document.createElement('canvas');
canvas.id = 'facility-canvas';
document.body.prepend(canvas);

const ctx = canvas.getContext('2d');
let width, height;
let charTargets = [];
let flyingBalls = [];
let paths = [];
let pathParticles = [];
const mouse = { x: -1000, y: -1000 };

const colors = ['#38bdf8', '#a78bfa', '#10b981'];
const titleEl = document.getElementById('facility-title');

class Path {
    constructor(x1, y1, x2, y2, interval) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.interval = interval; // Frames between releases
        this.timer = Math.random() * interval;
    }

    update() {
        this.timer--;
        if (this.timer <= 0) {
            pathParticles.push(new PathParticle(this));
            this.timer = this.interval;
        }
    }

    draw() {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
    }

    getRandomPoint() {
        const t = Math.random();
        return {
            x: this.x1 + (this.x2 - this.x1) * t,
            y: this.y1 + (this.y2 - this.y1) * t
        };
    }
}

class PathParticle {
    constructor(path) {
        this.path = path;
        this.progress = 0;
        this.speed = 0.001 + Math.random() * 0.002;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.size = 1 + Math.random();
    }

    update() {
        this.progress += this.speed;
        return this.progress >= 1;
    }

    draw() {
        const x = this.path.x1 + (this.path.x2 - this.path.x1) * this.progress;
        const y = this.path.y1 + (this.path.y2 - this.path.y1) * this.progress;
        
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function mapTitleCharacters() {
    if (!titleEl) return;
    charTargets = [];
    const text = titleEl.textContent.trim() || "Testing Facility";
    titleEl.innerHTML = '';
    [...text].forEach((char) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.className = 'reveal-char';
        titleEl.appendChild(span);
        
        const rect = span.getBoundingClientRect();
        charTargets.push({
            el: span,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            revealed: false
        });
    });
}

class LightBall {
    constructor(target, startPoint) {
        this.target = target;
        this.x = startPoint.x;
        this.y = startPoint.y;

        this.progress = 0;
        this.speed = 0.01 + Math.random() * 0.015;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.size = 3 + Math.random() * 2;
        
        // Control points for arcing flight path
        this.cp1x = Math.random() * width;
        this.cp1y = Math.random() * height;
    }

    update() {
        this.progress += this.speed;
        if (this.progress >= 1) {
            this.target.el.classList.add('revealed');
            this.target.revealed = true;
            return true;
        }
        
        const t = this.progress;
        const invT = 1 - t;
        this.currX = invT * invT * this.x + 2 * invT * t * this.cp1x + t * t * this.target.x;
        this.currY = invT * invT * this.y + 2 * invT * t * this.cp1y + t * t * this.target.y;
        return false;
    }

    draw() {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.currX, this.currY, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = this.size;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.quadraticCurveTo(this.cp1x, this.cp1y, this.currX, this.currY);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    mapTitleCharacters();
    flyingBalls = [];
    pathParticles = [];
    paths = [];

    // Create background paths
    const numPaths = 12;
    for (let i = 0; i < numPaths; i++) {
        const isHorizontal = Math.random() > 0.5;
        let x1, y1, x2, y2;
        if (isHorizontal) {
            y1 = y2 = Math.random() * height;
            x1 = -100;
            x2 = width + 100;
        } else {
            x1 = x2 = Math.random() * width;
            y1 = -100;
            y2 = height + 100;
        }
        const interval = 100 + Math.random() * 300; // Different intervals
        paths.push(new Path(x1, y1, x2, y2, interval));
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    // Update and draw paths
    paths.forEach(path => {
        path.update();
        path.draw();
    });

    // Update and draw path particles
    pathParticles = pathParticles.filter(p => {
        const finished = p.update();
        p.draw();
        return !finished;
    });

    // Release title balls from paths
    if (Math.random() < 0.1) {
        const unrevealed = charTargets.filter(c => !c.revealed);
        if (unrevealed.length > 0) {
            const target = unrevealed[Math.floor(Math.random() * unrevealed.length)];
            const alreadyTargeted = flyingBalls.some(b => b.target === target);
            if (!alreadyTargeted) {
                // Pick a random path and a random point on it
                const randomPath = paths[Math.floor(Math.random() * paths.length)];
                const startPoint = randomPath.getRandomPoint();
                flyingBalls.push(new LightBall(target, startPoint));
            }
        }
    }

    flyingBalls = flyingBalls.filter(ball => {
        const finished = ball.update();
        ball.draw();
        return !finished;
    });

    if (pointer) {
        pointer.style.left = mouse.x + 'px';
        pointer.style.top = mouse.y + 'px';
    }

    requestAnimationFrame(animate);
}

const pointer = document.createElement('div');
pointer.id = 'facility-pointer';
document.body.appendChild(pointer);

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('resize', init);
init();
animate();

