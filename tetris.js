(function () {
  const ROWS = 20;
  const COLS = 10;
  const BLOCK_SIZE = 24;
  let board = [];
  let piece = { x: 0, y: 0, matrix: null };
  const COLORS = [
    "#000",
    "#00f0f0",
    "#f0f000",
    "#a000f0",
    "#00f000",
    "#f00000",
    "#0000f0",
    "#f0a000",
  ];
  const SHAPES = {
    I: "0100|0100|0100|0100",
    O: "22|22",
    T: "030|333|000",
    S: "044|440|000",
    Z: "550|055|000",
    J: "060|060|660",
    L: "070|070|077",
  };

  let currentLevel = 1; // Текущий уровень скорости

  window.initTetris = function () {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    piece.matrix = null;
    currentLevel = 1;
    draw();
  };

  window.runTetris = function () {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    currentLevel = 1;
    spawnPiece();
    resetTetrisTimer(); // Запуск кастомного динамического таймера
  };

  // Функция перерасчета и сброса таймера в зависимости от очков
  function resetTetrisTimer() {
    if (window.gameInterval) clearInterval(window.gameInterval);
    if (!isPlaying) return;

    // Рассчитываем уровень: каждые 500 очков +1 уровень
    currentLevel = 1 + Math.floor(score / 500);

    // Рассчитываем задержку падения (минимальный порог — 120мс на экстремальных уровнях)
    let speedDelay = Math.max(120, 800 - (currentLevel - 1) * 150);

    window.gameInterval = setInterval(() => {
      if (!checkCollision(piece.x, piece.y + 1, piece.matrix)) {
        piece.y++;
      } else {
        lockPiece();
      }
      draw();
    }, speedDelay);
  }

  function draw() {
    if (currentGame !== "tetris") return;
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Отрисовка стакана
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] > 0) drawBlock(c, r, board[r][c]);
      }
    }

    // Отрисовка активной фигуры
    if (isPlaying && piece.matrix) {
      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (piece.matrix[r][c] > 0)
            drawBlock(piece.x + c, piece.y + r, piece.matrix[r][c]);
        }
      }
    }

    // Вывод текущего уровня скорости прямо на экран холста внизу стакана
    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("LEVEL: " + currentLevel, 12, canvas.height - 15);
  }

  function drawBlock(x, y, colorId) {
    ctx.fillStyle = COLORS[colorId];
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = "#111116";
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  }

  function spawnPiece() {
    const types = ["I", "O", "T", "S", "Z", "J", "L"];
    const t = types[Math.floor(Math.random() * 7)];
    piece.matrix = SHAPES[t].split("|").map((r) => r.split("").map(Number));
    piece.y = 0;
    piece.x = Math.floor((COLS - piece.matrix.length) / 2);
    if (checkCollision(piece.x, piece.y, piece.matrix))
      window.triggerGameOver();
  }

  function checkCollision(nx, ny, mat) {
    if (!mat) return false;
    for (let r = 0; r < mat.length; r++) {
      for (let c = 0; c < mat[r].length; c++) {
        if (mat[r][c] > 0) {
          let bx = nx + c;
          let by = ny + r;
          if (bx < 0 || bx >= COLS || by >= ROWS) return true;
          if (by >= 0 && board[by][bx] > 0) return true;
        }
      }
    }
    return false;
  }

  function lockPiece() {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c] > 0 && piece.y + r >= 0)
          board[piece.y + r][piece.x + c] = piece.matrix[r][c];
      }
    }

    let linesClearedThisTurn = false;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((v) => v > 0)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(0));
        score += 100;
        linesClearedThisTurn = true;
        r++;
      }
    }

    document.getElementById("score").innerText = score;

    // Если произошло начисление очков, проверяем необходимость повысить уровень скорости
    if (linesClearedThisTurn) {
      resetTetrisTimer();
    }

    spawnPiece();
  }

  document.addEventListener("keydown", (e) => {
    if (!isPlaying || currentGame !== "tetris") return;
    if (
      e.key === "ArrowLeft" &&
      !checkCollision(piece.x - 1, piece.y, piece.matrix)
    )
      piece.x--;
    if (
      e.key === "ArrowRight" &&
      !checkCollision(piece.x + 1, piece.y, piece.matrix)
    )
      piece.x++;
    if (
      e.key === "ArrowDown" &&
      !checkCollision(piece.x, piece.y + 1, piece.matrix)
    )
      piece.y++;
    if (e.key === "ArrowUp") {
      const n = piece.matrix.length;
      let temp = Array.from({ length: n }, () => Array(n).fill(0));
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++) temp[c][n - 1 - r] = piece.matrix[r][c];
      if (!checkCollision(piece.x, piece.y, temp)) piece.matrix = temp;
    }
    draw();
  });
})();
