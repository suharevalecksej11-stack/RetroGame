(function () {
  const TILE_SIZE = 20;
  const COLS = 19;
  const ROWS = 19;

  const _ = 0;
  const W = 1;
  const D = 2;
  const E = 3;
  const B = 4;

  const MAP_STRINGS = Array.of(
    "1111111111111111111",
    "1322222221222222231",
    "1211211121211121121",
    "1211211121211121121",
    "1222222222222222221",
    "1211212111112121121",
    "1222212221222122221",
    "1111211101011121111",
    "0001210000000121000",
    "1111210114110121111",
    "0000200100010020000",
    "1111210111110121111",
    "0001210000000121000",
    "1111210111110121111",
    "1222222221222222221",
    "1311211121211121131",
    "1221222220222221221",
    "1121212111112121211",
    "1111111111111111111"
  );

  let map = MAP_STRINGS.map((row) => row.split("").map(Number));
  let initialMap = MAP_STRINGS.map((row) => row.split("").map(Number));

  let pacman = {
    x: 9,
    y: 16,
    tX: 9,
    tY: 16,
    dirX: 0,
    dirY: 0,
    nextDirX: 0,
    nextDirY: 0,
    offset: 0,
    speed: 0.1,
    mouthAngle: 0.2,
    mouthClosing: 1,
  };
  let ghosts = [];
  let lives = 3;

  let globalTimer = 0;
  let frightenedTimer = 0;
  let currentMode = "scatter";

  window.initPacman = function () {
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  window.runPacman = function () {
    map = MAP_STRINGS.map((row) => row.split("").map(Number));
    lives = 3;
    resetPositions();

    window.stopAllLoops();

    function gameLoop() {
      if (!isPlaying) return;

      window.animationFrameId = requestAnimationFrame(gameLoop);

      // Вычисляем разницу времени, чтобы держать стабильные 60 кадров/сек
      let now = performance.now();
      let elapsed = now - window.then;

      if (elapsed > window.fpsInterval) {
        window.then = now - (elapsed % window.fpsInterval);

        globalTimer++;
        updateTimers();
        updatePacman();
        updateGhosts();
        checkCollisions();
        checkVictory();
        draw();
      }
    }

    window.animationFrameId = requestAnimationFrame(gameLoop);
  };

  function resetPositions() {
    pacman = {
      x: 9,
      y: 16,
      tX: 9,
      tY: 16,
      dirX: 0,
      dirY: 0,
      nextDirX: 0,
      nextDirY: 0,
      offset: 0,
      speed: 0.08,
      mouthAngle: 0.2,
      mouthClosing: 1,
    };

    ghosts = Array.of(
      {
        id: "blinky",
        color: "#ff0000",
        x: 9,
        y: 8,
        tX: 9,
        tY: 8,
        dirX: 1,
        dirY: 0,
        offset: 0,
        speed: 0.06,
        state: "alive",
        corner: { x: 18, y: 0 },
        spawnDelay: 0,
      },
      {
        id: "pinky",
        color: "#ffb8ff",
        x: 9,
        y: 10,
        tX: 9,
        tY: 10,
        dirX: 0,
        dirY: -1,
        offset: 0,
        speed: 0.06,
        state: "spawning",
        corner: { x: 0, y: 0 },
        spawnDelay: 60,
      },
      {
        id: "inky",
        color: "#00ffff",
        x: 8,
        y: 10,
        tX: 8,
        tY: 10,
        dirX: 0,
        dirY: -1,
        offset: 0,
        speed: 0.06,
        state: "spawning",
        corner: { x: 18, y: 18 },
        spawnDelay: 180,
      },
      {
        id: "clyde",
        color: "#ffb852",
        x: 10,
        y: 10,
        tX: 10,
        tY: 10,
        dirX: 0,
        dirY: -1,
        offset: 0,
        speed: 0.06,
        state: "spawning",
        corner: { x: 0, y: 18 },
        spawnDelay: 320,
      }
    );
    if (currentMode === "frightened") currentMode = "scatter";
    frightenedTimer = 0;
  }

  function updateTimers() {
    if (currentMode === "frightened") {
      frightenedTimer--;
      if (frightenedTimer <= 0) {
        currentMode = "chase";
        ghosts.forEach((g) => {
          if (g.state === "frightened") g.state = "alive";
        });
      }
    } else {
      let period = globalTimer % (60 * 27);
      if (period < 60 * 7) {
        currentMode = "scatter";
      } else {
        currentMode = "chase";
      }
    }
  }

  function updatePacman() {
    pacman.mouthAngle += 0.02 * pacman.mouthClosing;
    if (pacman.mouthAngle >= 0.4 || pacman.mouthAngle <= 0.05)
      pacman.mouthClosing *= -1;

    if (pacman.offset === 0) {
      let currentCell = map[pacman.y][pacman.x];
      if (currentCell === D) {
        map[pacman.y][pacman.x] = _;
        score += 10;
        document.getElementById("score").innerText = score;
      } else if (currentCell === E) {
        map[pacman.y][pacman.x] = _;
        score += 50;
        document.getElementById("score").innerText = score;
        triggerFrightenedMode();
      }

      if (pacman.nextDirX !== 0 || pacman.nextDirY !== 0) {
        if (canMove(pacman.x, pacman.y, pacman.nextDirX, pacman.nextDirY)) {
          pacman.dirX = pacman.nextDirX;
          pacman.dirY = pacman.nextDirY;
        }
      }

      if (canMove(pacman.x, pacman.y, pacman.dirX, pacman.dirY)) {
        pacman.tX = pacman.x + pacman.dirX;
        pacman.tY = pacman.y + pacman.dirY;
        pacman.offset = 0.001;
      }
    }

    if (pacman.offset > 0) {
      pacman.offset += pacman.speed;
      if (pacman.offset >= 1) {
        pacman.x = pacman.tX;
        pacman.y = pacman.tY;
        pacman.offset = 0;

        if (pacman.x < 0) pacman.x = COLS - 1;
        if (pacman.x >= COLS) pacman.x = 0;
      }
    }
  }

  function triggerFrightenedMode() {
    currentMode = "frightened";
    frightenedTimer = 60 * 7;
    ghosts.forEach((g) => {
      if (g.state === "alive") {
        g.state = "frightened";
        g.dirX *= -1;
        g.dirY *= -1;
        let temp = g.x;
        g.x = g.tX;
        g.tX = temp;
        let tempY = g.y;
        g.y = g.tY;
        g.tY = tempY;
      }
    });
  }

  function canMove(x, y, dx, dy) {
    let nx = x + dx;
    let ny = y + dy;
    if ((nx < 0 || nx >= COLS) && ny === 10) return true;
    if (map[ny] && map[ny][nx] !== undefined) {
      return map[ny][nx] !== W && map[ny][nx] !== B;
    }
    return false;
  }

  function updateGhosts() {
    ghosts.forEach((g) => {
      if (g.state === "spawning" && g.spawnDelay > 0) {
        g.spawnDelay--;
        return;
      }

      let ghostSpeed =
        g.state === "frightened" ? 0.03 : g.state === "dead" ? 0.15 : 0.05;

      if (g.offset === 0) {
        if (g.state === "spawning" && g.spawnDelay <= 0) {
          if (g.x < 9) g.x++;
          else if (g.x > 9) g.x--;
          else if (g.y > 8) g.y--;

          if (g.x === 9 && g.y === 8) {
            g.state = "alive";
            g.dirX = 1;
            g.dirY = 0;
          }
          return;
        }

        let validMoves = Array.of(
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 }
        ).filter((m) => {
          if (m.x === -g.dirX && m.y === -g.dirY) return false;
          let nx = g.x + m.x;
          let ny = g.y + m.y;
          if ((nx < 0 || nx >= COLS) && ny === 10) return true;

          if (map[ny] && map[ny][nx] !== undefined) {
            if (g.state === "dead") return map[ny][nx] !== W;
            return map[ny][nx] !== W && map[ny][nx] !== B;
          }
          return false;
        });

        if (validMoves.length > 0) {
          let chosenMove = null;

          if (g.state === "dead") {
            chosenMove = getBestMove(g.x, g.y, 9, 10, validMoves);
            if (g.x === 9 && g.y === 10) {
              g.state = "spawning";
              g.spawnDelay = 30;
              return;
            }
          } else if (g.state === "frightened") {
            chosenMove =
              validMoves[Math.floor(Math.random() * validMoves.length)];
          } else {
            let target = { x: 0, y: 0 };
            if (currentMode === "scatter") {
              target = g.corner;
            } else {
              target = getGhostTarget(g);
            }
            chosenMove = getBestMove(g.x, g.y, target.x, target.y, validMoves);
          }

          if (chosenMove) {
            g.dirX = chosenMove.x;
            g.dirY = chosenMove.y;
            g.tX = g.x + g.dirX;
            g.tY = g.y + g.dirY;
            g.offset = 0.001;
          }
        }
      }

      if (g.offset > 0) {
        g.offset += ghostSpeed;
        if (g.offset >= 1) {
          g.x = g.tX;
          g.y = g.tY;
          g.offset = 0;
          if (g.x < 0) g.x = COLS - 1;
          if (g.x >= COLS) g.x = 0;
        }
      }
    });
  }

  function getBestMove(gx, gy, tx, ty, moves) {
    let minDistance = Infinity;
    let bestMove = null;
    moves.forEach((m) => {
      let dist = Math.pow(gx + m.x - tx, 2) + Math.pow(gy + m.y - ty, 2);
      if (dist < minDistance) {
        minDistance = dist;
        bestMove = m;
      }
    });
    return bestMove || moves;
  }

  function getGhostTarget(g) {
    if (g.id === "blinky") return { x: pacman.x, y: pacman.y };
    if (g.id === "pinky")
      return { x: pacman.x + pacman.dirX * 4, y: pacman.y + pacman.dirY * 4 };
    if (g.id === "inky") {
      let blinky = ghosts || { x: 9, y: 8 };
      let pivotX = pacman.x + pacman.dirX * 2;
      let pivotY = pacman.y + pacman.dirY * 2;
      return {
        x: pivotX + (pivotX - blinky.x),
        y: pivotY + (pivotY - blinky.y),
      };
    }
    if (g.id === "clyde") {
      let dist = Math.sqrt(
        Math.pow(g.x - pacman.x, 2) + Math.pow(g.y - pacman.y, 2)
      );
      if (dist > 8) return { x: pacman.x, y: pacman.y };
      return g.corner;
    }
  }
  function checkCollisions() {
    ghosts.forEach((g) => {
      if (g.state === "spawning") return;
      if (Math.abs(g.x - pacman.x) < 0.5 && Math.abs(g.y - pacman.y) < 0.5) {
        if (g.state === "frightened") {
          g.state = "dead";
          score += 200;
          document.getElementById("score").innerText = score;
        } else if (g.state === "alive") {
          lives--;
          if (lives <= 0) {
            window.stopAllLoops();
            window.triggerGameOver(); // Железно выводит меню с кнопкой рестарта
          } else {
            resetPositions();
          }
        }
      }
    });
  }
  function checkVictory() {
    let hasFood = false;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (map[r][c] === D || map[r][c] === E) {
          hasFood = true;
          break;
        }
      }
      if (hasFood) break;
    }
    if (!hasFood) {
      score += 1000;
      map = MAP_STRINGS.map((row) => row.split("").map(Number));
      resetPositions();
    }
  }
  function draw() {
    if (currentGame !== "pacman") return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (map[r][c] === W) {
          ctx.fillStyle = "#1919b3";
          ctx.fillRect(
            c * TILE_SIZE,
            r * TILE_SIZE,
            TILE_SIZE - 1,
            TILE_SIZE - 1
          );
        } else if (map[r][c] === B) {
          ctx.fillStyle = "#222";
          ctx.fillRect(
            c * TILE_SIZE,
            r * TILE_SIZE,
            TILE_SIZE - 1,
            TILE_SIZE - 1
          );
        } else if (map[r][c] === D) {
          ctx.fillStyle = "#ffb8ae";
          ctx.fillRect(c * TILE_SIZE + 8, r * TILE_SIZE + 8, 4, 4);
        } else if (map[r][c] === E) {
          if (Math.floor(globalTimer / 10) % 2 === 0) {
            ctx.fillStyle = "#ffb8ae";
            ctx.beginPath();
            ctx.arc(c * TILE_SIZE + 10, r * TILE_SIZE + 10, 7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    if (isPlaying) {
      let pX =
        (pacman.x + (pacman.tX - pacman.x) * pacman.offset) * TILE_SIZE + 10;
      let pY =
        (pacman.y + (pacman.tY - pacman.y) * pacman.offset) * TILE_SIZE + 10;
      let rotation = 0;
      if (pacman.dirX === 1) rotation = 0;
      if (pacman.dirY === 1) rotation = Math.PI / 2;
      if (pacman.dirX === -1) rotation = Math.PI;
      if (pacman.dirY === -1) rotation = -Math.PI / 2;
      ctx.fillStyle = "#ffff00";
      ctx.beginPath();
      ctx.arc(
        pX,
        pY,
        9,
        rotation + pacman.mouthAngle,
        rotation + Math.PI * 2 - pacman.mouthAngle
      );
      ctx.lineTo(pX, pY);
      ctx.closePath();
      ctx.fill();
    }
    ghosts.forEach((g) => {
      let gX = (g.x + (g.tX - g.x) * g.offset) * TILE_SIZE + 10;
      let gY = (g.y + (g.tY - g.y) * g.offset) * TILE_SIZE + 10;
      if (g.state === "dead") {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(gX - 4, gY - 2, 4, 0, Math.PI2);
        ctx.arc(gX + 4, gY - 2, 4, 0, Math.PI2);
        ctx.fill();
        ctx.fillStyle = "#0000ff";
        ctx.fillRect(gX - 5 + g.dirX2, gY - 3 + g.dirY2, 2, 2);
        ctx.fillRect(gX + 3 + g.dirX2, gY - 3 + g.dirY2, 2, 2);
      } else if (g.state === "frightened") {
        let isBlinking =
          frightenedTimer < 120 && Math.floor(frightenedTimer / 10) % 2 === 0;
        ctx.fillStyle = isBlinking ? "#ffffff" : "#0000ff";
        ctx.beginPath();
        ctx.arc(gX, gY - 1, 9, Math.PI, 0, false);
        ctx.lineTo(gX + 9, gY + 9);
        ctx.lineTo(gX - 9, gY + 9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = isBlinking ? "#ff0000" : "#ffb8ae";
        ctx.fillRect(gX - 4, gY - 3, 2, 2);
        ctx.fillRect(gX + 2, gY - 3, 2, 2);
      } else {
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(gX, gY - 1, 9, Math.PI, 0, false);
        ctx.lineTo(gX + 9, gY + 9);
        ctx.lineTo(gX - 9, gY + 9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(gX - 4, gY - 2, 3, 0, Math.PI2);
        ctx.arc(gX + 4, gY - 2, 3, 0, Math.PI2);
        ctx.fill();
        ctx.fillStyle = "#0000ff";
        ctx.fillRect(gX - 5 + g.dirX2, gY - 3 + g.dirY2, 2, 2);
        ctx.fillRect(gX + 3 + g.dirX2, gY - 3 + g.dirY2, 2, 2);
      }
    });
    ctx.font = "bold 13px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("ЖИЗНИ: " + "💛".repeat(lives), 10, canvas.height - 8);
  }
  document.addEventListener("keydown", (e) => {
    if (!isPlaying || currentGame !== "pacman") return;
    let key = e.key.toLowerCase();
    if (key === "arrowleft" || key === "a") {
      pacman.nextDirX = -1;
      pacman.nextDirY = 0;
    }
    if (key === "arrowright" || key === "d") {
      pacman.nextDirX = 1;
      pacman.nextDirY = 0;
    }
    if (key === "arrowup" || key === "w") {
      pacman.nextDirX = 0;
      pacman.nextDirY = -1;
    }
    if (key === "arrowdown" || key === "s") {
      pacman.nextDirX = 0;
      pacman.nextDirY = 1;
    }
    if (pacman.dirX === 0 && pacman.dirY === 0) {
      if (canMove(pacman.x, pacman.y, pacman.nextDirX, pacman.nextDirY)) {
        pacman.dirX = pacman.nextDirX;
        pacman.dirY = pacman.nextDirY;
      }
    }
  });
})();
