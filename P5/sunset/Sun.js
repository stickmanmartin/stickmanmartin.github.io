//variable for initial sun position
let sunHeight = 400; //point below horizon


//variables for color change
let redVal = 0;
let greenVal = 0;
let blueVal = 0;

function setup() {
  createCanvas(600, 400);
  frameRate(17)
}
function draw(){
  //fill background based on custom variables
  background(500-mouseY, 200-mouseY, 100-mouseY);
  sunHeight = mouseY

  let x = frameCount % 100;
  if (mouseY > 350 ){
    var galaxy = {
      locationX : random(width),
      locationY : random(height),
      size : random(4,6)
    }
    var galaxy2 = {
      locationX : random(width),
      locationY : random(height),
      size : random(4,6)
    }
    fill("white")
      ellipse(galaxy.locationX ,galaxy.locationY, galaxy.size, galaxy.size);
      ellipse(galaxy2.locationX ,galaxy2.locationY, galaxy2.size, galaxy2.size);
      fill('rgba(255,255,255,0.45)');
      ellipse(500,100,90,90);
  }


  //sun
  fill("red");
  stroke("blue")
  circle(300, sunHeight, 180);
  stroke("yellow")
  fill("orange");
  circle(300, sunHeight, 140);
  stroke("purple")
  fill("yellow");
  circle(300, sunHeight, 100);
 
  //mountains
  fill(110, 50, 18);
  stroke("red")
  triangle(200, 400, 520, 253, 800, 400);
  stroke("blue")
  fill(110,95,20);
  triangle(200,400,520,253,350,400); 
 
  fill(150, 75, 0);
  stroke("green")
  triangle(-100, 400, 150, 200, 400, 400);
  fill(100, 50, 12);
  stroke("yellow")
  triangle(-100, 400, 150, 200, 0, 400);
 
  fill(150, 100, 0);
  stroke("purple")
  triangle(200, 400, 450, 250, 800, 400);
  fill(120, 80, 50);
  stroke("white")
  triangle(200, 400, 450, 250, 300, 400);
 }
  // reduce sunHeight by 2 until it reaches 13
   
function tree(x,y,size) {
    fill(80,30,20);
    rect(x-size,y,size*2,size*6);
    fill(20,130,5);
    triangle(x-size*3,y,x,y-size*8,x+size*3,y)
  }
  
  //A function that draws many trees 
  //using treeLine() and tree() functions
  function trees() {
    // First tree
    let x = mouseX;
    let y = mouseY;
    tree(x, y, 5);
  }
  function mousePressed(){
    tree(mouseX, mouseY,5);
  }
