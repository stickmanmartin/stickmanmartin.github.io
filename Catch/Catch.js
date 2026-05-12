const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const diesound = document.getElementById("coolsound");
const punch = document.getElementById("punch");
const round2 = document.getElementById("round2");

let score = 0;
let highScore = localStorage.getItem('catchHighscore') || 0;
let lives = 500;
let gameState = 'PLAYING';

let player = {
    x: 0,
    y: 0,
    w: 60,
    h: 20,
    speed: 8
};

let objects = [];
const COLORS = {
    HAZARD: '#ef4444', // Red - Avoid
    SHARD: '#38bdf8',  // Cyan - Catch (+Points)
    REPAIR: '#10b981'  // Green - Catch (+HP)
};

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - player.w / 2;
    player.y = canvas.height - 100;
}

function createObject() {
    const r = Math.random();
    let type = 'HAZARD';
    if (r < 0.15) type = 'SHARD';
    else if (r < 0.20) type = 'REPAIR';

    objects.push({
        x: Math.random() * (canvas.width - 30),
        y: -50,
        w: 25,
        h: 25,
        speed: 4 + Math.random() * 4 + (score / 5000),
        type: type,
        color: COLORS[type]
    });
}

function update() {
    if (gameState === 'GAMEOVER') return;

    // Movement (Restricted to bottom part)
    if ((keys['ArrowLeft'] || keys['KeyA']) && player.x > 0) player.x -= player.speed;
    if ((keys['ArrowRight'] || keys['KeyD']) && player.x < canvas.width - player.w) player.x += player.speed;
    if ((keys['ArrowUp'] || keys['KeyW']) && player.y > canvas.height * 0.65) player.y -= player.speed;
    if ((keys['ArrowDown'] || keys['KeyS']) && player.y < canvas.height - player.h - 20) player.y += player.speed;

    // Spawning
    if (Math.random() < 0.05 + (score / 100000)) {
        createObject();
    }

    objects.forEach((obj, index) => {
        obj.y += obj.speed;

        // Collision detection
        if (obj.y + obj.h >= player.y && obj.y <= player.y + player.h &&
            obj.x + obj.w >= player.x && obj.x <= player.x + player.w) {
            
            if (obj.type === 'HAZARD') {
                lives -= 50;
                if (punch) punch.play();
                if (lives <= 0) endGame();
            } else if (obj.type === 'SHARD') {
                score += 250;
            } else if (obj.type === 'REPAIR') {
                lives = Math.min(500, lives + 100);
            }
            
            objects.splice(index, 1);
        }

        // Cleanup
        if (obj.y > canvas.height) {
            if (obj.type === 'SHARD') score -= 50; // Penalty for missing shards
            objects.splice(index, 1);
        }
    });

    score += 1; // Passive score for survival
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Player
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#38bdf8";
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;

    // Draw Objects
    objects.forEach(obj => {
        ctx.fillStyle = obj.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = obj.color;
        if (obj.type === 'SHARD') {
            // Diamond shape for shards
            ctx.beginPath();
            ctx.moveTo(obj.x + obj.w/2, obj.y);
            ctx.lineTo(obj.x + obj.w, obj.y + obj.h/2);
            ctx.lineTo(obj.x + obj.w/2, obj.y + obj.h);
            ctx.lineTo(obj.x, obj.y + obj.h/2);
            ctx.fill();
        } else {
            ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
        ctx.shadowBlur = 0;
    });

    drawHUD();
}

function drawHUD() {
    const isDay = document.body.classList.contains('day-theme');
    ctx.fillStyle = isDay ? "#0f172a" : "#fff";
    ctx.font = "bold 24px Poppins";
    ctx.textAlign = "center";
    ctx.fillText(`INTEGRITY: ${lives}`, canvas.width/2, 60);
    ctx.fillText(`SYNC SCORE: ${Math.floor(score)}`, canvas.width/2, 95);
    ctx.font = "14px Poppins";
    ctx.fillText(`PEAK SYNC: ${Math.floor(highScore)}`, canvas.width/2, 120);
}

function endGame() {
    gameState = 'GAMEOVER';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('catchHighscore', highScore);
    }
    if (diesound) diesound.play();
    
    // Draw Game Over Overlay
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 64px Poppins";
    ctx.textAlign = "center";
    ctx.fillText("TERMINATED", canvas.width/2, canvas.height/2 - 40);
    
    ctx.fillStyle = "#fff";
    ctx.font = "24px Poppins";
    ctx.fillText(`Final Sync: ${Math.floor(score)}`, canvas.width/2, canvas.height/2 + 30);
    ctx.font = "18px Poppins";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("Press R to Re-Initialize", canvas.width/2, canvas.height/2 + 80);
}

window.addEventListener('keydown', e => {
    if (gameState === 'GAMEOVER' && e.code === 'KeyR') {
        score = 0;
        lives = 500;
        objects = [];
        gameState = 'PLAYING';
        init();
    }
});

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

window.addEventListener('resize', init);
init();
loop();
