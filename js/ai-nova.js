// ai-nova.js - AI nâng cấp cho CaroNova (ưu tiên tấn công, chặn thông minh)

export function getAIMove(board) {
  const aiSymbol = 'O';
  const playerSymbol = 'X';

  // 1. Thắng ngay nếu có thể
  const winNow = findWinningMove(board, aiSymbol);
  if (winNow) return winNow;

  // 2. Chặn thắng ngay của đối thủ
  const blockWin = findWinningMove(board, playerSymbol);
  if (blockWin) return blockWin;

  // 3. Chặn combo 3 mở đôi nguy hiểm (double threat)
  const threat = findDoubleThreat(board, playerSymbol);
  if (threat) return threat;

  // 4. Tạo chuỗi 4 của mình nếu có
  const attack4 = findLineLength(board, aiSymbol, 4);
  if (attack4) return attack4;

  // 5. Tạo combo 3 mở đôi để ép đối phương
  const attack3 = findDoubleThreat(board, aiSymbol);
  if (attack3) return attack3;

  // 6. Heuristic fallback nếu không có nước rõ ràng
  return findBestHeuristicMove(board, aiSymbol);
}

// =======================================
// ==== PHẦN HỖ TRỢ CHIẾN LƯỢC THÔNG MINH ====
// =======================================

function findWinningMove(board, symbol) {
  const size = board.length;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] !== '') continue;

      board[row][col] = symbol;
      const isWin = evaluateAttack(board, row, col, symbol) >= 1000;
      board[row][col] = '';

      if (isWin) return [row, col];
    }
  }
  return null;
}

function findLineLength(board, symbol, length) {
  const size = board.length;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] !== '') continue;

      const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ];

      for (const [dr, dc] of directions) {
        const count1 = countDirection(board, row, col, dr, dc, symbol);
        const count2 = countDirection(board, row, col, -dr, -dc, symbol);
        const openEnds = countOpenEnds(board, row, col, dr, dc, symbol);

        if (count1 + count2 + 1 >= length && openEnds >= 1) {
          return [row, col];
        }
      }
    }
  }

  return null;
}

function findDoubleThreat(board, symbol) {
  const size = board.length;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] !== '') continue;

      let threatCount = 0;
      const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ];

      for (const [dr, dc] of directions) {
        const count1 = countDirection(board, row, col, dr, dc, symbol);
        const count2 = countDirection(board, row, col, -dr, -dc, symbol);
        const openEnds = countOpenEnds(board, row, col, dr, dc, symbol);

        if (count1 + count2 === 2 && openEnds === 2) {
          threatCount++;
        }
      }

      if (threatCount >= 2) return [row, col];
    }
  }

  return null;
}

function countOpenEnds(board, row, col, dr, dc) {
  let open = 0;

  const r1 = row + dr;
  const c1 = col + dc;
  const r2 = row - dr;
  const c2 = col - dc;

  if (r1 >= 0 && r1 < board.length && c1 >= 0 && c1 < board.length && board[r1][c1] === '') open++;
  if (r2 >= 0 && r2 < board.length && c2 >= 0 && c2 < board.length && board[r2][c2] === '') open++;

  return open;
}

function findBestHeuristicMove(board, symbol) {
  const size = board.length;
  let bestScore = -Infinity;
  let bestMove = null;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] !== '') continue;

      const score =
        evaluateAttack(board, row, col, symbol) +
        evaluateDefense(board, row, col) +
        (isNearExistingMove(board, row, col) ? 15 : 0) +
        (Math.abs(row - size / 2) + Math.abs(col - size / 2) < size / 4 ? 10 : 0);

      if (score > bestScore) {
        bestScore = score;
        bestMove = [row, col];
      }
    }
  }

  return bestMove || [Math.floor(size / 2), Math.floor(size / 2)];
}

function isNearExistingMove(board, row, col) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;

      const r = row + dr;
      const c = col + dc;

      if (r >= 0 && r < board.length && c >= 0 && c < board.length) {
        if (board[r][c] !== '') return true;
      }
    }
  }
  return false;
}

function countDirection(board, row, col, dr, dc, symbol) {
  let count = 0;
  let r = row + dr;
  let c = col + dc;

  while (r >= 0 && r < board.length && c >= 0 && c < board.length && board[r][c] === symbol) {
    count++;
    r += dr;
    c += dc;
  }

  return count;
}

function evaluateAttack(board, row, col, symbol) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  let score = 0;

  for (const [dr, dc] of directions) {
    let count = 1;
    count += countDirection(board, row, col, dr, dc, symbol);
    count += countDirection(board, row, col, -dr, -dc, symbol);

    if (count >= 5) score += 1000;
    else if (count === 4) score += 100;
    else if (count === 3) score += 30;
    else if (count === 2) score += 10;
  }

  return score;
}

function evaluateDefense(board, row, col) {
  return evaluateAttack(board, row, col, 'X') * 0.8;
}
