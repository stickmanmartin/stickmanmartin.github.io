
let Start = True

function setup() {
  createCanvas(400, 400);
  frameRate(1);
}
function draw() {
  background("yellowgreen");  
    Draw_Flower()

}

function Draw_Flower() {
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
    x: random(70,330),
    y: random(70,330),
    size: random(20,75),
    lifespan: random(255,300),
    color: color(random(255), random(255), random(255))
  };
  return flower;
}