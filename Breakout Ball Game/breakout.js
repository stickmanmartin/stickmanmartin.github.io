const canvas = document.getElementById("gameCanvas");
const ctx = canavas.getElementById("2d")

let paddleX = 200;

function drawPaddle(){
    ctx.fillStyle = "black";
    ctx.fillRect(200,300,80,10);
}

document.addEventListener("keydown", (e) => {
    if(e.key === "ArrowLeft"){
        paddleX -= 20;
    }
    else if (e.key === "ArrowRight"){
        paddleX += 20;
    }
    ctx.clearRect(0,0,canvas.replaceCanvas.width,canvas.height);
    drawPaddle();
});