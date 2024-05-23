"use strict";
let pHtmlMsg;
let serialOptions = { baudRate: 115200 };
let serial;
let previousControllerValues = {};
let previousRawValue = null;
let currentRawValue;
let controllerValues = {};

let sprites;
let nextSpawnDistance;
let minDistanceBetweenSprites;
let video;
let predictions = [];
let bound = [];
let score = 0;

function setup() {
  createCanvas(window.innerWidth, window.innerHeight - 50);
  video = createCapture(VIDEO);
  video.size(width, height);

  handpose = ml5.handpose(video, modelReady);
  minDistanceBetweenSprites = width / 5; // at least this much margin between sprites
  resetGame();
  // Hide the video element, and just show the canvas
  video.hide();

  handpose.on("predict", (results) => {
    predictions = results;
  });

  // Setup Web Serial using serial.js
  serial = new Serial();
  serial.on(SerialEvents.CONNECTION_OPENED, onSerialConnectionOpened);
  serial.on(SerialEvents.CONNECTION_CLOSED, onSerialConnectionClosed);
  serial.on(SerialEvents.DATA_RECEIVED, onSerialDataReceived);
  serial.on(SerialEvents.ERROR_OCCURRED, onSerialErrorOccurred);

  // If we have previously approved ports, attempt to connect with them
  // serial.autoConnectAndOpenPreviouslyApprovedPort(serialOptions);

  // Add in a lil <p> element to provide messages. This is optional
  id("data").textContent =
    "Click anywhere on this page to open the serial connection dialog";

  colorMode(RGB);
}

let i = 0;

function draw() {
  // Mirror video
  push();
  translate(width,0);
  scale(-1.0,1.0);
  background(220);
  // draw hand
  bound = drawKeypoints(predictions);
  pop();

  // If no sprites or last sprite has surpassed nextSpawnDistance, generate another sprite
  if (
    sprites.length <= 0 ||
    sprites[sprites.length - 1].x >= nextSpawnDistance
  ) {
    sprites.push(new Sprite());
    // nextSpawnDistance = random(minDistanceBetweenSprites, width/3);
    // print(nextSpawnDistance);
  }

  // loop through all the sprites and update them
  for (let i = 0; i < sprites.length; i++) {
    // check if sprite is in hand
    // sprite will turn red if selected
    let selected = point_in_polygon(
      { x: sprites[i].x, y: sprites[i].y },
      bound
    );
    sprites[i].draw(selected);
    if (selected) {
      sprites[i].displayInfo();
    }
    sprites[i].update();

    // remove pipes that have gone off the screen
    if (sprites[i].x + sprites[i].width > width) {
      sprites.splice(i, 1); // delete 1 item starting at index i
    }
  }
}

function resetGame() {
  score = 0;
  sprites = [new Sprite()];
  nextSpawnDistance = random(minDistanceBetweenSprites, width / 3);
  print(nextSpawnDistance);
}

function preload() {}

// serial code

/**
 * Callback function by serial.js when there is an error on web serial
 *
 * @param {} eventSender
 */
function onSerialErrorOccurred(eventSender, error) {
  console.log("onSerialErrorOccurred", error);
  id("data").textContent = error;
}

/**
 * Callback function by serial.js when web serial connection is opened
 *
 * @param {} eventSender
 */
function onSerialConnectionOpened(eventSender) {
  console.log("onSerialConnectionOpened");
  id("data").textContent = "Serial connection opened successfully";
}

/**
 * Callback function by serial.js when web serial connection is closed
 *
 * @param {} eventSender
 */
function onSerialConnectionClosed(eventSender) {
  console.log("onSerialConnectionClosed");
  pHtmlMsg.html("onSerialConnectionClosed");
}

/**
 * Callback function serial.js when new web serial data is received
 *
 * @param {*} eventSender
 * @param {String} newData new data received over serial
 */
function onSerialDataReceived(eventSender, newData) {
  // console.log("onSerialDataReceived", newData);
  id("data").textContent = "onSerialDataReceived: " + newData;
  processData(newData);
}

/**
 * Called automatically by the browser through p5.js when mouse clicked
 */
function mouseClicked() {
  if (!serial.isOpen()) {
    serial.connectAndOpen(null, serialOptions);
  }
}

function processData(newData) {
  previousRawValue = currentRawValue;
  currentRawValue = newData;

  let dataArray = currentRawValue.split(",");
  let nameArray = [
    "x",
    "y",
    "z",
    "xAcceleration",
    "yAcceleration",
    "zAcceleration",
  ];

  if (dataArray.length != nameArray.length)
    console.error(
      "dataArray != nameArray in processData",
      dataArray,
      nameArray
    );

  previousControllerValues = structuredClone(controllerValues);
  controllerValues = {};
  for (let i = 0; i < dataArray.length; i++) {
    controllerValues[nameArray[i]] = Number(dataArray[i]);
  }
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
