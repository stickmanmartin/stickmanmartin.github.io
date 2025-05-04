const canvas = document.getElementById("gameCanvas");
const ctx =  canvas.getContext("2d");

// Paddle
let paddle = {
    x: canvas.width/2 - 40,
    y: canvas.height - 20,
    width: 80,
    height: 10,
    speed: 7
};
// Ball
let ball = {
    x: canvas.width/2,
    y: canvas.height - 30,
    radius: 8,
    dx: 2,
    dy: -2
};
let z = 0;
let w = 0;
let brick = {
    x: z,
    y: w,
    width: 40,
    height: 20,
    color: "red"
}
let bricks = []

function createBrick(){
    ctx.fillStyle = "red";
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    z+=40
    w+=20
}

// Draw Paddle
function drawPaddle() {
    ctx.fillStyle = "white";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}
// Draw Ball
function drawBall(){
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath(); 
}
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    // Bounce off left/right
    if(ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx *= -1;
    }
    // Bounce off top
    if(ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }
    // Bounce off paddle
    if(ball.x > paddle.x && ball.x < paddle.x + paddle.width && ball.y + ball.radius > paddle.y) {
        ball.dy *= -1;
    }
}

document.addEventListener("keydown", (e) => {
    if(e.key === "ArrowLeft"){
        paddle.x -= 20;
    }
    else if (e.key === "ArrowRight"){
        paddle.x +=20;
    }
});

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawPaddle();
    drawBall();
    moveBall();
    createBrick();
    
    requestAnimationFrame(draw);
}

draw();