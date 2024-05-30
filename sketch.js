
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

let backgroundImage;

let netControllerData;
let net;
let netScore = 0;
const DEFAULT_NET_SIZE = 75;


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

let screenEffectArray = [];
let isScreenEffectActive = false;
let screenEffectTimeout;

// google gemini generated, essentially we're creating objects per effect, but not using the new JS class constructor
let screenEffects = {
  blooper: {
    isActive: false,
    timeout: null,
    data: [],
    init: function() {
      this.data = [];
    },
    clear: function() {
      clearTimeout(this.timeout);
      this.data = [];
    },
    update: blooperEffect,
  },
  colorInvert: {
    isActive: false,
    timeout: null,
    init: function() {},
    clear: function() {
      clearTimeout(this.timeout);
    },
    update: function() {
      filter(INVERT);
    },
  },
  // ... add more effects here (e.g., shake, pixelate, etc.)
};



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

}


function setup() {
  createCanvas(window.innerWidth, window.innerWidth * 9 / 16);
  spriteMillis = millis();
  video = createCapture(VIDEO);
  video.size(width, height);


  soundFormats('mp3');

  handpose = ml5.handpose(video, modelReady);
  minDistanceBetweenSprites = width/5; // at least this much margin between sprites
  resetGame();
  // Hide the video element, and just show the canvas
  video.hide();

  handpose.on("hand", results => {
    predictions = results[0];
    push();
    translate(width,0);
    scale(-1.0,1.0);
    // draw hand
    if (predictions) {
      bound = draw_viewfinder(predictions);
    }
    pop();
  });

}

function draw() {
  // Mirror video
  // hasSetup = true;

  netUpdate();
  background(backgroundImage);

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


  drawScreenEffects();
}

function keyPressed() {
  if (key === 'e') {
    activateRandomScreenEffect(5000);
  }
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


// google gemini generated code from initial base code
function activateRandomScreenEffect(duration) {
  // Deactivate any currently active effect
  for (let effectName in screenEffects) {
    if (screenEffects[effectName].isActive) {
      screenEffects[effectName].isActive = false;
      screenEffects[effectName].clear();
    }
  }

  // Choose a random effect to activate
  const availableEffects = Object.keys(screenEffects).filter(
    effectName => !screenEffects[effectName].isActive
  );
  const randomEffectName = random(availableEffects);
  const randomEffect = screenEffects[randomEffectName];

  randomEffect.isActive = true;
  randomEffect.init(); // Call the init function if it exists

  randomEffect.timeout = setTimeout(() => {
    randomEffect.isActive = false;
    randomEffect.clear();
  }, duration);
}


function clearEffect() {
  clearTimeout(screenEffectTimeout);
  screenEffectArray = [];
}

function blooperEffect() {

  if (screenEffects.blooper.data.length === 0) {
    let amount = getRandomInt(30, 50);

    for (let i = 0; i < amount; i++) {
      let splat = {
        x: getRandomArbitrary(0, width),
        y: getRandomArbitrary(0, height),
        radius: getRandomArbitrary(width / 20, width / 10),
        opacity: 1,
        points: [],
        growthFactor: 0,
        isFullSize: false,
        growthSpeed: getRandomArbitrary(0.01, 0.03),
        fadeSpeed: getRandomArbitrary(0.003, 0.007),
      };

      for (let j = 0; j < 10; j++) {
        let angle = radians(j * 360 / 10);
        let offset = splat.radius * getRandomArbitrary(0.3, 0.8);
        let jitterX = getRandomArbitrary(-offset * 0.3, offset * 0.3);
        let jitterY = getRandomArbitrary(-offset * 0.3, offset * 0.3);
        splat.points.push({
          x: splat.x + cos(angle) * offset + jitterX,
          y: splat.y + sin(angle) * offset + jitterY,
          originalX: splat.x + cos(angle) * offset + jitterX,
          originalY: splat.y + sin(angle) * offset + jitterY,
        });
      }

      screenEffects.blooper.data.push(splat);
    }
  }

  push();

  // Iterate through splats in reverse to safely remove them
  for (let i = screenEffects.blooper.data.length - 1; i >= 0; i--) {
    let splat = screenEffects.blooper.data[i];

    // Increased number of layers and smoother opacity easing
    let numLayers = 5;
    for (let layer = 0; layer < numLayers; layer++) {
      let layerOpacity = splat.opacity * pow(1 - layer / numLayers, 2);
      noStroke();
      fill(color(70, 40, 10, layerOpacity * 255));

      // Apply individual growth to each point
      for (let j = 0; j < splat.points.length; j++) {
        let point = splat.points[j];
        point.x = point.originalX + splat.growthFactor * (point.originalX - splat.x);
        point.y = point.originalY + splat.growthFactor * (point.originalY - splat.y);
      }

      // Draw the splat with curveVertex() for smoother edges
      beginShape();
      curveVertex(splat.points[splat.points.length - 1].x, splat.points[splat.points.length - 1].y);
      for (let point of splat.points) {
        curveVertex(point.x, point.y);
      }
      curveVertex(splat.points[0].x, splat.points[0].y);
      curveVertex(splat.points[1].x, splat.points[1].y);
      endShape(CLOSE);
    }

    // Update growth factor and check for full size
    splat.growthFactor = min(splat.growthFactor + splat.growthSpeed, 0.7);
    if (splat.growthFactor >= 0.7) {
      splat.isFullSize = true;
    }

    // Fade out splat opacity completely
    if (splat.isFullSize) {
      splat.opacity -= splat.fadeSpeed;
    }

    // Remove splats when opacity reaches zero or below
    if (splat.opacity <= 0) {
      screenEffects.blooper.data.splice(i, 1);
    }
  }

  pop();
}



function drawScreenEffects() {
  for (let effectName in screenEffects) {
    if (screenEffects[effectName].isActive) {
      screenEffects[effectName].update();
    }
  }
}


/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

/**
* Returns a random integer between min (inclusive) and max (inclusive).
* The value is no lower than min (or the next integer greater than min
* if min isn't an integer) and no greater than max (or the next integer
* lower than max if max isn't an integer).
* Using Math.round() will give you a non-uniform distribution!
*/
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
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