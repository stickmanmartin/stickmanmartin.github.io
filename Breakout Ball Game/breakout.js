const canvas = document.getElementById("gameCanvas");
const ctx =  canvas.getContext("2d");

let paddleX = 200;
let ballX = 240;
let ballY = 290;
let ballDX = 2;
let ballDY = -2;

function drawPaddle(){
    ctx.fillStyle = "black";
    ctx.fillRect(paddleX,300,80,10);
}

function drawBall(){
    ctx.beginPath();
    ctx.arc(ballX,ballY,8,0,Math.PI*2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
}

function moveBall(){
    ballX += ballDX;
    ballY += ballDY;
}

document.addEventListener("keydown", (e) => {
    if(e.key === "ArrowLeft"){
        paddleX -= 20;
    }
    else if (e.key === "ArrowRight"){
        paddleX +=20;
    }
});


function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawPaddle();
    drawBall();
    moveBall();
    requestAnimationFrame(draw);
}

draw();