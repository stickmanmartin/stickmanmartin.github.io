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

// Economy & Betting
let playerMoney = 1000;
let currentBet = 0;
let betOn = -1; // -1 means no bet yet

// State management
let isRacing = false;
let raceFinished = false;
let winner = -1;

function setup() {
  createCanvas(4500, 800);
  frameRate(10); // Sped up slightly for better feel

  resetRace();
  
  // Assign unique colors
  for (let i = 0; i < numCaterpillars; i++) {
    caterpillarColors.push(color(random(100, 255), random(100, 255), random(100, 255)));
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
  
  // Draw the HUD (Stays visible)
  drawHUD();

  // Draw lines
  noStroke();
  fill(0);
  rect(startLine, 0, 5, height);
  fill(0, 255, 0);
  rect(finishLine, 0, 20, height);

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
  // We use push/pop to ensure HUD stays at screen left
  push();
  // Follow the "camera" if we wanted scrolling, but here we'll just draw at 0
  // Actually, since canvas is huge, we'll draw HUD based on mouseX or just at fixed positions
  let hudX = max(0, mouseX - 200); 
  if (isRacing) hudX = min(...caterpillarEnds) - 50; // Follow the pack
  
  fill(0, 150);
  rect(hudX, 10, 300, 120, 10);
  fill(255);
  textSize(20);
  textAlign(LEFT);
  text(`💰 Money: $${playerMoney}`, hudX + 20, 40);
  
  if (betOn !== -1 && !raceFinished) {
    text(`🎰 Bet: $${currentBet} on #${betOn + 1}`, hudX + 20, 70);
  } else if (!isRacing && !raceFinished) {
    text(`👉 Click # to bet $100`, hudX + 20, 70);
    text(`(Then click middle to START)`, hudX + 20, 100);
  }
  pop();
}

function writeStart() {
  textSize(40);
  textAlign(CENTER);
  fill(255);
  text("🏁 PLACE YOUR BETS & START!", width / 16, height / 2);
}

function drawCaterpillar(x, y, segments, col, index) {
  for (let i = 0; i < segments; i += 1) {
    fill(col);
    stroke(0);
    strokeWeight(2);
    circle(x, y, 50);
    x += spacing;
  }

  // Eyes
  fill(0);
  stroke(255);
  strokeWeight(3);
  circle(x, y - eyeSize, eyeSize);
  circle(x - eyeSize, y - eyeSize, eyeSize);
  
  // Number tag
  fill(255);
  noStroke();
  textSize(16);
  text(`#${index + 1}`, x - 40, y + 5);
}

function drawCaterpillars() {
  let padding = height / numCaterpillars;
  for (let i = 0; i < numCaterpillars; i += 1) {
    let y = (i + 0.5) * padding;
    let crawl = 4; // Constant segments for drawing
    drawCaterpillar(caterpillarEnds[i], y, crawl, caterpillarColors[i], i);
  }
}

function mousePressed() {
  if (raceFinished) {
    resetRace();
    return;
  }

  if (!isRacing) {
    // Check if clicked near a caterpillar to bet
    let padding = height / numCaterpillars;
    let clickedBet = false;
    for (let i = 0; i < numCaterpillars; i++) {
      let y = (i + 0.5) * padding;
      if (abs(mouseY - y) < 40 && playerMoney >= 100) {
        betOn = i;
        currentBet = 100;
        clickedBet = true;
        break;
      }
    }
    
    if (!clickedBet && betOn !== -1) {
      isRacing = true;
      playerMoney -= currentBet;
    }
  }
}

function moveCaterpillars() {
  for (let i = 0; i < numCaterpillars; i += 1) {
    let move = round(random(5, 15)); // Slower move since frameRate is higher
    caterpillarEnds[i] += move;
  }
}

function checkWinner() {
  if (raceFinished) return;
  
  for (let i = 0; i < caterpillarEnds.length; i += 1) {
    if (caterpillarEnds[i] >= finishLine) {
      raceFinished = true;
      winner = i;
      isRacing = false;
      
      if (betOn === winner) {
        let winnings = currentBet * 5; // 5x payout
        playerMoney += winnings;
      }
      noLoop();
    }
  }
}

function drawWinnerScreen() {
  background(0, 180);
  textAlign(CENTER);
  textSize(60);
  
  if (betOn === winner) {
    fill(0, 255, 100);
    text(`🏆 JACKPOT! #${winner + 1} WON!`, width / 2, height / 2);
    textSize(30);
    text(`You gained $${currentBet * 4}`, width / 2, height / 2 + 80);
  } else {
    fill(255, 50, 50);
    text(`💀 #${winner + 1} WON. YOU LOST.`, width / 2, height / 2);
    textSize(30);
    text(`Better luck next time!`, width / 2, height / 2 + 80);
  }
  
  fill(255);
  textSize(20);
  text("Click anywhere to RACE AGAIN", width / 2, height - 50);
}
