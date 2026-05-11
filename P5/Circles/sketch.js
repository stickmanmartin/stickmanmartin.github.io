function setup() {
  createCanvas(windowWidth, windowHeight);
}
function draw() {
  //when mouse button is pressed, circles turn black
  if (mouseIsPressed === true) {
    fill("RED");
    stroke("BLACK");
  } else {
    fill(250);
    stroke("BLUE");
  }

  //white circles drawn at mouse position
  circle(mouseX, mouseY, 100); 
    
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
