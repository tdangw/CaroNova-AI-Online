import '../js/game.js';
import { setCurrentAIName } from './novaReaction.js';
import { playSound } from './soundManager.js';
import { createRoom, showRoomList } from './game-online.js';

let selectedAI = 'basic'; /* AI mặc định là Meow */

const aiCards = document.querySelectorAll('.ai-card');
const nextBtn = document.getElementById('next-to-name-btn');
const nameOverlay = document.getElementById('name-input-overlay');
const confirmBtn = document.getElementById('confirm-name-btn');
const playerNameInput = document.getElementById('player-name-input');
const aiMenu = document.getElementById('ai-menu');
const gameContainer = document.getElementById('game-container');

// Tự động điền tên gần nhất đã dùng
function autoFillLastUsedName() {
  const lastName = localStorage.getItem('playerName');
  if (lastName) {
    playerNameInput.value = lastName;
  }
}

// Chọn AI
aiCards.forEach((card) => {
  card.addEventListener('click', () => {
    aiCards.forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedAI = card.dataset.ai;
    playSound('select'); // 🔊 phát âm thanh chọn AI

    console.log('[DEBUG] AI đang chọn:', selectedAI);
  });
});

// Tiếp theo → sang nhập tên
nextBtn.addEventListener('click', () => {
  playSound('selectButton'); // 🔊 phát âm thanh chọn nút
  aiMenu.style.display = 'none';
  nameOverlay.style.display = 'flex';
  autoFillLastUsedName();
});

// Bắt đầu game
confirmBtn.addEventListener('click', async () => {
  playSound('gameStart'); // 🔊 Phát nhạc bắt đầu
  nameOverlay.classList.add('fade-out'); // Thêm hiệu ứng mờ dần

  setTimeout(async () => {
    nameOverlay.style.display = 'none';
    gameContainer.style.display = 'block';

    let name = playerNameInput.value.trim();
    if (!name) name = 'Player';

    const selectedCard = document.querySelector('.ai-card.selected');
    const aiName = selectedCard.dataset.name;
    const aiAvatar = selectedCard.dataset.avatar;

    localStorage.setItem('playerName', name);
    localStorage.setItem('selectedAI', selectedAI);
    localStorage.setItem('aiName', aiName);
    localStorage.setItem('aiAvatar', aiAvatar);

    // Gọi AI tương ứng
    let aiModulePath;
    switch (selectedAI) {
      case 'nova':
        aiModulePath = './ai-nova.js';
        break;
      case 'zeta':
        aiModulePath = './ai-zeta.js';
        break;
      case 'lumi':
        aiModulePath = './ai-lumi.js';
        break;
      case 'aera':
        aiModulePath = './ai-aera.js';
        break;
      case 'kael':
        aiModulePath = './ai-kael.js';
        break;
      case 'sira':
        aiModulePath = './ai-sira.js';
        break;
      case 'elos':
        aiModulePath = './ai-elos.js';
        break;
      case 'nira':
        aiModulePath = './ai-nira.js';
        break;
      case 'online':
        showOnlineMenu(); // xử lý online riêng nếu có
        return; // không cần load AI local
      default:
        aiModulePath = './ai.js'; // basic: Meow
    }

    const mod = await import(aiModulePath);
    window.getAIMove = mod.getAIMove;
    // Gọi hàm khởi tạo AI nếu có

    setCurrentAIName(selectedAI);

    updatePlayerInfo(name, aiName, aiAvatar);
    window.createBoard();

    window.playPlaceSound = () => playSound('place'); // 🔊 Phát âm thanh khi đặt quân
  }, 2000);
});

function updatePlayerInfo(playerName, aiName, aiAvatar) {
  const leftInfo = document.createElement('div');
  leftInfo.className = 'player-info player';
  leftInfo.innerHTML = `
    <img src="assets/avatars/player.png" class="avatar" id="player-avatar" />
    <div class="player-reaction-box" id="player-reaction-box"></div>
    <div class="player-name">${playerName}<br><span id="player-level">Level 1</span></div>
  `;

  const rightInfo = document.createElement('div');
  rightInfo.className = 'player-info ai';
  rightInfo.innerHTML = `
    <img src="${aiAvatar}" class="avatar" id="ai-avatar" />
    <div class="player-name">${aiName}<br><span id="ai-level">Level 1</span></div>
  `;

  const timer = document.getElementById('timer');
  const wrapper = timer.parentElement;
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'space-between';
  wrapper.style.gap = '10px';
  wrapper.prepend(leftInfo);
  wrapper.append(rightInfo);
}
/* Thử nghiệm giọng nói AI */
let isVoiceEnabled = false;

window.isVoiceEnabled = false; // Để các file khác có thể truy cập

const voiceIcon = document.createElement('div');
voiceIcon.id = 'voice-toggle-icon';
voiceIcon.className = 'tooltip';
voiceIcon.dataset.tooltip = 'Bật/Tắt giọng nói AI (AI sẽ phản hồi bằng lời nói nếu bật)';
voiceIcon.innerText = '🎤';
document.body.appendChild(voiceIcon);

voiceIcon.addEventListener('click', () => {
  isVoiceEnabled = !isVoiceEnabled;
  window.isVoiceEnabled = isVoiceEnabled; // ✅ cập nhật biến toàn cục
  voiceIcon.classList.toggle('active', isVoiceEnabled);
  if (!isVoiceEnabled) window.speechSynthesis.cancel();
});

// Xử lý lật card bằng click
document.querySelectorAll('.ai-card').forEach((card) => {
  card.addEventListener('click', () => {
    // Toggle class 'flipped' khi click
    card.classList.toggle('flipped');
  });
});
/*
// Thông báo cho chế độ online - tạm thời không có AI
function showOnlineRoomOverlay() {
  // Xóa overlay cũ nếu có
  const old = document.getElementById('online-overlay');
  if (old) old.remove();

  // Tạo overlay
  const overlay = document.createElement('div');
  overlay.id = 'online-overlay';
  overlay.className = 'overlay-message';
  overlay.innerHTML = `
    <div class="overlay-box">
      <h2>🔧 Chế độ Online đang được phát triển!</h2>
      <p>Vui lòng quay lại sau để trải nghiệm phiên bản hoàn chỉnh.</p>
      <button id="back-to-menu">Quay về Menu</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Nút quay về
  document.getElementById('back-to-menu').addEventListener('click', () => {
    location.reload(); // Tải lại toàn bộ trang
  });
}
*/

// Online menu //
function showOnlineMenu() {
  document.getElementById('name-input-overlay').style.display = 'none';
  document.getElementById('game-container').style.display = 'none'; // 👈 Ẩn bàn cờ
  document.getElementById('online-menu').classList.remove('hidden');
}

document.getElementById('create-room-btn')?.addEventListener('click', () => {
  playSound('select');
  const name = localStorage.getItem('playerName') || 'Player';
  createRoom(name); // ✅ Gọi hàm tạo phòng
});

document.getElementById('join-room-btn')?.addEventListener('click', () => {
  playSound('select');
  showRoomList(); // ✅ Gọi hàm hiển thị danh sách phòng
});

document.getElementById('cancel-online-btn')?.addEventListener('click', () => {
  playSound('select');
  location.reload(); // Quay về từ đầu
});
