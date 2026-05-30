const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let currentGame = "tetris";
let score = 0;
window.gameInterval = null;
window.animationFrameId = null;
let isPlaying = false;

// Тайминги для фиксации 60 FPS на любых мониторах
window.fpsInterval = 1000 / 60;
window.then = 0;

window.stopAllLoops = function () {
  if (window.gameInterval) clearInterval(window.gameInterval);
  if (window.animationFrameId) cancelAnimationFrame(window.animationFrameId);
};

window.switchGame = function (gameType) {
  window.stopAllLoops();
  isPlaying = false;
  score = 0;
  document.getElementById("score").innerText = score;

  document
    .querySelectorAll(".game-card")
    .forEach((card) => card.classList.remove("active"));
  const targetCard = document.getElementById(`card-${gameType}`);
  if (targetCard) targetCard.classList.add("active");

  currentGame = gameType;
  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("start-screen").style.display = "flex";

  const uppercaseTitle =
    gameType === "space"
      ? "SPACE IMPACT"
      : gameType === "racing"
      ? "RETRO RACING"
      : gameType.toUpperCase();
  document.getElementById("header-logo").innerText = uppercaseTitle;
  document.getElementById("game-title").innerText = uppercaseTitle;

  if (gameType === "tetris") {
    document.getElementById("controls-hint").innerText =
      "Управление: Стрелки Влево / Вправо / Вниз / Вверх (поворот)";
    canvas.width = 240;
    canvas.height = 480;
    if (window.initTetris) window.initTetris();
  } else if (gameType === "snake") {
    document.getElementById("controls-hint").innerText =
      "Управление: Стрелки Влево / Вправо / Вверх / Вниз (разворот)";
    canvas.width = 400;
    canvas.height = 400;
    if (window.initSnake) window.initSnake();
  } else if (gameType === "space") {
    document.getElementById("controls-hint").innerText =
      "Управление: Стрелки Вверх/Вниз (движение) | Пробел (одиночный огонь)";
    canvas.width = 480;
    canvas.height = 240;
    if (window.initSpace) window.initSpace();
  } else if (gameType === "tanks") {
    document.getElementById("controls-hint").innerText =
      "Управление: Стрелки (шаг по сетке) | Пробел (выстрел)";
    canvas.width = 390;
    canvas.height = 390;
    if (window.initTanks) window.initTanks();
  } else if (gameType === "pacman") {
    document.getElementById("controls-hint").innerText =
      "Управление: Стрелки или WASD (выбор направления поворота)";
    canvas.width = 380;
    canvas.height = 380;
    if (window.initPacman) window.initPacman();
  } else if (gameType === "racing") {
    document.getElementById("controls-hint").innerText =
      "Управление: Стрелки Влево/Вправо (полоса) | Зажмите Вверх/W (Турбо-ускорение)";
    canvas.width = 350;
    canvas.height = 450;
    if (window.initRacing) window.initRacing();
  }

  document.getElementById("game-zone").scrollIntoView({ behavior: "smooth" });
};

window.startCurrentGame = function () {
  document.getElementById("start-screen").style.display = "none";
  isPlaying = true;
  score = 0;
  document.getElementById("score").innerText = score;
  window.then = performance.now(); // Засекаем стартовое время

  if (currentGame === "tetris" && window.runTetris) window.runTetris();
  if (currentGame === "snake" && window.runSnake) window.runSnake();
  if (currentGame === "space" && window.runSpace) window.runSpace();
  if (currentGame === "tanks" && window.runTanks) window.runTanks();
  if (currentGame === "pacman" && window.runPacman) window.runPacman();
  if (currentGame === "racing" && window.runRacing) window.runRacing();
};

window.restartCurrentGame = function () {
  document.getElementById("game-over-screen").style.display = "none";
  window.startCurrentGame();
};

window.triggerGameOver = function () {
  isPlaying = false;
  window.stopAllLoops();
  document.getElementById("final-score").innerText = score;
  document.getElementById("game-over-screen").style.display = "flex";
};

window.sendGameRequest = function () {
  const input = document.getElementById("gameRequestInput");
  const responseDiv = document.getElementById("terminalResponse");
  const value = input.value.trim();

  if (value === "") {
    responseDiv.style.color = "#ff3333";
    responseDiv.innerText =
      "> Ошибка: Строка ввода пуста. Введите название игры.";
    return;
  }

  responseDiv.style.color = "#00ff55";
  responseDiv.innerText = `> Запрос на игру [${value.toUpperCase()}] успешно отправлен на сервер. Разработчик рассмотрит его в следующем патче!`;
  input.value = "";
  setTimeout(() => {
    responseDiv.innerText = "";
  }, 5000);
};

document.addEventListener("keydown", (e) => {
  if (!isPlaying) return;
  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      " ",
      "w",
      "s",
      "a",
      "d",
      "W",
      "S",
      "A",
      "D",
    ].includes(e.key)
  ) {
    e.preventDefault();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    window.switchGame("tetris");
  }, 150);
});
