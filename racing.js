(function () {
  // Координаты X для 3 полос движения (смещены влево, оставляя место под боковой датчик)
  const LANES_X = Array.of(20, 105, 190);

  // Параметры игрока
  let player = {
    lane: 1, // Текущая целевая полоса (0, 1, 2)
    currentX: 105, // Текущая плавная координата X на холсте
    y: 370,
    w: 30,
    h: 50,
    slideSpeed: 10, // Скорость перестроения между рядами
  };

  let traffic = []; // Препятствия, монеты и канистры
  let roadOffsetY = 0; // Смещение разметки для иллюзии движения
  let gameSpeed = 5; // Текущая базовая скорость
  let spawnCooldown = 0; // Задержка между появлением объектов
  let highScore = 0;

  // Система топлива
  let fuel = 100; // Уровень бака (от 0% до 100%)
  let isAccelerating = false; // Зажата ли клавиша «Вверх»

  window.initRacing = function () {
    // Загрузка рекорда из памяти браузера
    highScore = parseInt(localStorage.getItem("racing_highscore")) || 0;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  window.runRacing = function () {
    // Сброс всех параметров при старте
    player.lane = 1;
    player.currentX = 105;
    traffic = [];
    roadOffsetY = 0;
    gameSpeed = 5;
    spawnCooldown = 0;
    fuel = 100;
    isAccelerating = false;
    highScore = parseInt(localStorage.getItem("racing_highscore")) || 0;

    if (window.gameInterval) clearInterval(window.gameInterval);

    window.gameInterval = setInterval(() => {
      if (!isPlaying) return;

      // 1. Динамический расчет скорости и расхода топлива
      let currentSpeed = gameSpeed;
      let fuelConsumption = 0.027; // Базовый плавный расход (~5% в секунду при 60 FPS)

      if (isAccelerating) {
        currentSpeed *= 1.6; // Машина едет быстрее
        fuelConsumption *= 2; // Топливо тратится в 2 раза быстрее!
        score += 2; // Бонус к очкам за риск и скорость
      } else {
        score += 1;
      }

      // Увеличиваем базовую скорость игры по мере роста счета
      gameSpeed = 5 + Math.floor(score / 400) * 0.7;

      // Уменьшаем топливо
      fuel -= fuelConsumption;
      if (fuel <= 0) {
        fuel = 0;
        // Топливо кончилось — машина плавно останавливается и наступает Game Over
        animateStopAndGameOver();
        return;
      }

      document.getElementById("score").innerText = score;

      // Скроллинг дороги в зависимости от текущей скорости
      roadOffsetY += currentSpeed;
      if (roadOffsetY >= 35) roadOffsetY = 0;

      // Плавное перестроение машинки игрока
      let targetX = LANES_X[player.lane];
      if (player.currentX < targetX) {
        player.currentX = Math.min(
          targetX,
          player.currentX + player.slideSpeed
        );
      } else if (player.currentX > targetX) {
        player.currentX = Math.max(
          targetX,
          player.currentX - player.slideSpeed
        );
      }

      // 2. Генерация объектов на трассе
      if (spawnCooldown > 0) spawnCooldown--;
      let currentSpawnRate = Math.max(25, 65 - Math.floor(currentSpeed * 1.5));

      if (spawnCooldown <= 0 && Math.random() < 0.35) {
        let randomLane = Math.floor(Math.random() * 3);
        let r = Math.random();
        let type = "traffic";
        let color = "#ff3333";
        let botSpeed = currentSpeed * (0.5 + Math.random() * 0.4);

        if (r < 0.18) {
          type = "fuel"; // Яркая канистра бензина
          color = "#00ff55";
          botSpeed = currentSpeed; // Канистры жестко привязаны к скорости дороги
        } else if (r < 0.35) {
          type = "coin"; // Золотая монетка
          color = "#ffff00";
          botSpeed = currentSpeed;
        } else {
          let botColors = Array.of("#ff3333", "#e0a32e", "#9b59b6", "#ea2027");
          color = botColors[Math.floor(Math.random() * 4)];
        }

        traffic.push({
          x: LANES_X[randomLane],
          y: -60,
          w: 30,
          h: 50,
          type: type,
          color: color,
          speed: botSpeed,
        });

        spawnCooldown = currentSpawnRate;
      }

      // 3. Движение объектов и проверка коллизий
      for (let i = traffic.length - 1; i >= 0; i--) {
        let obj = traffic[i];

        // Скорость движения объектов зависит от того, ускоряется ли игрок
        if (isAccelerating && obj.type !== "traffic") {
          obj.y += currentSpeed;
        } else {
          obj.y += obj.speed;
        }

        // Проверка физического столкновения с машиной игрока
        if (
          player.currentX < obj.x + obj.w &&
          player.currentX + player.w > obj.x &&
          player.y < obj.y + obj.h &&
          player.y + player.h > obj.y
        ) {
          if (obj.type === "traffic") {
            executeRacingGameOver();
            return;
          } else if (obj.type === "fuel") {
            // Канистра дает +30% к баку, но не выше 100%
            fuel = Math.min(100, fuel + 30);
            score += 200; // Бонусные очки за подбор
            traffic.splice(i, 1);
          } else if (obj.type === "coin") {
            score += 300;
            traffic.splice(i, 1);
          }
          document.getElementById("score").innerText = score;
          continue;
        }

        // Удаление улетевших объектов
        if (obj.y > canvas.height) {
          traffic.splice(i, 1);
        }
      }

      drawRacing();
    }, 1000 / 60);
  };

  // Эффект плавной остановки при пустом баке
  function animateStopAndGameOver() {
    clearInterval(window.gameInterval);
    let stopSpeed = gameSpeed;

    let stopInterval = setInterval(() => {
      stopSpeed -= 0.2;
      if (stopSpeed <= 0) {
        stopSpeed = 0;
        clearInterval(stopInterval);
        executeRacingGameOver();
      }
      roadOffsetY += stopSpeed;
      if (roadOffsetY >= 35) roadOffsetY = 0;
      traffic.forEach((obj) => (obj.y += stopSpeed * 0.5));
      drawRacing();
    }, 1000 / 60);
  }

  function executeRacingGameOver() {
    isPlaying = false;
    clearInterval(window.gameInterval);
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("racing_highscore", highScore);
    }
    drawRacing();
    window.triggerGameOver();
  }

  function drawRacing() {
    if (currentGame !== "racing") return;

    // 1. Отрисовка асфальта
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, 245, canvas.height);

    // Панель датчиков (справа)
    ctx.fillStyle = "#111116";
    ctx.fillRect(245, 0, canvas.width - 245, canvas.height);
    ctx.fillStyle = "#333";
    ctx.fillRect(245, 0, 3, canvas.height);

    // Подвижная пунктирная разметка
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.setLineDash(Array.of(20, 15));

    ctx.save();
    ctx.translate(0, roadOffsetY);
    ctx.beginPath();
    ctx.moveTo(85, -40);
    ctx.lineTo(85, canvas.height + 40);
    ctx.moveTo(170, -40);
    ctx.lineTo(170, canvas.height + 40);
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash(Array.of());

    // 2. Отрисовка трафика и бонусов
    traffic.forEach((obj) => {
      if (obj.type === "traffic") {
        ctx.fillStyle = obj.color;
        ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        ctx.fillStyle = "#000";
        ctx.fillRect(obj.x + 3, obj.y + 30, 24, 8);
        ctx.fillStyle = "#fff";
        ctx.fillRect(obj.x + 2, obj.y + 44, 4, 3);
        ctx.fillRect(obj.x + 24, obj.y + 44, 4, 3);
      } else if (obj.type === "fuel") {
        // Яркая зеленая канистра с буквой F
        ctx.fillStyle = "#00ff55";
        ctx.fillRect(obj.x + 5, obj.y + 10, 20, 25);
        ctx.fillStyle = "#fff";
        ctx.fillRect(obj.x + 10, obj.y + 4, 10, 6);
        ctx.fillStyle = "#000";
        ctx.font = "bold 13px Arial";
        ctx.fillText("F", obj.x + 11, obj.y + 27);
      } else if (obj.type === "coin") {
        ctx.fillStyle = "#ffff00";
        ctx.beginPath();
        ctx.arc(obj.x + 15, obj.y + 25, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d4af37";
        ctx.font = "bold 12px Arial";
        ctx.fillText("$", obj.x + 11, obj.y + 29);
      }
    });

    // 3. Отрисовка игрока
    ctx.fillStyle = "#00a8ff";
    ctx.fillRect(player.currentX, player.y, player.w, player.h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(player.currentX + 3, player.y + 12, 24, 8);
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(player.currentX + 2, player.y + 2, 4, 3);
    ctx.fillRect(player.currentX + 24, player.y + 2, 4, 3);

    // Если зажато ускорение — рисуем огонь из выхлопной трубы
    if (isAccelerating && Math.floor(score / 4) % 2 === 0) {
      ctx.fillStyle = "#ff5500";
      ctx.fillRect(player.currentX + 4, player.y + 50, 6, 8);
      ctx.fillRect(player.currentX + 20, player.y + 50, 6, 8);
    }
    // 4. Отрисовка вертикальной шкалы топлива (GAS)
    let barX = 285;
    let barY = 120;
    let barW = 20;
    let barH = 220;
    ctx.fillStyle = "#1e1e24";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);
    let currentPixelHeight = barH * (fuel / 100);
    // Мигание датчика, если бензина меньше 30%
    if (fuel <= 30) {
      ctx.fillStyle = Math.floor(score / 10) % 2 === 0 ? "#ff3333" : "#444";
    } else {
      ctx.fillStyle = "#00ffcc";
    }
    ctx.fillRect(
      barX,
      barY + (barH - currentPixelHeight),
      barW,
      currentPixelHeight
    );
    // Маркеры и проценты бака
    ctx.font = "bold 12px Helvetica";
    ctx.fillStyle = "#64748b";
    ctx.fillText("F", barX + 6, barY - 10);
    ctx.fillText("E", barX + 6, barY + barH + 18);
    ctx.font = "10px Arial";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("GAS", barX - 2, barY + barH / 2 - 10);
    ctx.fillStyle = "#00ffcc";
    ctx.fillText(Math.ceil(fuel) + "%", barX - 4, barY + barH / 2 + 10);
    // Хедер счета
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, 35);
    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("HI-SCORE:", 15, 22);
    ctx.fillStyle = "#ffff00";
    ctx.fillText(highScore, 85, 22);
  }
  // Слушатель нажатий клавиш (с поддержкой WASD/Стрелок и Одиночного отслеживания «Вверх»)
  document.addEventListener("keydown", (e) => {
    if (!isPlaying || currentGame !== "racing") return;
    let key = e.key.toLowerCase();
    if ((e.key === "ArrowLeft" || key === "a") && player.lane > 0)
      player.lane--;
    if ((e.key === "ArrowRight" || key === "d") && player.lane < 2)
      player.lane++;
    // Включение турбо-ускорения при зажатии «Вверх» или «W»
    if (e.key === "ArrowUp" || key === "w") {
      isAccelerating = true;
    }
  });
  document.addEventListener("keyup", (e) => {
    if (currentGame !== "racing") return;
    let key = e.key.toLowerCase();
    // Выключение турбо-ускорения при отпускании клавиши
    if (e.key === "ArrowUp" || key === "w") {
      isAccelerating = false;
    }
  });
})();
