// Array of flowers.
let flowers = [];

function setup() {
  createCanvas(1300, 900);
  frameRate(10);
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
  for (let i = 0; i < 20; i += 1 ) {
    // Create a flower in a random location.
    let flower = createFlower();
    // Add the flower to the flowers array.
    flowers.push(flower);
  }
}

// ... createFlower() and drawFlower()
function drawFlower() {
  // Create flower object.
  let myFlower = createFlower();

  
  // Use flower object properties to draw an ellipse.
  fill(myFlower.color);
  ellipse(myFlower.x, myFlower.y, myFlower.size);
  fill(myFlower.color);
  ellipse(myFlower.x + myFlower.size/2, myFlower.y + myFlower.size/2, myFlower.size - myFlower.size/8 * 5);
  fill(myFlower.color);
  ellipse(myFlower.x - myFlower.size/2, myFlower.y - myFlower.size/2, myFlower.size - myFlower.size/8 * 5);
  fill(myFlower.color);
  ellipse(myFlower.x + myFlower.size/2, myFlower.y - myFlower.size/2, myFlower.size - myFlower.size/8 * 5);
  fill(myFlower.color);
  ellipse(myFlower.x - myFlower.size/2, myFlower.y + myFlower.size/2, myFlower.size - myFlower.size/8 * 5);
  fill(myFlower.color);
  ellipse(myFlower.x, myFlower.y + myFlower.size - myFlower.size/16 * 5, myFlower.size - myFlower.size/8 * 5);
  fill(myFlower.color);
  ellipse(myFlower.x, myFlower.y - myFlower.size + myFlower.size/16 * 5, myFlower.size - myFlower.size/8 * 5);
  fill(myFlower.color);
  ellipse(myFlower.x - myFlower.size + myFlower.size/16 * 5, myFlower.y, myFlower.size - myFlower.size/8 * 5);
  fill(myFlower.color);
  ellipse(myFlower.x + myFlower.size - myFlower.size/16 * 5, myFlower.y, myFlower.size - myFlower.size/8 * 5);
  fill(color(random(255), random(255), random(255)));
  ellipse(myFlower.x + myFlower.size/4 + myFlower.size/2 - myFlower.size/32 * 3, myFlower.y - myFlower.size/4, myFlower.size - myFlower.size/8 * 5);
  fill(color(random(255), random(255), random(255)));
  ellipse(myFlower.x + myFlower.size/4 + myFlower.size/2 - myFlower.size/32 * 3, myFlower.y + myFlower.size/4, myFlower.size - myFlower.size/8 * 5);
  fill(color(random(255), random(255), random(255)));
  ellipse(myFlower.x - myFlower.size/4 - myFlower.size/2 + myFlower.size/32 * 3, myFlower.y + myFlower.size/4, myFlower.size - myFlower.size/8 * 5);
  fill(color(random(255), random(255), random(255)));
  ellipse(myFlower.x - myFlower.size/4 - myFlower.size/2 + myFlower.size/32 * 3, myFlower.y - myFlower.size/4, myFlower.size - myFlower.size/8 * 5);
  fill(color(random(255), random(255), random(255)));
  ellipse(myFlower.x - myFlower.size/4 - myFlower.size/2 + myFlower.size/32 * 3, myFlower.y - myFlower.size/4, myFlower.size - myFlower.size/8 * 5);
  fill(color(random(255), random(255), random(255)));
  ellipse(myFlower.x + myFlower.size/32 * 9, myFlower.y - myFlower.size + myFlower.size/16 * 6, myFlower.size - myFlower.size/8 * 5);
  fill(color(random(255), random(255), random(255)));
  ellipse(myFlower.x - myFlower.size/32 * 9, myFlower.y - myFlower.size + myFlower.size/16 * 6, myFlower.size - myFlower.size/8 * 5);
  fill(color(random(255), random(255), random(255)));
  ellipse(myFlower.x + myFlower.size/32 * 9, myFlower.y + myFlower.size - myFlower.size/16 * 6, myFlower.size - myFlower.size/8 * 5);
  fill(color(random(255), random(255), random(255)));
  ellipse(myFlower.x - myFlower.size/32 * 9, myFlower.y + myFlower.size - myFlower.size/16 * 6, myFlower.size - myFlower.size/8 * 5);
}
function createFlower() {
  let flower = {
    x: random(80, 820),
    y: random(80,820),
    size: random(20,75),
    lifespan: random(255,300),
    color: color(random(255), random(255), random(255))
  };
  return flower;
}