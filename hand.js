function modelReady() {
  console.log("Model ready!");
}


// A function to draw ellipses over the detected keypoints
function drawKeypoints(predictions) {
  let vertices = [];
  for (let i = 0; i < predictions.length; i += 1) {
    const prediction = predictions[i];
    
    for (let j = 0; j < prediction.landmarks.length; j += 1) {
      const keypoint = prediction.landmarks[j];
      const thumbtip = prediction.annotations.thumb[3];
      const pinkytip = prediction.annotations.pinky[3];
      const middlefingertip = prediction.annotations.middleFinger[3];
      const palmbase = prediction.annotations.palmBase[0];
      
      if (j == prediction.landmarks.length - 1) {
        // hand is translated by amount width and scaled by -1 in x axis
        vertices.push({x: -thumbtip[0] + width, y: thumbtip[1]});
        vertices.push({x : width - pinkytip[0], y: pinkytip[1]});
        vertices.push({x : width - middlefingertip[0], y : middlefingertip[1]});
        vertices.push({x: width - palmbase[0], y : palmbase[1]});
      }
      
      
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
  }
  return vertices;
}

// code credit : https://www.geeksforgeeks.org/how-to-check-if-a-given-point-lies-inside-a-polygon/
function point_in_polygon(point, polygon) {
    const num_vertices = polygon.length;
    const x = point.x;
    const y = point.y;
    let inside = false;
 
    let p1 = polygon[0];
    let p2;
 
    for (let i = 1; i <= num_vertices; i++) {
        p2 = polygon[i % num_vertices];
 
        if (y > Math.min(p1.y, p2.y)) {
            if (y <= Math.max(p1.y, p2.y)) {
                if (x <= Math.max(p1.x, p2.x)) {
                    const x_intersection = ((y - p1.y) * (p2.x - p1.x)) / (p2.y - p1.y) + p1.x;
 
                    if (p1.x === p2.x || x <= x_intersection) {
                        inside = !inside;
                    }
                }
            }
        }
 
        p1 = p2;
    }
 
    return inside;
}
