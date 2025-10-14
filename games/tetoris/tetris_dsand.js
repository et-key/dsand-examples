// ==========================================
// ゲーム設定
// ==========================================
// 【通常版との違い】: 定数定義は同じ
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
// 【通常版との違い】: 定数定義は同じ
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
// 【通常版との違い】:
// - グローバル変数 → $.dataでの一元管理
// - canvas, ctx等はここでは未定義（後で$.dataに格納）
// 通常版: let board = []; let currentPiece = null; など個別の変数
// dsand版: $.dataオブジェクトにまとめる（後述）

// ==========================================
// DOM要素
// ==========================================
// 【通常版との違い】:
// - 通常版: let scoreEl, linesEl等の変数でDOM要素を保持
// - dsand版: $.byId等で必要時に取得、またはDOMを動的構築

// ==========================================
// 初期化
// ==========================================
// 【通常版との違い】:
// - 通常版: window.addEventListener('DOMContentLoaded', ...)
// - dsand版: 直接実行で構築

// dsand版: $.dataでゲーム状態を一元管理
_($.data).put({
  board: [],
  currentPiece: null,
  nextPiece: null,
  score: 0,
  lines: 0,
  level: 1,
  gameLoop: null,
  isPaused: false,
  isGameOver: false,
  canvas: null,
  ctx: null,
  nextCanvas: null,
  nextCtx: null
});

// ==========================================
// ボードの初期化
// ==========================================
// 【通常版との違い】:
// - 通常版: function initBoard() { board = Array(ROWS)... }
// - dsand版: 同じロジックだが、$.dataを更新
function initBoard() {
  _($.data).put({
    board: Array(ROWS).fill(null).map(() => Array(COLS).fill(0))
  });
}

// ==========================================
// ゲーム開始
// ==========================================
// 【通常版との違い】:
// - 通常版: startBtn.disabled = true等の直接操作
// - dsand版: $.roleで処理、$.byIdで要素取得
function startGame() {
  initBoard();
  
  _($.data).put({
    score: 0,
    lines: 0,
    level: 1,
    isPaused: false,
    isGameOver: false
  });
  
  updateScore();
  
  // 【通常版との違い】: DOM操作
  // 通常版: gameOverEl.classList.add('hidden');
  // dsand版: CSSで直接非表示（.class()はトグルなので使わない）
  $.byId('gameOver').css({display: 'none'});
  $.byId('startBtn').set('disabled')(true);
  $.byId('pauseBtn').set('disabled')(false);
  
  _($.data).put({
    nextPiece: createPiece()
  });
  
  spawnPiece();
  drawNextPiece();
  
  const loop = setInterval(gameStep, 1000 / $.data.level);
  _($.data).put({ gameLoop: loop });
}

// ==========================================
// ゲームの一時停止/再開
// ==========================================
// 【通常版との違い】:
// - 通常版: isPaused = !isPaused; pauseBtn.textContent = ...
// - dsand版: $.dataを更新、$()で要素操作
function togglePause() {
  _($.data).put({
    isPaused: !$.data.isPaused
  });
  
  $.byId('pauseBtn').now($.data.isPaused ? '再開' : '一時停止');
}

// ==========================================
// ゲーム再開
// ==========================================
// 【通常版との違い】: ロジックは同じ
function restartGame() {
  clearInterval($.data.gameLoop);
  startGame();
}

// ==========================================
// ランダムなピースを生成
// ==========================================
// 【通常版との違い】: ロジックは完全に同じ
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
// 【通常版との違い】:
// - 通常版: currentPiece = nextPiece; nextPiece = createPiece();
// - dsand版: $.dataを更新
function spawnPiece() {
  _($.data).put({
    currentPiece: $.data.nextPiece,
    nextPiece: createPiece()
  });
  
  drawNextPiece();
  
  // ゲームオーバー判定
  if (checkCollision($.data.currentPiece)) {
    gameOver();
  }
}

// ==========================================
// 次のピースを描画
// ==========================================
// 【通常版との違い】:
// - 通常版: nextCtx.clearRect(...)
// - dsand版: $.data.nextCtxを使用（ロジックは同じ）
function drawNextPiece() {
  const nextCtx = $.data.nextCtx;
  const nextCanvas = $.data.nextCanvas;
  const shape = $.data.nextPiece.shape;
  const color = $.data.nextPiece.color;
  
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  
  const blockSize = 25;
  const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
  const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        drawBlock(nextCtx, offsetX + col * blockSize, offsetY + row * blockSize, blockSize, color);
      }
    }
  }
}

// ==========================================
// ゲームステップ
// ==========================================
// 【通常版との違い】: $.dataから状態を取得
function gameStep() {
  if ($.data.isPaused || $.data.isGameOver) return;
  
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
// 【通常版との違い】:
// - 通常版: currentPiece.x += dx;
// - dsand版: $.data.currentPieceを更新
function movePiece(dx, dy) {
  const piece = $.data.currentPiece;
  piece.x += dx;
  piece.y += dy;
  
  if (checkCollision(piece)) {
    piece.x -= dx;
    piece.y -= dy;
    return false;
  }
  
  _($.data).put({ currentPiece: piece });
  return true;
}

// ==========================================
// ピースの回転
// ==========================================
// 【通常版との違い】: $.dataを使用
function rotatePiece() {
  const piece = $.data.currentPiece;
  const oldShape = piece.shape;
  const newShape = rotateMatrix(oldShape);
  piece.shape = newShape;
  
  if (checkCollision(piece)) {
    piece.shape = oldShape;
  }
  
  _($.data).put({ currentPiece: piece });
}

// ==========================================
// 行列の回転
// ==========================================
// 【通常版との違い】: ロジックは完全に同じ
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
// 【通常版との違い】:
// - 通常版: board[newY][newX]
// - dsand版: $.data.board[newY][newX]
function checkCollision(piece) {
  const shape = piece.shape;
  const board = $.data.board;
  
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
// 【通常版との違い】: $.data.boardを更新
function placePiece() {
  const piece = $.data.currentPiece;
  const shape = piece.shape;
  const board = $.data.board;
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const y = piece.y + row;
        const x = piece.x + col;
        if (y >= 0) {
          board[y][x] = piece.color;
        }
      }
    }
  }
  
  _($.data).put({ board: board });
}

// ==========================================
// ライン消去
// ==========================================
// 【通常版との違い】: $.dataの更新
function clearLines() {
  let linesCleared = 0;
  const board = $.data.board;
  
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every(cell => cell !== 0)) {
      board.splice(row, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      row++;
    }
  }
  
  if (linesCleared > 0) {
    const newLines = $.data.lines + linesCleared;
    const newScore = $.data.score + linesCleared * 100 * $.data.level;
    const newLevel = Math.floor(newLines / 10) + 1;
    
    _($.data).put({
      board: board,
      lines: newLines,
      score: newScore,
      level: newLevel
    });
    
    clearInterval($.data.gameLoop);
    const loop = setInterval(gameStep, 1000 / $.data.level);
    _($.data).put({ gameLoop: loop });
    
    updateScore();
  }
}

// ==========================================
// スコア表示の更新
// ==========================================
// 【通常版との違い】:
// - 通常版: scoreEl.textContent = score;
// - dsand版: $.byId('score').now(...)
function updateScore() {
  $.byId('score').now($.data.score.toString());
  $.byId('lines').now($.data.lines.toString());
  $.byId('level').now($.data.level.toString());
}

// ==========================================
// キー入力処理
// ==========================================
// 【通常版との違い】: $.dataから状態を取得（ロジックは同じ）
function handleKeyPress(e) {
  if ($.data.isGameOver || !$.data.currentPiece) return;
  
  if (e.key === 'p' || e.key === 'P') {
    togglePause();
    return;
  }
  
  if ($.data.isPaused) return;
  
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
// 【通常版との違い】: $.data.ctx等を使用
function draw() {
  const ctx = $.data.ctx;
  const canvas = $.data.canvas;
  const board = $.data.board;
  const currentPiece = $.data.currentPiece;
  
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
// 【通常版との違い】: ロジックは完全に同じ
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
// 【通常版との違い】: $.dataとDOM操作
// - 通常版: gameOverEl.classList.remove('hidden');
// - dsand版: CSSで直接表示（.class()はトグルなので使わない）
function gameOver() {
  _($.data).put({ isGameOver: true });
  clearInterval($.data.gameLoop);
  
  $.byId('finalScore').now($.data.score.toString());
  $.byId('gameOver').css({display: 'block'});
  $.byId('startBtn').set('disabled')(false);
  $.byId('pauseBtn').set('disabled')(true);
}

// ==========================================
// dsand版: $.roleでイベント処理を定義
// ==========================================
// 【通常版との違い】:
// - 通常版: startBtn.addEventListener('click', startGame);
// - dsand版: $.roleでイベント処理を一元管理
_($.role).put({
  startBtn: {
    click(e) {
      startGame();
    }
  },
  pauseBtn: {
    click(e) {
      togglePause();
    }
  },
  restartBtn: {
    click(e) {
      restartGame();
    }
  }
});

// ==========================================
// dsand版: DOMの動的構築
// ==========================================
// 【通常版との違い】:
// - 通常版: HTMLに全て記述
// - dsand版: JavaScriptで動的に構築
$body.$(
  div.class('game-container').$(
    // 左側: ゲーム情報
    div.class('game-info').$(
      h1.$('テトリス'),
      
      // スコアパネル
      div.class('score-panel').$(
        div.class('score-item').$(
          span.class('label').$('スコア:'),
          span.id('score').$('0')
        ),
        div.class('score-item').$(
          span.class('label').$('ライン:'),
          span.id('lines').$('0')
        ),
        div.class('score-item').$(
          span.class('label').$('レベル:'),
          span.id('level').$('1')
        )
      ),
      
      // 次のピース表示
      div.class('next-piece').$(
        h3.$('Next'),
        canvas.id('nextCanvas').set('width')(120).set('height')(120)
      ),
      
      // 操作説明
      div.class('controls').$(
        h3.$('操作方法'),
        p.$('← → : 移動'),
        p.$('↓ : 高速落下'),
        p.$('↑ / Space : 回転'),
        p.$('P : 一時停止')
      ),
      
      // ボタン
      button.id('startBtn').class('startBtn').on('click').$('スタート'),
      button.id('pauseBtn').class('pauseBtn').set('disabled')(true).on('click').$('一時停止')
    ),
    
    // 右側: ゲームボード
    div.class('game-board').$(
      canvas.id('gameCanvas').set('width')(300).set('height')(600),
      
      // ゲームオーバー画面（初期状態は非表示）
      div.id('gameOver').class('game-over').css({display: 'none'}).$(
        h2.$('ゲームオーバー'),
        p.$(
          'スコア: ',
          span.id('finalScore').$('0')
        ),
        button.id('restartBtn').class('restartBtn').on('click').$('もう一度')
      )
    )
  )
);

// ==========================================
// 初期化処理（DOMContentLoaded相当）
// ==========================================
// 【通常版との違い】:
// - 通常版: window.addEventListener('DOMContentLoaded', ...)
// - dsand版: DOM構築後に直接実行
_($.data).put({
  canvas: $.byId('gameCanvas').it,
  ctx: $.byId('gameCanvas').it.getContext('2d'),
  nextCanvas: $.byId('nextCanvas').it,
  nextCtx: $.byId('nextCanvas').it.getContext('2d')
});

// キーボードイベントの登録
// 【通常版との違い】: 同じだが、$.dataを参照
document.addEventListener('keydown', handleKeyPress);

// ボードの初期化
initBoard();