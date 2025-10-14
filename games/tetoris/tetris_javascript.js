// ==========================================
// ゲーム設定
// ==========================================
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000'
};

// ==========================================
// テトリミノの形状定義
// ==========================================
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

// ==========================================
// ゲーム状態
// ==========================================
let canvas, ctx, nextCanvas, nextCtx;
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let lines = 0;
let level = 1;
let gameLoop = null;
let isPaused = false;
let isGameOver = false;

// ==========================================
// DOM要素
// ==========================================
let scoreEl, linesEl, levelEl, finalScoreEl;
let startBtn, pauseBtn, restartBtn, gameOverEl;

// ==========================================
// 初期化
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  // キャンバス取得
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  nextCanvas = document.getElementById('nextCanvas');
  nextCtx = nextCanvas.getContext('2d');
  
  // DOM要素取得
  scoreEl = document.getElementById('score');
  linesEl = document.getElementById('lines');
  levelEl = document.getElementById('level');
  finalScoreEl = document.getElementById('finalScore');
  startBtn = document.getElementById('startBtn');
  pauseBtn = document.getElementById('pauseBtn');
  restartBtn = document.getElementById('restartBtn');
  gameOverEl = document.getElementById('gameOver');
  
  // イベントリスナー設定
  startBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', togglePause);
  restartBtn.addEventListener('click', restartGame);
  document.addEventListener('keydown', handleKeyPress);
  
  // ボードの初期化
  initBoard();
});

// ==========================================
// ボードの初期化
// ==========================================
function initBoard() {
  board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

// ==========================================
// ゲーム開始
// ==========================================
function startGame() {
  initBoard();
  score = 0;
  lines = 0;
  level = 1;
  isPaused = false;
  isGameOver = false;
  
  updateScore();
  gameOverEl.classList.add('hidden');
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  
  nextPiece = createPiece();
  spawnPiece();
  drawNextPiece();
  
  gameLoop = setInterval(gameStep, 1000 / level);
}

// ==========================================
// ゲームの一時停止/再開
// ==========================================
function togglePause() {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? '再開' : '一時停止';
}

// ==========================================
// ゲーム再開
// ==========================================
function restartGame() {
  clearInterval(gameLoop);
  startGame();
}

// ==========================================
// ランダムなピースを生成
// ==========================================
function createPiece() {
  const types = Object.keys(SHAPES);
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    type: type,
    shape: SHAPES[type],
    color: COLORS[type],
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
    y: 0
  };
}

// ==========================================
// 新しいピースを配置
// ==========================================
function spawnPiece() {
  currentPiece = nextPiece;
  nextPiece = createPiece();
  drawNextPiece();
  
  // ゲームオーバー判定
  if (checkCollision(currentPiece)) {
    gameOver();
  }
}

// ==========================================
// 次のピースを描画
// ==========================================
function drawNextPiece() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = nextPiece.shape;
  const blockSize = 25;
  const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
  const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        drawBlock(nextCtx, offsetX + col * blockSize, offsetY + row * blockSize, blockSize, nextPiece.color);
      }
    }
  }
}

// ==========================================
// ゲームステップ
// ==========================================
function gameStep() {
  if (isPaused || isGameOver) return;
  
  if (!movePiece(0, 1)) {
    placePiece();
    clearLines();
    spawnPiece();
  }
  
  draw();
}

// ==========================================
// ピースの移動
// ==========================================
function movePiece(dx, dy) {
  currentPiece.x += dx;
  currentPiece.y += dy;
  
  if (checkCollision(currentPiece)) {
    currentPiece.x -= dx;
    currentPiece.y -= dy;
    return false;
  }
  return true;
}

// ==========================================
// ピースの回転
// ==========================================
function rotatePiece() {
  const oldShape = currentPiece.shape;
  const newShape = rotateMatrix(oldShape);
  currentPiece.shape = newShape;
  
  if (checkCollision(currentPiece)) {
    currentPiece.shape = oldShape;
  }
}

// ==========================================
// 行列の回転
// ==========================================
function rotateMatrix(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rotated[col][rows - 1 - row] = matrix[row][col];
    }
  }
  return rotated;
}

// ==========================================
// 衝突判定
// ==========================================
function checkCollision(piece) {
  const shape = piece.shape;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = piece.x + col;
        const newY = piece.y + row;
        
        if (newX < 0 || newX >= COLS || newY >= ROWS) {
          return true;
        }
        
        if (newY >= 0 && board[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

// ==========================================
// ピースをボードに配置
// ==========================================
function placePiece() {
  const shape = currentPiece.shape;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const y = currentPiece.y + row;
        const x = currentPiece.x + col;
        if (y >= 0) {
          board[y][x] = currentPiece.color;
        }
      }
    }
  }
}

// ==========================================
// ライン消去
// ==========================================
function clearLines() {
  let linesCleared = 0;
  
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every(cell => cell !== 0)) {
      board.splice(row, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      row++;
    }
  }
  
  if (linesCleared > 0) {
    lines += linesCleared;
    score += linesCleared * 100 * level;
    level = Math.floor(lines / 10) + 1;
    
    clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, 1000 / level);
    
    updateScore();
  }
}

// ==========================================
// スコア表示の更新
// ==========================================
function updateScore() {
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

// ==========================================
// キー入力処理
// ==========================================
function handleKeyPress(e) {
  if (isGameOver || !currentPiece) return;
  
  if (e.key === 'p' || e.key === 'P') {
    togglePause();
    return;
  }
  
  if (isPaused) return;
  
  switch (e.key) {
    case 'ArrowLeft':
      movePiece(-1, 0);
      break;
    case 'ArrowRight':
      movePiece(1, 0);
      break;
    case 'ArrowDown':
      movePiece(0, 1);
      break;
    case 'ArrowUp':
    case ' ':
      rotatePiece();
      break;
  }
  
  draw();
}

// ==========================================
// 描画
// ==========================================
function draw() {
  // ボードをクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 固定されたブロックを描画
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col]) {
        drawBlock(ctx, col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, board[row][col]);
      }
    }
  }
  
  // 現在のピースを描画
  if (currentPiece) {
    const shape = currentPiece.shape;
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const x = (currentPiece.x + col) * BLOCK_SIZE;
          const y = (currentPiece.y + row) * BLOCK_SIZE;
          drawBlock(ctx, x, y, BLOCK_SIZE, currentPiece.color);
        }
      }
    }
  }
  
  // グリッド線を描画
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * BLOCK_SIZE, 0);
    ctx.lineTo(i * BLOCK_SIZE, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i <= ROWS; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * BLOCK_SIZE);
    ctx.lineTo(canvas.width, i * BLOCK_SIZE);
    ctx.stroke();
  }
}

// ==========================================
// ブロックの描画
// ==========================================
function drawBlock(context, x, y, size, color) {
  context.fillStyle = color;
  context.fillRect(x, y, size, size);
  
  // ハイライト
  context.fillStyle = 'rgba(255, 255, 255, 0.3)';
  context.fillRect(x, y, size, size / 5);
  
  // シャドウ
  context.fillStyle = 'rgba(0, 0, 0, 0.3)';
  context.fillRect(x, y + size * 4 / 5, size, size / 5);
  
  // 枠線
  context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  context.lineWidth = 2;
  context.strokeRect(x, y, size, size);
}

// ==========================================
// ゲームオーバー
// ==========================================
function gameOver() {
  isGameOver = true;
  clearInterval(gameLoop);
  finalScoreEl.textContent = score;
  gameOverEl.classList.remove('hidden');
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}