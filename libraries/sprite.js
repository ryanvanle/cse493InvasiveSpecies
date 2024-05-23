const spriteHeight = 35;
const spriteWidth = 35;
const invasiveLikelihood = 0.4;
const speciesDescriptions = ['stinkbug', 'bullfrog', 'mustard'];

// Sprite class that holds info for each sprite
class Sprite {
  constructor(typeIndex) {
    this.x = 0; // start on left
    // Random place throughout screen
    this.y = random(0 + spriteHeight, height-spriteHeight); // TODO: check this correct range
    this.width = spriteWidth;
    this.height = spriteHeight;
    this.speed = 1;
    this.isInvasive = random(0, 1) < 0.4; // 40% chance of being invasive
    // const descrIndex = floor(random(0, speciesDescriptions.length));
    this.typeIndex = typeIndex;

    this.isHighlighted = false;

    if(this.isInvasive) {
      this.description = speciesDescriptions[this.typeIndex];

      // this.spriteImage = invasiveImages[descrIndex];
    }

    // Change this to index the corresponding invasive species
    // this.spriteImage = loadImage("images/brown_marmorated_stinkbug.jpg");
    this.offScreen = false;
  }

  // checkIfOverlaps(cursor){
  //   // returns true if sprite overlaps with cursor, false otherwise
  //   if((cursor.x + cursor.width > this.x && cursor.x < this.x + this.width) &&
  //      (cursor.y < this.topHeight || (cursor.y + cursor.height) > (height - this.bottomHeight))){
  //     return true;
  //   }
  //   return false;
  // }

  update(){
    // sprites move from left to right
    this.x += this.speed;
  }

  // Param: takes preloaded image defined by index of sprite
  draw(speciesImage){
    fill(0);
    if(speciesImage) {
      // Draw species sprite
      push();

      if (this.isHighlighted) {
        rectMode(CENTER)
        fill("red");
        stroke("red");
        rect(this.x, this.y, spriteWidth + 5, spriteHeight + 5)
      }

      imageMode(CENTER);
      image(speciesImage, this.x,this.y,spriteWidth,spriteHeight);
      pop();
    } else {
      print('Sprite image was not defined');
      rect(this.x, this.y, spriteWidth, spriteHeight);
    }
  }

  displayInfo() {
    let description = this.description == null ?
                      "friendly" : this.description;
    push();

    rectMode(CENTER)

    let isFriendly = this.description == null;
    if (isFriendly) {
      fill("blue");
    } else {
      fill("red");
    }

    stroke(155);
    rect(this.x, this.y, spriteWidth + 10, spriteHeight + 10);
    textSize(12);
    fill(255,255,255);
    textAlign(CENTER);
    text(description, this.x, this.y );
    pop();
  }

  displayNetInfo(isNetHovered) {

    this.isHighlighted = isNetHovered;

  }
}