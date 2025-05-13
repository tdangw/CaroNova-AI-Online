const sounds = {
  gameStart: new Audio('assets/sound/gamestart.mp3'),
  place: new Audio('assets/sound/place.mp3'),
  win: new Audio('assets/sound/win.mp3'),
  lose: new Audio('assets/sound/lose.mp3'),
  timeout: new Audio('assets/sound/timeout.mp3'),
  levelup: new Audio('assets/sound/levelup.mp3'),
  select: new Audio('assets/sound/selectcard.mp3'),
  selectButton: new Audio('assets/sound/select.mp3'),
};

Object.values(sounds).forEach((audio) => {
  audio.preload = 'auto';
  audio.load();
});

let suppressOtherSounds = false;

/**
 * Phát âm thanh theo tên. Nếu đang phát levelup thì các âm khác bị chặn.
 * @param {string} name
 */
export function playSound(name) {
  // Nếu đang suppress, chỉ cho phép levelup
  if (suppressOtherSounds && name !== 'levelup') return;

  const sound = sounds[name];
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {});

    // Khi phát levelup → chặn các âm khác trong 2.5 giây
    if (name === 'levelup') {
      suppressOtherSounds = true;
      setTimeout(() => {
        suppressOtherSounds = false;
      }, 3000); // thời lượng âm thanh levelup
    }
  }
}
