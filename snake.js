(function () {
  let snake = [];
  let snakeDir = { x: 1, y: 0 };
  let food = { x: 0, y: 0 };
  const CELLS = 20;
  const CELL_SIZE = 20;

  window.initSnake = function () {
    ctx.fillStyle = "#08120a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  window.runSnake = function () {
    snake = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ];
    snakeDir = { x: 1, y: 0 };
    spawnFood();
    gameInterval = setInterval(() => {
      let head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };

      if (
        head.x < 0 ||
        head.x >= CELLS ||
        head.y < 0 ||
        head.y >= CELLS ||
        snake.some((s) => s.x === head.x && s.y === head.y)
      ) {
        window.triggerGameOver();
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById("score").innerText = score;
        spawnFood();
      } else {
        snake.pop();
      }
      draw();
    }, 120);
  };

  function spawnFood() {
    food = {
      x: Math.floor(Math.random() * CELLS),
      y: Math.floor(Math.random() * CELLS),
    };
  }

  function draw() {
    if (currentGame !== "snake") return;
    ctx.fillStyle = "#08120a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#4af626";
    snake.forEach((s) =>
      ctx.fillRect(
        s.x * CELL_SIZE,
        s.y * CELL_SIZE,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      )
    );
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(
      food.x * CELL_SIZE,
      food.y * CELL_SIZE,
      CELL_SIZE - 2,
      CELL_SIZE - 2
    );
  }

  document.addEventListener("keydown", (e) => {
    if (!isPlaying || currentGame !== "snake") return;
    if (e.key === "ArrowLeft" && snakeDir.x === 0) snakeDir = { x: -1, y: 0 };
    if (e.key === "ArrowRight" && snakeDir.x === 0) snakeDir = { x: 1, y: 0 };
    if (e.key === "ArrowUp" && snakeDir.y === 0) snakeDir = { x: 0, y: -1 };
    if (e.key === "ArrowDown" && snakeDir.y === 0) snakeDir = { x: 0, y: 1 };
  });
})();
