const spriteHeight = 45;
const spriteWidth = 45;
const invasiveLikelihood = 0.4;
const speciesDescriptions = [
  {
    name: "Brown Marmorated Stinkbug",
    description:
      "Halyomorpha halys is an insect in the family Pentatomidae, native to China, Japan, Korea, and other Asian regions",
    imageIndex: 1,
  },
  {
    name: "Bullfrog",
    description:
      "Bullfrogs are predators that eat practically anything they can catch. They can swallow tree frogs, other amphibians and reptiles such as the western pond turtle, minnows, small birds, and young snakes.",
    imageIndex: 2,
  },
  {
    name: "Garlic mustard",
    description:
      "This plant spreads its seeds in the wind and gains a foothold in fields and forests by emerging earlier in spring than many native plants. By the time native species are ready to grow, garlic mustard has blocked their sunlight and outcompeted them for moisture and vital nutrients.",
    imageIndex: 3,
  },
];
// const infoBoxHeight = 200;

// Sprite class that holds info for each sprite
class Sprite {
  constructor(typeIndex) {
    this.x = 0; // start on left
    // Random place throughout screen
    this.y = random(2 * spriteHeight, 720 - spriteHeight * 2); // 720 is canvas height
    this.width = spriteWidth;
    this.height = spriteHeight;
    this.speed = 5;
    this.isInvasive = random(0, 1) < invasiveLikelihood; // 40% chance of being invasive
    // const descrIndex = floor(random(0, speciesDescriptions.length));
    this.typeIndex = typeIndex;
    this.spriteMillis = millis();

    this.isHighlighted = false;

    if (this.isInvasive) {
      this.description = speciesDescriptions[this.typeIndex];
      // this.spriteImage = invasiveImages[descrIndex];
    } else {
      this.description = {
        name: "Friendly",
        description: "This is a native species",
        imageIndex: typeIndex,
      };
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
    let description = this.description == null ? "friendly" : this.description;
    push();

    rectMode(CENTER);

    let isFriendly = this.isInvasive;
    if (isFriendly) {
      fill("blue");
    } else {
      fill("red");
    }

    stroke(155);
    rect(this.x, this.y, spriteWidth + 10, spriteHeight + 10);
    textSize(12);
    fill(255, 255, 255);
    textAlign(CENTER);
    text(this.description.name, this.x, this.y);
    pop();
  }

  displayNetInfo(isNetHovered) {
    this.isHighlighted = isNetHovered;
  }
}
