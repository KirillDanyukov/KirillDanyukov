'use strict';

// ─── PHOTO LIGHTBOX ──────────────────────────────────────────────────────────

const photoModal      = document.getElementById('photoModal');
const photoModalImg   = document.getElementById('photoModalImg');
const photoModalClose = document.getElementById('photoModalClose');

// Hero photo click
document.getElementById('heroPhotoImg').addEventListener('click', () => {
  openPhotoLightbox('Фото/Фото 1.webp');
});

// Block-2 sketch-photo click
document.querySelectorAll('.sketch-photo').forEach(img => {
  img.addEventListener('click', () => openPhotoLightbox(img.src));
});

function openPhotoLightbox(src) {
  photoModalImg.src = src;
  photoModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

photoModalClose.addEventListener('click', closePhotoModal);
photoModal.addEventListener('click', e => {
  if (e.target === photoModal || e.target === photoModalImg) return;
  closePhotoModal();
});
photoModal.addEventListener('click', e => {
  if (e.target === photoModal) closePhotoModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && photoModal.classList.contains('active')) closePhotoModal();
});

function closePhotoModal() {
  photoModal.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => { photoModalImg.src = ''; }, 300);
}

// ─── VIDEO MODAL PLAYER ───────────────────────────────────────────────────────

const modal       = document.getElementById('videoModal');
const modalClose  = document.getElementById('modalClose');
const mainVideo   = document.getElementById('mainVideo');
const mainSrc     = document.getElementById('mainVideoSrc');

const playPauseBtn = document.getElementById('playPauseBtn');
const iconPlay     = playPauseBtn.querySelector('.icon-play');
const iconPause    = playPauseBtn.querySelector('.icon-pause');

const rewind10  = document.getElementById('rewind10');
const forward10 = document.getElementById('forward10');

const progressBg    = document.getElementById('progressBg');
const progressFill  = document.getElementById('progressFill');
const progressThumb = document.getElementById('progressThumb');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl   = document.getElementById('totalTime');

const muteBtn     = document.getElementById('muteBtn');
const iconVol     = muteBtn.querySelector('.icon-vol');
const iconMute    = muteBtn.querySelector('.icon-mute');
const volumeSlider = document.getElementById('volumeSlider');

const speedBtn  = document.getElementById('speedBtn');
const speedMenu = document.getElementById('speedMenu');

const downloadBtn    = document.getElementById('downloadBtn');
const fullscreenBtn  = document.getElementById('fullscreenBtn');
const iconFs         = fullscreenBtn.querySelector('.icon-fs');
const iconFsExit     = fullscreenBtn.querySelector('.icon-fs-exit');

let currentVideoSrc  = '';
let isDragging = false;

const VIDEO_LIBRARY = {
  'Видео резерв/Видео 1_1080p.webm': 'Видео резерв/Видео 1_1080p.webm',
  'Видео резерв/Видео 2_1080p.webm': 'Видео резерв/Видео 2_1080p.webm',
  'Видео резерв/Видео 3_1080p.webm': 'Видео резерв/Видео 3_1080p.webm',
  'Видео резерв/Видео 4_1080p.webm': 'Видео резерв/Видео 4_1080p.webm',
  'Видео резерв/Видео 5_1080p.webm': 'Видео резерв/Видео 5_1080p.webm',
  'Видео резерв/Видео 6_1080p.webm': 'Видео резерв/Видео 6_1080p.webm',
  'Видео резерв/Видео 7_1080p.webm': 'Видео резерв/Видео 7_1080p.webm',
  'Видео резерв/Видео 8_1080p.webm': 'Видео резерв/Видео 8_1080p.webm',
};

let currentDownloadSrc = '';

// ─── OPEN / CLOSE PLAYER ─────────────────────────────────────────────────────
document.querySelectorAll('.work-card').forEach(card => {
  card.addEventListener('click', () => openPlayer(card.dataset.video));
});

function openPlayer(src) {
  currentVideoSrc = src;
  const playSrc = VIDEO_LIBRARY[src] || src;

  currentDownloadSrc = playSrc;

  mainVideo.src = playSrc;
  mainVideo.load();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  mainVideo.play();
}

function closePlayer() {
  mainVideo.pause();
  mainVideo.src = '';
  modal.classList.remove('active');
  document.body.style.overflow = '';
  speedMenu.classList.remove('open');
}

modalClose.addEventListener('click', closePlayer);
modal.addEventListener('click', e => { if (e.target === modal) closePlayer(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('active')) closePlayer();
});

// Play / Pause
mainVideo.addEventListener('click', togglePlay);
playPauseBtn.addEventListener('click', togglePlay);

function togglePlay() {
  if (mainVideo.paused) {
    mainVideo.play();
  } else {
    mainVideo.pause();
  }
}

mainVideo.addEventListener('play',  () => { iconPlay.style.display = 'none';  iconPause.style.display = ''; });
mainVideo.addEventListener('pause', () => { iconPlay.style.display = '';      iconPause.style.display = 'none'; });

// Seek
rewind10.addEventListener('click',  () => { mainVideo.currentTime = Math.max(0, mainVideo.currentTime - 10); });
forward10.addEventListener('click', () => { mainVideo.currentTime = Math.min(mainVideo.duration || 0, mainVideo.currentTime + 10); });

// Progress bar
mainVideo.addEventListener('timeupdate', updateProgress);
mainVideo.addEventListener('loadedmetadata', () => {
  totalTimeEl.textContent = fmtTime(mainVideo.duration);
});

function updateProgress() {
  if (isDragging) return;
  const pct = mainVideo.duration ? mainVideo.currentTime / mainVideo.duration : 0;
  setProgressUI(pct);
  currentTimeEl.textContent = fmtTime(mainVideo.currentTime);
}

function setProgressUI(pct) {
  const p = Math.max(0, Math.min(1, pct)) * 100;
  progressFill.style.width  = p + '%';
  progressThumb.style.left  = p + '%';
}

progressBg.addEventListener('mousedown', e => {
  isDragging = true;
  seekTo(e);
});
document.addEventListener('mousemove', e => { if (isDragging) seekTo(e); });
document.addEventListener('mouseup',   ()  => { isDragging = false; });

progressBg.addEventListener('touchstart', e => { isDragging = true; seekToTouch(e); }, { passive: true });
document.addEventListener('touchmove',  e => { if (isDragging) seekToTouch(e); }, { passive: true });
document.addEventListener('touchend',   () => { isDragging = false; });

function seekTo(e) {
  const rect = progressBg.getBoundingClientRect();
  const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  setProgressUI(pct);
  if (mainVideo.duration) {
    mainVideo.currentTime = pct * mainVideo.duration;
    currentTimeEl.textContent = fmtTime(mainVideo.currentTime);
  }
}
function seekToTouch(e) {
  if (e.touches.length) seekTo(e.touches[0]);
}

// Volume
volumeSlider.addEventListener('input', () => {
  mainVideo.volume = parseFloat(volumeSlider.value);
  mainVideo.muted  = mainVideo.volume === 0;
  updateVolIcon();
});
muteBtn.addEventListener('click', () => {
  mainVideo.muted = !mainVideo.muted;
  if (mainVideo.muted) {
    volumeSlider.value = 0;
  } else {
    mainVideo.volume  = parseFloat(volumeSlider.value) || 1;
    volumeSlider.value = mainVideo.volume;
  }
  updateVolIcon();
});

function updateVolIcon() {
  if (mainVideo.muted || mainVideo.volume === 0) {
    iconVol.style.display  = 'none';
    iconMute.style.display = '';
  } else {
    iconVol.style.display  = '';
    iconMute.style.display = 'none';
  }
}

// Speed
speedBtn.addEventListener('click', e => {
  e.stopPropagation();
  speedMenu.classList.toggle('open');
});

document.addEventListener('click', () => {
  speedMenu.classList.remove('open');
});

speedMenu.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const spd = parseFloat(btn.dataset.speed);
    mainVideo.playbackRate = spd;
    speedBtn.textContent   = spd + '×';
    speedMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    speedMenu.classList.remove('open');
  });
});

// Download — always use MP4 (not WebM)
downloadBtn.addEventListener('click', () => {
  const dl = currentDownloadSrc || currentVideoSrc;
  if (!dl) return;
  const a = document.createElement('a');
  a.href     = dl;
  a.download = dl.split('/').pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Fullscreen
const playerWrap = mainVideo.closest('.player-wrap');
let fsHideTimer  = null;
let isInFs       = false;

fullscreenBtn.addEventListener('click', () => {
  if (!isInFs) {
    const fn = playerWrap.requestFullscreen || playerWrap.webkitRequestFullscreen;
    if (fn) fn.call(playerWrap);
    else enterFsFallback();        // fallback for browsers without Fullscreen API
  } else {
    exitFs();
  }
});

// Real fullscreen API events
document.addEventListener('fullscreenchange',       onFsChange);
document.addEventListener('webkitfullscreenchange', onFsChange);

function onFsChange() {
  const nativeFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  if (nativeFs) enterFsMode(); else leaveFsMode();
}

// Fallback: use fixed positioning when Fullscreen API not available
function enterFsFallback() {
  playerWrap.classList.add('in-fs');
  isInFs = true;
  updateFsIcon(true);
  document.body.style.overflow = 'hidden';
  enterFsMode();
}

function exitFs() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } else {
    // fallback exit
    playerWrap.classList.remove('in-fs');
    isInFs = false;
    updateFsIcon(false);
    document.body.style.overflow = '';
    leaveFsMode();
  }
}

function enterFsMode() {
  isInFs = true;
  playerWrap.classList.add('in-fs');
  updateFsIcon(true);
  playerWrap.addEventListener('mousemove',  showFsControls);
  playerWrap.addEventListener('touchstart', showFsControls, { passive: true });
  playerWrap.addEventListener('click',      showFsControls);
  showFsControls();   // immediately show controls on enter
}

function leaveFsMode() {
  isInFs = false;
  playerWrap.classList.remove('in-fs', 'show-ctrl');
  updateFsIcon(false);
  playerWrap.removeEventListener('mousemove',  showFsControls);
  playerWrap.removeEventListener('touchstart', showFsControls);
  playerWrap.removeEventListener('click',      showFsControls);
  clearTimeout(fsHideTimer);
  document.body.style.overflow = '';
}

function updateFsIcon(inFs) {
  iconFs.style.display     = inFs ? 'none' : '';
  iconFsExit.style.display = inFs ? ''     : 'none';
}

function showFsControls() {
  playerWrap.classList.add('show-ctrl');
  clearTimeout(fsHideTimer);
  // Auto-hide only when playing
  if (!mainVideo.paused) {
    fsHideTimer = setTimeout(() => {
      if (!mainVideo.paused) playerWrap.classList.remove('show-ctrl');
    }, 3000);
  }
}

// Keep controls visible while paused
mainVideo.addEventListener('pause', () => {
  if (isInFs) { playerWrap.classList.add('show-ctrl'); clearTimeout(fsHideTimer); }
});
mainVideo.addEventListener('play', () => {
  if (isInFs) showFsControls();
});

// Keyboard shortcuts inside modal
document.addEventListener('keydown', e => {
  if (!modal.classList.contains('active')) return;
  if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyM'].includes(e.code)) e.preventDefault();
  if (e.code === 'Space')      togglePlay();
  if (e.code === 'ArrowLeft')  mainVideo.currentTime = Math.max(0, mainVideo.currentTime - 5);
  if (e.code === 'ArrowRight') mainVideo.currentTime = Math.min(mainVideo.duration || 0, mainVideo.currentTime + 5);
  if (e.code === 'KeyM')       muteBtn.click();
});

// ─── CAROUSEL PAUSE ON HOVER ─────────────────────────────────────────────────
// (handled via CSS :hover — pause-state already in styles.css)

// ─── VIDEO THUMBNAILS ────────────────────────────────────────────────────────
// Seek work-preview videos to 1s for a representative thumbnail
document.querySelectorAll('.work-preview').forEach(v => {
  v.addEventListener('loadedmetadata', () => {
    v.currentTime = Math.min(1, v.duration * 0.05);
  });
  v.addEventListener('error', () => {
    // If video fails to load, thumbnail area keeps its background color
  });
});

// ─── UTILS ───────────────────────────────────────────────────────────────────
function fmtTime(secs) {
  if (!isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── SMOOTH REVEAL ON SCROLL ─────────────────────────────────────────────────
const revealEls = document.querySelectorAll(
  '.exp-row, .who-card, .work-card, .carousel-item'
);

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity    = '1';
        entry.target.style.transform  = entry.target.style.transform.replace('translateY(24px)', '');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealEls.forEach(el => {
    el.style.opacity    = '0';
    el.style.transition += ', opacity 0.5s ease, transform 0.5s ease';
    el.style.transform  = (el.style.transform || '') + ' translateY(24px)';
    io.observe(el);
  });
}
