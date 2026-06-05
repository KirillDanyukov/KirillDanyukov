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
  if (e.target !== photoModalImg) {
    closePhotoModal();
  }
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
const playerWrap  = document.querySelector('.player-wrap');
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
  'Видео/Видео 1_1080p.webm': 'Видео/Видео 1_1080p.webm',
  'Видео/Видео 2_1080p.webm': 'Видео/Видео 2_1080p.webm',
  'Видео/Видео 3_1080p.webm': 'Видео/Видео 3_1080p.webm',
  'Видео/Видео 4_1080p.webm': 'Видео/Видео 4_1080p.webm',
  'Видео/Видео 5_1080p.webm': 'Видео/Видео 5_1080p.webm',
  'Видео/Видео 6_1080p.webm': 'Видео/Видео 6_1080p.webm',
  'Видео/Видео 7_1080p.webm': 'Видео/Видео 7_1080p.webm',
  'Видео/Видео 8_1080p.webm': 'Видео/Видео 8_1080p.webm',
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

  // Set the source elements
  mainVideo.src = playSrc;
  
  // Reset pinch-to-zoom properties
  currentScale = 1.0;
  panX = 0;
  panY = 0;
  mainVideo.style.transform = '';
  
  mainVideo.load();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  showControls(); // Initialize controls visibility and timers

  // Request Fullscreen immediately upon opening on both mobile and PC
  const requestFS = playerWrap.requestFullscreen || playerWrap.webkitRequestFullscreen || playerWrap.mozRequestFullScreen || playerWrap.msRequestFullscreen;
  if (requestFS) {
    requestFS.call(playerWrap).catch(error => {
      console.warn("Auto-fullscreen request failed, falling back to inline fullscreen:", error);
      enterFsFallback();
    });
  } else {
    enterFsFallback();
  }

  const playPromise = mainVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.warn("Video playback failed or was interrupted:", error);
    });
  }
}

function closePlayer() {
  mainVideo.pause();
  mainVideo.removeAttribute('src');
  if (mainSrc) mainSrc.removeAttribute('src');
  mainVideo.load(); // Release decoder memory immediately on close to support weak devices
  modal.classList.remove('active');
  document.body.style.overflow = '';
  speedMenu.classList.remove('open');
  playerWrap.classList.remove('hide-controls');
  clearTimeout(controlsHideTimer);
  
  // Reset pinch-to-zoom properties
  currentScale = 1.0;
  panX = 0;
  panY = 0;
  mainVideo.style.transform = '';

  if (isInFs) {
    exitFs();
  }
}

modalClose.addEventListener('click', closePlayer);
modal.addEventListener('click', e => { if (e.target === modal) closePlayer(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('active')) closePlayer();
});

// Play / Pause
mainVideo.addEventListener('click', e => {
  // Clicking the video overlay shows controls but does NOT pause/play as requested
  e.preventDefault();
  e.stopPropagation();
  showControls();
});
playPauseBtn.addEventListener('click', e => {
  e.stopPropagation();
  togglePlay();
});

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
  if (speedMenu.classList.contains('open')) {
    speedMenu.classList.remove('open');
    showControls();
  }
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
    showControls();
  });
});

// Download
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

// Fullscreen and Controls Auto-hide
let isInFs       = false;
let controlsHideTimer = null;

function showControls() {
  playerWrap.classList.remove('hide-controls');
  clearTimeout(controlsHideTimer);
  
  const isSpeedMenuOpen = speedMenu && speedMenu.classList.contains('open');
  if (!mainVideo.paused && !isSpeedMenuOpen) {
    controlsHideTimer = setTimeout(() => {
      if (!mainVideo.paused && (!speedMenu || !speedMenu.classList.contains('open'))) {
        playerWrap.classList.add('hide-controls');
      }
    }, 3000);
  }
}

// Reset timer on user activity inside playerWrap
playerWrap.addEventListener('mousemove', showControls);
playerWrap.addEventListener('touchstart', showControls, { passive: true });
playerWrap.addEventListener('touchmove', showControls, { passive: true });
playerWrap.addEventListener('click', showControls);

// Also show controls when video is played/paused
mainVideo.addEventListener('play', showControls);
mainVideo.addEventListener('pause', () => {
  playerWrap.classList.remove('hide-controls');
  clearTimeout(controlsHideTimer);
});

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
  if (nativeFs) {
    enterFsMode();
  } else {
    leaveFsMode();
    closePlayer(); // Exiting fullscreen closes the video modal player
  }
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
  showControls();   // immediately show controls on enter
}

// Leave Fullscreen
function leaveFsMode() {
  isInFs = false;
  playerWrap.classList.remove('in-fs');
  updateFsIcon(false);
  document.body.style.overflow = '';
  showControls();
}

function updateFsIcon(inFs) {
  iconFs.style.display     = inFs ? 'none' : '';
  iconFsExit.style.display = inFs ? ''     : 'none';
}

// Keyboard shortcuts inside modal
document.addEventListener('keydown', e => {
  if (!modal.classList.contains('active')) return;
  if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyM'].includes(e.code)) e.preventDefault();
  if (e.code === 'Space')      togglePlay();
  if (e.code === 'ArrowLeft')  mainVideo.currentTime = Math.max(0, mainVideo.currentTime - 5);
  if (e.code === 'ArrowRight') mainVideo.currentTime = Math.min(mainVideo.duration || 0, mainVideo.currentTime + 5);
  if (e.code === 'KeyM')       muteBtn.click();
});

// ─── VIDEO THUMBNAILS ────────────────────────────────────────────────────────
// Previews/covers use highly optimized WebP images extracted from videos to load instantly and save bandwidth.

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

// ─── LAZY LOAD VIDEOS FOR LOW-END DEVICES ────────────────────────────────────
if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        const source = video.querySelector('source');
        if (source && source.dataset.src) {
          source.src = source.dataset.src;
          video.load();
        }
        observer.unobserve(video);
      }
    });
  }, { rootMargin: '100px' });

  document.querySelectorAll('video.lazy-video').forEach(video => {
    videoObserver.observe(video);
  });
} else {
  document.querySelectorAll('video.lazy-video').forEach(video => {
    const source = video.querySelector('source');
    if (source && source.dataset.src) {
      source.src = source.dataset.src;
      video.load();
    }
  });
}

// ─── MOBILE PINCH-TO-ZOOM & PANNING (YouTube-like) ───────────────────────────
let currentScale = 1.0;
let startScale = 1.0;
let startDistance = 0;
let panX = 0;
let panY = 0;
let startX = 0;
let startY = 0;
let isZooming = false;
let isPanning = false;

function getDistance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function updateVideoTransform() {
  if (currentScale < 1.0) currentScale = 1.0;
  
  const videoWidth = mainVideo.offsetWidth;
  const videoHeight = mainVideo.offsetHeight;
  const maxPanX = ((currentScale - 1) * videoWidth) / 2;
  const maxPanY = ((currentScale - 1) * videoHeight) / 2;
  
  panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
  
  // Shift translation visually by dividing by currentScale
  mainVideo.style.transform = `scale(${currentScale}) translate(${panX / currentScale}px, ${panY / currentScale}px)`;
}

mainVideo.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    isZooming = true;
    isPanning = false;
    startDistance = getDistance(e.touches[0], e.touches[1]);
    startScale = currentScale;
  } else if (e.touches.length === 1 && currentScale > 1.0) {
    isPanning = true;
    startX = e.touches[0].clientX - panX;
    startY = e.touches[0].clientY - panY;
  }
}, { passive: false });

mainVideo.addEventListener('touchmove', e => {
  if (isZooming && e.touches.length === 2) {
    e.preventDefault(); // prevent viewport scrolling while zooming
    const dist = getDistance(e.touches[0], e.touches[1]);
    currentScale = Math.max(1.0, Math.min(4.0, (dist / startDistance) * startScale));
    updateVideoTransform();
  } else if (isPanning && e.touches.length === 1) {
    e.preventDefault(); // prevent viewport scrolling while panning
    panX = e.touches[0].clientX - startX;
    panY = e.touches[0].clientY - startY;
    updateVideoTransform();
  }
}, { passive: false });

mainVideo.addEventListener('touchend', e => {
  if (e.touches.length < 2) {
    isZooming = false;
  }
  if (e.touches.length === 0) {
    isPanning = false;
    // Snap back if zoom is very close to normal
    if (currentScale < 1.05) {
      currentScale = 1.0;
      panX = 0;
      panY = 0;
      mainVideo.style.transform = '';
    }
  }
});

// Update bounds on window resize / orientation change
window.addEventListener('resize', () => {
  if (modal.classList.contains('active') && currentScale > 1.0) {
    updateVideoTransform();
  }
});
