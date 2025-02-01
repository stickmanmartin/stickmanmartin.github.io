let m;
let s;

let angulo=0;
let vel=0;

let c1=33;
let c2=88;
let acc=0.01;

function setup() {
  createCanvas(700, 1000);
  
  noStroke();
  s=width/99;
  m=height/66;
}

function draw() {
  
  push();
  translate(-width/6,height/6);
  
  background(0,10);

  let l0 = map(cos(angulo),-1,1,1*width/3,2*width/3);
  let l1 = map(sin(angulo),-1,1,1*width/3,2*height/3);
  
  translate(width/2,height/2);
  rotate(angulo);
  
  for (i=0;i<c1;i++){
    push();
    rotate(i*TWO_PI/c1);
    translate(l0,0);

    fill(255);
    ellipse(0,0,s*2);
    rotate(-angulo);
    
    for (j=0;j<c2;j++){
      push();
      rotate(j*TWO_PI/c2);
      translate(l1,0);

      fill(200);
      ellipse(0,0,s/3);
      pop();
    }
    pop();
  }
  
  angulo=vel;
  vel+=acc;
  pop();
  
  fill(150);
  textAlign(RIGHT);
  textSize(m/2);
  text('A H-ILE DAD \n ALLES \n ALT \n BCI \n СÈ ШТО \n EVERYTHING \n DENA \n GACH RUD \n KAIKKI \n KÕIK \n KOLLOX \n MINDEN \n POPETH \n QUALUNQUE COSA \n SVE \n τα παντα \n TODO \n TOT \n TOUT \n TUDO \n TUKUY \n VISKAS \n VISS \n VSE \n VŠECHNO \n WSZYSTKO \n ҳама \n YCE \n Барысы да \n баары \n бүх зүйл  \n எல்லாம் \n 一切 \n すべて \n 모두 \n ସବୁକିଛି \n सबै \n সব \n ప్రతిదీ \n සියල්ල \n ทุกอย่าง \n سب کچھ \n ھەممە نەرسە \n هرڅه \n ਸਭ ਕੁਝ \n အားလုံး \n  सर्वकाही \n സകലതും \n ທຸກສິ່ງທຸກຢ່າງ \n អ្វីគ្រប់យ៉ាង \n ಎಲ್ಲವನ್ನೂ \n બધું \n ყველაფერი \n ամեն ինչ \n אַלץ ',width-m,m);
  
  describe(
  "A black canvas with a set of white circles turning around a void, while thousands of little circles creates an algorithmic coreography in the other way. The canvas shows at the right corner written in lots of languages the word 'everything' ");
 
}