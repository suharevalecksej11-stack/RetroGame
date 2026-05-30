(function () {
  const GRID_SIZE = 13;
  const CELL = 30;

  // Состояние игрока и базы (координаты строго целые числа)
  let myTank = {
    x: 4,
    y: 12,
    dir: "up",
    scoreHearts: 3,
    invulnerableTimer: 0,
    shootCooldown: 0,
  };
  let base = { x: 6, y: 12, alive: true };

  let bullets = [];
  let enemyTanks = [];
  let map = [];
  let spawnTimer = 0;

  let currentItem = null;
  let itemLifeTimer = 0;

  // Константы блоков
  const EMPTY = 0;
  const BRICK_3 = 1;
  const BRICK_2 = 2;
  const BRICK_1 = 3;
  const STEEL = 4;
  const BUSH = 5;
  const ICE = 6;

  window.initTanks = function () {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  window.runTanks = function () {
    bullets = [];
    enemyTanks = [];
    spawnTimer = 0;
    currentItem = null;
    base = { x: 6, y: 12, alive: true };
    myTank = {
      x: 4,
      y: 12,
      dir: "up",
      scoreHearts: 3,
      invulnerableTimer: 0,
      shootCooldown: 0,
    };

    map = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      map.push(new Array(GRID_SIZE).fill(EMPTY));
    }

    // Строим стены
    for (let r = 1; r < 11; r++) {
      if (r !== 5 && r !== 6) {
        map[r][2] = BRICK_3;
        map[r][3] = BRICK_3;
        map[r][5] = BRICK_3;
        map[r][7] = BRICK_3;
        map[r][9] = BRICK_3;
        map[r][10] = BRICK_3;
      }
    }

    map[3][6] = STEEL;
    map[4][6] = STEEL;
    map[8][1] = STEEL;
    map[8][11] = STEEL;

    map[5][4] = BUSH;
    map[5][8] = BUSH;
    map[6][4] = BUSH;
    map[6][8] = BUSH;
    map[11][2] = ICE;
    map[11][10] = ICE;

    // Окружение базы
    map[11][5] = BRICK_3;
    map[11][6] = BRICK_3;
    map[11][7] = BRICK_3;
    map[12][5] = BRICK_3;
    map[12][7] = BRICK_3;

    // Очищаем старый интервал перед запуском нового
    if (window.gameInterval) clearInterval(window.gameInterval);

    window.gameInterval = setInterval(() => {
      if (!isPlaying) return;

      if (myTank.shootCooldown > 0) myTank.shootCooldown--;
      if (myTank.invulnerableTimer > 0) myTank.invulnerableTimer--;
      spawnTimer++;

      // Спавн танков раз в 4 секунды (120 кадров)
      if (enemyTanks.length < 4 && spawnTimer % 120 === 0) {
        const spawnPoints = Array.of(0, 6, 12);
        const sx = spawnPoints[Math.floor(Math.random() * 3)];

        // Проверяем, не занята ли точка спавна другим танком
        if (!enemyTanks.some((e) => e.x === sx && e.y === 0)) {
          const rType = Math.random();
          let eType = "light";
          let hp = 1;

          if (rType < 0.35) (eType = "medium"), (hp = 2);
          else if (rType < 0.6) (eType = "heavy"), (hp = 3);

          enemyTanks.push({
            x: sx,
            y: 0,
            dir: "down",
            type: eType,
            hp: hp,
            maxHp: hp,
            moveCooldown: 0,
            shootCooldown: 0,
          });
        }
      }

      // Обработка кулдаунов врагов
      enemyTanks.forEach((e) => {
        if (e.shootCooldown > 0) e.shootCooldown--;

        // Дискретное движение врагов (срабатывает раз в несколько кадров в зависимости от типа)
        e.moveCooldown++;
        let speedTicks =
          e.type === "light" ? 12 : e.type === "medium" ? 10 : 16;

        if (e.moveCooldown >= speedTicks) {
          e.moveCooldown = 0;
          moveEnemy(e);
        }
      });

      // Спавн бонусов
      if (!currentItem && Math.random() < 0.003) {
        const types = Array.of("heart", "shield", "super");
        currentItem = {
          x: Math.floor(Math.random() * 11) + 1,
          y: Math.floor(Math.random() * 10) + 1,
          type: types[Math.floor(Math.random() * 3)],
        };
        itemLifeTimer = 450;
      }

      if (currentItem) {
        currentItem.timer--;
        if (itemLifeTimer <= 0) currentItem = null;
      }

      // Пошаговый микро-полет пуль (высокая точность детекции)
      for (let step = 0; step < 2; step++) {
        bullets.forEach((b, index) => {
          if (b.dir === "up") b.y -= 0.15;
          if (b.dir === "down") b.y += 0.15;
          if (b.dir === "left") b.x -= 0.15;
          if (b.dir === "right") b.x += 0.15;

          let mx = Math.round(b.x);
          let my = Math.round(b.y);

          if (mx < 0 || mx >= GRID_SIZE || my < 0 || my >= GRID_SIZE) {
            bullets.splice(index, 1);
            return;
          }

          let blockType = map[my][mx];

          // Пуля бьет по стенам
          if (blockType === BRICK_3) {
            map[my][mx] = BRICK_2;
            bullets.splice(index, 1);
            return;
          }
          if (blockType === BRICK_2) {
            map[my][mx] = BRICK_1;
            bullets.splice(index, 1);
            return;
          }
          if (blockType === BRICK_1) {
            map[my][mx] = EMPTY;
            bullets.splice(index, 1);
            return;
          }
          if (blockType === STEEL) {
            bullets.splice(index, 1);
            return;
          }

          // Пуля уничтожает штаб
          if (mx === base.x && my === base.y && base.alive) {
            base.alive = false;
            bullets.splice(index, 1);
            executeGameOver();
            return;
          }

          // Попадание в танки
          if (b.owner === "player") {
            enemyTanks.forEach((e, ei) => {
              if (Math.round(e.x) === mx && Math.round(e.y) === my) {
                bullets.splice(index, 1);
                e.hp = myTank.superAttack ? 0 : e.hp - 1;
                if (e.hp <= 0) {
                  enemyTanks.splice(ei, 1);
                  score += 100;
                  document.getElementById("score").innerText = score;
                }
              }
            });
          } else if (b.owner === "enemy") {
            if (Math.round(myTank.x) === mx && Math.round(myTank.y) === my) {
              bullets.splice(index, 1);
              if (myTank.invulnerableTimer === 0) {
                myTank.scoreHearts--;
                if (myTank.scoreHearts <= 0) {
                  executeGameOver();
                } else {
                  myTank.x = 4;
                  myTank.y = 12;
                  myTank.dir = "up";
                  myTank.invulnerableTimer = 45;
                }
              }
            }
          }
        });
      }

      // Фильтрация вылетевших пуль
      bullets = bullets.filter(
        (b) => b.x >= 0 && b.x < GRID_SIZE && b.y >= 0 && b.y < GRID_SIZE
      );

      // Подбор бонусов
      if (
        currentItem &&
        Math.round(myTank.x) === currentItem.x &&
        Math.round(myTank.y) === currentItem.y
      ) {
        if (currentItem.type === "heart" && myTank.scoreHearts < 5)
          myTank.scoreHearts++;
        else if (currentItem.type === "shield") myTank.invulnerableTimer = 300;
        else if (currentItem.type === "super") {
          myTank.superAttack = true;
          setTimeout(() => {
            myTank.superAttack = false;
          }, 10000);
        }
        currentItem = null;
        score += 200;
        document.getElementById("score").innerText = score;
      }

      drawTanks();
    }, 30);
  };

  // Изолированная функция принудительного завершения игры
  function executeGameOver() {
    isPlaying = false;
    clearInterval(window.gameInterval); // Добавлено window.
    drawTanks();
    window.triggerGameOver();
    return;
  }

  // Дискретное перемещение и логика ИИ врага
  function moveEnemy(e) {
    let playerInBush = map[Math.round(myTank.y)][Math.round(myTank.x)] === BUSH;
    let seesPlayer = false;

    if (!playerInBush) {
      if (Math.round(e.y) === Math.round(myTank.y)) {
        seesPlayer = true;
        e.dir = e.x < myTank.x ? "right" : "left";
      } else if (Math.round(e.x) === Math.round(myTank.x)) {
        seesPlayer = true;
        e.dir = e.y < myTank.y ? "down" : "up";
      }
    }

    if (seesPlayer) {
      if (e.shootCooldown === 0) {
        bullets.push({ x: e.x, y: e.y, dir: e.dir, owner: "enemy" });
        e.shootCooldown = 35;
      }
    } else {
      // Движение по клеткам
      let nx = e.x;
      let ny = e.y;
      if (e.dir === "up") ny--;
      if (e.dir === "down") ny++;
      if (e.dir === "left") nx--;
      if (e.dir === "right") nx++;

      let isBlocked = false;
      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE)
        isBlocked = true;
      else if (Array.of(BRICK_3, BRICK_2, BRICK_1, STEEL).includes(map[ny][nx]))
        isBlocked = true;
      else if (
        enemyTanks.some(
          (other) => other !== e && other.x === nx && other.y === ny
        )
      )
        isBlocked = true;
      else if (Math.round(myTank.x) === nx && Math.round(myTank.y) === ny)
        isBlocked = true;

      if (isBlocked || Math.random() < 0.2) {
        // Выбор нового пути
        if (Math.random() < 0.75) {
          let targetDir = [];
          if (e.y < base.y) targetDir.push("down");
          if (e.x < base.x) targetDir.push("right");
          if (e.x > base.x) targetDir.push("left");
          e.dir =
            targetDir[Math.floor(Math.random() * targetDir.length)] || "down";
        } else {
          const dirs = Array.of("up", "down", "left", "right");
          e.dir = dirs[Math.floor(Math.random() * 4)];
        }
      } else {
        e.x = nx;
        e.y = ny;
      }
      if (Math.random() < 0.08 && e.shootCooldown === 0) {
        bullets.push({ x: e.x, y: e.y, dir: e.dir, owner: "enemy" });
        e.shootCooldown = 50;
      }
    }
  }
  function drawTanks() {
    if (currentGame !== "tanks") return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Лёд
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (map[r][c] === ICE) {
          ctx.fillStyle = "#2b5c66";
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
          ctx.strokeStyle = "#61b0bf";
          ctx.strokeRect(c * CELL + 3, r * CELL + 3, CELL - 6, CELL - 6);
        }
      }
    }
    // Стены
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        let blockType = map[r][c];
        if (Array.of(BRICK_3, BRICK_2, BRICK_1).includes(blockType)) {
          ctx.fillStyle =
            blockType === BRICK_3
              ? "#b84400"
              : blockType === BRICK_2
              ? "#8a3300"
              : "#5c2200";
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
          ctx.fillStyle = "#3a1600";
          ctx.fillRect(c * CELL, r * CELL + 8, CELL, 2);
          ctx.fillRect(c * CELL, r * CELL + 18, CELL, 2);
          if (blockType === BRICK_1) {
            ctx.fillStyle = "#000";
            ctx.fillRect(c * CELL + 4, r * CELL + 4, 12, 2);
            ctx.fillRect(c * CELL + 14, r * CELL + 4, 2, 12);
          }
        } else if (blockType === STEEL) {
          ctx.fillStyle = "#73737c";
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
          ctx.fillStyle = "#d1d1d6";
          ctx.fillRect(c * CELL + 2, r * CELL + 2, CELL - 4, CELL - 4);
          ctx.fillStyle = "#a1a1a8";
          ctx.fillRect(c * CELL + 5, r * CELL + 5, CELL - 10, CELL - 10);
        }
      }
    }
    // Орёл
    if (base.alive) {
      ctx.fillStyle = "#d49b2c";
      ctx.fillRect(base.x * CELL + 2, base.y * CELL + 4, CELL - 4, CELL - 8);
      ctx.fillStyle = "#f5c367";
      ctx.fillRect(base.x * CELL + 8, base.y * CELL + 8, 14, 14);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(base.x * CELL + 11, base.y * CELL + 2, 8, 6);
    } else {
      ctx.fillStyle = "#222";
      ctx.fillRect(base.x * CELL, base.y * CELL, CELL, CELL);
      ctx.fillStyle = "#ff3333";
      ctx.font = "14px Arial";
      ctx.fillText("❌", base.xCELL + 6, base.yCELL + 20);
    }
    // Бонусы
    if (currentItem) {
      let itemX = currentItem.x * CELL + 4;
      let itemY = currentItem.y * CELL + 4;
      ctx.fillStyle = "#111";
      ctx.fillRect(itemX, itemY, 22, 22);
      if (currentItem.type === "heart") {
        ctx.fillStyle = "#ff3333";
        ctx.font = "14px Arial";
        ctx.fillText("❤️", itemX + 3, itemY + 16);
      } else if (currentItem.type === "shield") {
        ctx.fillStyle = "#00f0f0";
        ctx.font = "14px Arial";
        ctx.fillText("🛡️", itemX + 3, itemY + 16);
      } else if (currentItem.type === "super") {
        ctx.fillStyle = "#ffaa00";
        ctx.font = "14px Arial";
        ctx.fillText("⚡", itemX + 5, itemY + 16);
      }
    }
    // Игрок
    if (myTank.scoreHearts > 0) {
      ctx.fillStyle =
        myTank.invulnerableTimer > 0 &&
        Math.floor(myTank.invulnerableTimer / 3) % 2 === 0
          ? "#00ffff"
          : "#3fa843";
      ctx.fillRect(
        myTank.x * CELL + 3,
        myTank.y * CELL + 3,
        CELL - 6,
        CELL - 6
      );
      ctx.fillStyle = "#1e1f21"; // Катки
      ctx.fillRect(myTank.x * CELL, myTank.y * CELL + 2, 3, CELL - 4);
      ctx.fillRect(
        myTank.x * CELL + CELL - 3,
        myTank.y * CELL + 2,
        3,
        CELL - 4
      );
      ctx.fillStyle = "#ffffff"; // Дуло
      if (myTank.dir === "up")
        ctx.fillRect(myTank.x * CELL + 13, myTank.y * CELL, 4, 8);
      if (myTank.dir === "down")
        ctx.fillRect(myTank.x * CELL + 13, myTank.y * CELL + CELL - 8, 4, 8);
      if (myTank.dir === "left")
        ctx.fillRect(myTank.x * CELL, myTank.y * CELL + 13, 8, 4);
      if (myTank.dir === "right")
        ctx.fillRect(myTank.x * CELL + CELL - 8, myTank.y * CELL + 13, 8, 4);
    }
    // Враги
    enemyTanks.forEach((e) => {
      if (e.type === "light") ctx.fillStyle = "#a1a1a8";
      else if (e.type === "medium") ctx.fillStyle = "#4976ba";
      else if (e.type === "heavy") {
        ctx.fillStyle =
          e.hp === 3 ? "#cf6d17" : e.hp === 2 ? "#b38419" : "#d43333";
      }
      ctx.fillRect(e.x * CELL + 3, e.y * CELL + 3, CELL - 6, CELL - 6);
      ctx.fillStyle = "#222";
      ctx.fillRect(e.x * CELL, e.y * CELL + 2, 3, CELL - 4);
      ctx.fillRect(e.x * CELL + CELL - 3, e.y * CELL + 2, 3, CELL - 4);
      if (e.maxHp > 1) {
        ctx.fillStyle = "#ff3333";
        ctx.fillRect(e.x * CELL, e.y * CELL - 4, CELL, 3);
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(e.x * CELL, e.y * CELL - 4, CELL * (e.hp / e.maxHp), 3);
      }
    });
    // Снаряды
    ctx.fillStyle = "#ffff00";
    bullets.forEach((b) =>
      ctx.fillRect(b.x * CELL + 13, b.y * CELL + 13, 4, 4)
    );
    // Кусты (верхний слой)
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (map[r][c] === BUSH) {
          ctx.fillStyle = "rgba(29, 133, 34, 0.88)";
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        }
      }
    }
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("БРОНЯ: " + "❤️".repeat(myTank.scoreHearts), 10, 20);
  }
  // Идеальное пошаговое перемещение игрока по клавишам
  document.addEventListener("keydown", (e) => {
    if (!isPlaying || currentGame !== "tanks" || myTank.scoreHearts <= 0)
      return;
    let nx = myTank.x;
    let ny = myTank.y;
    let moved = false;
    if (e.key === "ArrowLeft") {
      myTank.dir = "left";
      nx--;
      moved = true;
    }
    if (e.key === "ArrowRight") {
      myTank.dir = "right";
      nx++;
      moved = true;
    }
    if (e.key === "ArrowUp") {
      myTank.dir = "up";
      ny--;
      moved = true;
    }
    if (e.key === "ArrowDown") {
      myTank.dir = "down";
      ny++;
      moved = true;
    }
    if (e.key === " ") {
      if (myTank.shootCooldown === 0) {
        bullets.push({
          x: myTank.x,
          y: myTank.y,
          dir: myTank.dir,
          owner: "player",
        });
        myTank.shootCooldown = 12;
      }
    }
    if (moved) {
      let isBlocked = false;
      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE)
        isBlocked = true;
      else if (Array.of(BRICK_3, BRICK_2, BRICK_1, STEEL).includes(map[ny][nx]))
        isBlocked = true;
      else if (enemyTanks.some((e) => e.x === nx && e.y === ny))
        isBlocked = true;
      if (!isBlocked) {
        myTank.x = nx;
        myTank.y = ny;
      }
    }
    drawTanks();
  });
})();
