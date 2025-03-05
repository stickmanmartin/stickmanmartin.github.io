let emoji = "☀️"
let emojitwo = "🌏"
let emojithree = "🪐"

function setup() {
    createCanvas(800, 800);
    background(0);
    frameRate(30)
}

function draw() {
    let x = randomGaussian(400, 90);
    let y = randomGaussian(400, 90);
    noStroke();
    fill(255, 0, 0, 70);
    circle(x, y, 16);
    let z = randomGaussian(400, 90);
    let w = randomGaussian(400, 90);
    noStroke();
    fill(0, 255, 0, 70);
    circle(z, w, 16);
    let b = randomGaussian(400, 90);
    let a = randomGaussian(400, 90);
    noStroke();
    fill(0, 0, 255, 70);
    circle(a, b, 16);
    let v = randomGaussian(400, 90);
    let s = randomGaussian(400, 90);
    noStroke();
    fill(255, 255, 0, 70);
    circle(v, s, 16);
    let g = randomGaussian(400, 90);
    let h = randomGaussian(400, 90);
    noStroke();
    fill(127, 0, 255, 70);
    circle(g, h, 16);
    let f = randomGaussian(400, 90);
    let j = randomGaussian(400, 90);
    noStroke();
    fill(255, 255, 255, 70);
    circle(f, j, 16);
    let r = randomGaussian(400, 300);
    let d = randomGaussian(400, 300);
    noStroke();
    fill(0, 0, 0, 150);
    circle(r, d, 16);
    stroke(255, 0, 0);
    fill(0, 0, 0);
    circle(400, 400, 50);
    noStroke()
    fill(138, 0, 196);
    circle(400, 400, 35);
    fill(129, 133, 137);
    circle(400, 300, 30);
    circle(400, 500, 30);
    fill(255, 255, 255);
    circle(400, 400, 30);
    circle(400, 300, 20);
    circle(400, 500, 20);
    fill(0, 255, 0);
    circle(329, 470, 30);
    fill(255, 0, 0);
    circle(471, 330, 30);
    fill(255, 102, 0);
    circle(500, 400, 30);
    fill(255, 255, 0);
    circle(471, 470, 30);
    fill(0, 100, 255);
    circle(300, 400, 30);
    fill(138, 0, 196);
    circle(330, 330, 30);
    textSize(27)
    text(emoji, 387, 409)
    textSize(15)
    text(emojitwo, 393, 305.5)
    text(emojithree, 393, 505.5)
}