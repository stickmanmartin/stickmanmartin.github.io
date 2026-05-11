// Set variables to draw the racetrack.
let startLine = 30;
let finishLine = 4400;

// Set variables for the caterpillar.
let spacing = 20;
let segmentSize = 30;
let eyeSize = 15;

// Set variables for the race.
let numCaterpillars = 10;
let caterpillarEnds = [];
let caterpillarColors = [];
let obstacles = []; // New: Obstacles and boosts

// Economy & Betting
let playerMoney = 1000;
let currentBet = 0;
let betOn = -1;

// State management
let isRacing = false;
let raceFinished = false;
let winner = -1;
let startBtn;

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(15); 

  resetRace();
  
  // Assign unique colors
  for (let i = 0; i < numCaterpillars; i++) {
    caterpillarColors.push(color(random(100, 255), random(100, 255), random(100, 255)));
  }

  // Create physical button at the bottom
  startBtn = createButton('🚀 START THE RACE');
  startBtn.position(20, height + 10);
  startBtn.size(200, 50);
  startBtn.style('background', '#00f2ff');
  startBtn.style('font-weight', 'bold');
  startBtn.style('border-radius', '10px');
  startBtn.style('cursor', 'pointer');
  startBtn.mousePressed(beginRace);

  // Generate track obstacles
  for(let i=0; i<30; i++) {
    obstacles.push({
        x: random(500, 4000),
        y: random(0, height),
        type: random() < 0.5 ? 'mud' : 'leaf' // mud slows, leaf speeds up
    });
  }
}

function beginRace() {
    if (!isRacing && !raceFinished && betOn !== -1) {
        isRacing = true;
        playerMoney -= currentBet;
    } else if (raceFinished) {
        resetRace();
    } else if (betOn === -1) {
        alert("Please place a bet on a caterpillar first!");
    }
}

function resetRace() {
  caterpillarEnds = [];
  for (let i = 0; i < numCaterpillars; i++) {
    caterpillarEnds.push(startLine);
  }
  isRacing = false;
  raceFinished = false;
  winner = -1;
  loop();
}

function draw() {
  background(121, 96, 76);
  
  drawHUD();

  // Draw lines
  noStroke();
  fill(0);
  rect(startLine, 0, 5, height);
  fill(0, 255, 0);
  rect(finishLine, 0, 20, height);

  // Draw obstacles
  obstacles.forEach(o => {
      fill(o.type === 'mud' ? '#4b2c20' : '#4caf50');
      ellipse(o.x, o.y, 40, 20);
  });

  if (isRacing === true) {
    moveCaterpillars();
  } else if (!raceFinished) {
    writeStart();
  }

  drawCaterpillars();
  checkWinner();
  
  if (raceFinished) {
    drawWinnerScreen();
  }
}

function drawHUD() {
  push();
  let hudX = max(0, mouseX - 200); 
  if (isRacing) hudX = min(...caterpillarEnds) - 50;
  
  fill(0, 180);
  stroke(0, 242, 255);
  rect(hudX, 10, 320, 140, 15);
  
  noStroke();
  fill(255);
  textSize(22);
  text(`💰 Funds: $${playerMoney}`, hudX + 20, 45);
  
  if (betOn !== -1 && !raceFinished) {
    fill(255, 215, 0);
    text(`🎰 ACTIVE: $${currentBet} on #${betOn + 1}`, hudX + 20, 80);
  } else if (!isRacing && !raceFinished) {
    fill(200);
    textSize(16);
    text(`1. Click a caterpillar to set bet`, hudX + 20, 80);
    text(`2. Use button below to START`, hudX + 20, 105);
  }
  pop();
}

function writeStart() {
  textSize(40);
  textAlign(CENTER);
  fill(255);
  text("🏁 READY TO ROLL?", width / 16, height / 2);
}

function drawCaterpillar(x, y, segments, col, index) {
  for (let i = 0; i < segments; i += 1) {
    fill(col);
    stroke(0);
    circle(x, y, 50);
    x += spacing;
  }
  fill(0);
  stroke(255);
  circle(x, y - eyeSize, eyeSize);
  circle(x - eyeSize, y - eyeSize, eyeSize);
  
  fill(255);
  noStroke();
  textSize(18);
  text(`#${index + 1}`, x - 45, y + 5);
}

function drawCaterpillars() {
  let padding = height / numCaterpillars;
  for (let i = 0; i < numCaterpillars; i += 1) {
    let y = (i + 0.5) * padding;
    drawCaterpillar(caterpillarEnds[i], y, 4, caterpillarColors[i], i);
  }
}

function mousePressed() {
  if (raceFinished) {
    resetRace();
    return;
  }

  if (!isRacing) {
    let padding = height / numCaterpillars;
    for (let i = 0; i < numCaterpillars; i++) {
      let y = (i + 0.5) * padding;
      if (abs(mouseY - y) < 40) {
        let amount = prompt("How much do you want to bet? (Min $10)", "100");
        amount = parseInt(amount);
        if (!isNaN(amount) && amount >= 10 && amount <= playerMoney) {
            betOn = i;
            currentBet = amount;
        }
        break;
      }
    }
  }
}

function moveCaterpillars() {
  for (let i = 0; i < numCaterpillars; i += 1) {
    let speed = random(5, 20);
    
    // Check for obstacles
    obstacles.forEach(o => {
        let y = (i + 0.5) * (height / numCaterpillars);
        if (dist(caterpillarEnds[i], y, o.x, o.y) < 50) {
            speed *= (o.type === 'mud' ? 0.5 : 1.5);
        }
    });

    caterpillarEnds[i] += speed;
  }
}

function checkWinner() {
  if (raceFinished) return;
  for (let i = 0; i < caterpillarEnds.length; i += 1) {
    if (caterpillarEnds[i] >= finishLine) {
      raceFinished = true;
      winner = i;
      if (betOn === winner) playerMoney += currentBet * 5;
      noLoop();
    }
  }
}

function drawWinnerScreen() {
  background(0, 200);
  textAlign(CENTER);
  textSize(60);
  if (betOn === winner) {
    fill(0, 255, 150);
    text(`🏆 JACKPOT! #${winner + 1} WON!`, width / 2, height / 2);
    textSize(30);
    text(`Payout: $${currentBet * 5}`, width / 2, height / 2 + 80);
  } else {
    fill(255, 50, 50);
    text(`💀 #${winner + 1} WON. YOU LOST.`, width / 2, height / 2);
  }
  fill(255);
  textSize(20);
  text("Click to RESET", width / 2, height - 50);
}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
