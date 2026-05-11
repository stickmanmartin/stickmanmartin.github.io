/**
 * NEURAL EVALUATION "QUANTUM GRID" BACKGROUND
 * Features:
 * 1. 3D Warping Grid: A structural floor and ceiling that distorts under the mouse.
 * 2. Gravity Well Physics: Damped spring motion for grid intersections.
 * 3. Light Forge 2.0: Title assembly using data balls from grid nodes.
 * 4. Neural Echo: Color and intensity based on performance metrics.
 * 5. Circadian Sync: Dynamic dark/light modes based on system time.
 */

const canvas = document.createElement('canvas');
canvas.id = 'facility-canvas';
document.body.prepend(canvas);

const ctx = canvas.getContext('2d');
let width, height;
let points = [];
let charTargets = [];
let flyingBalls = [];
const targetMouse = { x: -1000, y: -1000 };
const mouse = { x: -1000, y: -1000 };

const GRID_SPACING = 60;
const STIFFNESS = 0.12;
const DAMPING = 0.85;
const GRAVITY_RADIUS = 250;
const GRAVITY_STRENGTH = 80;

const accentColors = {
    high: '#38bdf8', // Sharp Cyan
    low: '#a78bfa'  // Slow Violet
};

function isDayTime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

function getPerformanceScale() {
    const reflex = parseInt(localStorage.getItem('clickSpeedHighscore') || 0);
    const typing = parseInt(localStorage.getItem('typingHighscore') || 0);
    const avg = (reflex + (typing / 10)) / 2;
    return Math.min(1, Math.max(0, avg / 50));
}

class GridPoint {
    constructor(x, y, z) {
        this.baseX = x;
        this.baseY = y;
        this.baseZ = z;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = 0;
        this.vy = 0;
    }

    update() {
        const dx = targetMouse.x - this.x;
        const dy = targetMouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < GRAVITY_RADIUS) {
            const force = (GRAVITY_RADIUS - dist) / GRAVITY_RADIUS;
            const tx = this.baseX - (dx / dist) * force * GRAVITY_STRENGTH;
            const ty = this.baseY - (dy / dist) * force * GRAVITY_STRENGTH;
            this.vx += (tx - this.x) * STIFFNESS;
            this.vy += (ty - this.y) * STIFFNESS;
        } else {
            this.vx += (this.baseX - this.x) * STIFFNESS;
            this.vy += (this.baseY - this.y) * STIFFNESS;
        }
        this.vx *= DAMPING;
        this.vy *= DAMPING;
        this.x += this.vx;
        this.y += this.vy;
    }
}

function mapTitleCharacters() {
    const titleEl = document.getElementById('facility-title');
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
        this.speed = 0.02 + Math.random() * 0.015;
        this.hue = Math.random() * 360;
        this.size = 5 + Math.random() * 3;
    }

    update() {
        this.progress += this.speed;
        if (this.progress >= 1) {
            this.target.el.classList.add('revealed');
            this.target.revealed = true;
            return true;
        }
        this.currX = this.x + (this.target.x - this.x) * this.progress;
        this.currY = this.y + (this.target.y - this.y) * this.progress;
        this.hue = (this.hue + 8) % 360;
        const isDay = isDayTime();
        this.color = `hsl(${this.hue}, 100%, ${isDay ? '40%' : '60%'})`;
        return false;
    }

    draw() {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = isDayTime() ? '#333' : '#fff';
        ctx.beginPath();
        ctx.arc(this.currX, this.currY, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    points = [];
    flyingBalls = [];
    const rows = 12;
    const cols = 20;
    const vanishY = height / 2;

    for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
            const x = (c / cols) * width;
            points.push(new GridPoint(x, vanishY + (r / rows) * (height / 2), r));
            points.push(new GridPoint(x, vanishY - (r / rows) * (height / 2), r));
        }
    }
    mapTitleCharacters();
    
    // Update CSS variables for dark/light mode
    const isDay = isDayTime();
    document.documentElement.style.setProperty('--bg-facility', isDay ? '#f8fafc' : '#141418');
    document.documentElement.style.setProperty('--text-main', isDay ? '#0f172a' : '#f8fafc');
    document.documentElement.style.setProperty('--text-muted', isDay ? '#475569' : '#94a3b8');
}

function drawGridLines() {
    const isDay = isDayTime();
    const pScale = getPerformanceScale();
    const color = isDay 
        ? (pScale > 0.5 ? '#0ea5e9' : '#8b5cf6')
        : (pScale > 0.5 ? accentColors.high : accentColors.low);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = isDay ? 0.2 : 0.35;

    const cols = 20;
    const numPointsPerPlane = (cols + 1);

    for (let i = 0; i < points.length; i += 2) {
        points[i].update();
        points[i+1].update();

        if (i >= 2 * numPointsPerPlane) {
            ctx.beginPath();
            ctx.moveTo(points[i - 2 * numPointsPerPlane].x, points[i - 2 * numPointsPerPlane].y);
            ctx.lineTo(points[i].x, points[i].y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(points[i + 1 - 2 * numPointsPerPlane].x, points[i + 1 - 2 * numPointsPerPlane].y);
            ctx.lineTo(points[i + 1].x, points[i + 1].y);
            ctx.stroke();
        }

        if (i % (2 * numPointsPerPlane) !== 0) {
            ctx.beginPath();
            ctx.moveTo(points[i-2].x, points[i-2].y);
            ctx.lineTo(points[i].x, points[i].y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(points[i-1].x, points[i-1].y);
            ctx.lineTo(points[i+1].x, points[i+1].y);
            ctx.stroke();
        }
    let flyingBalls = [];
    const targetMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    ...
    function animate() {
        const isDay = isDayTime();
        ctx.fillStyle = isDay ? '#f8fafc' : '#141418';
        ctx.fillRect(0, 0, width, height);

        mouse.x += (targetMouse.x - mouse.x) * 0.15;
        mouse.y += (targetMouse.y - mouse.y) * 0.15;

        drawGridLines();

        if (Math.random() < 0.1) {
            const unrevealed = charTargets.filter(c => !c.revealed);
            if (unrevealed.length > 0) {
                const target = unrevealed[Math.floor(Math.random() * unrevealed.length)];
                if (!flyingBalls.some(b => b.target === target)) {
                    const randomPoint = points[Math.floor(Math.random() * points.length)];
                    flyingBalls.push(new LightBall(target, { x: randomPoint.x, y: randomPoint.y }));
                }
            }
        }

        flyingBalls = flyingBalls.filter(ball => {
            const finished = ball.update();
            ball.draw();
            return !finished;
        });

        const activePointer = document.getElementById('facility-pointer');
        

        requestAnimationFrame(animate);
        }

        window.addEventListener('mousemove', (e) => {
        targetMouse.x = e.clientX;
        targetMouse.y = e.clientY;
        });


window.addEventListener('resize', init);
init();
animate();
