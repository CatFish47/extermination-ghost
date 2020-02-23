var game = {
  pos:[0,0],
  vec:[0,0], //movement vector
  map:null
}

var TEXTUREMAP = {};
// TEXTUREMAP[COLORMAP.empty] = TEXTURESETS.empty;
// TEXTUREMAP[COLORMAP.jumpfloor] = TEXTURESETS.jumpfloor;
// TEXTUREMAP[COLORMAP.room.t] = TEXTURESETS.floor;
// TEXTUREMAP[COLORMAP.corridor.t] = TEXTURESETS.floor;
// TEXTUREMAP[COLORMAP.room.b] = TEXTURESETS.floor;
// TEXTUREMAP[COLORMAP.corridor.b] = TEXTURESETS.floor;
// TEXTUREMAP[COLORMAP.room.l] = TEXTURESETS.wall;
// TEXTUREMAP[COLORMAP.room.r] = TEXTURESETS.wall;
// TEXTUREMAP[COLORMAP.corridor.l] = TEXTURESETS.wall;
// TEXTUREMAP[COLORMAP.corridor.r] = TEXTURESETS.wall;

var LOOT_TABLE = {
  "5": ["dmgUp"], // Some rare items (permanent buffs)
  "25": ["potion"], // Some uncommon items (health drops)
  "50": ["bullet"], // Some common drops (bullet drops)
  "20": ["nothing"]
}

var ITEM_DATA = {
  "dmgUp": {
    color: "#ff4500",
    min: 1,
    max: 5,
    stat: "player.dmg+=this.num"
  },
  "potion": {
    color: "#0f0",
    min: 10,
    max: 50,
    stat: "player.hp+=this.num"
  },
  "bullet": {
    color: "#ffdf00",
    min: 3,
    max: 25,
    stat: "player.bullets+=this.num"
  }
}

class Loot {
  constructor(name, x, y) {
    this.num = Math.floor(Math.random() * (ITEM_DATA[name].max - ITEM_DATA[name].min) + ITEM_DATA[name].min);
    this.x = x;
    this.y = y;
    this.stat = ITEM_DATA[name].stat;
    this.used = false;
    this.color = ITEM_DATA[name].color;

    this.img = new Image();
    this.img.src = "sprites/loot/" + name + ".png";
  }

  use(player) {
    let stat = eval(this.stat)
    stat += this.num;
    this.used = true;
  }

  near(x, y) {
    return Math.sqrt((this.x - x) * (this.x - x) + (this.y - y) * (this.y - y)) < 10;
  }

  renderNear(x, y) {
    return Math.sqrt((this.x - x) * (this.x - x) + (this.y - y) * (this.y - y)) < 75;
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 100;
    this.bullets = 100;
    this.dmg = 10;
    this.img = new Image;
    this.img.src = "sprites/player/player_0_0.png"
    this.state = 0;
    this.stateChange = 1;
  }

  move(x, y) {
    this.x += x;
    this.y += y;
  }

  loseHP(n) {
    player.hp -= n;
    if (player.hp < 0) {
      player.hp = 0;
    }
  }

  shoot() {
    if (this.bullets <= 0) {
      this.bullets = 0;
      return false;
    } else {
      this.bullets--;
      return true;
    }
  }

  changeState() {
    this.state += this.stateChange;
    if (Math.abs(this.state) == 3) {
      this.stateChange *= -1;
    }
  }
}

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 50;
    this.cooldown = 0;
    this.moveCooldown = 0;
    this.atkPattern = ["move", "attack"]
    this.patternIndex = 0;
    this.moving = false;
    this.moveX = 1;
    this.moveY = 1;
    this.dmg = 10;

    this.img = new Image;
    this.img.src = "sprites/enemy/enemy_0.png"
  }

  near(x, y) {
    return Math.sqrt((this.x - x) * (this.x - x) + (this.y - y) * (this.y - y)) < 75;
  }

  move() {
    this.x += this.moveX;
    this.y += this.moveY;
  }

  setMove(x, y) {
    this.moveX = x;
    this.moveY = y;
  }

  patternUp() {
    this.patternIndex++;
    if (this.patternIndex >= this.atkPattern.length) {
      this.patternIndex = 0;
    }
  }
}

class Bullet {
  constructor(x, y, targetX, targetY, dmg, friendly) {
    this.x = x;
    this.y = y;
    this.friendly = friendly;
    this.dmg = dmg;
    this.hit = false;

    // this.moveX = (targetX - x) / Math.sqrt(targetX * targetX + x * x) * 10
    // this.moveY = (targetY - y) / Math.sqrt(targetY * targetY + y * y) * 10
    // You can fix this later to make it so that C will equal to 1
    //let c = Math.sqrt(targetX * targetX + x * x)
    let theta = Math.atan((targetY - y) / (targetX - x));

    if ((targetX - x) < 0) {
      theta += Math.PI;
    }

    this.moveX = Math.cos(theta) * STEP*10;
    this.moveY = Math.sin(theta) * STEP*10;
  }

  move() {
    this.x += this.moveX;
    this.y += this.moveY;
  }

  shift(x, y) {
    this.x += x;
    this.y += y;
  }
}
