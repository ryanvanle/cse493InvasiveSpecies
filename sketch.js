// sprite globals
let sprites;
let nextSpawnDistance;
let minDistanceBetweenSprites;
let spriteImages;
let sourceImage;
let spriteMillis = 0;
const invasive_max_index = 2;

// handpose globals
let video;
let predictions;
let bound = null;
let prediction_interval = 100;
let last_prediction = 0;
let capture_millis = 0;
let model_ready = false;
let hand_raised = false;

// net globals
let netControllerData;
let net;
let netScore = 0;
let netSound;
const DEFAULT_NET_SIZE = window.innerWidth / 10;

// gameplay globals
let isGameOver = false;
let mainFont;
const START_HEALTH = 3;
let ecoHealth = START_HEALTH;
const PTS = 1;

let backgroundImage;

const SHOW_TOP_BAR = true;

net = {
  x: Number(300 / 2),
  y: Number(200 / 2),
  xSpeed: 0,
  ySpeed: 0,
  diameter: DEFAULT_NET_SIZE,
};

previousNetControllerData = {
  x: 0,
  y: 0,
  z: 0,
  pressed: false,
};

netControllerData = {
  x: 0,
  y: 0,
  z: 0,
  pressed: false,
};

let screenEffectArray = [];
let fallingLeaves = [];
let groundLeaves = [];

let isScreenEffectActive = false;
let screenEffectTimeout;

// google gemini advance generated, essentially we're creating objects per effect, but not using the new JS class constructor

let screenEffects = {
  blooper: {
    isActive: false,
    timeout: null,
    data: [],
    init: function () {
      this.data = [];
    },
    clear: function () {
      clearTimeout(this.timeout);
      this.data = [];
    },
    update: blooperEffect,
  },
  colorInvert: {
    isActive: false,
    timeout: null,
    init: function () {},
    clear: function () {
      clearTimeout(this.timeout);
    },
    update: function () {
      filter(INVERT);
    },
  },
  leafFall: {
    isActive: false,
    timeout: null,
    init: function () {
      fallingLeaves = []; // Clear previous leaves if any
    },
    clear: function () {
      clearTimeout(this.timeout);
      fallingLeaves = [];
      groundLeaves = [];
    },
    update: leafFallEffect,
  },
  // ... add more effects here (e.g., shake, pixelate, etc.)
};

// Must declare image array in preload to work
// Invariant: # of invasive and non-invasive species must be the same.
// Each Sprite has an image index that is the same across invasive and native variants
function preload() {
  spriteImages = [  // index 0 up to invasive_max_index are invasive species
    loadImage("img/invasive/brown_marmorated_stinkbug.png"),
    loadImage("img/invasive/american_bullfrog.png"),
    loadImage("img/invasive/garlic_mustard.jpg"),
    loadImage("img/native/american_pika.jpg"),
    loadImage("img/native/olympic_marmot.jpg"),
    loadImage("img/native/canada_geese.jpg"),
  ]

  // order consistent with spriteImages
  sourceImage = [  // // index 0 up to invasive_max_index are invasive species
    "img/invasive/brown_marmorated_stinkbug.png",
    "img/invasive/american_bullfrog.png",
    "img/invasive/garlic_mustard.jpg",
    "img/native/american_pika.jpg",
    "img/native/olympic_marmot.jpg",
    "img/native/canada_geese.jpg",
  ];

  backgroundImage = loadImage("img/grass.jpeg");
  // Image Attribution: Image by brgfx on Freepik
  backgroundImage = loadImage("img/rocky_cliff.jpg");
  // backgroundImage = loadImage('img/grass.jpeg');

  cameraSound = loadSound("audio/camera.mp3");
  netSound = loadSound("audio/swing.mp3");
  correct_bell = loadSound("audio/correct.mp3");
  wrong = loadSound("audio/wrong.mp3");
  lose = loadSound("audio/lose.mp3");
  // mainFont = loadFont('assets/Organo.ttf');
  mainFont = loadFont("assets/comic.TTF");
}

function setup() {
  let canvasWidth = window.innerWidth - 100;
  let canvasHeight = (canvasWidth * 9) / 16;

  if (canvasHeight > window.innerHeight - 100) {
    canvasHeight = window.innerHeight - 100;
    canvasWidth = (canvasHeight * 16) / 9;
  }

  createCanvas(canvasWidth, canvasHeight);
  spriteMillis = millis();
  video = createCapture(VIDEO);
  video.size(width, height);
  textFont(mainFont);

  soundFormats("mp3");

  handpose = ml5.handpose(video, () => {
    model_ready = true;
  });

  minDistanceBetweenSprites = width / 5; // at least this much margin between sprites

  resetGame();
  // Hide the video element, and just show the canvas
  video.hide();

  handpose.on("predict", (results) => {
    predictions = results[0];
    if (!hand_raised && results[0] != undefined) {
      if (results[0].handInViewConfidence > 0.9999) {
        hand_raised = true;
      }
    }
  });
}

function hideTopBar() {
  if (!SHOW_TOP_BAR) {
    let topBar = id("top-bar");
    topBar.style.display = "none";
  }
}

function draw() {
  hideTopBar();

  if (!model_ready) {
    menu();
  } else if (!hand_raised) {
    if (isGameOver) {
      // Start over screen
      gameOver();
    } else {
      raise_hand(); // Raise hand to trigger game
    }
  } else {
    // Game in action
    gameplay_loop();
  }
}

function menu() {
  background(backgroundImage);
  push();
  textSize(50);
  let s = "Model Loading...";
  text(s, (width - textWidth(s)) / 2, height / 2);
  pop();
}

function raise_hand() {
  background(backgroundImage);
  push();
  textSize(100);
  let s = "Space Invaders";
  text(s, (width - textWidth(s)) / 2, height / 3);
  textSize(50);
  s = "raise hand to start playing";
  text(s, (width - textWidth(s)) / 2, height / 2);
  pop();
}

function gameplay_loop() {
  netUpdate();
  background(backgroundImage);

  // If no sprites or last sprite has surpassed nextSpawnDistance, generate another sprite
  if (
    sprites.length <= 0 ||
    sprites[sprites.length - 1].x >= nextSpawnDistance
  ) {
    sprites.push(getNewSprite());
    // nextSpawnDistance = random(minDistanceBetweenSprites, width/3);
    // print(nextSpawnDistance);
  }

  // loop through all the sprites and update them
  for (let i = 0; i < sprites.length; i++) {
    // check if sprite is in hand
    let selected = false;
    if (bound) {
      selected = in_rect({ x: sprites[i].x, y: sprites[i].y }, bound);
    }

    sprites[i].update();

    // remove sprites that have gone off the screen
    if (sprites[i].x + sprites[i].width > width) {
      sprites[i].offScreen = true;

      // If failed to capture,
      if (sprites[i].isInvasive) {
        updateScore(false);
        console.log("Failed to capture invasive");
      }
    }

    // Only draw on screen sprites
    if (!sprites[i].offScreen) {
      // INVASIVE
      sprites[i].draw(spriteImages[sprites[i].typeIndex]);
    }
    const speciesIdentifier = id("species-identifier");
    const imgElement = id("species-image");
    const info = id("species-info");
    const name = id("species-name");

    if (selected) {
      if (
        predictions &&
        is_closed(predictions) &&
        millis() - capture_millis > 500
      ) {
        cameraSound.play();
        push();
        translate(width, 0);
        scale(-1.0, 1.0);
        draw_viewfinder(predictions, true);
        pop();

        info.innerHTML = sprites[i].description.description;
        name.innerHTML = sprites[i].description.name;
        imgElement.src = sourceImage[sprites[i].typeIndex];
        imgElement.style.display = "block";
        let speciesType = sprites[i].isInvasive ? "invasive" : "native";

        sendDataToServer("image", sprites[i].description.description, sprites[i].description.name, speciesType); // replace image later

        if (sprites[i].isInvasive) {
          speciesIdentifier.innerHTML = "Invasive ❌";
        } else {
          console.log("Native!!!!");
          speciesIdentifier.innerHTML = "Native ✅";
        }

        capture_millis = millis();
      }
      sprites[i].displayInfo();
    }

    let isNetHovering = netSpeciesHoverChecker(sprites[i]);
    sprites[i].displayNetInfo(isNetHovering);

    push();
    translate(width, 0);
    scale(-1.0, 1.0);
    // draw hand
    if (predictions) {
      bound = draw_viewfinder(predictions, false);
    }
    pop();
  }
  // Check if furthest sprite has gone off screen
  // Delete from list to prevent from getting unnecessarily long
  if (sprites[0].offScreen) {
    sprites.splice(0, 1);
  }

  drawNetCursor();
  displayScore();

  // frame rate count. uncomment when debugging
  // text(frameRate(), 20, 20);
  text(frameRate(), 20, 20);

  drawScreenEffects();
}

function keyPressed() {
  if (key === "e") {
    activateRandomScreenEffect(5000);
  }
}

function resetGame() {
  // netScore = 0;
  ecoHealth = START_HEALTH;
  sprites = [getNewSprite()];
  nextSpawnDistance = random(minDistanceBetweenSprites, width / 3);
  hand_raised = false;
}

// Game Over Screen
function gameOver() {
  // Clear the screen
  background(backgroundImage);
  updateHealthBar(0);
  // Ask user to try again
  push();
  textSize(100);
  let message = "game over!";
  textSize(50);
  text(message, (width - textWidth(message)) / 2, height / 3);
  message = "raise hand to try again";
  text(message, (width - textWidth(message)) / 2, height / 2);
  pop();
  setTimeout(checkResetGame, 2000);

  // // Watch for hand raise again
  // if (hand_raised) {
  //   isGameOver = false;
  //   updateHealthBar(1);
  // }
}

function checkResetGame() {
  if (hand_raised) {
    isGameOver = false;
    updateHealthBar(1);
  }
}

// generate a new sprite
function getNewSprite() {
  // 40% chance of being invasive
  // index 0 - 2 are invasive
  const isInvasive = random(0, 1) < 0.4;
  let typeIndex;
  if (isInvasive) {
    typeIndex = floor(random(0, invasive_max_index));
  } else {
    typeIndex = floor(random(invasive_max_index + 1, spriteImages.length));
  }
  console.log(typeIndex, isInvasive);
  return new Sprite(typeIndex, isInvasive);
}

// Code and Sprite class inspiried by https://editor.p5js.org/jonfroehlich/sketches/sFOMDuDaw

const ws = new WebSocket("ws://localhost:8005");

ws.onopen = () => {
  console.log("Connected to the server");

  const sampleImageData = "base64EncodedImageData";
  const sampleDescription = "description";
  const sampleTitle = "hi! :D";
  const sampleSpecies = "invasive"

  sendDataToServer(sampleImageData, sampleDescription, sampleTitle, sampleSpecies);
};

function sendDataToServer(imageData, description, title, speciesType) {
  const dataToSend = JSON.stringify({ image: imageData, description, title, speciesType});
  ws.send(dataToSend);
}


ws.onmessage = (event) => {
  // console.log(event.data);
  let data = event.data.split(",");
  let isPressed = data[3] === "true";

  previousNetControllerData = netControllerData;

  netControllerData = {
    x: Number(data[0]),
    y: Number(data[1]),
    z: Number(data[2]),
    pressed: isPressed,
  };
};

ws.onclose = () => {
  console.log("Disconnected from the server");
};

function netUpdate() {
  // if (!hasSetup) return;

  let isPressed = netControllerData.pressed;
  let isCatching = isSwingingChecker() && isPressed;

  if (isCatching) {
    lockNetPosition();
    netSound.play();

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

  let strokeColor = netControllerData.pressed ? "red" : "black";
  stroke(strokeColor);
  noFill();

  strokeWeight(12);
  stroke(0);
  circle(net.x, net.y, net.diameter);

  strokeWeight(8);
  stroke(255);

  circle(net.x, net.y, net.diameter);
  pop();
}


function lockNetPosition() {
  net.xSpeed = 0;
  net.ySpeed = 0;
}

function netSpeciesHoverChecker(specie) {
  if (specie.offScreen) return;

  let netRadius = net.diameter / 2;
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
  let netRadius = net.diameter / 2;
  let isOutOfBoundsX =
    nextXPosition < 0 + netRadius || nextXPosition > width - netRadius;
  let isOutOfBoundsY =
    nextYPosition < 0 + netRadius || nextYPosition > height - netRadius;
  let isInBounds = !(isOutOfBoundsX || isOutOfBoundsY);
  return isInBounds;
}

function updateCapture() {
  console.log("in updateCapture");

  for (let specie of sprites) {
    if (specie.offScreen) continue;
    if (!specie.isHighlighted) continue;

    // If species on-screen and selected
    specie.offScreen = true;

    if (specie.isInvasive) {
      updateScore(true);
    } else {
      updateScore(false);
    }
  }
}

// When an animal is captured, updates score according to
// its identity (native vs invasive)
function updateScore(capturedInvasive) {
  if (capturedInvasive) {
    // netScore += 1;
    ecoHealth += PTS;
    correct_bell.play();
  } else {
    // captured native animal or failed to capture invasive
    // netScore--;
    ecoHealth -= PTS;
    if(ecoHealth > 0) {
      wrong.play();
    }
    
  }

  if (ecoHealth <= 0) {
    //  Lose game when health below 0
    resetGame();
    isGameOver = true;
    lose.play();
    // netScore = 0;
  }

  // displayScore();
}

function displayScore() {
  let currHealth = ecoHealth / START_HEALTH;
  updateHealthBar(currHealth);
}

function updateHealthBar(percentage) {
  let healthBarColors = [
    "#dc2626",
    "#f97316",
    "#f59e0b",
    "#facc15",
    "#84cc16",
    "#22c55e",
  ];

  let healthBarColor =
    healthBarColors[floor(percentage * healthBarColors.length)];

  const healthBar = id("health-bar");
  healthBar.style.width = percentage * 100 + "%";
  healthBar.style.backgroundColor = healthBarColor;

  const ecoHealthText = id("ecohealth");
  ecoHealthText.innerHTML = Math.round(percentage * 100) + "%";

  if (percentage <= 0.9) {
    ecoHealthText.style.color = "white";
  } else {
    ecoHealthText.style.color = "black";
  }

  if (percentage == 1) {
    healthBar.style.backgroundColor =
      healthBarColors[healthBarColors.length - 1];
  }
}

// google gemini advance generated code from initial base code
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
    (effectName) => !screenEffects[effectName].isActive
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
        let angle = radians((j * 360) / 10);
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
        point.x =
          point.originalX + splat.growthFactor * (point.originalX - splat.x);
        point.y =
          point.originalY + splat.growthFactor * (point.originalY - splat.y);
      }

      // Draw the splat with curveVertex() for smoother edges
      beginShape();
      curveVertex(
        splat.points[splat.points.length - 1].x,
        splat.points[splat.points.length - 1].y
      );
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

function leafFallEffect() {
  if (frameCount % 5 == 0) {
    let leaf = {
      x: getRandomArbitrary(0, width),
      y: -getRandomArbitrary(50, 100),
      size: getRandomArbitrary(100, 200),
      speed: getRandomArbitrary(3, 8),
      rotation: getRandomArbitrary(0, 360),
      opacity: random(0.7, 1),
      color: color(random(180, 220), random(100, 150), random(50, 80)),
      shapeVariation: random(0.8, 1.2),
      windFactor: random(-0.5, 0.5),
      targetY: random(0, height - 150), // Random target y position
    };
    fallingLeaves.push(leaf);
  }

  push();

  for (let i = fallingLeaves.length - 1; i >= 0; i--) {
    let leaf = fallingLeaves[i];

    // Update leaf position with wind effect and check if it reached its target
    leaf.x += leaf.windFactor;
    if (leaf.y < leaf.targetY) {
      leaf.y += leaf.speed;
      leaf.rotation += leaf.speed * 0.1;
    } else {
      groundLeaves.push(leaf);
      fallingLeaves.splice(i, 1);
      continue;
    }

    // Draw leaf (no fading)
    fill(leaf.color, leaf.opacity * 255);
    noStroke();
    translate(leaf.x, leaf.y);
    rotate(radians(leaf.rotation));
    beginShape();
    vertex(0, (-leaf.size / 2) * leaf.shapeVariation);
    vertex((-leaf.size / 4) * leaf.shapeVariation, 0);
    vertex(0, (leaf.size / 2) * leaf.shapeVariation);
    vertex((leaf.size / 4) * leaf.shapeVariation, 0);
    endShape(CLOSE);
    resetMatrix();
  }

  // Draw leaves on the ground
  for (let leaf of groundLeaves) {
    fill(leaf.color, leaf.opacity * 255);
    noStroke();
    translate(leaf.x, leaf.y);
    rotate(radians(leaf.rotation));
    beginShape();
    vertex(0, (-leaf.size / 2) * leaf.shapeVariation);
    vertex((-leaf.size / 4) * leaf.shapeVariation, 0);
    vertex(0, (leaf.size / 2) * leaf.shapeVariation);
    vertex((leaf.size / 4) * leaf.shapeVariation, 0);
    endShape(CLOSE);
    resetMatrix();
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
