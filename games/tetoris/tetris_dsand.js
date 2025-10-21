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
// $.data: データの状態管理
// ==========================================
_($.data).put({
  board: Array(ROWS).fill(null).map(() => Array(COLS).fill(0)),
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
// 純粋関数：データ処理のみ（描画しない）
// ==========================================

// ボードの初期化
const initBoard = () => 
  Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

// ランダムなピースを生成
const createPiece = () => {
  const types = Object.keys(SHAPES);
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    type: type,
    shape: SHAPES[type],
    color: COLORS[type],
    x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
    y: 0
  };
};

// 行列の回転
const rotateMatrix = (matrix) => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rotated[col][rows - 1 - row] = matrix[row][col];
    }
  }
  return rotated;
};

// 衝突判定
const checkCollision = (piece, board) => {
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
};

// ピースをボードに配置
const placePiece = (piece, board) => {
  const newBoard = board.map(row => [...row]);
  const shape = piece.shape;
  
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const y = piece.y + row;
        const x = piece.x + col;
        if (y >= 0) {
          newBoard[y][x] = piece.color;
        }
      }
    }
  }
  return newBoard;
};

// ライン消去（データのみ）
const clearLines = (board) => {
  let linesCleared = 0;
  const newBoard = [...board];
  
  for (let row = ROWS - 1; row >= 0; row--) {
    if (newBoard[row].every(cell => cell !== 0)) {
      newBoard.splice(row, 1);
      newBoard.unshift(Array(COLS).fill(0));
      linesCleared++;
      row++;
    }
  }
  
  return { board: newBoard, linesCleared };
};

// ゲームステップの処理
const processGameStep = (data) => {
  if (data.isPaused || data.isGameOver) return data;
  
  // ピースを下に移動
  const movedPiece = { ...data.currentPiece, y: data.currentPiece.y + 1 };
  
  // 衝突チェック
  if (checkCollision(movedPiece, data.board)) {
    // 配置
    const newBoard = placePiece(data.currentPiece, data.board);
    
    // ライン消去
    const { board: clearedBoard, linesCleared } = clearLines(newBoard);
    
    // 新しいピース
    const newCurrent = data.nextPiece;
    const newNext = createPiece();
    
    // スコア計算（指数計算：消したライン数の2乗）
    const newLines = data.lines + linesCleared;
    const newScore = data.score + (linesCleared * 10) ** 2;
    const newLevel = Math.floor(newLines / 8) + 1;  // 8ラインごとにレベルUP
    
    // ゲームオーバーチェック
    const isGameOver = checkCollision(newCurrent, clearedBoard);
    
    return {
      ...data,
      board: clearedBoard,
      currentPiece: newCurrent,
      nextPiece: newNext,
      lines: newLines,
      score: newScore,
      level: newLevel,
      isGameOver: isGameOver,
      needsLevelChange: newLevel !== data.level,
      needsRedraw: true
    };
  } else {
    return {
      ...data,
      currentPiece: movedPiece,
      needsRedraw: true
    };
  }
};

// ==========================================
// 描画関数（データを受け取って描画のみ）
// ==========================================

const drawBlock = (ctx, x, y, size, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(x, y, size, size / 5);
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x, y + size * 4 / 5, size, size / 5);
  
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);
};

const drawBoard = (data) => {
  const { ctx, canvas, board, currentPiece } = data;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 固定されたブロック
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col]) {
        drawBlock(ctx, col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, board[row][col]);
      }
    }
  }
  
  // 現在のピース
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
  
  // グリッド
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
};

const drawNextPiece = (data) => {
  const { nextCtx, nextCanvas, nextPiece } = data;
  const shape = nextPiece.shape;
  const color = nextPiece.color;
  
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
};

// ==========================================
// $.role: 演技（データ処理のみ）
// ==========================================
_($.role).put({
  startBtn: {
    click(e) {
      // データ処理のみ
      const newData = {
        ...$.data,
        board: initBoard(),
        score: 0,
        lines: 0,
        level: 1,
        isPaused: false,
        isGameOver: false,
        nextPiece: createPiece()
      };
      
      newData.currentPiece = newData.nextPiece;
      newData.nextPiece = createPiece();
      
      // ゲームループ開始
      if ($.data.gameLoop) clearInterval($.data.gameLoop);
      const loop = setInterval(() => {
        const result = processGameStep($.data);
        _($.data).put(result);
        
        if (result.needsRedraw) {
          drawBoard($.data);
          drawNextPiece($.data);  // NEXTピースも更新
          
          // スコア更新
          if (result.score !== undefined) {
            $.byId('score').now(result.score.toString());
            $.byId('lines').now(result.lines.toString());
            $.byId('level').now(result.level.toString());
          }
        }
        
        if (result.needsLevelChange) {
          clearInterval($.data.gameLoop);
          const newLoop = setInterval(() => {
            const result = processGameStep($.data);
            _($.data).put(result);
            if (result.needsRedraw) {
              drawBoard($.data);
              drawNextPiece($.data);  // NEXTピースも更新
              
              // スコア更新
              if (result.score !== undefined) {
                $.byId('score').now(result.score.toString());
                $.byId('lines').now(result.lines.toString());
                $.byId('level').now(result.level.toString());
              }
            }
            if (result.isGameOver) {
              clearInterval($.data.gameLoop);
              $.byId('finalScore').now($.data.score.toString());
              $.byId('gameOver').css({display: 'block'});
              $.byId('startBtn').set('disabled')(false);
              $.byId('pauseBtn').set('disabled')(true);
            }
          }, 1000 / $.data.level);
          _($.data).put({ gameLoop: newLoop });
        }
        
        if (result.isGameOver) {
          clearInterval($.data.gameLoop);
          $.byId('finalScore').now($.data.score.toString());
          $.byId('gameOver').css({display: 'block'});
          $.byId('startBtn').set('disabled')(false);
          $.byId('pauseBtn').set('disabled')(true);
        }
      }, 1000 / newData.level);
      
      _($.data).put({ ...newData, gameLoop: loop });
      
      return $.data;
    }
  },
  
  pauseBtn: {
    click(e) {
      _($.data).put({ isPaused: !$.data.isPaused });
      return $.data;
    }
  },
  
  restartBtn: {
    click(e) {
      if ($.data.gameLoop) clearInterval($.data.gameLoop);
      return $.data;
    }
  },
  
  gameControl: {
    keydown(e) {
      if ($.data.isGameOver || !$.data.currentPiece) return $.data;
      
      if (e.key === 'p' || e.key === 'P') {
        $.byId('pauseBtn').it.click();
        return $.data;
      }
      
      if ($.data.isPaused) return $.data;
      
      const piece = { ...$.data.currentPiece };
      let moved = false;
      
      switch (e.key) {
        case 'ArrowLeft':
          piece.x -= 1;
          if (!checkCollision(piece, $.data.board)) {
            moved = true;
          }
          break;
        case 'ArrowRight':
          piece.x += 1;
          if (!checkCollision(piece, $.data.board)) {
            moved = true;
          }
          break;
        case 'ArrowDown':
          piece.y += 1;
          if (!checkCollision(piece, $.data.board)) {
            moved = true;
          }
          break;
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          piece.shape = rotateMatrix(piece.shape);
          if (!checkCollision(piece, $.data.board)) {
            moved = true;
          }
          break;
      }
      
      if (moved) {
        _($.data).put({ currentPiece: piece });
        return $.data;
      }
      
      return $.data;
    }
  }
});

// ==========================================
// $.pack: 衣装直し（再描画のみ）
// ==========================================
_($.pack).put({
  startBtn: {
    click(e, data) {
      // 描画のみ
      $.byId('gameOver').css({display: 'none'});
      $.byId('startBtn').set('disabled')(true);
      $.byId('pauseBtn').set('disabled')(false);
      
      $.byId('score').now(data.score.toString());
      $.byId('lines').now(data.lines.toString());
      $.byId('level').now(data.level.toString());
      
      drawBoard(data);
      drawNextPiece(data);
    }
  },
  
  pauseBtn: {
    click(e, data) {
      $.byId('pauseBtn').now(data.isPaused ? '再開' : '一時停止');
    }
  },
  
  restartBtn: {
    click(e, data) {
      // startBtnのclickをトリガー
      $.byId('startBtn').it.click();
    }
  },
  
  gameControl: {
    keydown(e, data) {
      drawBoard(data);
      drawNextPiece(data);  // 念のため
    }
  }
});

// ==========================================
// DOM構築
// ==========================================
$body.class('gameControl').on('keydown').$(
  div.class('game-container').$(
    div.class('game-info').$(
      h1.$('テトリス'),
      
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
      
      div.class('next-piece').$(
        h3.$('Next'),
        canvas.id('nextCanvas').set('width')(120).set('height')(120)
      ),
      
      div.class('controls').$(
        h3.$('操作方法'),
        p.$('← → : 移動'),
        p.$('↓ : 高速落下'),
        p.$('↑ / Space : 回転'),
        p.$('P : 一時停止')
      ),
      
      button.id('startBtn').class('startBtn').on('click').$('スタート'),
      button.id('pauseBtn').class('pauseBtn').set('disabled')(true).on('click').$('一時停止')
    ),
    
    div.class('game-board').$(
      canvas.id('gameCanvas').set('width')(300).set('height')(600),
      
      div.id('gameOver').class('game-over').css({display: 'none'}).$(
        h2.$('ゲームオーバー'),
        p.$('スコア: ', span.id('finalScore').$('0')),
        button.id('restartBtn').class('restartBtn').on('click').$('もう一度')
      )
    )
  )
);

// ==========================================
// 初期化
// ==========================================
_($.data).put({
  canvas: $.byId('gameCanvas').it,
  ctx: $.byId('gameCanvas').it.getContext('2d'),
  nextCanvas: $.byId('nextCanvas').it,
  nextCtx: $.byId('nextCanvas').it.getContext('2d')
});