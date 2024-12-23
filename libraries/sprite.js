const spriteHeight = screen.height*0.1;
const spriteWidth = screen.height*0.1;
const invasiveLikelihood = 0.4;
const speciesDescriptions = [
  // order is consistent with spriteImages in sketch.js
  {
    name: "Brown Marmorated Stinkbug",
    description: "Native to China, Japan, Korea, and other Asian regions",
  },
  {
    name: "Bullfrog",
    description:
      "Bullfrogs are predators that eat practically anything they can catch.",
  },
  {
    name: "Garlic mustard",
    description:
      "This plant blocks sunlight and outcompetes others for moisture and vital nutrients.",
  },
  {
    name: "Apple Maggot",
    description:
      "This insect lay eggs in apples. Young worms will consume the fruit",
  },
  {
    name: "Feral Swine",
    description:
      "Originally from Europe and Asia, this swine is highly adaptable",
  },
  {
    name: "European Green Crab",
    description:
      "An opportunistic feeder and aggressive invader, they are native to the Atlantic",
  },
  {
    name: "American Pika",
    description: "Herbivores, normally found in mountains of North America",
  },
  {
    name: "Olympic Marmot",
    description: "Occurs only in Washington, USA",
  },
  {
    name: "Canada Geese",
    description: "Found in the temperate regions of North America",
  },
  {
    name: "Garter Snake",
    description: "Lives in forests and wetlands of North America",
  },
  {
    name: "Columbia Spotted Frog",
    description: "A local of the Puget Sound Lowlands",
  },
  {
    name: "Western screech owl",
    description: "Loves areas near water and lives in Washington year round",
  },
];
// const infoBoxHeight = 200;

// Sprite class that holds info for each sprite
class Sprite {
  constructor(typeIndex, isInvasive, level) {
    this.x = 0; // start on left
    // Random place throughout screen
    this.y = random(2 * spriteHeight, window.innerHeight - 100 - spriteHeight * 2); // 720 is canvas height
    this.width = spriteWidth;
    this.height = spriteHeight;
    this.speed = (level - 1) + 5; // Speed increments by 2 pixels per level
    this.isInvasive = isInvasive;
    // const descrIndex = floor(random(0, speciesDescriptions.length));
    this.typeIndex = typeIndex;
    this.spriteMillis = millis();

    this.isHighlighted = false;
    this.isDisplayed = false;
    this.description = speciesDescriptions[this.typeIndex];
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
        rect(this.x, this.y, spriteWidth + 5, spriteHeight + 5, 10);
        imageMode(CENTER);
        image(
          speciesImage,
          this.x,
          this.y,
          spriteWidth * 1.5,
          spriteHeight * 1.5
        );
      } else {
        imageMode(CENTER);
        image(speciesImage, this.x, this.y, spriteWidth, spriteHeight);
      }
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
    stroke(255, 255, 255);
    strokeWeight(2);
    rect(this.x, this.y, spriteWidth + 10, spriteHeight + 10, 5);
    pop();
  }

  displayNetInfo(isNetHovered) {
    this.isHighlighted = isNetHovered;
  }
}
