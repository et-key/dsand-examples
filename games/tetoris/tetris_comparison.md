# テトリス - 通常版とdsand版の比較

## 📋 主な違いの一覧

### 1. 状態管理

| 通常版 | dsand版 |
|--------|---------|
| `let board = [];`<br>`let score = 0;`<br>`let isPaused = false;` | `_($.data).put({`<br>`  board: [],`<br>`  score: 0,`<br>`  isPaused: false`<br>`});` |
| 個別のグローバル変数 | `$.data`に一元管理 |

### 2. DOM要素の取得・作成

| 通常版 | dsand版 |
|--------|---------|
| **HTML**: `<div id="score">0</div>` | **JS**: `div.id('score').$('0')` |
| **JS**: `let scoreEl = document.getElementById('score');` | **JS**: `$.byId('score')` |
| HTMLに記述、JSで取得 | JSで動的に構築 |

### 3. DOM操作

| 通常版 | dsand版 |
|--------|---------|
| `scoreEl.textContent = score;` | `$.byId('score').now(score);` |
| `element.classList.add('hidden');` | `element.class('hidden');` |
| `element.disabled = true;` | `element.set('disabled')(true);` |
| プロパティ直接変更 | メソッドチェーン |

### 4. イベントリスナー

| 通常版 | dsand版 |
|--------|---------|
| `startBtn.addEventListener('click', startGame);` | `_($.role).put({`<br>`  startBtn: {`<br>`    click(e) { startGame(); }`<br>`  }`<br>`});` |
| 個別に登録 | `$.role`で一元管理 |

### 5. Canvas操作

| 通常版 | dsand版 |
|--------|---------|
| `canvas = document.getElementById('gameCanvas');`<br>`ctx = canvas.getContext('2d');` | `$.data.canvas = $.byId('gameCanvas').it;`<br>`$.data.ctx = $.data.canvas.getContext('2d');` |
| 同じ（Canvas APIはそのまま使用） | 同じ（Canvas APIはそのまま使用） |

## 🔍 コードの対応関係

### 例1: スコア更新

**通常版:**
```javascript
// 変数定義
let score = 0;
let scoreEl;

// 初期化
scoreEl = document.getElementById('score');

// 更新
score = 100;
scoreEl.textContent = score;
```

**dsand版:**
```javascript
// 状態定義
_($.data).put({ score: 0 });

// 更新
_($.data).put({ score: 100 });
$.byId('score').now($.data.score.toString());
```

### 例2: ボタンのクリックイベント

**通常版:**
```javascript
// HTML
<button id="startBtn">スタート</button>

// JavaScript
const startBtn = document.getElementById('startBtn');
startBtn.addEventListener('click', () => {
  startGame();
});
```

**dsand版:**
```javascript
// JavaScript（DOM構築）
button.id('startBtn').class('startBtn').on('click').$('スタート')

// JavaScript（イベント処理）
_($.role).put({
  startBtn: {
    click(e) {
      startGame();
    }
  }
});
```

### 例3: クラスの追加・削除

**通常版:**
```javascript
gameOverEl.classList.add('hidden');    // 非表示
gameOverEl.classList.remove('hidden'); // 表示
```

**dsand版:**
```javascript
$.byId('gameOver').class('hidden');  // トグル（追加/削除）
```

## 💡 dsandの特徴

### メリット

1. **状態の一元管理**: `$.data`で全ての状態を管理
2. **宣言的なDOM構築**: HTMLを書かずにJSで完結
3. **メソッドチェーン**: 読みやすいコード
4. **イベント処理の分離**: `$.role`で処理ロジックを集約

### デメリット/注意点

1. **学習コスト**: dsand独自の記法を学ぶ必要がある
2. **デバッグ**: ブラウザの開発ツールでHTMLを見ると動的生成されている
3. **パフォーマンス**: 大規模アプリでは考慮が必要
4. **Canvas操作**: 結局Canvas APIは直接使うので、dsandの恩恵は少ない

## 📝 ファイル構成の違い

### 通常版
```
tetris_javascript.html       ← DOM構造を記述
tetris.css                   ← スタイル
tetris_javascript.js         ← ロジック + DOM操作
```

### dsand版
```
tetris_dsand.html  ← ほぼ空（ライブラリ読込のみ）
tetris.css         ← スタイル（共通）
tetris_dsand.js    ← DOM構築 + ロジック + イベント処理
```

## 🎯 学習のポイント

1. **同じセクションを見比べる**: コメントが対応しているので、該当箇所を探しやすい
2. **$.dataの使い方**: 状態管理の中心概念
3. **$()ラッパー**: DOM要素を扱う基本
4. **メソッドチェーン**: `.id().class().on()` のような連続呼び出し
5. **$.role**: イベント処理のパターン
