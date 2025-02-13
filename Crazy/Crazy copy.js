// Array of flowers.
let flowers = [];
let emoji = ['💩', '☠️', '👻', '🤑', '💥', '🌏', '', '🐲', '💸']


function setup() {
  createCanvas(1300, 900);
  frameRate(1);
  flowerPower();

  // Generate 20 flowers.
  
}
function draw() {
  flowerPower();
  background("lightblue");
  // For each flower in the array of flowers.
  for (let flower of flowers) {
    drawFlower(flower);
  }
  flowers=[];
}

// Function to create 20 flowers.
function flowerPower() {
  for (let i = 0; i < 25; i += 1 ) {
    // Create a flower in a random location.
    let flower = createFlower();
    // Add the flower to the flowers array.
    flowers.push(flower);
  }
}

// ... createFlower() and drawFlower()
function createFlower() {
  let flower = {
    x: random(80, 1220),
    y: random(80,820),
    size: random(20,75),
    lifespan: random(255,300),
    color: color(random(255), random(255), random(255)),
    emoji: random(emoji)
  };
  // Array of flowers.
  
  return flower;
}


function drawFlower(flower) { 
  noStroke();
  fill(flower.color);

  // Draw petals.
  ellipse(flower.x, flower.y, flower.size / 2, flower.size);

  ellipse(flower.x, flower.y, flower.size, flower.size / 2);

  // Draw a yellow center.
  fill(255, 204, 0);
  circle(flower.x, flower.y, flower.size / 2);
  textSize(flower.size/8 * 3)
  text(flower.emoji, flower.x - flower.size/128 * 23, flower.y + flower.size/256 * 31.5);
}