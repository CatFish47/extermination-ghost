var globalSeed;
var globalRNG;

var gameState = 0; // 0 is start screen, 1 is main game, 2 is death screen, 3 is win

const MAPRATIO = 16; //how many in game pixels are equivalent to 1 "block"
const WALKSPEED = 1;
var SCALE = 10;
const STEP = 0.5;
const SIZE = 40;

var KEYS_DOWN = {
  'w':false,
  's':false,
  'a':false,
  'd':false,
  'e':false
};

var MOUSE = {
  "mousedown": false,
  x: 0,
  y: 0
}

var canv, context;
var scaleCanv, scaleCtx;

function setupCanvas(canvas) {
  // Get the device pixel ratio, falling back to 1.
  var dpr = window.devicePixelRatio || 1;
  // Get the size of the canvas in CSS pixels.
  var rect = canvas.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  var ctx = canvas.getContext('2d');
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  ctx.scale(dpr, dpr);
  return ctx;
}

var dungeon, player, bullets, enemies, loot;
var renderedEnemies, renderedLoot;
const MAX_COOLDOWN = 20;
var cooldown = 0;

const mapImg = new Image();


window.onload = function(){
  generate();
}




function generateEnemies() {
  for (i in dungeon.rooms) {
    if (i == 0) {
      continue;
    } else {
      let room = dungeon.rooms[i];
      let area = Math.abs((room[2] - room[0]) * (room[1] * room[3]));
      let maxNum = Math.min(Math.ceil(area / 1000000 * 0.75), 10);
      let randNum = Math.floor(Math.random() * maxNum)

      for (let j = 0; j < randNum; j++) {
        enemies.push(new Enemy(Math.random() * Math.abs(room[2] - room[0]) + room[0],
                                Math.random() * Math.abs(room[3] - room[1]) + room[1]))
      }
    }
  }
}

function generate() {
  globalSeed = Math.random();
  globalRNG = new Math.seedrandom(globalSeed);

  canv = document.getElementById('canvas');
  context = setupCanvas(canv);
  canv.width = window.innerWidth * 2;
  canv.height = window.innerHeight * 2;

  scaleCanv = document.getElementById('scale');
  scaleCanv.width = canvas.width;
  scaleCanv.height = canvas.height;
  scaleCtx = scaleCanv.getContext('2d');

  dungeon = randomDungeon(globalRNG(), window.innerWidth, window.innerHeight);
  canvasPutMatrix(scaleCtx, dungeon.map);

  mapImg.src = scaleCanv.toDataURL();

  player = new Player((dungeon.rooms[0][0] + dungeon.rooms[0][2]) / 2,
                        (dungeon.rooms[0][1] + dungeon.rooms[0][3]) / 2);

  bullets = [];
  enemies = [];
  loot = [];

  generateEnemies();
}




function init() {
  clearInterval(interval);

  console.log("Game start");
  window.requestAnimationFrame(animate);
}

function update() {
  if (gameState == 0) {
    if (MOUSE["mousedown"] && MOUSE.x > 100 && MOUSE.y > canvas.height/3 &&
        MOUSE.x < 100 + canvas.width/5 && MOUSE.y < canvas.height/3 + canvas.height/7) {

      gameState = 1;
      startMusic.pause();
      bgMusic.play();
    }
  } else if (gameState == 1) {
    checkWin();
    updatePlayer();
    updateRendered();
    checkLava();
    checkBullet();
    checkLoot();
    updateEnemies();
    checkBulletCollision();
  }
}

function checkWin() {
  if (enemies.length == 0) {
    gameState = 3;
    bgMusic.pause();
    winMusic.play();
  }
}

function updateRendered() {
  renderedEnemies = [];

  for (i in enemies) {
    if (enemies[i].near(player.x, player.y)) {
      renderedEnemies.push(enemies[i]);
    }
  }

  renderedLoot = [];
  for (i in loot) {
    if (loot[i].renderNear(player.x, player.y)) {
      renderedLoot.push(loot[i])
    }
  }
}

function checkLoot() {
  for (i in loot) {
    if (KEYS_DOWN['e'] && loot[i].near(player.x, player.y)) {
      loot[i].use(player);
      loot.splice(i, 1);
      i--;
    }
  }
}

function updatePlayer() {
  if (player.hp == 0) {
    gameState = 2;
    bgMusic.pause();
    loseMusic.play();
  }

  if (KEYS_DOWN['w'] == true) {
    player.move(0, -STEP);
  }
  if (KEYS_DOWN['a'] == true) {
    player.move(-STEP, 0);
  }
  if (KEYS_DOWN['s'] == true) {
    player.move(0, STEP);
  }
  if (KEYS_DOWN['d'] == true) {
    player.move(STEP, 0);
  }

  let stage = 0;
  let phase = 0;

  let theta = Math.atan((MOUSE.y - canvas.height/4) / (MOUSE.x - canvas.width/4));

  if ((MOUSE.x - canvas.width/4) < 0) {
    theta += Math.PI;
  }

  if (Math.PI/4 <= theta && theta < 3*Math.PI/4) {
    stage = 0;
  } else if (-Math.PI/4 <= theta && theta < Math.PI/4) {
    stage = 1;
  } else if (3*Math.PI/4 <= theta && theta < 5*Math.PI/4) {
    stage = 3;
  } else {
    stage = 2;
  }

  if (KEYS_DOWN['w'] == true || KEYS_DOWN['a'] == true || KEYS_DOWN['s'] == true || KEYS_DOWN['d'] == true) {
    player.changeState();
  } else {
    player.state = 0;
  }

  phase = player.state;

  player.img = PLAYER_IMAGES[stage][phase];
}

function checkBulletCollision() {
  for (i in bullets) {
    if (bullets[i].friendly) {
      for (j in enemies) {
        let enemyPosX = canvas.width/4 - (player.x - enemies[j].x)*SCALE;
        let enemyPosY = canvas.height/4 - (player.y - enemies[j].y)*SCALE;

        if (bullets[i].x > (enemyPosX - SIZE/2) && bullets[i].x < (enemyPosX + SIZE/2)
            && bullets[i].y > (enemyPosY - SIZE/2) && bullets[i].y < (enemyPosY + SIZE/2)) {

          enemies[j].hp -= bullets[i].dmg;
          bullets[i].hit = true;
        }
      }
    } else {
      if (bullets[i].x > (canvas.width/4 - SIZE/2) && bullets[i].x < (canvas.width/4 + SIZE/2)
          && bullets[i].y > (canvas.height/4 - SIZE/2) && bullets[i].y < (canvas.height/4 + SIZE/2)) {

        player.loseHP(bullets[i].dmg);
        bullets[i].hit = true;
      }
    }
  }
}

function updateEnemies() {
  for (i in renderedEnemies) {
    if (renderedEnemies[i].hp <= 0) {
      // Drops
      let randLoot = Math.random()*100;
      if (randLoot < 5) {
        loot.push(new Loot(LOOT_TABLE["5"][Math.floor(Math.random() * LOOT_TABLE["5"].length)], renderedEnemies[i].x, renderedEnemies[i].y))
      } else if (randLoot < 30) {
        loot.push(new Loot(LOOT_TABLE["25"][Math.floor(Math.random() * LOOT_TABLE["25"].length)], renderedEnemies[i].x, renderedEnemies[i].y))
      } else if (randLoot < 80) {
        loot.push(new Loot(LOOT_TABLE["50"][Math.floor(Math.random() * LOOT_TABLE["50"].length)], renderedEnemies[i].x, renderedEnemies[i].y))
      }

      for (j in enemies) {
        if (enemies[j] == renderedEnemies[i]) {
          enemies.splice(j,1)
        }
      }
      renderedEnemies.splice(i, 1);
      i--;

      continue;
    } else if (renderedEnemies[i].near(player.x, player.y) && renderedEnemies[i].cooldown <= 0) {
      if (renderedEnemies[i].atkPattern[renderedEnemies[i].patternIndex] == "attack") {
        let bulletAudio = new Audio('audio/pew.mp3');
        bulletAudio.play();

        bullets.push(new Bullet(canvas.width/4 - (player.x - renderedEnemies[i].x)*SCALE,
                                  canvas.height/4 - (player.y - renderedEnemies[i].y)*SCALE,
                                  canvas.width/4, canvas.height/4, renderedEnemies[i].dmg, false));
        renderedEnemies[i].moving = false;
        renderedEnemies[i].patternUp();
      } else if (renderedEnemies[i].atkPattern[renderedEnemies[i].patternIndex] == "move") {
        let directions = [[1, 0], [Math.sqrt(2)/2, Math.sqrt(2)/2], [0, 1],
                          [-Math.sqrt(2)/2, Math.sqrt(2)/2], [-1, 0],
                          [-Math.sqrt(2)/2, -Math.sqrt(2)/2], [0, -1],
                          [Math.sqrt(2)/2, -Math.sqrt(2)/2]]

        enemyMove = directions[Math.floor(Math.random() * directions.length)]

        renderedEnemies[i].moving = true;
        renderedEnemies[i].setMove(enemyMove[0]/2, enemyMove[1]/2)
        renderedEnemies[i].patternUp();
      }

      renderedEnemies[i].cooldown = MAX_COOLDOWN;
    } else {
      if (renderedEnemies[i].atkPattern[renderedEnemies[i].patternIndex] == "move") {
        if (dungeon.map[Math.floor(renderedEnemies[i].x + renderedEnemies[i].moveX)][Math.floor(renderedEnemies[i].y + renderedEnemies[i].moveY)] != 0) {
          renderedEnemies[i].move();
        }
      }
      renderedEnemies[i].cooldown--;
    }

    let state = 0;

    let theta = Math.atan((player.y - renderedEnemies[i].y) / (player.x - renderedEnemies[i].x));

    if ((player.x - renderedEnemies[i].x) < 0) {
      theta += Math.PI;
    }

    if (Math.PI/4 <= theta && theta < 3*Math.PI/4) {
      state = 0;
    } else if (-Math.PI/4 <= theta && theta < Math.PI/4) {
      state = 1;
    } else if (3*Math.PI/4 <= theta && theta < 5*Math.PI/4) {
      state = 3;
    } else {
      state = 2;
    }

    renderedEnemies[i].img = ENEMY_IMAGES[state];
  }
}

function checkLava() {
  if (dungeon.map[Math.floor(player.x)][Math.floor(player.y)] == 0) {
    player.loseHP(1);
  }
}

function checkBullet() {
  if (cooldown > 0) {
    cooldown--;
  }

  if (MOUSE["mousedown"] == true && cooldown == 0) {
    if (player.shoot()) {
      let bulletAudio = new Audio('audio/pew.mp3');
      bulletAudio.play();
      bullets.push(new Bullet(canvas.width/4, canvas.height/4, MOUSE.x, MOUSE.y, player.dmg, true));
      cooldown = MAX_COOLDOWN;
    }
  }

  for (i in bullets) {
    if (bullets[i].y > canvas.height / 2 || bullets[i].y < 0 || bullets[i].x > canvas.width / 2 || bullets[i].x < 0 || bullets[i].hit) {
      bullets.splice(i, 1)
      i--;
      // Change this to bullet lifetime instead
    } else {
      if (KEYS_DOWN['w'] == true) {
        bullets[i].shift(0, STEP*SCALE);
      }
      if (KEYS_DOWN['a'] == true) {
        bullets[i].shift(STEP*SCALE, 0);
      }
      if (KEYS_DOWN['s'] == true) {
        bullets[i].shift(0, -STEP*SCALE);
      }
      if (KEYS_DOWN['d'] == true) {
        bullets[i].shift(-STEP*SCALE, 0);
      }
      bullets[i].move();
    }
  }
}

function draw() {
  context.clearRect(0, 0, canv.width, canv.height);

  if (gameState == 0) {
    let startImg = new Image();
    startImg.src = "pictures/start.jpg";
    context.drawImage(startImg, 0, 0, canvas.width/2, canvas.height/2);

    let startButton = new Image();
    startButton.src = "pictures/startButton.png";
    context.drawImage(startButton, 100, canvas.height/3, canvas.width/5, canvas.height/7)
  } else if (gameState == 1) {
    drawMap(mapImg);
    drawLoot();
    drawPlayer();
    drawEnemies();
    drawBullets();
    drawUI(mapImg);
  } else if (gameState == 2) {
    drawLose();
  } else if (gameState == 3) {
    drawWin();
  }

  return 0;
}

function drawLoot() {
  for (i in loot) {
    context.drawImage(loot[i].img, canvas.width/4 - SIZE/4 - (player.x - loot[i].x)*SCALE,
                      canvas.height/4 - SIZE/4 - (player.y - loot[i].y)*SCALE, SIZE/2, SIZE/2);
  }
}

function drawWin() {
  context.fillStyle = "#000"
  context.fillRect(0, 0, canvas.width, canvas.height)

  let winImage = new Image();
  winImage.src = "pictures/win.png";
  context.drawImage(winImage, canvas.width/4-winImage.width/2, canvas.height/4-winImage.height/2)
}

function drawLose() {
  context.fillStyle = "#000"
  context.fillRect(0, 0, canvas.width, canvas.height)

  let gameOverImage = new Image();
  gameOverImage.src = "pictures/gameOver.png";
  context.drawImage(gameOverImage, canvas.width/4-gameOverImage.width/2, canvas.height/4-gameOverImage.height/2)
}

function drawUI(map) {
  // HP
  context.fillStyle = "#f00"
  context.fillRect(25, 25, 2*100, 20);
  context.fillStyle = "#0f0"
  context.fillRect(25, 25, 2*player.hp, 20);

  // Bullets
  context.fillStyle = "#55f"
  context.fillRect(25, 50, 2*player.bullets, 20);

  // Minimap
  context.drawImage(map, canvas.width/2-canvas.width/10-50, 50, canvas.width/5, canvas.height/5)
  for (i in enemies) {
    context.fillStyle = "#f00";
    context.fillRect(canvas.width/2-canvas.width/10-51 + enemies[i].x/5, 49 + enemies[i].y/5, 2, 2)
  }
  context.fillStyle = "#00f"
  context.fillRect(canvas.width/2-canvas.width/10-52 + player.x/5, 48 + player.y/5, 4, 4)
}

function drawMap(map) {
  context.drawImage(map, -player.x*SCALE + canvas.width/4, -player.y*SCALE + canvas.height/4, canvas.width*SCALE, canvas.height*SCALE);
}

function drawPlayer() {
  context.drawImage(player.img, canvas.width/4 - SIZE/2, canvas.height/4 - SIZE/2, SIZE, SIZE)
  // context.fillStyle = "#128"
  // context.fillRect(canvas.width/4 - SIZE/2, canvas.height/4 - SIZE/2, SIZE, SIZE)
}

function drawEnemies() {
  context.fillStyle = "#d129d1"
  for (i in renderedEnemies) {
    context.drawImage(renderedEnemies[i].img, canvas.width/4 - SIZE/2 - (player.x - renderedEnemies[i].x)*SCALE,
                      canvas.height/4 - SIZE/2 - (player.y - renderedEnemies[i].y)*SCALE, SIZE, SIZE)
  }
}

function drawBullets() {
  for (i in bullets) {
    if (bullets[i].friendly) {
      context.fillStyle = "#daa520"
    } else {
      context.fillStyle = "#f00"
    }

    context.beginPath();
    context.arc(bullets[i].x, bullets[i].y, 5, 0, 2 * Math.PI);
    context.fill();
  }
}

function animate() {
  update();

  if (draw() == 0) {
    window.requestAnimationFrame(animate);
  }
}

var interval = setInterval(function() {
  if (context != null) {
    init();
  }
}, 500);











//Event Listeners
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() in KEYS_DOWN) KEYS_DOWN[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key.toLowerCase() in KEYS_DOWN) KEYS_DOWN[e.key.toLowerCase()] = false;
});
document.addEventListener("mousedown", (e) => {
  MOUSE["mousedown"] = true;
});
document.addEventListener("mouseup", (e) => {
  MOUSE["mousedown"] = false;
});
document.addEventListener("mousemove", (e) => {
  MOUSE.x = e.x;
  MOUSE.y = e.y;
});
