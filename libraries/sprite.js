const spriteHeight = 25;
const spriteWidth = 45;
const invasiveLikelihood = 0.4;
const speciesDescriptions = ['stinkbug', 'bullfrog', 'mustard'];

// Sprite class that holds info for each sprite
class Sprite {
  constructor(index) {
    this.x = 0; // start on left
    // Random place throughout screen
    this.y = random(0 + spriteHeight, height-spriteHeight); // TODO: check this correct range
    this.width = spriteWidth;
    this.height = spriteHeight;
    this.speed = 1;
    this.isInvasive = random(0, 1) < 0.4; // 40% chance of being invasive
    // const descrIndex = floor(random(0, speciesDescriptions.length));
    this.typeIndex = index
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

  draw(speciesImage){
    fill(0);
    if(speciesImage) {
      // Draw invasive sprite
      image(speciesImage, this.x,this.y,spriteWidth,spriteHeight);
    } else {
      rect(this.x, this.y, spriteWidth, spriteHeight);
    }
  }

  displayInfo() {
    let description = this.description == null ? 
                      "friendly" : this.description;  
    push();
    fill(0,0,255);
    stroke(155);
    rect(this.x, this.y, 60, 80);
    textSize(12);
    fill(255,255,255);
    text(description, this.x + 5, this.y + 10);
    pop();
  }
}