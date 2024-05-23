// sprite globals
let sprites;
let nextSpawnDistance;
let minDistanceBetweenSprites;
let invasiveImages;
let nativeImages;

// handpose globals
let video;
let predictions;
let bound = [];

// Must declare image array in preload to work
// Invariant: # of invasive and non-invasive species must be the same.
// Each Sprite has an image index that is the same across invasive and native variants
function preload() {
  invasiveImages = [loadImage('img/brown_marmorated_stinkbug.jpg'), 
                    loadImage('img/american_bullfrog.png'),
                    loadImage('img/garlic_mustard.jpg')];
  nativeImages = [];
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);

  handpose = ml5.handpose(video, modelReady);
  minDistanceBetweenSprites = width/5; // at least this much margin between sprites
  resetGame();
  // Hide the video element, and just show the canvas
  video.hide();

  handpose.on("predict", results => {
    if (results && results.length > 0) {
      predictions = results[0];
    } else {
      predictions = null;
    }
  });
}

function draw() {
  // Mirror video
  push();
  translate(width,0);
  scale(-1.0,1.0);
  background(220);
  // draw hand
  if (predictions) {
    bound = drawKeypoints(predictions);
  }
  pop();

  // If no sprites or last sprite has surpassed nextSpawnDistance, generate another sprite
  if (sprites.length <= 0 || sprites[sprites.length-1].x >= nextSpawnDistance){
    sprites.push(getNewSprite()); 
    // nextSpawnDistance = random(minDistanceBetweenSprites, width/3);
    // print(nextSpawnDistance);
  }

  // loop through all the sprites and update them
  for(let i = 0; i < sprites.length; i++){
    // check if sprite is in hand
    // sprite will turn red if selected
    let selected = in_poly({x: sprites[i].x, y: sprites[i].y}, bound);
    
    sprites[i].update();
    
    // remove sprites that have gone off the screen
    if(sprites[i].x + sprites[i].width > width){
      sprites[i].offScreen = true;
      // Don't delete here because will glitch next sprite
      // Just set to not show
    }

    // Only draw on screen sprites
    if(!sprites[i].offScreen) {
      if(sprites[i].isInvasive){
        print(invasiveImages);
        sprites[i].draw(invasiveImages[sprites[i].typeIndex]);
      } else {
        sprites[i].draw(null);
      }
    }
    if (selected) {
      sprites[i].displayInfo();
    }
  }
  // Check if furthest sprite has gone off screen
  // Delete from list to prevent from getting unnecessarily long
  if(sprites[0].offScreen) {
    sprites.splice(0, 1);
  }
}

function resetGame(){
  score = 0;
  sprites = [new Sprite()];
  nextSpawnDistance = random(minDistanceBetweenSprites, width/3);
  print(nextSpawnDistance);
}

// generate a new sprite
function getNewSprite() {
  const typeIndex = floor(random(0, invasiveImages.length));
  return new Sprite(typeIndex);
}

// Code and Sprite class inspiried by https://editor.p5js.org/jonfroehlich/sketches/sFOMDuDaw 