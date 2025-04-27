const canvas = document.getElementById("gameCanvas");
const ctx =  canvas.getContext("2d");

let paddleX = 200;

function drawPaddle(){
    ctx.fillStyle = "black";
    ctx.fillRect(paddleX,300,80,10);
}

function drawBall(){
    ctx.beginPath();
    ctx.arc(240,290,8,0,Math.PI*2);
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