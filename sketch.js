
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
let bound = [];

let netControllerData;
let net;

let netScore = 0;

const DEFAULT_NET_SIZE = 75;

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
  invasiveImages = [loadImage('img/invasive/brown_marmorated_stinkbug.jpg'),
                    loadImage('img/invasive/american_bullfrog.png'),
                    loadImage('img/invasive/garlic_mustard.jpg')];
  nativeImages = [loadImage('img/native/american_pika.jpg'),
                    loadImage('img/native/olympic_marmot.jpg'),
                    loadImage('img/native/canada_geese.jpg')];

  backgroundImage = loadImage('img/grass.jpeg')

}


function setup() {
  createCanvas(1280, 720);
  spriteMillis = millis();
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
      console.log("hand detected");
    } else {
      predictions = null;
    }
  });

}

function draw() {
  // Mirror video
  // hasSetup = true;
  
  netUpdate();
  push();
  translate(width,0);
  scale(-1.0,1.0);
  background(backgroundImage);
  // draw hand
  if (predictions) {
    bound = drawKeypoints(predictions);
  } else {
    bound = null;
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
      selected = in_poly({x: sprites[i].x, y: sprites[i].y}, bound);
    }

    sprites[i].update();

    // remove sprites that have gone off the screen
    if(sprites[i].x + sprites[i].width > width){
      sprites[i].offScreen = true;

      if (sprites.isInvasive) updateScore(false);


      // Don't delete here because will glitch next sprite
      // Just set to not show
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

  text(frameRate(), 20, 20);
}

function resetGame(){
  score = 0;
  sprites = [getNewSprite()];
  nextSpawnDistance = random(minDistanceBetweenSprites, width/3);
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