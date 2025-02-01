//v0.12 29-8-23

/*
Made by hazzza https://openprocessing.org/user/224122?o=48&view=sketches

The true successor of Smash footy.

Credits:

Code n art:
me (i can't draw)

Inspiration: Retro Goal
https://www.newstargames.com/servlet/Content/en/text/releases/Releases/item/448/Releases-Retro-Goal

Font: Long Nguyen 
https://www.1001fonts.com/users/long-nguyen/

v0.1 release 25-8-23

*/

var camX = 0;
var camY = 0;
var camZoom = 2;

const pitchWidth = 1050 * 1.4;
const pitchHeight = 680 * 1.1;

const pitchStripes = 20;
var pitchImage;

var players = [];

var ball;

var redScore = 0;
var blueScore = 0;

const goalWidth = 120;
const goalHeight = 30;

var timeScale = 1;

var goalTimer = 0;

var gameState = "Title";

var font;
var playerControlRed = false;
var playerControlBlue = false;

var redFormationIndex = 0;
var blueFormationIndex = 0;

var timer = 0;

//v0.12 added tilt 
var tiltAmount = 0.75;

function mousePressed() {
	/*
	print(frameRate());

	if (timeScale == 1) {
		timeScale = 5;
	} else {
		timeScale = 1;
	}
	
	*/
	//camZoom = 5;
	//if (gameState == "Title") {
	//	gameState = "Game";
	//}
	if (gameState == "Menu") {
		if (dist(mouseX, mouseY, width / 2, height * 0.9) < 50) {
			gameState = "Game";
			redScore = 0;
			blueScore = 0;
			createTeams();
			ball = new football(0, 0);
			timer = 180;
		}
		if (dist(mouseX, mouseY, width * 0.4, height * 0.15) < width * 0.1) {
			playerControlRed = !playerControlRed;
		}
		if (dist(mouseX, mouseY, width * 0.6, height * 0.15) < width * 0.1) {
			playerControlBlue = !playerControlBlue;
		}
		if(dist(mouseX, mouseY, width * 0.1, height * 0.55+30) < width * 0.1) {
			redFormationIndex += 1;
			if(redFormationIndex == formations.length) {
				redFormationIndex = 0;
			}
		}
		if(dist(mouseX, mouseY, width * 0.9, height * 0.55+30) < width * 0.1) {
			blueFormationIndex += 1;
			if(blueFormationIndex == formations.length) {
				blueFormationIndex = 0;
			}
		}
	}
	if(gameState == "Postmatch") {
		if (dist(mouseX, mouseY, width / 2, height * 0.9) < 50) {
			gameState = "Title";
			
			playerControlRed = false;
			playerControlBlue = false;
			
			redScore = 0;
			blueScore = 0;
			createTeams();
			ball = new football(0, 0);
			goalTimer = 24000000000000000;
		}
	}
}

function keyPressed() {
	if (gameState == "Title") {
		gameState = "Menu";
		playerControlRed = true;
		playerControlBlue = false;
	}
}

function setup() {
	generatePitchImage();
	createCanvas(windowWidth, windowHeight);

	camX = width / 2;
	camY = height / 2;

	ball = new football(0, 0);

	createTeams();

}

function draw() {
	//camZoom = 12;
	if (gameState == "Thumbnail") {

		translate(width / 2, height / 2);
		scale(1.8);
		drawBackground();
		drawGraphics();
		imageMode(CENTER);
		image(redKick, 0, 0, 600, 600);
		translate(-width / 2, -height / 2);
	}
	if(gameState == "Postmatch") {
		drawBackground();
		let txt = "";
		
		if(redScore > blueScore) {
			txt = "Red wins!";
		}
		else if(blueScore > redScore) {
			txt = "Blue wins!";
		}
		else {
			txt = "Draw!";
		}
		txt += "\n";
		txt += redScore;
		txt += " : ";
		txt += blueScore;
		push();
		textFont(font);
		textSize(200);
		textAlign(CENTER, CENTER);
		stroke(100, 100);
		strokeWeight(10);
		fill(255);
		text(txt, width / 2, height / 4);
		textSize(100);
		text("Leave a heart if you liked it!\nComment your suggestions", width/2, height * 0.6);
		pop();
		
		drawButton(width / 2, height * 0.9, 100, "OK");
	}
	if (gameState == "Title") {
		//goalTimer = 0;
		camX = lerp(camX, (camZoom * -ball.x + width / 2), 0.05);
		camY = lerp(camY, (camZoom * -ball.y + height / 2), 0.05);
		if (goalTimer == 241) {
			ball = new football(0, 0);

			createTeams();
			//goalTimer = 0;
		}
		if (goalTimer != 0) {
			goalTimer--;
		}


		drawBackground();
		push();
		translate(camX, camY);
		scale(camZoom);

		if (timeScale >= 1) {
			for (var i = 0; i < floor(timeScale); i++) {
				drawBackground();
				drawGraphics();
				runPlayers();
				drawBall();
			}
		}
		drawGoals();

		translate(-camX, -camY);
		scale(-camZoom + 1);
		pop();
		//draw title stuff
		push();
		fill(40, 150);
		stroke(40, 150);
		rectMode(CENTER);
		rect(width / 2, height / 4 + 35, width * 4, height / 4 + 100);
		rect(width / 2, height * 0.75 + 10, width * 4, 100);
		textFont(font);
		textSize(width / 8);
		textAlign(CENTER, CENTER);
		stroke(100, 100);
		strokeWeight(10);
		fill(255);
		text("FOOTBALL", width / 2, height / 4);
		textSize(60);
		text("RAPID", width/2, height/4 - width/18);
		textSize(50);
		if (floor(frameCount / 40) % 2 == 0) text("Press any key to continue", width / 2, height * 0.75);
		textSize(30);
		pop();
	}
	if (gameState == "Menu") {
		drawBackground();

		/////////////////////////////////////////////////////////////////////

		drawButton(width / 2, height * 0.9, 100, "PLAY");
		push();
		fill(40, 150);
		stroke(40, 150);
		rectMode(CENTER);
		rect(width / 2, height * 0.4 + 30, width * 4, 150);

		rect(width / 2, height * 0.55 + 30, width * 4, 150);

		rect(width / 2, height * 0.7 + 30, width * 4, 150);

		fill(150, 150);
		stroke(50, 100);
		strokeWeight(7);
		textAlign(CENTER, CENTER);
		rectMode(CENTER);
		rect(width * 0.25, height * 0.4, 60, 60, 20);
		rect(width * 0.25, height * 0.4 + 60, 60, 60, 20);
		rect(width * 0.25 - 60, height * 0.4 + 60, 60, 60, 20);
		rect(width * 0.25 + 60, height * 0.4 + 60, 60, 60, 20);

		rect(width * 0.75, height * 0.4, 60, 60, 20);
		rect(width * 0.75, height * 0.4 + 60, 60, 60, 20);
		rect(width * 0.75 - 60, height * 0.4 + 60, 60, 60, 20);
		rect(width * 0.75 + 60, height * 0.4 + 60, 60, 60, 20);


		rect(width * 0.25, height * 0.55 + 30, 60, 60, 20);
		rect(width * 0.75, height * 0.55 + 30, 60, 60, 20);

		rect(width * 0.25, height * 0.7 + 30, 60, 60, 20);
		rect(width * 0.75, height * 0.7 + 30, 60, 60, 20);

		strokeWeight(3);
		fill(240, 150);
		stroke(50, 150);
		//textFont(font);
		textAlign(CENTER, CENTER);
		textSize(32);

		text("W", width * 0.25, height * 0.4);
		text("S", width * 0.25, height * 0.4 + 60);
		text("A", width * 0.25 - 60, height * 0.4 + 60);
		text("D", width * 0.25 + 60, height * 0.4 + 60);

		text("↑", width * 0.75, height * 0.4);
		text("↓", width * 0.75, height * 0.4 + 60);
		text("←", width * 0.75 - 60, height * 0.4 + 60);
		text("→", width * 0.75 + 60, height * 0.4 + 60);

		text("V", width * 0.25, height * 0.55 + 30);
		text(".", width * 0.75, height * 0.55 + 30);

		text("B", width * 0.25, height * 0.7 + 30);
		text("/", width * 0.75, height * 0.7 + 30);
		pop();
		push();
		strokeWeight(5);
		fill(255);
		stroke(50, 150);
		textFont(font);
		textAlign(CENTER, CENTER);
		textSize(50);
		text("MOVEMENT", width * 0.5, height * 0.4 + 30);
		text("PASS", width * 0.5, height * 0.55 + 30);
		text("LONG PASS/SHOT\n(hold longer for more power)", width * 0.5, height * 0.7 + 30);

		textSize(40);

		let p1Text = playerControlRed ? "Player\n(click to change)" : "AI\n(click to change)";
		let p2Text = playerControlBlue ? "Player\n(click to change)" : "AI\n(click to change)";
		text(p1Text, width * 0.4, height * 0.15);
		text(p2Text, width * 0.6, height * 0.15);
		
		text(formations[redFormationIndex] + "\nClick to change", width * 0.1, height * 0.55+30);
		text(formations[blueFormationIndex]+ "\nClick to change", width * 0.9, height * 0.55+30);

		text("Most goals after 180 seconds wins", width * 0.5, height * 0.25);
		
		imageMode(CENTER);
		scale(-1, 1);
		image(redStand, -width * 0.25, height * 0.15);
		scale(-1, 1);
		image(blueStand, width * 0.75, height * 0.15);
		pop();
		//////////////////////////////////////////////////////////////////////////////
	}
	if (gameState == "Game") {
		if(timer > 0 &&goalTimer == 0) {
			timer -= deltaTime/1000;
		}
		else if(timer < 0) {
			timer = 0;
			goalTimer = 1000;
		}
		
		if(goalTimer == 700) {
			gameState = "Postmatch";
		}
		
		
		if (goalTimer == 241) {
			ball = new football(0, 0);

			createTeams();
			//goalTimer = 0;
		}
		if (goalTimer != 0) {
			goalTimer--;
		}


		drawBackground();
		push();
		translate(camX, camY);
		scale(camZoom);

		if (timeScale >= 1) {
			for (let i = 0; i < floor(timeScale); i++) {
				drawBackground();
				drawGraphics();
				runPlayers();
				drawBall();
			}
		}
		drawGoals();

		translate(-camX, -camY);
		scale(-camZoom + 1);
		pop();

		drawUI();
	}
}

function drawButton(x, y, radius, txt) {

	var size = radius;
	push();
	translate(x, y);
	fill(240);
	stroke(250, 50);
	strokeWeight(size / 6);
	ellipse(0, 0, size, size);
	fill(0);
	noStroke();

	let rotationAdd = 0;

	if (dist(mouseX, mouseY, x, y) < size / 2) {
		rotationAdd = frameCount * 0.1;
	}
	rotate(rotationAdd);
	for (let i = 0; i < 5; i++) {
		rotate(TWO_PI / 5);
		translate(size / 3, 0);
		ellipse(0, 0, size * 0.4, size * 0.4);
		translate(-size / 3, 0);
	}
	pop();
	push();
	textFont(font);
	textSize(22);
	textAlign(CENTER, CENTER);
	stroke(100, 100);
	strokeWeight(10);
	fill(255);
	text(txt, x, y);
	pop();
}

function keyReleased() {
	if (gameState == "Game") {
		if (ball.currentPlayer != null) {
			if (keyCode == 66 && ball.currentPlayer.team == 1) {
				ball.currentPlayer.manualShot();
			}
			if (keyCode == 191 && ball.currentPlayer.team == -1) {
				ball.currentPlayer.manualShot();
			}
		}
	}
}

function drawBall() {
	ball.update();
}

function runPlayers() {
	for (var p of players) {
		p.update();
	}
}

function drawBackground() {
	background(33, 133, 17);
}

function drawGraphics() {
	drawPitch();

}

function drawGoals() {
	push();
	strokeWeight(6);

	stroke(200);
	line(-pitchWidth / 2, (goalWidth / 2) * tiltAmount, -pitchWidth / 2 - 5, (goalWidth / 2 - goalHeight)* tiltAmount);
	stroke(170);
	line(-pitchWidth / 2, -(goalWidth / 2) * tiltAmount, -pitchWidth / 2 - 5, (-goalWidth / 2 - goalHeight) * tiltAmount);

	stroke(230);
	line(-pitchWidth / 2 - 5, (goalWidth / 2 - goalHeight)* tiltAmount, -pitchWidth / 2 - 5, (-goalWidth / 2 - goalHeight)* tiltAmount);


	stroke(200);
	line(pitchWidth / 2, (goalWidth / 2)* tiltAmount, pitchWidth / 2 + 5, (goalWidth / 2 - goalHeight)* tiltAmount);
	stroke(170);
	line(pitchWidth / 2, (-goalWidth / 2)* tiltAmount, pitchWidth / 2 + 5, (-goalWidth / 2 - goalHeight)* tiltAmount);

	stroke(230);
	line(pitchWidth / 2 + 5, (goalWidth / 2 - goalHeight)* tiltAmount, pitchWidth / 2 + 5, (-goalWidth / 2 - goalHeight)* tiltAmount);
	pop();
}

function drawUI() {
	camX = lerp(camX, (camZoom * -ball.x + width / 2), 0.05);
	camY = lerp(camY, (camZoom * -ball.y + height / 2), 0.05);
	//print(ball.velocity.mag());
	
	var zm = 2 - ball.velocity.mag();
	camZoom = lerp(camZoom, zm, 0.005);
	camZoom = min(camZoom, 2);
	camZoom = max(camZoom, 1.2);
	strokeWeight(0.2);
	translate(width / 2 - 150 * 0.6, 30);
	fill(255, 0, 0, 100);
	rect(0, 0, 100 * 0.6, 60 * 0.6);
	fill(100, 100);
	rect(100 * 0.6, 0, 100 * 0.6, 120 * 0.6);
	fill(0, 0, 255, 100);
	rect(200 * 0.6, 0, 100 * 0.6, 60 * 0.6);
	
	fill(240, 150);
	stroke(100);
	strokeWeight(2);
	textSize(32 * 0.6);
	textAlign(CENTER, CENTER);
	text("RED", 50 * 0.6, 30 * 0.6);
	text(redScore + " - " + blueScore, 150 * 0.6, 30 * 0.6);
	text("BLU", 250 * 0.6, 30 * 0.6);
	//textSize(32);
	text(round(timer*10)/10, 150 * 0.6, 90 * 0.6);
	
	translate(-width / 2 + 150 * 0.6, -30 * 0.6);
	noStroke();
	if (goalTimer >= 700) {
		textSize(width / 5);
		fill(255, map(goalTimer, 700, 1000, 0, 255));
		text("TIME", width / 2, height / 2);
	}
	if (goalTimer >= 240 && goalTimer < 400) {
		textSize(width / 5);
		fill(255, map(goalTimer, 240, 400, 0, 255));
		text("GOAL!!!", width / 2, height / 2);
	}
	if (goalTimer < 180 && goalTimer != 0) {
		textSize(width / 5);
		fill(255, map(goalTimer, 180, 120, 255, 0));
		text("3", width / 2, height / 2);

	}
	if (goalTimer < 120 && goalTimer != 0) {
		textSize(width / 5);
		fill(255, map(goalTimer, 120, 60, 255, 0));
		text("2", width / 2, height / 2);
	}
	if (goalTimer < 60 && goalTimer != 0) {
		textSize(width / 5);
		fill(255, map(goalTimer, 60, 0, 255, 0));
		text("1", width / 2, height / 2);
	}

}

function generatePitchImage() {
	//create a separate canvas and draw the pitch as preproc
	//should help performance and i get a feeling i'll need all the help i can get

	pitchImage = createGraphics(pitchWidth, pitchHeight);
	
	
	pitchImage.translate(pitchWidth / 2, pitchHeight / 2);
	for (let i = 0; i < pitchStripes; i++) {
		if (i % 2 == 0) {
			pitchImage.push();
			pitchImage.rectMode(CORNER);
			pitchImage.noStroke();
			pitchImage.fill(53, 117, 42);
			pitchImage.rect((pitchWidth / pitchStripes) * i - pitchWidth / 2, -pitchHeight / 2, pitchWidth / pitchStripes, pitchHeight);
			pitchImage.pop();
		}
	}
	pitchImage.stroke(255);
	pitchImage.strokeWeight(12);
	pitchImage.noFill();
	pitchImage.rectMode(CENTER);

	pitchImage.point(0, 0);
	pitchImage.strokeWeight(5);

	pitchImage.ellipse(0, 0, pitchWidth / 5);

	pitchImage.rect(0, 0, pitchWidth, pitchHeight);
	pitchImage.rect(0, 0, 0, pitchHeight);
	pitchImage.rect(-pitchWidth / 2 * (pitchStripes - 1) / pitchStripes, 0, pitchWidth / pitchStripes, pitchHeight / 4);
	pitchImage.rect(-pitchWidth / 2 * (pitchStripes - 3) / pitchStripes, 0, pitchWidth * 3 / pitchStripes, pitchHeight * 0.6);

	pitchImage.rect(pitchWidth / 2 * (pitchStripes - 1) / pitchStripes, 0, pitchWidth / pitchStripes, pitchHeight / 4);
	pitchImage.rect(pitchWidth / 2 * (pitchStripes - 3) / pitchStripes, 0, pitchWidth * 3 / pitchStripes, pitchHeight * 0.6);
	pitchImage.push();
	for (var i = 0; i < 1200; i++) {

		pitchImage.fill(0, random(5));
		pitchImage.noStroke();
		pitchImage.circle(random(-pitchWidth / 2, pitchWidth / 2), random(-pitchHeight / 2, pitchHeight / 2), random(60));
	}
	pitchImage.pop();
	pitchImage.strokeWeight(12);
	pitchImage.point(-pitchWidth / 2, goalWidth / 2);
	pitchImage.point(-pitchWidth / 2, -goalWidth / 2);
	pitchImage.point(pitchWidth / 2, goalWidth / 2);
	pitchImage.point(pitchWidth / 2, -goalWidth / 2);
	//v0.12
	pitchImage.tint(255, 30);
	pitchImage.imageMode(CENTER);
	//removed 
}

function drawPitch() {
	imageMode(CENTER);
	image(pitchImage, 0, 0, pitchImage.width, pitchImage.height * tiltAmount);
}