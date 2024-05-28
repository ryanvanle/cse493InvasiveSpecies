const WIDTH = 640.0;
const HEIGHT = 480.0;
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

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
  thumbtip = translate_coordinate(thumbtip[0], thumbtip[1], CANVAS_WIDTH, CANVAS_HEIGHT);
  pinkytip = translate_coordinate(pinkytip[0], pinkytip[1], CANVAS_WIDTH, CANVAS_HEIGHT);
  middlefingertip = translate_coordinate(middlefingertip[0], middlefingertip[1], CANVAS_WIDTH, CANVAS_HEIGHT);
  palmbase = translate_coordinate(palmbase[0], palmbase[1], CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // hand is translated by amount width and scaled by -1 in x axis
  vertices.push({x: width - thumbtip[0], y: thumbtip[1]});
  vertices.push({x : width - pinkytip[0], y: pinkytip[1]});
  vertices.push({x : width - middlefingertip[0], y : middlefingertip[1]});
  vertices.push({x: width - palmbase[0], y : palmbase[1]});
  for (let j = 0; j < prediction.landmarks.length; j += 1) {
    const keypoint = prediction.landmarks[j];
    push();
    fill(0, 255, 0);
    noStroke();
    let point = translate_coordinate(keypoint[0], keypoint[1], CANVAS_WIDTH, CANVAS_HEIGHT);
    ellipse(point[0], point[1], 10, 10);
    pop();
  }


  return vertices;
}

// code credit : https://observablehq.com/@tmcw/understanding-point-in-polygon
function in_poly(point, polygon) {
  let x = point.x;
  let y = point.y;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i].x, yi = polygon[i].y;
    let xj = polygon[j].x, yj = polygon[j].y;

    let intersect = ((yi > y) != (yj > y)) &&
                    (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
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
  res[0] = x / WIDTH * w;
  res[1] = y / HEIGHT * h;
  return res;
}
