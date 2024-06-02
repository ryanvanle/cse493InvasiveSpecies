const spriteHeight = 45;
const spriteWidth = 45;
const invasiveLikelihood = 0.4;
const speciesDescriptions = [  // order is consistent with spriteImages in sketch.js
  {
    name: "Brown Marmorated Stinkbug",
    description:
      "Native to China, Japan, Korea, and other Asian regions",
    imageIndex: 1,
  },
  {
    name: "Bullfrog",
    description:
      "Bullfrogs are predators that eat practically anything they can catch.",
    imageIndex: 2,
  },
  {
    name: "Garlic mustard",
    description:
      "This plant blocks sunlight and outcompetes others for moisture and vital nutrients.",
    imageIndex: 3,
  },
  {
    name: "American Pika",
    description:
      "Herbivores, normally found in mountains of North America",
    imageIndex: 4,
  },
  {
    name: "Olympic Marmot",
    description:
      "Occurs only in Washington, USA",
    imageIndex: 5,
  },
  {
    name: "Canada Geese",
    description:
      "Found in the temperate regions of North America",
    imageIndex: 6,
  },
];
// const infoBoxHeight = 200;

// Sprite class that holds info for each sprite
class Sprite {
  constructor(typeIndex, isInvasive) {
    this.x = 0; // start on left
    // Random place throughout screen
    this.y = random(2 * spriteHeight, 720 - spriteHeight * 2); // 720 is canvas height
    this.width = spriteWidth;
    this.height = spriteHeight;
    this.speed = 5;
    this.isInvasive = isInvasive;
    // const descrIndex = floor(random(0, speciesDescriptions.length));
    this.typeIndex = typeIndex;
    this.spriteMillis = millis();

    this.isHighlighted = false;
    this.description = speciesDescriptions[this.typeIndex];

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

  update() {
    // sprites move from left to right
    if (millis() - this.spriteMillis > 30) {
      this.x += this.speed;
      this.spriteMillis = millis();
    }
  }

  // Param: takes preloaded image defined by index of sprite
  draw(speciesImage) {
    fill(0);
    if (speciesImage) {
      // Draw species sprite
      push();

      if (this.isHighlighted) {
        rectMode(CENTER);
        fill("red");
        stroke("red");
        rect(this.x, this.y, spriteWidth + 5, spriteHeight + 5);
      }

      imageMode(CENTER);
      image(speciesImage, this.x, this.y, spriteWidth, spriteHeight);
      pop();
    } else {
      print("Sprite image was not defined");
      rect(this.x, this.y, spriteWidth, spriteHeight);
    }
  }

  displayInfo() {
    push();
    rectMode(CENTER);
    noFill();
    stroke(0, 0, 255);
    rect(this.x, this.y, spriteWidth + 10, spriteHeight + 10);
    pop();
  }

  displayNetInfo(isNetHovered) {
    this.isHighlighted = isNetHovered;
  }
}
