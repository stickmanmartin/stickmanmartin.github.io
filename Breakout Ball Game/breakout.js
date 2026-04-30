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

let bricks = []



function createBrick(inputx){
    let brick = {
        x: inputx,
        y: 0,
        width: 40,
        height: 20,
        color: "red"
    }
    bricks.push(brick);
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

    // Brick collision
    for(let i = 0; i < bricks.length; i++) {
        let b = bricks[i];
        if(ball.x > b.x && ball.x < b.x + b.width && ball.y > b.y && ball.y < b.y + b.height) {
            ball.dy *= -1;
            bricks.splice(i, 1);
            i--;
        }
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

for(let x =0;x<canvas.width;x+=40){
    createBrick(x);
}


function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    bricks.forEach((brick,index)=>{
    
        ctx.fillStyle = "red";
        ctx.fillRect(brick.x, brick.y,brick.width,brick.height);
    })
    

    drawPaddle();
    drawBall();
    moveBall();
    requestAnimationFrame(draw);
}

draw();