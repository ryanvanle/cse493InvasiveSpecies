
// sprite globals
let sprites;
let nextSpawnDistance;
let minDistanceBetweenSprites;
let invasiveImages;
let nativeImages;
let spriteMillis = 0;

// handpose globals
let video;
let predictions;
let bound = null;
let prediction_interval = 100;
let last_prediction= 0;
let capture_millis = 0;
let model_ready = false;
let hand_raised = false;

// net globals
let netControllerData;
let net;

let netScore = 0;

const DEFAULT_NET_SIZE = 75;

// gameplay globals
let isGameOver = false;
let mainFont;

let backgroundImage;

net = {
  x: Number(300 / 2),
  y: Number(200 / 2),
  xSpeed: 0,
  ySpeed: 0,
  diameter: DEFAULT_NET_SIZE,
}

previousNetControllerData = {
  x: 0,
  y: 0,
  z: 0,
  pressed: false,
}

netControllerData = {
  x: 0,
  y: 0,
  z: 0,
  pressed: false,
}



// Must declare image array in preload to work
// Invariant: # of invasive and non-invasive species must be the same.
// Each Sprite has an image index that is the same across invasive and native variants
function preload() {
  invasiveImages = [loadImage('img/invasive/brown_marmorated_stinkbug.png'),
                    loadImage('img/invasive/american_bullfrog.png'),
                    loadImage('img/invasive/garlic_mustard.jpg')];
  nativeImages = [loadImage('img/native/american_pika.jpg'),
                    loadImage('img/native/olympic_marmot.jpg'),
                    loadImage('img/native/canada_geese.jpg')];

  backgroundImage = loadImage('img/grass.jpeg');
  cameraSound = loadSound("audio/camera.mp3");
  mainFont = loadFont('assets/Organo.ttf');
}


function setup() {
  createCanvas(window.innerWidth, window.innerWidth * 9 / 16);
  spriteMillis = millis();
  video = createCapture(VIDEO);
  video.size(width, height);
  textFont(mainFont);

  soundFormats('mp3');
  
  handpose = ml5.handpose(video, () => {
    model_ready = true;
  });
  minDistanceBetweenSprites = width/5; // at least this much margin between sprites
  resetGame();
  // Hide the video element, and just show the canvas
  video.hide();

  handpose.on("predict", results => {
    predictions = results[0];
    if (!hand_raised && results[0] != undefined) {
      if (results[0].handInViewConfidence > 0.9999) {
        hand_raised = true;
      }
    }
  });
}

function draw() {
  // Mirror video
  // hasSetup = true;
  if (!model_ready) {
    menu();
  } else if (!hand_raised) {
    raise_hand(); // Raise hand to trigger game
  } 
  else {
    if(isGameOver) {

      // Start over screen
      gameOver();
    } else {

      // Game in action
      gameplay_loop();
    }
  }
  
}

function menu() {
  background(backgroundImage);
  push();
  textSize(50);
  let s = "Model Loading...";
  text(s, (width - textWidth(s)) / 2, height/2);
  pop();
}

function raise_hand() {
  background(backgroundImage);
  push();
  textSize(50);
  let s = "Raise Hand To Start Playing";
  text(s, (width - textWidth(s)) / 2, height/2);
  pop();
}

function gameplay_loop() {
  netUpdate();
  background(backgroundImage);

  push();
  translate(width,0);
  scale(-1.0,1.0);
  // draw hand
  if (predictions) {
    bound = draw_viewfinder(predictions);
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
    let selected = false;
    if (bound) {
      selected = in_rect({x: sprites[i].x, y: sprites[i].y}, bound);
    }

    sprites[i].update();

    // remove sprites that have gone off the screen
    if(sprites[i].x + sprites[i].width > width){
      sprites[i].offScreen = true;

      if (sprites.isInvasive) updateScore(false);
    }

    // Only draw on screen sprites
    if(!sprites[i].offScreen) {

      // INVASIVE
      if(sprites[i].isInvasive){
        // print(invasiveImages);
        // print("Type index: ");
        // print(sprites[i].typeIndex);
        sprites[i].draw(invasiveImages[sprites[i].typeIndex]);
      } else {

        // NATIVE
        // console.log(sprites[i].typeIndex);
        // print(nativeImages);
        // print("Type index: ");
        // print(sprites[i].typeIndex);
        sprites[i].draw(nativeImages[sprites[i].typeIndex]);
        // print(sprites[i].typeIndex);
        // sprites[i].draw(null);
      }
    }
    if (selected) {
      if (predictions && is_closed(predictions) && millis() - capture_millis > 500) {
        cameraSound.play();
        let info = document.getElementById("species-info");
        info.innerHTML = sprites[i].description;
        capture_millis = millis();
      }
      sprites[i].displayInfo();
    }

    let isNetHovering = netSpeciesHoverChecker(sprites[i]);
    sprites[i].displayNetInfo(isNetHovering);
  }
  // Check if furthest sprite has gone off screen
  // Delete from list to prevent from getting unnecessarily long
  if(sprites[0].offScreen) {
    sprites.splice(0, 1);
  }

  drawNetCursor();

  // frame rate count. uncomment when debugging
  text(frameRate(), 20, 20);
}

function resetGame(){
  score = 0;
  sprites = [getNewSprite()];
  nextSpawnDistance = random(minDistanceBetweenSprites, width/3);
}

function gameOver() {

}

// generate a new sprite
function getNewSprite() {
  const typeIndex = floor(random(0, invasiveImages.length));
  return new Sprite(typeIndex);
}

// Code and Sprite class inspiried by https://editor.p5js.org/jonfroehlich/sketches/sFOMDuDaw


const ws = new WebSocket('ws://localhost:8005');

ws.onopen = () => {
  console.log('Connected to the server');
};

ws.onmessage = (event) => {

  // console.log(event.data);
  let data = event.data.split(",");
  let isPressed = data[3] === "true";

  previousNetControllerData = netControllerData;

  netControllerData = {
    x: Number(data[0]),
    y: Number(data[1]),
    z: Number(data[2]),
    pressed: isPressed
  }

};

ws.onclose = () => {
  console.log('Disconnected from the server');
};



function netUpdate() {

  // if (!hasSetup) return;

  let isPressed = netControllerData.pressed;
  let isCatching = isSwingingChecker() && isPressed;

  if (isCatching) {
    lockNetPosition();
    updateCapture();
  } else if (isPressed) {
    lockNetPosition();
  } else {
    updateNetPosition();
  }

}

function drawNetCursor() {
  push();
  strokeWeight(4);

  let strokeColor = netControllerData.pressed ? "red" : "black"
  stroke(strokeColor);

  noFill();
  circle(net.x, net.y, net.diameter);
  pop();
}

function lockNetPosition() {
  net.xSpeed = 0;
  net.ySpeed = 0;
}


function netSpeciesHoverChecker(specie) {
  if (specie.offScreen) return;

  let netRadius = net.diameter/2;
  let netXEdgeLeft = net.x - netRadius;
  let netXEdgeRight = net.x + netRadius;
  let netYEdgeBottom = net.y - netRadius;
  let netYEdgeTop = net.y + netRadius;
  let isOutOfBoundsX = specie.x < netXEdgeLeft || specie.x > netXEdgeRight;
  let isOutOfBoundsY = specie.y < netYEdgeBottom || specie.y > netYEdgeTop;
  let isInBoundsNet = !(isOutOfBoundsX || isOutOfBoundsY);

  return isInBoundsNet;
}

function isSwingingChecker() {

  let previousZ = previousNetControllerData.z;
  let currentZ = netControllerData.z;

  if (previousZ < currentZ) return false;
  if (previousZ <= 0) return false; // is in currentSwing range;


  let threshold = 5;
  const difference = Math.abs(previousZ - currentZ);
  const isValidSwing = difference >= threshold;
  return isValidSwing;

}


function updateNetPosition() {


  net.xSpeed = -netControllerData.y;
  net.ySpeed = -netControllerData.z;

  if (!isInNetBoundsChecker()) return;

  net.x += net.xSpeed;
  net.y += net.ySpeed;
}

function isInNetBoundsChecker() {
  let nextXPosition = net.x + net.xSpeed;
  let nextYPosition = net.y + net.ySpeed;
  let netRadius = net.diameter/2;
  let isOutOfBoundsX = nextXPosition < 0 + netRadius || nextXPosition > width - netRadius;
  let isOutOfBoundsY = nextYPosition < 0 + netRadius || nextYPosition > height - netRadius;
  let isInBounds = !(isOutOfBoundsX || isOutOfBoundsY);
  return isInBounds;
}

function updateCapture() {

  console.log("in updateCapture");

  for (let specie of sprites) {
    if (specie.offScreen) continue;
    if (!specie.isHighlighted) continue;

    specie.offScreen = true;

    if (specie.isInvasive) {
      updateScore(true);
    } else {
      updateScore(false);
    }
  }

}


function updateScore(didGain) {
  if (didGain) {
    netScore += 1;
  } else {
    netScore--;
  }

  if (netScore < 0) netScore = 0;

  displayScore();
}

function displayScore() {
  id("score").textContent = netScore;
}


/**
 * Returns the element that has the ID attribute with the specified value.
 * @param {string} idName - element ID
 * @returns {object} DOM object associated with id.
 */
function id(idName) {
  return document.getElementById(idName);
}

/**
* Returns the first element that matches the given CSS selector.
* @param {string} selector - CSS query selector.
* @returns {object} The first DOM object matching the query.
*/
function qs(selector) {
  return document.querySelector(selector);
}

/**
* Returns the array of elements that match the given CSS selector.
* @param {string} selector - CSS query selector
* @returns {object[]} array of DOM objects matching the query.
*/
function qsa(selector) {
  return document.querySelectorAll(selector);
}

/**
* Returns a new element with the given tag name.
* @param {string} tagName - HTML tag name for new DOM element.
* @returns {object} New DOM object for given HTML tag.
*/
function gen(tagName) {
  return document.createElement(tagName);
}