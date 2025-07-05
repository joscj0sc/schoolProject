const canvas = document.getElementById("playGround");
const ctx = canvas.getContext("2d");

const realWidth = (1 / 3) * canvas.width;
const topY = 200;
const devNum = 21;
const devCol = 73;
const baseSpeed = 3;
const repeatNumber = 6;
const thresholdForRandOp = 70 / 100;
const base = 1.0005;
const minTime = 130;

const players = [];
const gates = [];
const frameImages = [];

for (let i = 0; i < 4; i++) {
  frameImages[i] = new Image();
  frameImages[i].src = `Bilder/frame${i}.png`;
}

const clampDistance = 40;
const center = canvas.width / 2;
const playerBaseHeight = canvas.height - 70;

// Perspective scaling parameters
const makeApparentBigger = 10;
const minAppScale = 0.2;
const maxAppScale = 1.5;
const invClampDistance = 100;

const gateConstants = {
  height: 500,
  speed: 1,
  startY: topY
};

const addPlayersInf = {
  randY: playerBaseHeight,
  size: 15,
  newCol: "#b52121",
  randSpeedMultL: 1,
  randSpeedMultR: 1,
  newX: centerOfPlayers()
};

const keys = {
  left: false,
  right: false
};

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
});

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.moveTo(center - realWidth / 2, canvas.height);
  ctx.lineTo(center - getApparent(realWidth / 2, topY), topY);
  ctx.lineTo(center + getApparent(realWidth / 2, topY), topY);
  ctx.lineTo(center + realWidth / 2, canvas.height);
  ctx.closePath();
  ctx.fillStyle = "#8B8585";
  ctx.fill();
}

function drawPlayerAmount() {
  const label = `${players.length}`;
  ctx.font = `70px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'black';      // changed to black
  ctx.fillText(label, center, 50);
}

function drawProgressBar() {
  const barWidth = realWidth;
  const barHeight = 10;
  const x0 = center - barWidth / 2;
  const y0 = topY - 20;

  // background
  ctx.fillStyle = '#ccc';
  ctx.fillRect(x0, y0, barWidth, barHeight);

  // filled portion
  const pct = Math.min(players.length / 2000, 1);
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(x0, y0, barWidth * pct, barHeight);
}

function drawAddGates() {
  for (let i = 0; i < gates.length; i++) {
    const gate = gates[i];
    ctx.fillStyle = "rgba(0, 0, 255, 0.82)";
    ctx.fillRect(gate.x, gate.y, gate.apparentWidth, gate.apparentHeight);

    const label = `${gate.operation}${gate.amount}`;
    const fontSize = Math.min(gate.apparentWidth, gate.apparentHeight) * 0.5;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(
      label,
      gate.x + gate.apparentWidth / 2,
      gate.y + gate.apparentHeight / 2
    );
  }
}

function draw() {
  drawBackground();
  drawProgressBar();
  drawAddGates();
  drawPlayerAmount();

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    ctx.fillStyle = p.color;
    ctx.drawImage(frameImages[p.frame], p.x, p.y);
    p.frameSlowDown++;
    if (p.frameSlowDown === repeatNumber) {
      p.frameSlowDown = p.frameSlowDown % repeatNumber;
      p.frame++;
      p.frame = p.frame % 4;
    }
  }

  let gameOver = false;

  // WIN / LOSE overlays
  if (players.length < 1) {
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'red';
    ctx.fillText('YOU LOSE!', center, canvas.height / 2);
    gameOver = true;
  } else if (players.length >= 2000) {
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'green';
    ctx.fillText('YOU WIN!', center, canvas.height / 2);
    gameOver = true;
  }

  // Show/hide reset button
  resetBtn.style.display = gameOver ? 'block' : 'none';
  
}



function updatePosition() {
  const centerX = centerOfPlayers();

  for (let i = 0; i < players.length; i++) {
    const p = players[i];

    if (keys.left) {
      p.speed = -baseSpeed;
    } else if (keys.right) {
      p.speed = baseSpeed;
    }

    if (keys.left && keys.right) {
      p.speed = 0;
    } else if (!keys.left && !keys.right) {
      p.speed = 0;
    }

    if (keys.left) {
      p.speed *= p.speedMultiplierL;
    } else if (keys.right) {
      p.speed *= p.speedMultiplierR;
    }

    let nextX = p.x + p.speed;

    if (
      (Math.abs(centerX - nextX) < Math.abs(centerX - p.x)) &&
      (Math.abs(centerX - p.x) > clampDistance)
    ) {
      p.speed *= 2.5;
    } else if (
      (Math.abs(centerX - nextX) > Math.abs(centerX - p.x)) &&
      (Math.abs(centerX - p.x) > clampDistance)
    ) {
      p.speed *= 0.5;
    }

    nextX = p.x + p.speed;

    if (hitSideAtX(p, nextX)) {
      p.x = nextX;
    }
  }
}

function hitSideAtX(p, nextX) {
  const topHalf = getApparent(realWidth / 2, topY);
  const t = (canvas.height - p.y - p.size) / (canvas.height - topY);
  const bottomHalf = realWidth / 2;
  const halfWidth = topHalf * t + bottomHalf * (1 - t);
  const leftBound = center - halfWidth;
  const rightBound = center + halfWidth - p.size;
  return nextX >= leftBound && nextX <= rightBound;
}

function addPlayer() {
  randomiseColors();
  deviateNumber(addPlayersInf, "randY", devNum);

  addPlayersInf.randSpeedMultL += (Math.random() * 2 + 1) / 10;
  addPlayersInf.randSpeedMultR += (Math.random() * 2 + 1) / 10;

  const newX = getValidX(addPlayersInf.randY, addPlayersInf.size);

  players.push({
    x: newX,
    y: addPlayersInf.randY - addPlayersInf.size / 2,
    size: addPlayersInf.size,
    speed: 0,
    color: addPlayersInf.newCol,
    speedMultiplierL: addPlayersInf.randSpeedMultL,
    speedMultiplierR: addPlayersInf.randSpeedMultR,
    frame: 0,
    frameSlowDown: 0
  });

  addPlayersInf.randSpeedMultL = 1;
  addPlayersInf.randSpeedMultR = 1;
  addPlayersInf.randY = playerBaseHeight;
}

function moveAddGate() {
  for (let i = 0; i < gates.length; i++) {
    const gate = gates[i];
    gate.y += gate.speed;
    gate.apparentHeight = getApparent(gateConstants.height, gate.y);

    const Ybot = gate.y + gate.apparentHeight;
    const topHalf = getApparent(realWidth / 2, topY);
    const tBot = (canvas.height - Ybot) / (canvas.height - topY);
    const bottomHalf = realWidth / 2;
    const halfWidthBot = topHalf * tBot + bottomHalf * (1 - tBot);
    gate.apparentWidth = halfWidthBot;

    if (gate.leftOrRight === -1) {
      gate.x = center - halfWidthBot;
    } else {
      gate.x = center + halfWidthBot - gate.apparentWidth;
    }

    if (gate.y > canvas.height) {
      gates.splice(i, 1);
      i--;
    }
  }
}

function addValueGate(op, am) {
  gates.push({
    y: gateConstants.startY,
    speed: gateConstants.speed,
    operation: op,
    amount: am,
    leftOrRight: Math.random() < 0.5 ? -1 : 1,
    functionOfGate() {
      if (this.operation === "*") {
        const initialCount = players.length;
        const toAdd = initialCount * (this.amount - 1);
        for (let j = 0; j < toAdd; j++) {
          addPlayer();
        }
      } else if (this.operation === "+") {
        for (let j = 0; j < this.amount; j++) {
          addPlayer();
        }
      } else if (this.operation === "/") {
        let newLength = Math.floor(players.length / this.amount);
        if (newLength < 1) {
          newLength = 1;
        }
        const removeCount = players.length - newLength;
        if (removeCount > 0) {
          players.splice(0, removeCount);
        }
      } else if (this.operation === "-") {
        const removeCount = Math.min(this.amount, players.length);
        if (removeCount > 0) {
          players.splice(0, removeCount);
        }
      }
    }
  });
}

function deviateNumber(obj, key, dev) {
  obj[key] += Math.floor(Math.random() * dev) - Math.floor(dev / 2);
}

function randomiseColors() {
  const base = [181, 33, 33];
  const col = base.map(c => c + Math.floor(Math.random() * devCol) - Math.floor(devCol / 2));
  addPlayersInf.newCol = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0.8)`;
}

function getApparent(baseSize, y) {
  const d = canvas.height - y;
  const inv = makeApparentBigger * baseSize / Math.max(d, invClampDistance);
  const clampedY = Math.min(Math.max(y, topY), canvas.height);
  const t = (clampedY - topY) / (canvas.height - topY);
  const lin = baseSize * (minAppScale + (maxAppScale - minAppScale) * t);
  return Math.min(inv, lin);
}

function centerOfPlayers() {
  let a = 0;
  for (let i = 0; i < players.length; i++) {
    a += players[i].x + players[i].size / 2;
  }
  a = a / players.length;
  if (players.length === 0) {
    return center;
  } else {
    return a;
  }
}

function gateHitPlayer() {
  for (let i = gates.length - 1; i >= 0; i--) {
    const gate = gates[i];
    const gx1 = gate.x;
    const gy1 = gate.y;
    const gx2 = gate.x + gate.apparentWidth;
    const gy2 = gate.y + gate.apparentHeight;

    for (let j = players.length - 1; j >= 0; j--) {
      const player = players[j];
      const px1 = player.x;
      const py1 = player.y;
      const px2 = player.x + player.size;
      const py2 = player.y + player.size;

      if (px1 < gx2 && px2 > gx1 && py1 < gy2 && py2 > gy1) {
        gate.functionOfGate();
        gates.splice(i, 1);
        break;
      }
    }
  }
}

function getValidX(y, size) {
  const topHalf = getApparent(realWidth / 2, topY);
  const t = (canvas.height - y - size) / (canvas.height - topY);
  const bottomHalf = realWidth / 2;
  const halfWidth = topHalf * t + bottomHalf * (1 - t);
  const leftBound = center - halfWidth;
  const rightBound = center + halfWidth - size;

  const mid = centerOfPlayers();
  const preferredLeft = mid - clampDistance;
  const preferredRight = mid + clampDistance;

  const spawnLeft = Math.max(leftBound, preferredLeft);
  const spawnRight = Math.min(rightBound, preferredRight);

  if (spawnLeft >= spawnRight) {
    return Math.max(leftBound, Math.min(mid, rightBound));
  }

  return Math.random() * (spawnRight - spawnLeft) + spawnLeft;
}

function spawnGates() {
  let randOp = Math.random();
  if (Math.random() < 0.5) {
    if (randOp < thresholdForRandOp) {
      addValueGate("/", Math.ceil(Math.random() * 4) + 1);
    } else if (randOp > thresholdForRandOp) {
      addValueGate("*", Math.ceil(Math.random() * 3) + 1);
    }
  } else {
    if (randOp < 0.7) {
      addValueGate("+", Math.ceil(Math.random() * 10));
    } else if (randOp > 0.7) {
      addValueGate("-", Math.ceil(Math.random() * 50));
    }
  }
}

let counter = 0;
let counterThresh = 1 - Math.pow(base, -counter);

function spawnGatesCountdown() {
  counterThresh = 1 - Math.pow(base, -counter);
  if (Math.random() < counterThresh && counter > minTime) {
    spawnGates();
    counter = 0;
  }
  counter++;
}

const resetBtn = document.getElementById('resetBtn');
resetBtn.addEventListener('click', () => {
  players.splice(0, players.length);
  addPlayer();
});


addPlayer();

function gameLoop() {
  updatePosition();
  moveAddGate();
  draw();
  if(players.length <2000){
    gateHitPlayer();
  }
  spawnGatesCountdown();
  requestAnimationFrame(gameLoop);
}

gameLoop();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker registered.'))
    .catch(error => console.error('Service Worker failed:', error));
}
