const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const diesound = document.getElementById("coolsound");
const punch = document.getElementById("punch");
const round2 = document.getElementById("round2");
let round = "round1";

let basket = {
    x: 175,
    y: 450,
    width: 50, 
    height: 20,
    speed: 5
};

let x = 51;
let objects = [];
let waves = -1;
let lives = 500;
let maxwaves = 47;

function createObject(speed){
    let object = {
        x:Math.random()* (canvas.width-20),
        y: 0,
        width: 20,
        height: 20,
        speed: 1 + Math.random()*3 ,
    }
    objects.push(object)
}

function drawBasket(){
    ctx.fillStyle = "brown";
    ctx.fillRect(basket.x,basket.y,basket.width,basket.height);
}

function drawLives(){
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("HP: " + lives, 50, 30)
}

function drawWin1(){
    ctx.fillStyle = "Red";
    ctx.font = "50px Arial";
    ctx.fillText("You Win!!!", 100, 300)
    ctx.fillStyle = "Yellow";
    ctx.font = "30px Arial";
    ctx.fillText("You Survived Round 1", 80, 200)
}

function drawWaves(){
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Waves Survived: " + waves, 200, 30)
}

function drawContinue(){
    ctx.fillStyle = "blue";
    ctx.font = "30px Arial";
    ctx.fillText("click 'c' or 'C' to Continue", 60, 400)
}

function drawR(){
    ctx.fillStyle = "yellow";
    ctx.font = "15px Arial";
    ctx.fillText("Click `R` or `r` To Restart Once You Have Lost", 50, canvas.height/2 - 80)
}

document.addEventListener("keydown", (event) => {
    if(event.key === "ArrowLeft" && basket.x > 0){
        basket.x -= basket.speed*5;
    } else if (event.key === "ArrowRight" && basket.x + basket.width<canvas.width){
        basket.x += basket.speed*5
    } else if (lives<=0 && (event.key === "r" || event.key === "R")){
        lives = 500;
        waves = -1;
        objects = [];
        update();
        punch.play();
    } if (waves === x && lives > 0 && (event.key === "c" || event.key === "C")){
        lives += 100;
        round2.play();
        round = "round2";
        update();
    }


});

function update(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    drawBasket();
    drawLives();
    drawWaves();


    objects.forEach((obj,index)=>{
        obj.y += obj.speed;
        if (obj.y + obj.height >= basket.y && obj.x >= basket.x && obj.x <= basket.x+basket.width){
            objects.splice(index,1)
            lives -= 10;
            punch.play();
        }

        if(obj.y > canvas.height){
            objects.splice(index,1)
        }

        ctx.fillStyle = "red";
        ctx.fillRect(obj.x, obj.y,obj.width,obj.height);
    })

    if (Math.random() < 0.06 && objects.length === 0){
        let twmp = maxwaves > waves ? waves : maxwaves;
        for (let index = 0; index < 2 + twmp; index++) {
            createObject(1.0*waves/10);
        }
        waves++;
        
       
    }

    if (lives == 0 && lives < 10){
        ctx.fillStyle = "black";
        ctx.font = "50px Arial";
        ctx.fillText("Game Over!",canvas.width/2-120, canvas.height/2);
        drawR();
        diesound.play();


        return;
    }

    if (waves === x && lives > 0 && round === "round1"){
        drawWin1();
        drawContinue();
        return;
    }


    requestAnimationFrame(update);
}

update();
