// ai.js
// Hàm lấy nước đi của AI cơ bản

export function getAIMove(board) {
  const boardSize = board.length;
  let bestScore = -Infinity;
  let bestMove = null;

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] !== '') continue;

      const score =
        evaluatePoint(board, row, col, 'O') + // điểm tấn công
        evaluatePoint(board, row, col, 'X') * 0.8 + // điểm phòng thủ
        proximityBonus(board, row, col); // điểm gần quân

      if (score > bestScore) {
        bestScore = score;
        bestMove = [row, col];
      }
    }
  }

  return bestMove || getRandomMove(board);
}

// Hàm đánh giá điểm tấn công hoặc phòng thủ
function evaluatePoint(board, row, col, player) {
  let score = 0;
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (const [dRow, dCol] of directions) {
    let count = 1;
    let forward = countSame(board, row, col, dRow, dCol, player);
    let backward = countSame(board, row, col, -dRow, -dCol, player);
    count += forward + backward;

    if (count >= 5) score += 1000; // thắng ngay
    else if (count === 4) score += 500;
    else if (count === 3) score += 200;
    else if (count === 2) score += 50;
  }

  return score;
}

// Đếm số lượng quân giống nhau theo 1 hướng
function countSame(board, row, col, dRow, dCol, player) {
  let count = 0;
  let r = row + dRow;
  let c = col + dCol;

  while (inBounds(r, c, board) && board[r][c] === player && count < 4) {
    count++;
    r += dRow;
    c += dCol;
  }

  return count;
}

// Ưu tiên ô gần vùng đã có quân
function proximityBonus(board, row, col) {
  const dirs = [-1, 0, 1];
  for (let dx of dirs) {
    for (let dy of dirs) {
      if (dx === 0 && dy === 0) continue;
      const r = row + dx;
      const c = col + dy;
      if (inBounds(r, c, board) && board[r][c] !== '') {
        return 10;
      }
    }
  }
  return 0;
}

// Nếu không có nước tốt thì random
function getRandomMove(board) {
  const emptyCells = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] === '') emptyCells.push([row, col]);
    }
  }

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
}

function inBounds(row, col, board) {
  return row >= 0 && row < board.length && col >= 0 && col < board.length;
}
