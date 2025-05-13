// ai-zeta.js
// AI Zeta: Ưu tiên tấn công, nhưng vẫn đủ thông minh để chặn các đường nguy hiểm

// Hàm lấy nước đi của AI Zeta
export function getAIMove(board) {
  const size = board.length;
  let bestMove = null;
  let bestScore = -Infinity;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] !== '') continue;

      // 1. Kiểm tra nước đi thắng ngay lập tức
      if (isWinningMove(board, row, col, 'O')) {
        return [row, col]; // Ưu tiên đánh thắng ngay
      }

      // 2. Kiểm tra nước đi chặn đối thủ thắng ngay lập tức
      if (isWinningMove(board, row, col, 'X')) {
        return [row, col]; // Ưu tiên chặn đối thủ thắng
      }

      // 3. Kiểm tra nước đi nối các đường 3-4 để thắng
      const potentialWin = evaluatePotentialWin(board, row, col, 'O');
      if (potentialWin > 0) {
        return [row, col]; // Ưu tiên nước đi dẫn đến chiến thắng nhanh hơn
      }

      // 4. Kiểm tra nước đi chặn các đường nguy hiểm của đối thủ
      const threatLevel = isThreatMove(board, row, col, 'X');
      if (threatLevel > 0) {
        return [row, col]; // Ưu tiên chặn nước đi nguy hiểm
      }

      // 5. Nếu không có nguy hiểm, tính điểm tấn công/phòng thủ
      const attackScore = evaluate(board, row, col, 'O') * 2.0; // Tăng trọng số tấn công
      const defendScore = evaluate(board, row, col, 'X') * 1.5; // Tăng trọng số phòng thủ
      const nearBonus = isNearExistingMove(board, row, col) ? 10 : 0; // Tăng trọng số gần quân cờ
      const centerBonus = Math.abs(row - size / 2) + Math.abs(col - size / 2) < size / 4 ? 10 : 0; // Ưu tiên trung tâm

      // Giảm điểm nếu nước đi gần tường, nhưng chỉ áp dụng nếu không phải nước đi thắng hoặc chặn thắng
      const wallPenalty = row <= 1 || row >= size - 2 || col <= 1 || col >= size - 2 ? -15 : 0;

      // Kiểm tra xem nước đi có thể nối được bước tiếp theo không
      const followUpBonus = canExtendMove(board, row, col, 'O') ? 10 : -10; // Tăng điểm nếu có thể nối tiếp

      const total = attackScore + defendScore + nearBonus + centerBonus + wallPenalty + followUpBonus;

      if (total > bestScore) {
        bestScore = total;
        bestMove = [row, col];
      }
    }
  }

  return bestMove || [Math.floor(size / 2), Math.floor(size / 2)];
}

// Hàm kiểm tra nước đi thắng ngay lập tức
function isWinningMove(board, row, col, symbol) {
  board[row][col] = symbol; // Tạm thời đặt quân cờ
  const isWin = evaluate(board, row, col, symbol) >= 25; // 5 quân liên tiếp
  board[row][col] = ''; // Hoàn tác nước đi
  return isWin;
}

// Ưu tiên ô gần quân cờ đã đánh
function isNearExistingMove(board, row, col) {
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r === row && c === col) continue;
      if (r >= 0 && r < board.length && c >= 0 && c < board.length) {
        if (board[r][c] !== '') return true;
      }
    }
  }
  return false;
}

// Kiểm tra xem nước đi có thể nối được bước tiếp theo không
function canExtendMove(board, row, col, symbol) {
  const directions = [
    [0, 1], // Horizontal
    [1, 0], // Vertical
    [1, 1], // Diagonal (top-left to bottom-right)
    [1, -1], // Diagonal (top-right to bottom-left)
  ];

  for (const [dr, dc] of directions) {
    const count1 = countDirection(board, row, col, dr, dc, symbol);
    const count2 = countDirection(board, row, col, -dr, -dc, symbol);

    // Nếu có ít nhất 2 quân liên tiếp và còn ô trống để nối tiếp
    if (count1 + count2 >= 2 && (isOpenEnd(board, row, col, dr, dc) || isOpenEnd(board, row, col, -dr, -dc))) {
      return true;
    }
  }

  return false;
}

// Tính điểm dựa vào chuỗi cờ liên tục theo các hướng
function evaluate(board, row, col, symbol) {
  return evaluateAttack(board, row, col, symbol) + evaluateDefense(board, row, col, symbol);
}

// Hàm kiểm tra ô trống ở cuối chuỗi
function isOpenEnd(board, row, col, dr, dc) {
  const r = row + dr;
  const c = col + dc;
  return r >= 0 && c >= 0 && r < board.length && c < board.length && board[r][c] === '';
}

function countDirection(board, row, col, dr, dc, symbol) {
  let count = 0;
  for (let i = 1; i < 5; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || c < 0 || r >= board.length || c >= board.length) break;
    if (board[r][c] === symbol) count++;
    else break;
  }
  return count;
}

function evaluateAttack(board, row, col, symbol) {
  const directions = [
    [0, 1], // Horizontal
    [1, 0], // Vertical
    [1, 1], // Diagonal (top-left to bottom-right)
    [1, -1], // Diagonal (top-right to bottom-left)
  ];
  let score = 0;

  for (const [dr, dc] of directions) {
    let count = 1;
    let openEnds = 0;

    // Đếm số quân liên tiếp theo hướng chính
    count += countDirection(board, row, col, dr, dc, symbol);
    // Đếm số quân liên tiếp theo hướng ngược lại
    count += countDirection(board, row, col, -dr, -dc, symbol);

    // Kiểm tra các ô trống ở hai đầu chuỗi
    if (isOpenEnd(board, row, col, dr, dc)) openEnds++;
    if (isOpenEnd(board, row, col, -dr, -dc)) openEnds++;

    // Tăng điểm dựa trên độ dài chuỗi và số ô trống xung quanh
    if (count >= 5) {
      score += 1000; // Ưu tiên thắng ngay
    } else if (count === 4 && openEnds > 0) {
      score += 800; // Ưu tiên tạo chuỗi 4 quân mở
    } else if (count === 3 && openEnds > 1) {
      score += 400; // Ưu tiên tạo chuỗi 3 quân mở
    } else if (count === 2 && openEnds > 1) {
      score += 150; // Ưu tiên tạo chuỗi 2 quân mở
    }
  }

  return score;
}

function evaluateDefense(board, row, col, symbol) {
  const opponent = symbol === 'O' ? 'X' : 'O';
  return evaluateAttack(board, row, col, opponent); // Phòng thủ dựa trên chiến lược tấn công của đối thủ
}

function isThreatMove(board, row, col, symbol) {
  const directions = [
    [0, 1], // Horizontal
    [1, 0], // Vertical
    [1, 1], // Diagonal (top-left to bottom-right)
    [1, -1], // Diagonal (top-right to bottom-left)
  ];

  let maxThreatLevel = 0;

  for (const [dr, dc] of directions) {
    const count1 = countDirection(board, row, col, dr, dc, symbol);
    const count2 = countDirection(board, row, col, -dr, -dc, symbol);

    // Tính số ô trống ở hai đầu chuỗi
    const openEnds = (isOpenEnd(board, row, col, dr, dc) ? 1 : 0) + (isOpenEnd(board, row, col, -dr, -dc) ? 1 : 0);

    // Đánh giá mức độ nguy hiểm
    const threatLevel = count1 + count2; // Tổng số quân liên tiếp
    if (threatLevel === 4 && openEnds > 0) {
      return 4; // Đường 4 quân nguy hiểm
    } else if (threatLevel === 3 && openEnds > 0) {
      maxThreatLevel = Math.max(maxThreatLevel, 3); // Đường 3 quân nguy hiểm
    }
  }

  return maxThreatLevel; // Trả về mức độ nguy hiểm cao nhất
}

function evaluatePotentialWin(board, row, col, symbol) {
  const directions = [
    [0, 1], // Horizontal
    [1, 0], // Vertical
    [1, 1], // Diagonal (top-left to bottom-right)
    [1, -1], // Diagonal (top-right to bottom-left)
  ];

  for (const [dr, dc] of directions) {
    const count1 = countDirection(board, row, col, dr, dc, symbol);
    const count2 = countDirection(board, row, col, -dr, -dc, symbol);

    // Nếu tổng số quân liên tiếp >= 4, nước đi này có thể dẫn đến chiến thắng
    if (count1 + count2 >= 4) {
      return 1; // Ưu tiên nước đi này
    }
  }

  return 0; // Không có nước đi tiềm năng dẫn đến chiến thắng
}
