'use strict';

// ─── DEVICE / NETWORK PERFORMANCE TIER ───────────────────────────────────────
// Detects slow connections or weak devices and forces smaller image variants.
// Result cached in localStorage so detection runs once per session.
(function detectPerfTier() {
  var TIER_KEY = 'perf_tier';
  var cached = localStorage.getItem(TIER_KEY);
  if (cached) { document.documentElement.dataset.tier = cached; applyTier(cached); return; }

  var conn   = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var memory = navigator.deviceMemory;
  var cores  = navigator.hardwareConcurrency;

  var tier = 'high';
  if (conn && (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) {
    tier = 'low';
  } else if (conn && conn.effectiveType === '3g') {
    tier = 'medium';
  } else if ((memory != null && memory <= 1) || (cores != null && cores <= 2)) {
    tier = 'medium';
  }

  localStorage.setItem(TIER_KEY, tier);
  document.documentElement.dataset.tier = tier;
  applyTier(tier);

  function applyTier(t) {
    if (t === 'low') {
      document.querySelectorAll('picture source').forEach(function(s) { s.sizes = '480px'; });
    } else if (t === 'medium') {
      document.querySelectorAll('picture source').forEach(function(s) {
        s.sizes = s.sizes.replace(/\d{4,}px/, '768px');
      });
    }
  }
})();

// ─── PHOTO LIGHTBOX ──────────────────────────────────────────────────────────

const photoModal        = document.getElementById('photoModal');
const photoModalImg     = document.getElementById('photoModalImg');
const photoModalClose   = document.getElementById('photoModalClose');
const photoModalDownload = document.getElementById('photoModalDownload');

// Hero photo click — triggered by image
const avatarCharEl = document.getElementById('avatarCharacter');
function openHeroPhoto() {
  const src = (avatarCharEl && (avatarCharEl.dataset.orig || avatarCharEl.src)) || 'Фото/Кирилл-Данюков-фото-1.webp';
  const previewSrc = (avatarCharEl && (avatarCharEl.currentSrc || avatarCharEl.src)) || src;
  openPhotoLightbox(src, 'character_portrait', previewSrc);
}
if (avatarCharEl) avatarCharEl.addEventListener('click', openHeroPhoto);

// Click handlers for both sketch-photo-wrap and who-photo-wrap (covers full photo areas)
document.querySelectorAll('.sketch-photo-wrap, .who-photo-wrap').forEach(wrap => {
  wrap.addEventListener('click', (e) => {
    e.preventDefault();
    const img = wrap.querySelector('img');
    if (img) {
      openPhotoLightbox(
        img.dataset.orig || img.currentSrc || img.src,
        img.dataset.photoNum,
        img.currentSrc || img.src
      );
    }
  });
});

function openPhotoLightbox(src, photoNum, previewSrc) {
  const previewUrl = previewSrc || src;
  const tier = document.documentElement.dataset.tier || 'high';

  // Instantly show already loaded preview to make opening 0ms
  if (previewUrl) {
    photoModalImg.src = previewUrl;
  } else {
    photoModalImg.src = src;
  }

  if (photoNum) {
    if (photoNum === 'character_portrait') {
      photoModalDownload.href = 'Фото/downloads/Фото-1.png';
      photoModalDownload.download = 'Кирилл-Данюков-фото-1.png';
    } else if (photoNum === '30' || photoNum === '31') {
      photoModalDownload.href = src;
      photoModalDownload.download = 'ФОТО ' + photoNum + '.png';
    } else {
      photoModalDownload.href = 'Фото/downloads/Фото-' + photoNum + '.png';
      photoModalDownload.download = 'Кирилл-Данюков-фото-' + photoNum + '.png';
    }
    photoModalDownload.style.display = '';
  } else {
    photoModalDownload.style.display = 'none';
  }

  photoModal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Load high-res original in the background only when the connection is good enough.
  if (previewUrl && src && previewUrl !== src && tier !== 'low' && tier !== 'medium') {
    const hiResImg = new Image();
    hiResImg.decoding = 'async';
    hiResImg.onload = () => {
      // Swap to sharp image only if modal is still open displaying this photo
      if (photoModal.classList.contains('active') && photoModalImg.src === previewUrl) {
        photoModalImg.src = src;
      }
    };
    hiResImg.src = src;
  }
}

function queueHighResPrefetch(sources) {
  if (!sources || !sources.length) return;

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isSlowConnection = !!(conn && (conn.saveData || /slow-2g|2g|3g/.test(conn.effectiveType || '')));
  if (isSlowConnection) return;

  const schedule = window.requestIdleCallback || function(callback) {
    return window.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 1500);
  };

  schedule(() => {
    sources.slice(0, 4).forEach((src, index) => {
      window.setTimeout(() => {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
      }, 400 + index * 220);
    });
  });
}

function prefetchOriginalPhotos() {
  const tier = document.documentElement.dataset.tier || 'high';
  if (tier === 'low' || tier === 'medium') return;

  const sources = [];
  const seen = new Set();

  if (avatarCharEl && avatarCharEl.dataset.orig) {
    const heroOrig = avatarCharEl.dataset.orig;
    if (!seen.has(heroOrig)) {
      seen.add(heroOrig);
      sources.push(heroOrig);
    }
  }

  document.querySelectorAll('.sketch-photo-wrap img, .who-photo-wrap img').forEach(img => {
    const src = img.dataset.orig;
    if (!src || seen.has(src)) return;
    seen.add(src);
    sources.push(src);
  });

  queueHighResPrefetch(sources.slice(0, 4));
}

window.addEventListener('load', prefetchOriginalPhotos);
window.addEventListener('pageshow', prefetchOriginalPhotos);

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

let currentVideoSrc = '';
let isDragging = false;
let isSubMenuOpen = false;

// ─── OPEN / CLOSE PLAYER ─────────────────────────────────────────────────────
document.querySelectorAll('.work-card').forEach(card => {
  card.addEventListener('click', () => openPlayer(card.dataset.video));
});

function openPlayer(src) {
  currentVideoSrc = src;
  mainVideo.src = src;
  
  // Reset pinch-to-zoom properties
  currentScale = 1.0;
  panX = 0;
  panY = 0;
  mainVideo.style.transform = '';
  
  mainVideo.load();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  currentSubCues = [];
  clearSubtitle();
  if (currentSubLang !== 'off') loadSubtitles(currentSubLang);

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
  mainVideo.load(); // Release decoder memory immediately on close to support weak devices
  modal.classList.remove('active');
  document.body.style.overflow = '';
  speedMenu.classList.remove('open');
  subtitleMenu.classList.remove('open');
  isSubMenuOpen = false;
  currentSubCues = [];
  clearSubtitle();
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
mainVideo.addEventListener('timeupdate', updateSubtitle);
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
  const dl = currentVideoSrc;
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
  if (!mainVideo.paused && !isSpeedMenuOpen && !isSubMenuOpen) {
    controlsHideTimer = setTimeout(() => {
      if (!mainVideo.paused && (!speedMenu || !speedMenu.classList.contains('open')) && !isSubMenuOpen) {
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
let lastTapTime = 0;
let tapTimer = null;

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
  const wasZooming = isZooming;
  const wasPanning = isPanning;

  if (e.touches.length < 2) isZooming = false;
  if (e.touches.length === 0) {
    isPanning = false;
    if (currentScale < 1.05) {
      currentScale = 1.0;
      panX = 0;
      panY = 0;
      mainVideo.style.transform = '';
    }

    // Handle tap gestures only when no zoom/pan was active
    if (!wasZooming && !wasPanning && e.changedTouches.length === 1) {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const now = Date.now();
      const dt = now - lastTapTime;

      if (dt > 30 && dt < 300) {
        // Double tap
        clearTimeout(tapTimer);
        tapTimer = null;
        lastTapTime = 0;
        const rect = mainVideo.getBoundingClientRect();
        if (touch.clientX - rect.left >= rect.width / 2) {
          mainVideo.currentTime = Math.min(mainVideo.duration || 0, mainVideo.currentTime + 10);
        } else {
          mainVideo.currentTime = Math.max(0, mainVideo.currentTime - 10);
        }
        showControls();
      } else {
        // Single tap — wait to confirm it's not followed by a second tap
        lastTapTime = now;
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => {
          tapTimer = null;
          togglePlay();
          showControls();
        }, 250);
      }
    }
  }
}, { passive: false });

// Update bounds on window resize / orientation change
window.addEventListener('resize', () => {
  if (modal.classList.contains('active') && currentScale > 1.0) {
    updateVideoTransform();
  }
});

// ─── SUBTITLES ────────────────────────────────────────────────────────────────

const subtitleBtn     = document.getElementById('subtitleBtn');
const subtitleMenu    = document.getElementById('subtitleMenu');
const subtitleDisplay = document.getElementById('subtitleDisplay');

let currentSubLang = 'off';
let currentSubCues = [];

subtitleBtn.addEventListener('click', e => {
  e.stopPropagation();
  isSubMenuOpen = !isSubMenuOpen;
  subtitleMenu.classList.toggle('open', isSubMenuOpen);
  showControls();
});

subtitleMenu.querySelectorAll('.sub-option').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    currentSubLang = btn.dataset.lang;
    subtitleMenu.querySelectorAll('.sub-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    subtitleMenu.classList.remove('open');
    isSubMenuOpen = false;
    loadSubtitles(currentSubLang);
    showControls();
  });
});

document.addEventListener('click', e => {
  if (isSubMenuOpen && !subtitleBtn.contains(e.target) && !subtitleMenu.contains(e.target)) {
    isSubMenuOpen = false;
    subtitleMenu.classList.remove('open');
    showControls();
  }
});

function loadSubtitles(lang) {
  currentSubCues = [];
  clearSubtitle();
  if (lang === 'off' || !currentVideoSrc) return;

  const m = currentVideoSrc.match(/Видео (\d+)_/);
  if (!m) return;

  fetch('Субтитры/Видео ' + m[1] + '_' + lang + '.vtt')
    .then(r => { if (!r.ok) throw new Error('no vtt'); return r.text(); })
    .then(text => {
      currentSubCues = parseVTT(text);
      updateSubtitle(); // show immediately without waiting for next timeupdate
    })
    .catch(() => {
      currentSubCues = [];
      if (location.protocol === 'file:') {
        subtitleDisplay.innerHTML = '<span class="subtitle-text" style="font-size:0.85rem;opacity:0.8">⚠ Субтитры требуют запуска через сервер. Открой start.bat</span>';
        setTimeout(() => { if (!currentSubCues.length) clearSubtitle(); }, 4000);
      }
    });
}

function parseVTT(text) {
  const cues = [];
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const ti = lines.findIndex(l => l.includes('-->'));
    if (ti === -1) continue;
    const parts = lines[ti].split('-->');
    const start = parseVTTTime(parts[0].trim());
    const end   = parseVTTTime(parts[1].trim().split(' ')[0]);
    const cueText = lines.slice(ti + 1).join('\n').trim();
    if (cueText) cues.push({ start, end, text: cueText });
  }
  return cues;
}

function parseVTTTime(s) {
  const p = s.split(':');
  if (p.length === 3) return +p[0] * 3600 + +p[1] * 60 + parseFloat(p[2]);
  return +p[0] * 60 + parseFloat(p[1]);
}

function updateSubtitle() {
  if (!currentSubCues.length || currentSubLang === 'off') { clearSubtitle(); return; }
  const t = mainVideo.currentTime;
  const cue = currentSubCues.find(c => t >= c.start && t < c.end);
  if (cue) {
    subtitleDisplay.innerHTML = '<span class="subtitle-text">' + cue.text.replace(/\n/g, '<br>') + '</span>';
  } else {
    clearSubtitle();
  }
}

function clearSubtitle() {
  if (subtitleDisplay) subtitleDisplay.innerHTML = '';
}



// Background prefetching for high-res photos to make lightbox clicks instant
window.addEventListener('load', () => {
  setTimeout(() => {
    const origImages = Array.from(document.querySelectorAll('img[data-orig]'))
      .map(img => img.dataset.orig)
      .filter(Boolean);
    
    // Stagger prefetch links to avoid hogging bandwidth on slow connections
    let delay = 300;
    origImages.forEach(src => {
      setTimeout(() => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = src;
        document.head.appendChild(link);
      }, delay);
      delay += 250;
    });
  }, 1500);
});
