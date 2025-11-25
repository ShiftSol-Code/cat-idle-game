// Audio System

// Sound Pool for overlapping sounds
export class SoundPool {
  constructor(src, size = 5) {
    this.pool = [];
    this.index = 0;
    this.muted = false;
    for (let i = 0; i < size; i++) {
      this.pool.push(new Audio(src));
    }
  }

  play() {
    if (this.muted) return;
    const sound = this.pool[this.index];
    sound.currentTime = 0;
    sound.play().catch(e => console.warn('Audio play failed:', e));
    this.index = (this.index + 1) % this.pool.length;
  }

  setVolume(volume) {
    this.pool.forEach(sound => {
      sound.volume = volume;
    });
  }

  setMuted(muted) {
    this.muted = muted;
  }
}

// Audio instances
export const popSound = new SoundPool('/Pop1.mp3', 5);
export const coinSound = new SoundPool('/CashRegister.mp3', 5);

// BGM tracks
const bgmTracks = ['/Music/MyMusic1.mp3', '/Music/MyMusic2.mp3', '/Music/babyfox1.mp3', '/Music/babyfox2.mp3'];
export const bgm = new Audio();
bgm.loop = false;
bgm.volume = 0.5;

export function playNextTrack() {
  const randomTrack = bgmTracks[Math.floor(Math.random() * bgmTracks.length)];
  bgm.src = randomTrack;
  bgm.play().catch(e => console.warn('BGM play failed:', e));
}

bgm.addEventListener('ended', playNextTrack);

export function playBGM() {
  // If already playing, don't restart
  if (!bgm.paused) return;
  
  playNextTrack();
  
  // Remove interaction listener if it was added
  document.body.removeEventListener('click', playBGM);
}

export function updateVolume(value) {
  bgm.volume = value;
  popSound.setVolume(value);
  coinSound.setVolume(value);
}

export function toggleBGM(isChecked) {
  if (isChecked) {
    if (!bgm.src) {
      playNextTrack();
    } else {
      bgm.play().catch(e => console.warn('BGM play failed:', e));
    }
  } else {
    bgm.pause();
  }
}

export function toggleSFX(isChecked) {
  popSound.setMuted(!isChecked);
  coinSound.setMuted(!isChecked);
}
