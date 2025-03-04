function setup() {
    createCanvas(800, 800);
    background(0);
}

function draw() {
    let x = randomGaussian(400, 100);
    let y = randomGaussian(400, 100);
    noStroke();
    fill(255, 0, 0, 70);
    circle(x, y, 16);
    let z = randomGaussian(400, 100);
    let w = randomGaussian(400, 100);
    noStroke();
    fill(0, 255, 0, 70);
    circle(z, w, 16);
    let b = randomGaussian(400, 100);
    let a = randomGaussian(400, 100);
    noStroke();
    fill(0, 0, 255, 70);
    circle(a, b, 16);
    let v = randomGaussian(400, 100);
    let s = randomGaussian(400, 100);
    noStroke();
    fill(255, 255, 0, 70);
    circle(v, s, 16);
    let g = randomGaussian(400, 100);
    let h = randomGaussian(400, 100);
    noStroke();
    fill(127, 0, 255, 70);
    circle(g, h, 16);
    let f = randomGaussian(400, 100);
    let j = randomGaussian(400, 100);
    noStroke();
    fill(255, 255, 255, 70);
    circle(f, j, 16);
    let r = randomGaussian(400, 100);
    let d = randomGaussian(400, 100);
    noStroke();
    fill(0, 0, 0, 70);
    circle(r, d, 16);
}