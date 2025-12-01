// === Config ===
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/btvlWZOp3/";
const CANVAS_WIDTH = 640, CANVAS_HEIGHT = 200;
const PLAYER_Y = 140, PLAYER_W = 30, PLAYER_H = 30;
const PREDICT_INTERVAL = 150; // ms
const MAX_LEVEL = 5;

// === Game state ===
let playerX, moving, finished, win;
let level = 1;
let playerSpeed = 5;
let goalStart, goalEnd;

// === Scoring ===
let score = 0;
let highScore = 0; // could swap for localStorage later

// === AI state ===
let model = null, video = null;
let aiLabel = "idle", lastAiLabel = "idle";
let aiEnabled = true; // set false for keyboard-only

function resetGame(newLevel = level) {
  level = newLevel;
  playerSpeed = 5 + (level - 1) * 1.2; // speed up each level
  setGoalForLevel(level);

  playerX = 20;
  moving = false;
  finished = false;
  win = false;
  loop(); // restart draw loop
}

function setGoalForLevel(lvl) {
  // Goal moves across the screen by level
  const zoneWidth = 100 - lvl * 10; // narrower with higher levels
  goalStart = 300 + (lvl - 1) * 40;
  goalEnd = goalStart + zoneWidth;

  // Clamp so it stays inside canvas
  if (goalEnd > CANVAS_WIDTH - 20) {
    goalEnd = CANVAS_WIDTH - 20;
    goalStart = goalEnd - zoneWidth;
  }
}

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  textFont("system-ui, sans-serif");
  resetGame(1);

  // webcam (hidden)
  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();

  // load TM model
  tmImage
    .load(MODEL_URL + "model.json", MODEL_URL + "metadata.json")
    .then(m => {
      model = m;
      startClassifyLoop();
    })
    .catch(err => console.error("Model load failed:", err));
}

function startClassifyLoop() {
  setInterval(async () => {
    if (!model || !video) return;
    try {
      const preds = await model.predict(video.elt);
      preds.sort((a, b) => b.probability - a.probability);
      aiLabel = preds[0].className.toLowerCase();
    } catch (err) {
      console.error("Predict error:", err);
    }
  }, PREDICT_INTERVAL);
}

function draw() {
  background(240);
  drawGoalZone();
  handleAI();
  updatePlayer();
  drawPlayer();
  drawHUD();
}

// --- Rendering helpers ---
function drawGoalZone() {
  noStroke();
  fill(190, 240, 200);
  rect(goalStart, 0, goalEnd - goalStart, height);
}

function drawPlayer() {
  fill(40);
  rect(playerX, PLAYER_Y - PLAYER_H, PLAYER_W, PLAYER_H, 6);
}

function drawHUD() {
  fill(0);
  textSize(14);

  // Messages
  if (!finished) {
    text(`Level ${level} — Goal: stop in green zone`, 10, 20);
    text("Press G/open palm = GO, S/fist = STOP", 10, 40);
  } else {
    if (win) {
      if (level < MAX_LEVEL) {
        text(`🎉 You WIN Level ${level}! Press N for next level`, 10, 20);
      } else {
        text("🏆 You beat all levels! Press R to restart", 10, 20);
      }
    } else {
      text(`❌ Missed! Press R to retry Level ${level}`, 10, 20);
    }
  }

  // Scores
  text(`Score: ${score}`, 10, height - 70);
  text(`High Score: ${highScore}`, 10, height - 50);

  // AI info + webcam
  text("AI Label: " + aiLabel, 10, height - 30);
  image(video, width - 130, height - 100, 120, 90);
}

// --- Logic ---
function handleAI() {
  if (!aiEnabled || finished) return;

  if (aiLabel === "go") moving = true;

  if (aiLabel === "stop" && lastAiLabel !== "stop") {
    stopAndCheckWin();
  }
  lastAiLabel = aiLabel;
}

function updatePlayer() {
  if (!finished && moving) playerX += playerSpeed;

  if (!finished && playerX > width - PLAYER_W) {
    finished = true;
    win = false;
    noLoop();
  }
}

function stopAndCheckWin() {
  moving = false;
  finished = true;
  win = playerX >= goalStart && playerX + PLAYER_W <= goalEnd;

  if (win) {
    // award points
    let points = 100 + (level - 1) * 50; // more points for higher levels
    score += points;
    highScore = Math.max(highScore, score);
  }

  noLoop();
}

// --- Keyboard fallback ---
function keyPressed() {
  if (key.toLowerCase() === "g") moving = true;
  if (key.toLowerCase() === "s" && !finished) stopAndCheckWin();
  if (key.toLowerCase() === "r") resetGame(level); // retry same level
  if (key.toLowerCase() === "n" && win && level < MAX_LEVEL) {
    resetGame(level + 1); // advance level
  }
  if (key.toLowerCase() === "r" && win && level >= MAX_LEVEL) {
    // restart full run
    score = 0;
    resetGame(1);
  }
}
