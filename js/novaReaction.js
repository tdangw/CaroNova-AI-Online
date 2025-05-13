// novaReaction.js - Phản ứng AI & người chơi linh hoạt

let currentAIName = 'nova'; // AI mặc định

export function setCurrentAIName(name) {
  currentAIName = name.toLowerCase();
}

// Tên các AI + player để thay thế trong câu
const aiNames = {
  basic: 'Meow',
  nova: 'Nova',
  zeta: 'Zeta',
  lumi: 'Lumi',
  aera: 'Aera',
  kael: 'Kael',
  sira: 'Sira',
  elos: 'Elos',
  nira: 'Nira',
  online: 'Người chơi khác',
  player: 'Player',
};

// Danh sách phản ứng chung (sử dụng từ khóa)
const commonAIReactions = [
  '{AI} bật chế độ toàn lực rồi đó ⚡',
  '{AI} đang phân tích nước của {other} 🧠',
  '{AI} nghĩ {player} cần học hỏi thêm từ {meow} 😼',
  'Nếu là {nova} chắc chưa chắc làm được như {AI} đâu 😏',
  '{AI} sẽ không thua kiểu như {other} đâu nha 😎',
  '{AI} cảm thấy {zeta} có thể học hỏi từ nước này 😇',
  '{AI} thấy {other} đang run kìa 😅',
  '{AI} không đùa đâu, kể cả với {player} hay {nira} 😈',
  '{other} mà thấy nước này chắc bỏ cuộc sớm luôn 😤',
  '{AI} tặng {player} một cú troll nhẹ nè 🤭',
  '{AI} lấy cảm hứng từ {kael} để đi nước này đó 📊',
  'Ủa, nước này {AI} học từ {sira} á 😅',
  '{AI} tính toán chuẩn từng pixel luôn 💻',
  '{other} vừa bị outplay bởi {AI} 🧠',
  '{AI} không cần may mắn, chỉ cần thuật toán 🔁',
  '{AI} chặn trước cả {player} lẫn {meow} luôn 😆',
];

// Phản ứng từ người chơi
const playerReactions = [
  'Hy vọng đi đúng... 😬',
  'Chơi đẹp nha! 😁',
  'Bạn sợ chưa? 😏',
  'Tính cả rồi nha 😎',
  'Tới lượt mình! 🚀',
  'Làm liều thôi 😅',
  'Lần này phải thắng! 🧠',
  'Đừng giận nha 😆',
];
// Tạo phản ứng cho AI
export function reactToAIMove(board, move, symbol) {
  const [row, col] = move;
  if (Math.random() < 0.6) {
    const template = commonAIReactions[Math.floor(Math.random() * commonAIReactions.length)];
    const message = renderReaction(template, currentAIName);
    triggerReaction('ai', message);
    if (window.isVoiceEnabled) speakAI(message);
  }
}

// Tạo phản ứng cho người chơi
export function reactToPlayerMove(board, move, symbol) {
  if (Math.random() < 0.4) {
    const message = playerReactions[Math.floor(Math.random() * playerReactions.length)];
    const box = document.getElementById('player-reaction-box');
    if (box) {
      box.textContent = message;
      box.classList.add('show');
      setTimeout(() => {
        box.classList.remove('show');
        box.textContent = '';
      }, 3500);
    }
  }
}

// Hàm thay thế từ khóa trong câu phản ứng
function renderReaction(template, currentAIKey) {
  const aiName = aiNames[currentAIKey] || 'AI';
  const others = Object.keys(aiNames).filter((k) => k !== currentAIKey && k !== 'online');
  others.push('player');
  const otherKey = others[Math.floor(Math.random() * others.length)];
  const otherName = aiNames[otherKey] || 'đối thủ';

  return template
    .replace(/{AI}/g, aiName)
    .replace(/{other}/g, otherName)
    .replace(/{player}/gi, aiNames['player'])
    .replace(/{meow}/gi, aiNames['basic'])
    .replace(/{nova}/gi, aiNames['nova'])
    .replace(/{zeta}/gi, aiNames['zeta'])
    .replace(/{lumi}/gi, aiNames['lumi'])
    .replace(/{aera}/gi, aiNames['aera'])
    .replace(/{kael}/gi, aiNames['kael'])
    .replace(/{sira}/gi, aiNames['sira'])
    .replace(/{elos}/gi, aiNames['elos'])
    .replace(/{nira}/gi, aiNames['nira']);
}

// Hiển thị bong bóng phản ứng
function triggerReaction(who, message) {
  const avatarId = who === 'ai' ? 'ai-avatar' : 'player-avatar';
  const avatar = document.getElementById(avatarId);
  if (!avatar) return;

  const bubble = document.createElement('div');
  bubble.className = 'reaction-bubble';
  bubble.textContent = message;

  const container = avatar.parentElement;
  container.style.position = 'relative';
  bubble.style.left = '150%';
  bubble.style.bottom = '2px';

  container.appendChild(bubble);
  setTimeout(() => {
    bubble.style.opacity = '0';
    setTimeout(() => bubble.remove(), 300);
  }, 3500);
}

// Voice AI
function speakAI(text) {
  if (!window.speechSynthesis || !window.isVoiceEnabled) return;
  const clean = text.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  if (!clean) return;

  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = 'vi-VN';
  utter.pitch = 1.3;
  utter.rate = 1.05;
  utter.volume = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

// Log giọng
speechSynthesis.getVoices().forEach((v, i) => {
  console.log(`${i}: ${v.name} [${v.lang}]`);
});
