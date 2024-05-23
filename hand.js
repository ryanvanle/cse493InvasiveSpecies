function modelReady() {
  console.log("Model ready!");
}


// A function to draw ellipses over the detected keypoints
function drawKeypoints(prediction) {
  let vertices = [];
  const bb = prediction.boundingBox;
  const bbWidth = bb.bottomRight[0] - bb.topLeft[0];
  const bbHeight = bb.bottomRight[1] - bb.topLeft[1];
  for (let j = 0; j < prediction.landmarks.length; j += 1) {
    const keypoint = prediction.landmarks[j];
    const thumbtip = prediction.annotations.thumb[3];
    const pinkytip = prediction.annotations.pinky[3];
    const middlefingertip = prediction.annotations.middleFinger[3];
    const palmbase = prediction.annotations.palmBase[0];
    
    // hand is translated by amount width and scaled by -1 in x axis
    vertices.push({x: width - thumbtip[0], y: thumbtip[1]});
    vertices.push({x : width - pinkytip[0], y: pinkytip[1]});
    vertices.push({x : width - middlefingertip[0], y : middlefingertip[1]});
    vertices.push({x: width - palmbase[0], y : palmbase[1]});
    
    
    stroke(155);
    line(thumbtip[0], thumbtip[1] , middlefingertip[0], middlefingertip[1]);
    line(middlefingertip[0], middlefingertip[1] , pinkytip[0], pinkytip[1]);
    line(thumbtip[0], thumbtip[1], palmbase[0], palmbase[1]);
    line(pinkytip[0], pinkytip[1], palmbase[0], palmbase[1]);
    
    push();
    fill(0, 255, 0);
    noStroke();
    ellipse(keypoint[0], keypoint[1], 10, 10);
    pop();
  }

    push();
    noFill();
    stroke("red");
    rect(bb.topLeft[0], bb.topLeft[1], bbWidth, bbHeight);
    pop();

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
