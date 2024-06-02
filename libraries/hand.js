const PADDING = 100;
const WIDTH = 640.0;
const HEIGHT = 480.0;
let CANVAS_WIDTH = window.innerWidth - PADDING;
let CANVAS_HEIGHT = ((window.innerWidth - PADDING) * 9) / 16;

if (CANVAS_HEIGHT > window.innerHeight - PADDING) {
  CANVAS_HEIGHT = window.innerHeight - PADDING;
  CANVAS_WIDTH = (CANVAS_HEIGHT * 16) / 9;
}

function modelReady() {
  console.log("Model ready!");
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints(prediction) {
  let vertices = [];
  let thumbtip = prediction.annotations.thumb[3];
  let pinkytip = prediction.annotations.pinky[3];
  let middlefingertip = prediction.annotations.middleFinger[3];
  let palmbase = prediction.annotations.palmBase[0];

  // translate coordinates
  thumbtip = translate_coordinate(
    thumbtip[0],
    thumbtip[1],
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
  pinkytip = translate_coordinate(
    pinkytip[0],
    pinkytip[1],
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
  middlefingertip = translate_coordinate(
    middlefingertip[0],
    middlefingertip[1],
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
  palmbase = translate_coordinate(
    palmbase[0],
    palmbase[1],
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );

  // hand is translated by amount width and scaled by -1 in x axis
  vertices.push({ x: width - thumbtip[0], y: thumbtip[1] });
  vertices.push({ x: width - pinkytip[0], y: pinkytip[1] });
  vertices.push({ x: width - middlefingertip[0], y: middlefingertip[1] });
  vertices.push({ x: width - palmbase[0], y: palmbase[1] });
  for (let j = 0; j < prediction.landmarks.length; j += 1) {
    const keypoint = prediction.landmarks[j];
    push();
    fill(0, 255, 0);
    noStroke();
    let point = translate_coordinate(
      keypoint[0],
      keypoint[1],
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );
    ellipse(point[0], point[1], 10, 10);
    pop();
  }

  return vertices;
}

function choose(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

// draw viewfinder on hand location
function draw_viewfinder(prediction, shutter) {
  let palmbase = prediction.annotations.palmBase[0];
  palmbase = translate_coordinate(
    palmbase[0],
    palmbase[1],
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );

  let w = window.innerWidth / 6;
  let h = window.innerWidth / 6;
  let diameter = 40;

  push();
  if (shutter) {
    angleMode(DEGREES);
    image(uiImages[4], palmbase[0] - w / 2, palmbase[1] - h, w, h);
    rotate(choose([0, 90, 180, 270]));
  } else {
    image(uiImages[3], palmbase[0] - w / 2, palmbase[1] - h, w, h);
  }

  pop();
  return [width - w - (palmbase[0] - w / 2), palmbase[1], w, h];
}

// x1, y1 is the object and x2, y2 is the bounds
function in_rect(point, bound) {
  x1 = point.x;
  y1 = point.y;
  x2 = bound[0];
  y2 = bound[1];
  w = bound[2];
  h = bound[3];
  if (x1 < x2 || y1 > y2 || x1 > x2 + w || y1 < y2 - h) {
    return false;
  }
  return true;
}

// code credit : https://observablehq.com/@tmcw/understanding-point-in-polygon
function in_poly(point, polygon) {
  let x = point.x;
  let y = point.y;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i].x,
      yi = polygon[i].y;
    let xj = polygon[j].x,
      yj = polygon[j].y;

    let intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// scale the ml5 output to actual canvas size
// parameters :
// x, y : input coordinate
// w, h : width and height of canvas
// Output
// res : array containing output x and y
function translate_coordinate(x, y, w, h) {
  let res = [];
  res[0] = (x / WIDTH) * w;
  res[1] = (y / HEIGHT) * h;
  return res;
}

// function to detect whether hand is closed
// returns boolean value
function is_closed(prediction) {
  let thumbtip = prediction.annotations.thumb[3];
  let pinkytip = prediction.annotations.pinky[3];
  let middlefingertip = prediction.annotations.middleFinger[3];
  let palmbase = prediction.annotations.palmBase[0];
  let palmbase_2 = prediction.annotations.middleFinger[0];
  palmbase_2 = translate_coordinate(
    palmbase_2[0],
    palmbase_2[1],
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );

  thumbtip = translate_coordinate(
    thumbtip[0],
    thumbtip[1],
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
  pinkytip = translate_coordinate(
    pinkytip[0],
    pinkytip[1],
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
  middlefingertip = translate_coordinate(
    middlefingertip[0],
    middlefingertip[1],
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
  palmbase = translate_coordinate(
    palmbase[0],
    palmbase[1],
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
  let depth =
    abs(palmbase[0] - palmbase_2[0]) + abs(palmbase[1] - palmbase_2[1]) * 10;

  let observed_points = [thumbtip, pinkytip, middlefingertip];
  let distances = 0;
  for (let i = 0; i < observed_points.length; i++) {
    const point = observed_points[i];
    distances +=
      abs(point[0] - palmbase[0]) + abs(point[1] - palmbase[1]) / depth;
  }
  // palm closes at value < 30
  let value = distances / observed_points.length;
  text(value, 20, 40);
  return value < 60;
}
