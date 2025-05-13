// 📁 js/ai-nira.js
// AI nira: phiên bản cơ bản

export function getAIMove(board) {
  return getRandomEmptyCell(board);
}

function getRandomEmptyCell(board) {
  const emptyCells = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] === '') emptyCells.push([row, col]);
    }
  }
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}
