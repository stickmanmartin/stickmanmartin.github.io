const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const towerPool = [
  { name: "Rapid Shooter", type: "rapid", desc: "Fast shooting", fireRate: 100, damage: 5, range: 200, level: 1 },
  { name: "Sniper Tower", type: "sniper", desc: "Slow, long range, high dmg", fireRate: 800, damage: 30, range: 800, level: 1 },
  { name: "Splash Tower", type: "splash", desc: "AoE splash dmg", fireRate: 400, damage: 12, range: 250, level: 1 },
  { name: "Bomb Tower", type: "bomb", desc: "Big AoE bomb", fireRate: 1000, damage: 40, range: 300, level: 1 },
  { name: "Flamethrower", type: "flame", desc: "Short range, rapid dmg", fireRate: 50, damage: 3, range: 150, level: 1 },
  { name: "Freezer Tower", type: "freeze", desc: "Slows enemies", fireRate: 400, damage: 8, range: 200, level: 1 },
  { name: "Tesla Tower", type: "tesla", desc: "Chains to multiple", fireRate: 500, damage: 20, range: 300, level: 1 },
  { name: "Multi-Shot Tower", type: "multi", desc: "Shoots 3 spread", fireRate: 300, damage: 7, range: 220, level: 1 },
  { name: "Critical Tower", type: "crit", desc: "Chance x3 dmg", fireRate: 500, damage: 10, range: 250, level: 1 },
  { name: "Poison Tower", type: "poison", desc: "Applies poison DoT", fireRate: 400, damage: 5, range: 240, level: 1 },
];

const towerColors = {
  rapid: "#3B82F6",
  sniper: "#EF4444",
  splash: "#F59E0B",
  bomb: "#7C3AED",
  flame: "#FB923C",
  freeze: "#06B6D4",
  tesla: "#A855F7",
  multi: "#84CC16",
  crit: "#EAB308",
  poison: "#10B981",
};

let towers = [];
let enemies = [];
let bullets = [];
let round = 1;
let xp = 0;
let money = 0;
let level = 1;
let gameOver = false;
let upgrades = { damage: 1, firerate: 1, slots: 3 }; // Start with 3 tower slots
let baseHp = 1000; // Base Health
const maxBaseHp = 1000; // Max base HP

let awaitingLevelUpChoice = false; // Flag to indicate if player needs to make a level up choice
let awaitingTowerPlacement = false; // Flag to indicate if player needs to place a tower
let currentTowerToPlace = null; // Stores the tower object chosen to be placed

const choicesDiv = document.getElementById('choices');
const shopDiv = document.getElementById('shop');
const hud = document.getElementById('hud');
const gameMessageDiv = document.getElementById('gameMessage');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const levelUpOptionsDiv = document.getElementById('levelUpOptions');


// Helper to display a modal with dynamic content
function showModal(title, contentHtml, buttons = []) {
    modalContent.innerHTML = `<h2>${title}</h2><div id="modalBody">${contentHtml}</div>`;
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttons.forEach(btnInfo => {
        const btn = document.createElement('button');
        btn.textContent = btnInfo.text;
        btn.onclick = btnInfo.onClick;
        btn.style.margin = '0 5px';
        buttonContainer.appendChild(btn);
    });
    modalContent.appendChild(buttonContainer);
    modalOverlay.style.display = 'flex';
}

function hideModal() {
    modalOverlay.style.display = 'none';
}

// Function to show game messages
function showGameMessage(message, duration = 2000) {
    gameMessageDiv.textContent = message;
    gameMessageDiv.style.display = 'block';
    if (duration > 0) {
        setTimeout(() => {
            gameMessageDiv.style.display = 'none';
        }, duration);
    }
}

// Circular distance for range check
function inRange(t, e) {
  if (t.type === "sniper") {
    const dy = e.y - t.y;
    return Math.abs(dy) <= t.range;
  } else {
    const dx = e.x - t.x;
    const dy = e.y - t.y;
    return Math.sqrt(dx*dx + dy*dy) <= t.range;
  }
}

function spawnEnemies() {
  enemies = [];
  for (let i = 0; i < 5 + round * 3; i++) {
    enemies.push({
      x: Math.random()*580+10,
      y: -Math.random()*300,
      hp: 30 + round*20,
      maxHp: 30 + round*20,
      speed: 1 + round*0.3,
      poison: 0,
      slow: 1
    });
  }
}

// New function to handle placing a chosen tower
function placeTower(tower, slotX, slotY) {
    if (towers.length >= upgrades.slots) {
        showGameMessage("No available tower slots!", 2000);
        return false;
    }
    
    // Check if the chosen slot is already occupied
    const occupied = towers.some(t => t.x === slotX && t.y === slotY);
    if (occupied) {
        showGameMessage("This slot is already taken!", 2000);
        return false;
    }

    towers.push({...tower, x: slotX, y: slotY, lastShot: 0, currentLevel: 1});
    showGameMessage(`${tower.name} placed!`, 1500);
    return true;
}

function showTowerPlacementGrid(towerToPlace) {
    currentTowerToPlace = towerToPlace;
    awaitingTowerPlacement = true;
    let content = `<p>Click on an empty slot to place your new <b>${towerToPlace.name}</b> tower:</p><div class="placement-grid">`;

    // Define potential placement spots (e.g., a few rows at the bottom of the canvas)
    const placementSpots = [];
    const cellSize = 60; // Size of each slot visual
    const startY = canvas.height - 100; // Start higher up for placement
    const startX = 50;

    for (let row = 0; row < 2; row++) { // 2 rows
        for (let col = 0; col < Math.floor((canvas.width - 2 * startX) / cellSize) + 1; col++) { // Fill horizontally
            placementSpots.push({
                x: startX + col * cellSize + cellSize / 2, // Center of the slot
                y: startY + row * cellSize + cellSize / 2
            });
        }
    }

    placementSpots.forEach((spot, index) => {
        const isOccupied = towers.some(t => t.x === spot.x && t.y === spot.y);
        content += `<div class="placement-slot ${isOccupied ? 'taken' : ''}" 
                        onclick="handlePlacementClick(${spot.x}, ${spot.y}, ${isOccupied})">
                        ${isOccupied ? 'X' : ''}
                    </div>`;
    });
    content += '</div>';

    showModal("Place Your Tower", content);
}

function handlePlacementClick(x, y, isOccupied) {
    if (isOccupied) {
        showGameMessage("This spot is already taken! Choose another.", 1500);
        return;
    }
    if (currentTowerToPlace && awaitingTowerPlacement) {
        const placed = placeTower(currentTowerToPlace, x, y);
        if (placed) {
            awaitingTowerPlacement = false;
            currentTowerToPlace = null;
            hideModal();
            // Decide what to do next based on why we were placing the tower
            if (awaitingLevelUpChoice) {
                // If it was for level up, now offer tower upgrade
                showGameMessage("Tower picked! Now, choose an existing tower to upgrade.", 2500);
                offerTowerUpgrade();
            } else {
                // Otherwise, just continue the game (round start)
                continueGame();
            }
        }
    }
}


function showTowerChoices(isLevelUpChoice = false) {
  let content = '<div class="choices" style="display:grid;">';
  const shuffled = [...towerPool].sort(()=>0.5 - Math.random()).slice(0,3);
  shuffled.forEach(t=>{
    content += `
      <div class="card">
        <h3>${t.name}</h3>
        <p>${t.desc}</p>
        <button onclick="selectTowerForPlacement(${JSON.stringify(t).replace(/"/g, '&quot;')})">Pick</button>
      </div>
    `;
  });
  content += '</div>';

  showModal(isLevelUpChoice ? "LEVEL UP! Pick a New Tower" : `Round ${round} - Pick a New Tower`, content);
}

function selectTowerForPlacement(tower) {
    hideModal(); // Hide tower choices modal
    showTowerPlacementGrid(tower); // Then show placement grid
}


function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // enemies
  enemies.forEach(e=>{
    ctx.fillStyle = "red";
    ctx.fillRect(e.x-10, e.y-10, 20, 20);
    // hp bar
    ctx.fillStyle = "green";
    ctx.fillRect(e.x-10, e.y-15, Math.max(0, (e.hp/e.maxHp)*20), 3);
  });

  // towers
  towers.forEach(t=>{
    ctx.beginPath();
    ctx.arc(t.x, t.y, 12, 0, Math.PI*2);
    ctx.fillStyle = towerColors[t.type] || "gray";
    ctx.shadowColor = "white";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Display tower level
    if (t.currentLevel > 1) {
        ctx.fillStyle = "gold";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`L${t.currentLevel}`, t.x, t.y + 4);
    }


    // optional: draw range circle for debugging / visualization
    ctx.beginPath();
    if (t.type === "sniper") {
        // Draw a horizontal line for sniper range, extending to canvas sides
        ctx.moveTo(0, t.y - t.range);
        ctx.lineTo(canvas.width, t.y - t.range);
        ctx.moveTo(0, t.y + t.range);
        ctx.lineTo(canvas.width, t.y + t.range);
    } else {
        // Draw a circle for other towers, capped at canvas boundaries if range is too big
        ctx.arc(t.x, t.y, Math.min(t.range, canvas.width, canvas.height), 0, Math.PI*2);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.stroke();
  });

  // bullets
  bullets.forEach(b=>{
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI*2);
    ctx.fillStyle = "black";
    ctx.fill();
  });

  // Draw Base HP Bar
  ctx.fillStyle = "lightgray";
  ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
  ctx.fillStyle = "darkgreen";
  ctx.fillRect(0, canvas.height - 30, Math.max(0, (baseHp / maxBaseHp) * canvas.width), 30);
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`BASE HP: ${Math.floor(baseHp)}/${maxBaseHp}`, canvas.width / 2, canvas.height - 10);
}

function update(delta) {
  if (gameOver || awaitingLevelUpChoice || awaitingTowerPlacement) {
    // If any modal is active, stop game logic update
    return;
  }

  enemies.forEach(e=>{
    if (e.poison > 0) { e.hp -= 0.2; e.poison -= 0.2; }
    e.y += e.speed * e.slow;
    if (e.y > canvas.height - 30) { // If enemy reaches the base line
      baseHp -= 10; // Reduce base HP
      e.hp = 0; // Remove enemy from game
      if (baseHp <= 0) {
        gameOver = true;
        showGameMessage("GAME OVER!", 0); // Show persistent message
        showShop(true); // Show shop on game over
      }
    }
  });
  enemies = enemies.filter(e=>e.hp>0);

  // bullets move toward targets
    bullets.forEach(b=>{
    const dx = b.target.x - b.x;
    const dy = b.target.y - b.y;
    const dist = Math.sqrt(dx*dx+dy*dy);
    const speed = 10;

    if (dist < speed) {
      applyTowerDamage(b.tower, b.target);
      b.hit = true;
    } else {
      b.x += (dx / dist) * speed;
      b.y += (dy / dist) * speed;
    }
  });
  bullets = bullets.filter(b=>!b.hit && b.target.hp > 0);

  // level up system: every 100 XP → +1 level
  const newLevel = Math.floor(xp / 100) + 1;
  if (newLevel > level) {
    level = newLevel;
    money += 50 * level;
    showGameMessage(`LEVEL UP! You are now Level ${level}!`, 2500);
    awaitingLevelUpChoice = true;
    showLevelUpOptions();
  }

  if (enemies.length === 0 && !gameOver && !awaitingLevelUpChoice && !awaitingTowerPlacement) {
    // This block now correctly handles round progression
    round++; // Increment round AFTER the previous one is cleared
    showGameMessage(`Round ${round} Approaching! Get ready for your choices.`, 3000);
    showShop(true); // Show shop, then it will lead to tower choices
  }
}

function applyTowerDamage(t, target){
  if (target.hp <= 0) return;
  const dmg = t.damage * upgrades.damage;
  let didDamage = false;

  switch(t.type){
    case "rapid":
    case "sniper":
      target.hp -= dmg;
      didDamage = true;
      break;
    case "splash":
    case "bomb":
      enemies.forEach(e=>{
          if(inRange(t,e) && e.y > 0) {
              e.hp -= dmg;
              didDamage = true;
          }
      });
      break;
    case "flame":
      enemies.forEach(e=>{
          if(inRange(t,e) && e.y > 0) {
              e.hp -= dmg*0.5;
              didDamage = true;
          }
      });
      break;
    case "freeze":
      target.hp -= dmg;
      target.slow = 0.5;
      setTimeout(()=>target.slow=1,2000);
      didDamage = true;
      break;
    case "tesla":
      const chain = enemies.filter(e=>inRange(t,e) && e.y > 0 && e.hp > 0).sort((a,b)=> Math.sqrt((a.x-t.x)**2 + (a.y-t.y)**2) - Math.sqrt((b.x-t.x)**2 + (b.y-t.y)**2)).slice(0,3);
      chain.forEach((e,i)=>{
          e.hp-=dmg*(1 - i*0.3);
          didDamage = true;
      });
      break;
    case "multi":
      enemies.filter(e=>inRange(t,e) && e.y > 0 && e.hp > 0).sort((a,b)=> Math.sqrt((a.x-t.x)**2 + (a.y-t.y)**2) - Math.sqrt((b.x-t.x)**2 + (b.y-t.y)**2)).slice(0,3).forEach(e=>{
          e.hp-=dmg;
          didDamage = true;
      });
      break;
    case "crit":
      target.hp -= Math.random()<0.25? dmg*3 : dmg;
      didDamage = true;
      break;
    case "poison":
      target.hp -= dmg;
      target.poison += 20;
      didDamage = true;
      break;
  }

  if (target.hp <= 0 && didDamage) {
    xp += 10 + round;
    money += 5 + round;
  }
}

function shoot(delta) {
  if (gameOver || awaitingLevelUpChoice || awaitingTowerPlacement) {
    // If any modal is active, towers should not shoot
    return;
  }
  towers.forEach(t=>{
    t.lastShot += delta;
    const rate = t.fireRate * upgrades.firerate;
    if (t.lastShot < rate) return;

    const target = enemies.find(e=>inRange(t,e) && e.y > 0 && e.hp > 0);
    if (!target) return;

    t.lastShot = 0;

    bullets.push({
      x: t.x,
      y: t.y,
      target: target,
      tower: t,
      hit: false
    });
  });
}

let lastTime = performance.now();
let animationFrameId;
function gameLoop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  update(delta);
  shoot(delta);
  draw();
  hud.textContent = `Round: ${round} | XP: ${xp} | Level: ${level} | Money: $${money} | Base HP: ${Math.floor(baseHp)}/${maxBaseHp} | Tower Slots: ${towers.length}/${upgrades.slots}`;

  if (!gameOver) {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

function restartGame() {
  cancelAnimationFrame(animationFrameId);
  animationFrameId = null; // Clear animation frame ID
  towers = [];
  enemies = [];
  bullets = [];
  round = 1;
  xp = 0;
  money = 0;
  level = 1;
  gameOver = false;
  upgrades = { damage: 1, firerate: 1, slots: 3 }; // Start with 3 tower slots
  baseHp = maxBaseHp;
  gameMessageDiv.style.display = 'none';
  hideModal();
  awaitingLevelUpChoice = false;
  awaitingTowerPlacement = false;
  currentTowerToPlace = null;
  
  // Start the first round sequence
  showShop(true); 
}

function continueGame() {
    hideModal();
    // Ensure flags are reset
    awaitingLevelUpChoice = false;
    awaitingTowerPlacement = false;
    currentTowerToPlace = null;

    // Only spawn enemies if there are no enemies left (i.e., beginning of a new round)
    // The `update` function handles the `enemies.length === 0` condition to trigger shop/choices
    // So here, we just make sure the game loop is active.
    if (enemies.length === 0 && !gameOver) {
        spawnEnemies();
    }
    
    // Ensure game loop is running
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function showShop(fromRoundEnd = false) {
    let shopContent = '<div class="shop" style="display:grid;">';
    const upgradesList = [
        { name: "Damage Boost", desc: "+20% global tower damage", cost: 50 * level, type:"damage", value: 0.2},
        { name: "Fire Rate Boost", desc: "-20% global tower fire rate (faster)", cost: 75 * level, type:"firerate", value: 0.8},
        { name: "Extra Tower Slot", desc: "+1 tower slot", cost: 100 * level, type:"slot", value: 1},
        { name: "Heal Base", desc: "+250 Base HP", cost: 40 * level, type:"heal", value: 250}
    ];

    upgradesList.forEach(u=>{
        shopContent += `
            <div class="card">
                <h3>${u.name}</h3>
                <p>${u.desc}</p>
                <button onclick="buyUpgrade('${u.type}', ${u.value}, ${u.cost}, '${u.name}')">Buy ($${u.cost})</button>
            </div>
        `;
    });
    shopContent += '</div>';

    let modalButtons = [];
    if (gameOver) {
        modalButtons.push({ text: "Restart Game", onClick: restartGame });
    } else if (fromRoundEnd) {
        // If coming from round end, the next step is to pick a new tower
        modalButtons.push({ text: "Done Shopping, Pick New Tower", onClick: () => showTowerChoices(false) });
    } else if (awaitingLevelUpChoice) {
        // If it's a level-up shop visit, allow returning to level-up options
        modalButtons.push({ text: "Done Shopping, Back to Level Up Choices", onClick: showLevelUpOptions });
    } else {
        // Otherwise, simply continue the game
        modalButtons.push({ text: "Continue Game", onClick: continueGame });
    }

    showModal("Shop", shopContent, modalButtons);
}

function buyUpgrade(type, value, cost, name) {
    if (money < cost) {
        showGameMessage("Not enough money!", 1500);
        return;
    }
    money -= cost;
    if (type === 'damage') upgrades.damage *= (1 + value);
    if (type === 'firerate') upgrades.firerate *= value;
    if (type === 'slot') upgrades.slots += value;
    if (type === 'heal') baseHp = Math.min(maxBaseHp, baseHp + value);
    showGameMessage(`${name} purchased!`, 1500);
    showShop(awaitingLevelUpChoice); // Refresh shop with updated money/status
}


function showLevelUpOptions() {
    awaitingLevelUpChoice = true; // Ensure game loop is paused

    let content = `
        <p>Congratulations, you reached Level ${level}! Choose your bonus:</p>
        <div class="level-up-options" style="display:grid;">
            <div class="card">
                <h3>Get a New Tower</h3>
                <p>Pick one of three random towers to add to your defense.</p>
                <button onclick="showTowerChoices(true)">Pick Tower</button>
            </div>
            <div class="card">
                <h3>Upgrade an Existing Tower</h3>
                <p>Choose one of your existing towers to improve its stats.</p>
                <button onclick="offerTowerUpgrade()">Upgrade Tower</button>
            </div>
            <div class="card">
                <h3>Visit Shop</h3>
                <p>Buy global upgrades or heal your base with your money.</p>
                <button onclick="showShop(false)">Go to Shop</button>
            </div>
        </div>
    `;

    showModal("Level Up!", content);
}


function offerTowerUpgrade() {
    if (towers.length === 0) {
        showGameMessage("You have no towers to upgrade!", 2000);
        showLevelUpOptions(); // Go back to level up choices
        return;
    }

    let upgradeContent = `
        <p>Select a tower to upgrade its Damage, Fire Rate, or Range:</p>
        <div class="level-up-options" style="display:grid;">
    `;
    towers.forEach((t, index) => {
        upgradeContent += `
            <div class="card">
                <h3>${t.name} (L${t.currentLevel})</h3>
                <p>Damage: ${t.damage.toFixed(1)} | Fire Rate: ${t.fireRate.toFixed(1)} | Range: ${t.range.toFixed(0)}</p>
                <button onclick="applyTowerUpgrade(${index}, 'damage')">Upgrade Damage</button>
                <button onclick="applyTowerUpgrade(${index}, 'firerate')">Upgrade Fire Rate</button>
                <button onclick="applyTowerUpgrade(${index}, 'range')">Upgrade Range</button>
            </div>
        `;
    });
    upgradeContent += '</div>';

    showModal("Upgrade Tower", upgradeContent);
}

function applyTowerUpgrade(towerIndex, upgradeType) {
    const tower = towers[towerIndex];
    if (!tower) return;

    tower.currentLevel = (tower.currentLevel || 1) + 1; // Increment tower's individual level

    switch (upgradeType) {
        case 'damage':
            tower.damage *= 1.2; // +20% damage
            break;
        case 'firerate':
            tower.fireRate *= 0.8; // -20% fire rate (faster)
            break;
        case 'range':
            tower.range *= 1.15; // +15% range
            break;
    }
    showGameMessage(`${tower.name} upgraded to Level ${tower.currentLevel} (${upgradeType})!`, 2000);
    continueGame(); // Resume game after upgrade
}

// Initial setup
restartGame();