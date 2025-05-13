// game-online.js
import { updateLevelDisplay } from './level.js';

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import { db } from './firebase.js'; // ✅ ok vì bạn đã export db từ firebase.js

const ROOMS_COLLECTION = 'rooms';
const MAX_ROOMS = 10;

// Tạo mã phòng gồm 4 ký tự (chữ in hoa + số)
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ O, 0, I, 1 các ký tự dễ nhầm
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Tạo phòng mới
export async function createRoom(playerName) {
  setTimeout(() => showTempPopup('🚧 Server quá tải, vui lòng thử lại sau'), 3000);

  const roomsRef = collection(db, ROOMS_COLLECTION);
  const snapshot = await getDocs(roomsRef);
  const currentRooms = snapshot.docs.filter((doc) => !doc.data().isLocked);

  if (currentRooms.length >= MAX_ROOMS) {
    showTempPopup('⚠️ Đã có tối đa 10 phòng đang mở. Vui lòng chờ!');
    return;
  }

  let roomId = '';
  let exists = true;
  while (exists) {
    roomId = generateRoomCode();
    exists = snapshot.docs.some((doc) => doc.id === roomId);
  }

  const newRoom = {
    roomId,
    creatorName: playerName,
    createdAt: serverTimestamp(),
    isLocked: false,
    ready: {
      creator: false, // 👈 tạo sẵn trạng thái ready cho chủ phòng
    },
  };

  await setDoc(doc(db, ROOMS_COLLECTION, roomId), newRoom);
  console.log(`✅ Đã tạo phòng ${roomId}`);

  // Tự xóa nếu sau 2 phút vẫn chưa có người tham gia
  setTimeout(async () => {
    const roomSnap = await getDoc(doc(db, ROOMS_COLLECTION, roomId));
    if (roomSnap.exists()) {
      const data = roomSnap.data();
      if (!data.joinedName) {
        await deleteDoc(doc(db, ROOMS_COLLECTION, roomId));
        console.log(`🗑️ Phòng ${roomId} tự xóa vì không có người tham gia`);
      }
    }
  }, 120000);

  // Chủ phòng vào phòng chờ luôn
  showReadyScreen(newRoom, playerName);
}

// ==========================
// Hệ thống đếm thời gian & kết thúc ván cho Online
// ==========================
let totalTime = 600;
let turnTime = 30;
let totalTimerId = null;
let turnTimerId = null;

function updateTimerUI() {
  const min = String(Math.floor(totalTime / 60)).padStart(2, '0');
  const sec = String(totalTime % 60).padStart(2, '0');
  const timer = document.getElementById('timer-online');
  if (timer) timer.textContent = `⏱️ ${min}:${sec}`;
}

function resetTimers(currentTurn, playerSymbol) {
  clearInterval(turnTimerId);
  clearInterval(totalTimerId);

  let turnRemaining = turnTime;
  const bar = document.getElementById('turn-progress-bar');
  bar.style.width = '100%';
  bar.classList.remove('warning', 'danger');

  totalTimerId = setInterval(() => {
    totalTime--;
    updateTimerUI();
    if (totalTime <= 0) {
      clearInterval(totalTimerId);
      clearInterval(turnTimerId);
      showEndGame('⏱️ Hết giờ!', false);
    }
  }, 1000);

  turnTimerId = setInterval(() => {
    turnRemaining--;
    bar.style.width = `${(turnRemaining / turnTime) * 100}%`;
    bar.classList.remove('warning', 'danger');

    if (turnRemaining <= 10) {
      if (turnRemaining === 10 && typeof window.playSound === 'function') {
        window.playSound('timeout');
      }
      bar.classList.add('danger');
    } else if (turnRemaining <= 20) {
      bar.classList.add('warning');
    }

    if (turnRemaining <= 0) {
      clearInterval(turnTimerId);
      showEndGame('⏱️ Hết lượt!', currentTurn !== playerSymbol);
    }
  }, 1000);
}

function showEndGame(message, isPlayerWin) {
  clearInterval(totalTimerId);
  clearInterval(turnTimerId);

  const overlay = document.createElement('div');
  overlay.className = 'result-overlay';
  if (!isPlayerWin) overlay.classList.add('player-lose');
  overlay.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(overlay);

  if (isPlayerWin) {
    const winCount = Number(localStorage.getItem('playerWins') || 0) + 1;
    localStorage.setItem('playerWins', winCount);
  } else {
    const lossCount = Number(localStorage.getItem('playerLosses') || 0) + 1;
    localStorage.setItem('playerLosses', lossCount);
  }

  updateLevelDisplay(
    Number(localStorage.getItem('playerWins') || 0),
    Number(localStorage.getItem('playerLosses') || 0)
  );

  setTimeout(() => overlay.remove(), 2500);
  document.getElementById('board').style.pointerEvents = 'none';
}

// ✅ GỌI resetTimers trong startOnlineGame khi bắt đầu và mỗi lượt:
// Trong startOnlineGame(...) sau khi khởi tạo board:
// resetTimers(currentTurn, symbol);
// Trong onSnapshot(...) sau khi detect move của đối thủ:
// if (move && move.symbol !== symbol) resetTimers(currentTurn, symbol);

// Hiển thị danh sách phòng
export function showRoomList() {
  // Xóa overlay cũ nếu có
  const old = document.getElementById('room-list-overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'room-list-overlay';
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="overlay-box" style="max-width: 600px; width: 90%; padding: 24px;">
      <h2 style="text-align:center; margin-bottom: 16px;">📋 Danh sách phòng đang mở</h2>
      <div id="room-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;"></div>
      <div style="display:flex; justify-content: space-between; margin-top: 20px;">
        <button id="close-room-list">🔙 Quay lại</button>
        <button id="enter-room-code">🔑 Nhập mã phòng</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('close-room-list').addEventListener('click', () => overlay.remove());

  // Xử lý nhập mã phòng
  document.getElementById('enter-room-code').addEventListener('click', () => {
    const popup = document.createElement('div');
    popup.className = 'overlay';
    popup.id = 'enter-room-overlay';
    popup.innerHTML = `
    <div class="overlay-box" style="text-align:center; max-width:360px;">
      <h3>🔑 Nhập mã phòng</h3>
      <input id="room-code-input" maxlength="4" placeholder="Ví dụ: A1B2" style="text-transform:uppercase; padding:10px; font-size:1.2rem; text-align:center; border-radius:8px; border:none; margin:10px 0;" />
      <div style="margin-top:12px;">
        <button id="confirm-room-code" style="margin-right:10px;">Vào phòng</button>
        <button id="cancel-room-code">Hủy</button>
      </div>
    </div>
  `;
    document.body.appendChild(popup);

    document.getElementById('room-code-input').focus();

    // Xử lý xác nhận mã
    document.getElementById('confirm-room-code').addEventListener('click', () => {
      const code = document.getElementById('room-code-input').value.trim().toUpperCase();
      if (code.length === 4) {
        popup.remove();
        joinRoomByCode(code);
      } else {
        showTempPopup('⚠️ Mã phòng cần đúng 4 ký tự!');
      }
    });

    // Hủy
    document.getElementById('cancel-room-code').addEventListener('click', () => {
      popup.remove();
    });
  });

  const roomsRef = collection(db, ROOMS_COLLECTION);

  onSnapshot(roomsRef, (snapshot) => {
    const grid = document.getElementById('room-grid');
    grid.innerHTML = '';

    const now = Date.now();
    const rooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    let visibleCount = 0;

    for (const room of rooms) {
      if (room.isLocked) continue;

      const created = room.createdAt?.seconds ? room.createdAt.seconds * 1000 : now;
      const elapsed = Math.floor((now - created) / 1000);
      const left = 120 - elapsed;

      if (left <= 0) {
        // 🔁 Tự động xóa phòng nếu quá hạn
        deleteDoc(doc(db, ROOMS_COLLECTION, room.id));
        console.log(`🗑️ Đã xóa phòng ${room.id} hết hạn`);
        continue;
      }

      visibleCount++;

      const item = document.createElement('div');
      item.className = 'room-item';
      item.style = `
        background: #1e1e2e;
        border-radius: 10px;
        padding: 12px;
        color: white;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 0 6px rgba(0,255,255,0.3);
      `;

      const timeId = `time-${room.id}`;
      item.innerHTML = `
        <div><strong>📎 Mã:</strong> ${room.roomId}</div>
        <div><strong>👤 Người tạo:</strong> ${room.creatorName}</div>
        <div><strong>⏳ Còn lại:</strong> <span id="${timeId}">--:--</span></div>
        <button style="padding: 6px 12px; border:none; border-radius:6px; background:#00f0ff; color:black; font-weight:bold; cursor:pointer;">Tham gia</button>
      `;

      item.querySelector('button').addEventListener('click', () => {
        joinRoomByCode(room.roomId);
      });

      grid.appendChild(item);

      // ⏱️ Tự cập nhật thời gian còn lại mỗi giây
      const updateTimer = () => {
        const now = Date.now();
        const remaining = 120 - Math.floor((now - created) / 1000);
        const min = String(Math.floor(remaining / 60)).padStart(2, '0');
        const sec = String(remaining % 60).padStart(2, '0');
        const el = document.getElementById(timeId);
        if (el) el.textContent = `${min}:${sec}`;
      };
      updateTimer();
      const intervalId = setInterval(() => {
        const el = document.getElementById(timeId);
        if (!el) return clearInterval(intervalId);
        updateTimer();
      }, 1000);
    }

    if (visibleCount === 0) {
      grid.innerHTML = `<p style="grid-column: span 2; text-align: center;">Chưa có phòng nào</p>`;
    }
  });
}

// Tham gia phòng bằng mã

export async function joinRoomByCode(roomId) {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    alert('❌ Phòng không tồn tại!');
    return;
  }

  const room = roomSnap.data();

  if (room.isLocked && !room.joinedName) {
    alert('⛔ Phòng đã bị khóa.');
    return;
  }

  const playerName = localStorage.getItem('playerName') || 'Player';

  // 🔧 KHÔNG ghi đè ready.creator
  await updateDoc(roomRef, {
    joinedName: playerName,
    isLocked: true,
    [`ready.joined`]: false, // ✅ chỉ cập nhật joined
  });

  // Lấy dữ liệu mới sau khi cập nhật để tránh dùng bản cũ
  const updatedSnap = await getDoc(roomRef);
  const updatedRoom = updatedSnap.data();

  document.getElementById('room-list-overlay')?.remove();

  showReadyScreen(updatedRoom, playerName);
}

// Giao diện "Sẵn sàng" cho người chơi
function showReadyScreen(roomData, playerName) {
  // Xóa hết nội dung bàn cờ (nếu có)
  document.getElementById('board').innerHTML = '';

  const overlay = document.createElement('div');
  overlay.id = 'ready-overlay';
  overlay.className = 'overlay';
  overlay.style.background = 'rgba(0,0,0,0.75)';
  overlay.innerHTML = `
    <div class="overlay-box" style="text-align: center;">
      <h2>🎮 Phòng: ${roomData.roomId}</h2>
      <p id="player-list">👤 ${roomData.creatorName} vs 👤 ${roomData.joinedName || '--'}</p>
      <button id="ready-btn" style="margin-top: 20px; padding: 10px 24px; font-size: 1.2rem; background:#00f0ff; color:#000; border:none; border-radius:10px; cursor:pointer;">✅ Tôi đã sẵn sàng</button>
      <button id="cancel-room-btn" style="margin-top: 10px; padding: 8px 16px; font-size: 1rem; background:#ff4444; color:#fff; border:none; border-radius:10px; cursor:pointer;">❌ Hủy</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const roomRef = doc(db, ROOMS_COLLECTION, roomData.roomId);
  const role = playerName === roomData.creatorName ? 'creator' : 'joined';

  const readyBtn = document.getElementById('ready-btn');

  // ✅ Cả 2 vai đều bấm được nút "Tôi đã sẵn sàng"
  readyBtn.addEventListener('click', async () => {
    await updateDoc(roomRef, {
      [`ready.${role}`]: true,
    });
    readyBtn.disabled = true;
    readyBtn.textContent = '⏳ Đang chờ người còn lại...';
  });

  // ❌ Hủy: chỉ thoát client, không xóa phòng
  document.getElementById('cancel-room-btn').addEventListener('click', () => {
    // Xóa overlay phòng chờ
    document.getElementById('ready-overlay')?.remove(); // Ẩn overlay khi bấm sẵn sàng
    document.getElementById('game-container').style.display = 'none'; // Ẩn bàn cờ

    // Hiển thị lại danh sách phòng
    showRoomList();
  });

  // Theo dõi thay đổi realtime
  onSnapshot(roomRef, (snapshot) => {
    const data = snapshot.data();

    // Cập nhật tên người tham gia nếu có
    const playerList = document.getElementById('player-list');
    if (playerList && data.joinedName) {
      playerList.innerHTML = `👤 ${data.creatorName} vs 👤 ${data.joinedName}`;
    }

    // Nếu cả 2 đã sẵn sàng, bắt đầu game
    if (data.ready?.creator && data.ready?.joined) {
      document.getElementById('ready-overlay')?.remove();
      startOnlineGame(data, role);
    }
  });
}

// Bắt đầu game online
function startOnlineGame(roomData, role) {
  document.getElementById('game-container').style.display = 'block';
  console.log(`🎮 Vào game online - bạn là ${role}`);
  // Ẩn các overlay còn lại
  document.getElementById('ready-overlay')?.remove();
  document.getElementById('online-menu')?.classList.add('hidden');

  // Ẩn timer AI, hiện timer online
  document.getElementById('timer')?.classList.add('hidden');
  document.getElementById('timer-online')?.classList.remove('hidden');

  // Tạo động turn-indicator
  createTurnIndicator();

  const boardSize = 15;
  const board = Array.from({ length: boardSize }, () => Array(boardSize).fill(''));
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  boardEl.style.display = 'grid';
  boardEl.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
  boardEl.style.gap = '1px';

  // Ẩn nút reset nếu là online
  document.getElementById('reset-btn')?.classList.add('hidden');
  document.getElementById('reset-stats-btn')?.classList.add('hidden');
  document.getElementById('status')?.classList.add('hidden');
  document.getElementById('scoreboard')?.classList.add('hidden');
  document.getElementById('player-losses')?.classList.add('hidden');

  const symbol = role === 'creator' ? 'X' : 'O';
  const opponentSymbol = role === 'creator' ? 'O' : 'X';
  let currentTurn = 'X';

  // Hiển thị tên + avatar 2 bên
  const myName = role === 'creator' ? roomData.creatorName : roomData.joinedName;
  const enemyName = role === 'creator' ? roomData.joinedName : roomData.creatorName;

  document.getElementById('player-left').innerHTML = `
    <img src="images/player.png" class="avatar">
    <div class="info">
      <div>${myName}</div>
      <div>Level 1</div>
    </div>
  `;
  document.getElementById('player-right').innerHTML = `
    <img src="images/player-lumi.png" class="avatar">
    <div class="info">
      <div>${enemyName || '--'}</div>
      <div>Level 1</div>
    </div>
  `;
  const turnSymbol = currentTurn;
  const isYourTurn = currentTurn === symbol;
  document.getElementById('turn-indicator').textContent = `Lượt: ${turnSymbol === 'X' ? '❌' : '⭕'} ${
    isYourTurn ? 'Bạn' : 'Đối thủ'
  }`;

  // Vẽ bàn cờ
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      boardEl.appendChild(cell);
    }
  }

  // Sự kiện click
  boardEl.addEventListener('click', async (e) => {
    const cell = e.target;
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);

    if (!cell.classList.contains('cell') || board[r][c] !== '') return;
    if (currentTurn !== symbol) return;

    board[r][c] = symbol;
    cell.textContent = symbol;
    cell.style.color = symbol === 'X' ? '#ffcc00' : '#00f0ff';

    const roomRef = doc(db, ROOMS_COLLECTION, roomData.roomId);
    await updateDoc(roomRef, {
      lastMove: { r, c, symbol },
      [`moves.${r}_${c}`]: symbol, // ✅ Lưu toàn bộ nước đi
    });

    currentTurn = opponentSymbol;
    document.getElementById('turn-indicator').textContent = `Lượt: ${currentTurn === symbol ? '❌ Bạn' : '⭕ Đối thủ'}`;
    resetTimers(currentTurn, symbol);
  });

  // Hiển thị mã phòng trong giao diện
  const roomIdDisplay = document.getElementById('room-id-display');
  if (roomIdDisplay) {
    roomIdDisplay.textContent = `📎 Mã phòng: ${roomData.roomId}`;
  }

  // Theo dõi realtime từ Firestore
  const roomRef = doc(db, ROOMS_COLLECTION, roomData.roomId);
  onSnapshot(roomRef, (snap) => {
    const data = snap.data();
    const move = data.lastMove;
    if (checkWin(board, move.r, move.c, move.symbol)) {
      const isPlayerWin = move.symbol === symbol;
      const message = isPlayerWin ? '🏆 You win!' : '😿 You lose!';

      const overlay = document.createElement('div');
      overlay.className = 'result-overlay';
      if (!isPlayerWin) overlay.classList.add('player-lose'); // Thêm hiệu ứng thua nếu cần

      overlay.innerHTML = `<span>${message}</span>`;
      document.body.appendChild(overlay);

      setTimeout(() => overlay.remove(), 2500);
      boardEl.style.pointerEvents = 'none';
    }

    // 🔁 Phục hồi toàn bộ moves (khi reload hoặc mới vào)
    if (data.moves) {
      Object.entries(data.moves).forEach(([key, value]) => {
        const [r, c] = key.split('_').map(Number);
        if (board[r][c] === '') {
          board[r][c] = value;
          const index = r * boardSize + c;
          const cell = boardEl.children[index];
          cell.textContent = value;
          cell.style.color = value === 'X' ? '#ffcc00' : '#00f0ff';
        }
      });
    }

    // Cập nhật lượt
    if (move) {
      currentTurn = move.symbol === 'X' ? 'O' : 'X';

      const turnSymbol = currentTurn;
      const isYourTurn = currentTurn === symbol;
      document.getElementById('turn-indicator').textContent = `Lượt: ${turnSymbol === 'X' ? '❌' : '⭕'} ${
        isYourTurn ? 'Bạn' : 'Đối thủ'
      }`;

      resetTimers(currentTurn, symbol);
    }
  });
}

// Check win
function checkWin(board, r, c, symbol) {
  const directions = [
    [0, 1], // ngang →
    [1, 0], // dọc ↓
    [1, 1], // chéo ↘
    [1, -1], // chéo ↙
  ];
  const size = board.length;

  for (const [dr, dc] of directions) {
    let count = 1;
    let cells = [[r, c]];

    // Đi tới
    let nr = r + dr,
      nc = c + dc;
    while (nr >= 0 && nc >= 0 && nr < size && nc < size && board[nr][nc] === symbol) {
      cells.push([nr, nc]);
      nr += dr;
      nc += dc;
      count++;
    }

    // Đi lui
    nr = r - dr;
    nc = c - dc;
    while (nr >= 0 && nc >= 0 && nr < size && nc < size && board[nr][nc] === symbol) {
      cells.unshift([nr, nc]);
      nr -= dr;
      nc -= dc;
      count++;
    }

    if (count >= 5) {
      highlightCells(cells); // Nổi bật ô chiến thắng
      return true;
    }
  }

  return false;
}

// Popup thông báo
function showTempPopup(message = '') {
  const popup = document.createElement('div');
  popup.className = 'overlay-message';
  popup.innerHTML = `
    <div class="overlay-box">
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 2000);
}
// Highlight ô chiến thắng
function highlightCells(cells) {
  const allCells = document.querySelectorAll('#board .cell');
  const boardSize = 15; // hoặc lấy theo board.length nếu bạn muốn linh động

  cells.forEach(([r, c]) => {
    const index = r * boardSize + c;
    allCells[index]?.classList.add('win');
  });
}

// Tạo turn indicator
function createTurnIndicator() {
  // Kiểm tra nếu đã tồn tại, tránh tạo lại
  if (document.getElementById('turn-indicator')) return;

  // Tạo phần tử turn-indicator
  const turnIndicator = document.createElement('div');
  turnIndicator.id = 'turn-indicator';
  turnIndicator.textContent = 'Lượt: ❌ Bạn'; // Nội dung mặc định

  // Thêm vào body
  document.body.appendChild(turnIndicator);
}
