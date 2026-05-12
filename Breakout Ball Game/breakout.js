const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const speedEl = document.getElementById("speed");
const gameOverEl = document.getElementById("game-over");
const finalScoreEl = document.getElementById("final-score");
const letters = document.querySelectorAll(".letter");

let score = 0;
let lives = 3;
let baseSpeed = 4;
let speedMultiplier = 1.0;
let gameActive = true;
let currentSection = 0; // 0 to 7 (B-R-E-A-K-O-U-T)

// Paddle
let paddle = {
    x: 0,
    y: 0,
    width: 150,
    height: 12,
    speed: 12,
    dx: 0
};

// Ball
let ball = {
    x: 0,
    y: 0,
    radius: 10,
    dx: 0,
    dy: 0
};

let bricks = [];
const BRICK_ROWS = 6;
const BRICK_COLS = 12;
const BRICK_PADDING = 10;
const BRICK_TOP_OFFSET = 250; // Pushed down for the title
const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#38bdf8', '#a78bfa', '#f472b6'];

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    paddle.width = Math.max(80, 150 - (currentSection * 10)); // Paddle gets smaller
    paddle.x = canvas.width / 2 - paddle.width / 2;
    paddle.y = canvas.height - 60;

    resetBall();
    createBricks();
    updateTitleProgress();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2 + 100;
    // Speed increases per section
    const sectionBonus = 1 + (currentSection * 0.15);
    const angle = (Math.random() * Math.PI / 2) + Math.PI / 4; 
    ball.dx = Math.cos(angle) * baseSpeed * speedMultiplier * sectionBonus;
    ball.dy = -Math.sin(angle) * baseSpeed * speedMultiplier * sectionBonus;
}

function createBricks() {
    bricks = [];
    const availableWidth = canvas.width - (BRICK_PADDING * (BRICK_COLS + 1));
    const brickWidth = availableWidth / BRICK_COLS;
    const brickHeight = 30;

    // Harder rows as sections progress
    const activeRows = Math.min(10, BRICK_ROWS + Math.floor(currentSection / 2));

    for (let r = 0; r < activeRows; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            bricks.push({
                x: BRICK_PADDING + c * (brickWidth + BRICK_PADDING),
                y: BRICK_TOP_OFFSET + r * (brickHeight + BRICK_PADDING),
                width: brickWidth,
                height: brickHeight,
                color: COLORS[r % COLORS.length],
                active: true,
                strength: (r < currentSection - 2) ? 2 : 1 // Harder bricks in later sections
            });
        }
    }
}

function updateTitleProgress() {
    letters.forEach((l, i) => {
        if (i < currentSection) {
            l.classList.add("active");
        } else {
            l.classList.remove("active");
        }
    });
}

function drawPaddle() {
    ctx.fillStyle = "#38bdf8";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#38bdf8";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#fff";
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawBricks() {
    bricks.forEach(b => {
        if (!b.active) return;
        ctx.fillStyle = b.color;
        ctx.globalAlpha = b.strength === 2 ? 1 : 0.7;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.globalAlpha = 1;
        
        ctx.strokeStyle = b.strength === 2 ? "#fff" : "rgba(0,0,0,0.3)";
        ctx.lineWidth = b.strength === 2 ? 2 : 1;
        ctx.strokeRect(b.x, b.y, b.width, b.height);
    });
}

function movePaddle() {
    paddle.x += paddle.dx;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
}

function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx *= -1;
    }
    if (ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }

    // Death floor
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        livesEl.textContent = lives;
        if (lives <= 0) {
            endGame();
        } else {
            resetBall();
        }
    }

    // Paddle collision
    if (ball.y + ball.radius > paddle.y && 
        ball.x > paddle.x && 
        ball.x < paddle.x + paddle.width && 
        ball.dy > 0) {
        
        const relativeHitX = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        const maxBounceAngle = Math.PI / 3; 
        const bounceAngle = relativeHitX * maxBounceAngle;
        
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = currentSpeed * Math.sin(bounceAngle);
        ball.dy = -currentSpeed * Math.cos(bounceAngle);
    }

    // Brick collision
    bricks.forEach(b => {
        if (!b.active) return;
        if (ball.x + ball.radius > b.x && 
            ball.x - ball.radius < b.x + b.width && 
            ball.y + ball.radius > b.y && 
            ball.y - ball.radius < b.y + b.height) {
            
            b.strength--;
            if (b.strength <= 0) {
                b.active = false;
                score += 10 + (currentSection * 5);
                scoreEl.textContent = score;
            }
            
            ball.dy *= -1;
            speedMultiplier += 0.01;
            speedEl.textContent = (speedMultiplier * (1 + currentSection * 0.15)).toFixed(2);
        }
    });

    // Check Section Clear
    if (bricks.every(b => !b.active)) {
        currentSection++;
        lives += 3;
        livesEl.textContent = lives;
        if (currentSection >= 8) {
            victory();
        } else {
            init(); // Re-init for next section
        }
    }
}

function endGame() {
    gameActive = false;
    gameOverEl.style.display = "block";
    finalScoreEl.textContent = score;
}

function victory() {
    gameActive = false;
    letters.forEach(l => l.classList.add("active"));
    const h2 = gameOverEl.querySelector("h2");
    h2.textContent = "SYSTEM OVERRIDDEN";
    h2.style.color = "#10b981";
    gameOverEl.querySelector("p").textContent = "All Neural Blocks Cleared. Ultimate Access Granted.";
    gameOverEl.style.display = "block";
    finalScoreEl.textContent = score;
}

window.resetGame = function() {
    score = 0;
    lives = 3;
    speedMultiplier = 1.0;
    currentSection = 0;
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    speedEl.textContent = "1.00";
    gameOverEl.style.display = "none";
    gameActive = true;
    init();
};

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") paddle.dx = -paddle.speed;
    if (e.key === "ArrowRight") paddle.dx = paddle.speed;
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") paddle.dx = 0;
});

window.addEventListener("resize", init);

function draw() {
    if (!gameActive) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBricks();
    drawPaddle();
    drawBall();
    
    movePaddle();
    moveBall();
    
    requestAnimationFrame(draw);
}

init();
draw();

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();
