let sprites;
let nextSpawnDistance;
let minDistanceBetweenSprites;
let video;
let predictions = [];
let bound = [];

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
    predictions = results;
  });

}

function draw() {
  // Mirror video
  translate(width,0); // move to far corner
  scale(-1.0,1.0);

  background(220);
  // draw hand
  bound = drawKeypoints(predictions);

  // If no sprites or last sprite has surpassed nextSpawnDistance, generate another sprite
  if (sprites.length <= 0 || sprites[sprites.length-1].x >= nextSpawnDistance){
    sprites.push(new Sprite());
    // nextSpawnDistance = random(minDistanceBetweenSprites, width/3);
    // print(nextSpawnDistance);
  }

  // loop through all the sprites and update them
   for(let i = 0; i < sprites.length; i++){
    // check if sprite is in hand
    // sprite will turn red if selected
    let selected = point_in_polygon({x: sprites[i].x, y: sprites[i].y}, bound);
    sprites[i].draw(selected);
    sprites[i].update();

    // remove pipes that have gone off the screen
    if(sprites[i].x + sprites[i].width > width){
      sprites.splice(i, 1); // delete 1 item starting at index i
    }
  }


  // print(sprites);
}

function resetGame(){
  score = 0;
  sprites = [new Sprite()];
  nextSpawnDistance = random(minDistanceBetweenSprites, width/3);
  print(nextSpawnDistance);
}

// Code and Sprite class inspiried by https://editor.p5js.org/jonfroehlich/sketches/sFOMDuDaw