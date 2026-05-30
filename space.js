(function () {
  let ship = { y: 100, x: 20, w: 28, h: 20 };
  let lasers = [];
  let enemies = [];
  let lives = 3;
  let bigMeteor = null;
  let questionMeteor = null;
  let timeCounter = 0;
  let glowPulse = 0;
  let invincibility = 0;
  let doubleShot = 0;
  let spacePressed = false;

  window.initSpace = function () {
    ctx.fillStyle = "#050a12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  window.runSpace = function () {
    lasers = [];
    enemies = [];
    bigMeteor = null;
    questionMeteor = null;
    lives = 3;
    ship.y = 110;
    timeCounter = 0;
    glowPulse = 0;
    invincibility = 0;
    doubleShot = 0;
    spacePressed = false;

    gameInterval = setInterval(() => {
      timeCounter++;
      glowPulse += 0.15;

      // Секретный метеорит с эффектом раз в 60 секунд (1800 кадров)
      if (timeCounter > 0 && timeCounter % 1800 === 0) {
        questionMeteor = {
          x: canvas.width,
          y: Math.random() * (canvas.height - 60) + 15,
          w: 45,
          h: 45,
          speed: 1.5,
          hp: 15,
        };
        enemies = [];
      }

      // Мелкие метеориты или Босс
      if (!bigMeteor && !questionMeteor && Math.random() < 0.03) {
        if (Math.random() < 0.05) {
          bigMeteor = {
            x: canvas.width,
            y: Math.random() * (canvas.height - 70) + 10,
            w: 60,
            h: 60,
            speed: 1.0,
            hp: 30,
          };
          enemies = [];
        } else {
          enemies.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 25) + 5,
            w: 18,
            h: 18,
            speed: 3.5,
          });
        }
      }

      if (invincibility > 0) invincibility--;
      if (doubleShot > 0) doubleShot--;

      lasers.forEach((l) => (l.x += 8));
      lasers = lasers.filter((l) => l.x < canvas.width);

      if (!bigMeteor && !questionMeteor) {
        enemies.forEach((e) => (e.x -= e.speed));
      } else {
        enemies = [];
      }

      // Логика Метеорита-Вопроса [?]
      if (questionMeteor) {
        questionMeteor.x -= questionMeteor.speed;
        for (let li = lasers.length - 1; li >= 0; li--) {
          if (
            lasers[li].x >= questionMeteor.x &&
            lasers[li].x <= questionMeteor.x + questionMeteor.w &&
            lasers[li].y >= questionMeteor.y &&
            lasers[li].y <= questionMeteor.y + questionMeteor.h
          ) {
            lasers.splice(li, 1);
            questionMeteor.hp--;
            if (questionMeteor.hp <= 0) {
              const r = Math.random();
              if (r < 0.34) invincibility = 30 * 20;
              else if (r < 0.68) doubleShot = 30 * 20;
              else if (lives < 5) lives++;
              questionMeteor = null;
              score += 300;
              document.getElementById("score").innerText = score;
              break;
            }
          }
        }
        if (
          questionMeteor &&
          (questionMeteor.x < -questionMeteor.w ||
            (questionMeteor.x < ship.x + ship.w &&
              questionMeteor.x + questionMeteor.w > ship.x &&
              questionMeteor.y + questionMeteor.h > ship.y &&
              questionMeteor.y < ship.y + ship.h))
        ) {
          if (invincibility <= 0 && questionMeteor.x >= 0) lives--;
          questionMeteor = null;
          if (lives <= 0) {
            window.triggerGameOver();
            return;
          }
        }
      }

      // Логика Большого Метеорита (Босса)
      if (bigMeteor) {
        bigMeteor.x -= bigMeteor.speed;
        for (let li = lasers.length - 1; li >= 0; li--) {
          if (
            lasers[li].x >= bigMeteor.x &&
            lasers[li].x <= bigMeteor.x + bigMeteor.w &&
            lasers[li].y >= bigMeteor.y &&
            lasers[li].y <= bigMeteor.y + bigMeteor.h
          ) {
            lasers.splice(li, 1);
            bigMeteor.hp--;
            if (bigMeteor.hp <= 0) {
              bigMeteor = null;
              score += 500;
              document.getElementById("score").innerText = score;
              break;
            }
          }
        }
        if (
          bigMeteor &&
          (bigMeteor.x < -bigMeteor.w ||
            (bigMeteor.x < ship.x + ship.w &&
              bigMeteor.x + bigMeteor.w > ship.x &&
              bigMeteor.y + bigMeteor.h > ship.y &&
              bigMeteor.y < ship.y + ship.h))
        ) {
          if (invincibility <= 0 && bigMeteor.x >= 0) lives--;
          bigMeteor = null;
          if (lives <= 0) {
            window.triggerGameOver();
            return;
          }
        }
      }

      // Столкновения обычных метеоритов
      for (let li = lasers.length - 1; li >= 0; li--) {
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
          if (
            enemies[ei] &&
            lasers[li] &&
            lasers[li].x > enemies[ei].x &&
            lasers[li].x < enemies[ei].x + enemies[ei].w &&
            lasers[li].y > enemies[ei].y &&
            lasers[li].y < enemies[ei].y + enemies[ei].h
          ) {
            enemies.splice(ei, 1);
            lasers.splice(li, 1);
            score += 50;
            document.getElementById("score").innerText = score;
          }
        }
      }

      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        if (enemies[ei].x < 0) {
          enemies.splice(ei, 1);
        } else if (
          enemies[ei].x < ship.x + ship.w &&
          enemies[ei].x + enemies[ei].w > ship.x &&
          enemies[ei].y + enemies[ei].h > ship.y &&
          enemies[ei].y < ship.y + ship.h
        ) {
          enemies.splice(ei, 1);
          if (invincibility <= 0) lives--;
          if (lives <= 0) {
            window.triggerGameOver();
            return;
          }
        }
      }

      draw();
    }, 1000 / 30);
  };

  function draw() {
    if (currentGame !== "space") return;
    ctx.fillStyle = "#050a12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isPlaying) {
      ctx.fillStyle =
        invincibility > 0 && Math.floor(invincibility / 3) % 2 === 0
          ? "#ffffff"
          : "#00ffcc";
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y);
      ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
      ctx.lineTo(ship.x, ship.y + ship.h);
      ctx.lineTo(ship.x + 6, ship.y + ship.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ship.x + 10, ship.y + 6, 6, 6);
    }

    ctx.fillStyle = "#ffff00";
    lasers.forEach((l) => ctx.fillRect(l.x, l.y, 10, 3));

    enemies.forEach((e) => {
      ctx.fillStyle = "#cf7d4a";
      ctx.beginPath();
      ctx.arc(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8a4f2a";
      ctx.fillRect(e.x + 4, e.y + 4, 3, 3);
    });

    if (bigMeteor) {
      ctx.fillStyle = "#804040";
      ctx.beginPath();
      ctx.arc(
        bigMeteor.x + bigMeteor.w / 2,
        bigMeteor.y + bigMeteor.h / 2,
        bigMeteor.w / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ff5555";
      ctx.stroke();
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(bigMeteor.x, bigMeteor.y - 10, bigMeteor.w, 4);
      ctx.fillStyle = "#00ff00";
      ctx.fillRect(
        bigMeteor.x,
        bigMeteor.y - 10,
        bigMeteor.w * (bigMeteor.hp / 30),
        4
      );
    }

    if (questionMeteor) {
      let cx = questionMeteor.x + questionMeteor.w / 2;
      let cy = questionMeteor.y + questionMeteor.h / 2;
      let r = questionMeteor.w / 2;
      let currentGlow = r + 6 + Math.sin(glowPulse) * 5;
      let grad = ctx.createRadialGradient(cx, cy, r - 2, cx, cy, currentGlow);
      grad.addColorStop(0, "rgba(138, 63, 252, 0.6)");
      grad.addColorStop(1, "rgba(138, 63, 252, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, currentGlow, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8a3ffc";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#d4b3ff";
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px Arial";
      ctx.fillText(
        "?",
        questionMeteor.x + 16,
        questionMeteor.y + 29 + Math.sin(glowPulse * 1.5) * 2
      );
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(
        questionMeteor.x,
        questionMeteor.y - 12,
        questionMeteor.w,
        4
      );
      ctx.fillStyle = "#e0a0ff";
      ctx.fillRect(
        questionMeteor.x,
        questionMeteor.y - 12,
        questionMeteor.w * (questionMeteor.hp / 15),
        4
      );
    }

    ctx.font = "12px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("ЖИЗНИ: " + "❤️".repeat(lives), 10, 20);

    let offsetTextY = 40;
    if (invincibility > 0) {
      ctx.fillStyle = "#00ffcc";
      ctx.fillText(
        "🛡️ БЕССМЕРТИЕ: " + Math.ceil(invincibility / 30) + "с",
        10,
        offsetTextY
      );
      offsetTextY += 20;
    }
    if (doubleShot > 0) {
      ctx.fillStyle = "#ffff00";
      ctx.fillText(
        "⚔️ ДВОЙНОЙ ЛУЧ: " + Math.ceil(doubleShot / 30) + "с",
        10,
        offsetTextY
      );
    }
  }

  document.addEventListener("keydown", (e) => {
    if (!isPlaying || currentGame !== "space") return;
    if (e.key === "ArrowUp" && ship.y > 10) ship.y -= 15;
    if (e.key === "ArrowDown" && ship.y < canvas.height - ship.h - 10)
      ship.y += 15;
    if (e.key === " " && !spacePressed) {
      spacePressed = true;
      if (doubleShot > 0) {
        lasers.push({ x: ship.x + ship.w, y: ship.y + 3 });
        lasers.push({ x: ship.x + ship.w, y: ship.y + ship.h - 5 });
      } else {
        lasers.push({ x: ship.x + ship.w, y: ship.y + ship.h / 2 - 1 });
      }
    }
    draw();
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === " ") spacePressed = false;
  });
})();
